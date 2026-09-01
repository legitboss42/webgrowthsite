import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import {
  getWhatsAppSupabaseConfig,
  mutateWhatsAppRest,
  readWhatsAppRows,
} from "@/app/admin/whatsapp/data";
import { parseWhatsAppContactCsv } from "@/app/admin/whatsapp/contactCsvModel";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

type ImportBody = { csv?: unknown };
type RowOutcome = {
  row: number;
  whatsappNumber?: string;
  status: "inserted" | "skipped" | "error";
  message: string;
};

function duplicateQuery(numbers: string[]) {
  return `whatsapp_contacts?wa_id=in.(${numbers.join(",")})&select=wa_id&limit=${numbers.length}`;
}

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canWhatsAppRoleSuperviseTeam(access.role)) {
    return NextResponse.json({ error: "Manager or Owner access is required to import contacts." }, { status: 403 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: ImportBody;
  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
  if (typeof body.csv !== "string") {
    return NextResponse.json({ error: "CSV text is required." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseWhatsAppContactCsv(body.csv);
  } catch (reason) {
    return NextResponse.json(
      { error: reason instanceof Error ? reason.message : "CSV could not be parsed." },
      { status: 400 },
    );
  }

  const outcomes: RowOutcome[] = parsed.errors.map((error) => ({
    row: error.row,
    status: "error",
    message: error.message,
  }));

  const firstRowByNumber = new Map<string, number>();
  const uniqueRows = [] as typeof parsed.rows;
  for (const row of parsed.rows) {
    const firstRow = firstRowByNumber.get(row.waId);
    if (firstRow) {
      outcomes.push({
        row: row.rowNumber,
        whatsappNumber: row.waId,
        status: "skipped",
        message: `Duplicate number inside this CSV; first seen on row ${firstRow}.`,
      });
      continue;
    }
    firstRowByNumber.set(row.waId, row.rowNumber);
    uniqueRows.push(row);
  }

  const existingRows = uniqueRows.length
    ? await readWhatsAppRows<Record<string, unknown>>(duplicateQuery(uniqueRows.map((row) => row.waId)))
    : [];
  if (existingRows === null) {
    return NextResponse.json({ error: "Existing contacts could not be checked safely." }, { status: 502 });
  }
  const existingNumbers = new Set(
    existingRows.map((row) => typeof row.wa_id === "string" ? row.wa_id : "").filter(Boolean),
  );

  const candidates = uniqueRows.filter((row) => {
    if (!existingNumbers.has(row.waId)) return true;
    outcomes.push({
      row: row.rowNumber,
      whatsappNumber: row.waId,
      status: "skipped",
      message: "A contact with this WhatsApp number already exists.",
    });
    return false;
  });

  const config = getWhatsAppSupabaseConfig();
  if (!config) return NextResponse.json({ error: "WhatsApp storage is not configured." }, { status: 503 });

  let insertedRows: Array<Record<string, unknown>> = [];
  if (candidates.length) {
    try {
      const response = await fetch(`${config.url}/rest/v1/whatsapp_contacts?on_conflict=wa_id`, {
        method: "POST",
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=representation",
        },
        body: JSON.stringify(candidates.map((row) => row.payload)),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        console.error("WhatsApp CSV import rejected", { status: response.status, payload });
        return NextResponse.json({ error: "The validated contacts could not be imported." }, { status: 502 });
      }
      insertedRows = Array.isArray(payload) ? payload as Array<Record<string, unknown>> : [];
    } catch (error) {
      console.error("Unable to import WhatsApp contacts", error);
      return NextResponse.json({ error: "The validated contacts could not be imported." }, { status: 502 });
    }
  }

  const insertedByNumber = new Map<string, Record<string, unknown>>();
  for (const row of insertedRows) {
    if (typeof row.wa_id === "string") insertedByNumber.set(row.wa_id, row);
  }

  const activityRows: Array<Record<string, unknown>> = [];
  for (const candidate of candidates) {
    const inserted = insertedByNumber.get(candidate.waId);
    if (!inserted) {
      outcomes.push({
        row: candidate.rowNumber,
        whatsappNumber: candidate.waId,
        status: "skipped",
        message: "The number became a duplicate before import completed.",
      });
      continue;
    }
    outcomes.push({
      row: candidate.rowNumber,
      whatsappNumber: candidate.waId,
      status: "inserted",
      message: "Contact imported.",
    });
    if (typeof inserted.id === "string") {
      activityRows.push({
        actor_member_id: access.memberId || null,
        actor_email: access.email,
        target_member_id: null,
        event_type: "contact_created",
        metadata: {
          contactId: inserted.id,
          fields: ["csv_import"],
          source: "csv_import",
          rowNumber: candidate.rowNumber,
        },
      });
    }
  }

  if (activityRows.length) {
    await mutateWhatsAppRest({
      method: "POST",
      pathAndQuery: "whatsapp_team_activity",
      body: activityRows,
    });
  }

  outcomes.sort((a, b) => a.row - b.row);
  const summary = {
    inserted: outcomes.filter((item) => item.status === "inserted").length,
    skipped: outcomes.filter((item) => item.status === "skipped").length,
    errors: outcomes.filter((item) => item.status === "error").length,
  };

  return NextResponse.json({ ok: true, summary, outcomes });
}
