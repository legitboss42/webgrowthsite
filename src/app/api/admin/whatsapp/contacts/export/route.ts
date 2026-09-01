import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { normalizeWhatsAppContactRow } from "@/app/admin/whatsapp/contactsModel";
import {
  createWhatsAppContactCsvTemplate,
  encodeWhatsAppContactsCsv,
} from "@/app/admin/whatsapp/contactCsvModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

const CONTACT_SELECT =
  "id,wa_id,phone,display_name,business_name,email,website,source,lead_status,lead_temperature,lead_stage,tags,custom_fields,opt_in_status,opt_in_at,opt_out_at,created_at,updated_at";

async function readAllContacts() {
  const contacts: ReturnType<typeof normalizeWhatsAppContactRow>[] = [];
  const pageSize = 1000;
  const maxContacts = 10000;

  for (let offset = 0; offset < maxContacts; offset += pageSize) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_contacts?select=${CONTACT_SELECT}&order=created_at.asc&limit=${pageSize}&offset=${offset}`,
    );
    if (rows === null) return null;
    contacts.push(...rows.map(normalizeWhatsAppContactRow));
    if (rows.length < pageSize) break;
  }
  return contacts;
}

export async function GET(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canWhatsAppRoleSuperviseTeam(access.role)) {
    return NextResponse.json({ error: "Manager or Owner access is required to export contacts." }, { status: 403 });
  }

  const isTemplate = new URL(request.url).searchParams.get("template") === "1";
  let output: string;
  if (isTemplate) {
    output = createWhatsAppContactCsvTemplate();
  } else {
    const contacts = await readAllContacts();
    if (contacts === null) return NextResponse.json({ error: "Contact storage could not be read." }, { status: 502 });
    output = encodeWhatsAppContactsCsv(contacts);
  }

  const date = new Date().toISOString().slice(0, 10);
  const filename = isTemplate ? "whatsapp-contact-import-template.csv" : `whatsapp-contacts-${date}.csv`;
  return new NextResponse(`\uFEFF${output}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
