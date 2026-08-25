import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import {
  POSTGRES_UNIQUE_VIOLATION,
  mutateWhatsAppRest,
} from "@/app/admin/whatsapp/data";
import {
  normalizeWhatsAppQuickReplyRow,
  validateWhatsAppQuickReplyInput,
} from "@/app/admin/whatsapp/quickRepliesModel";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

const TABLE = "whatsapp_quick_replies";
const DUPLICATE_MESSAGE = "That shortcut is already in use. Pick another one.";

/** Shared gate for every mutation on this route. */
async function guard(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  return null;
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const validation = validateWhatsAppQuickReplyInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const result = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: TABLE,
    body: validation.value,
  });

  if (!result.ok) {
    const duplicate = result.code === POSTGRES_UNIQUE_VIOLATION;
    return NextResponse.json(
      { error: duplicate ? DUPLICATE_MESSAGE : result.message },
      { status: duplicate ? 409 : result.status },
    );
  }

  const row = result.rows[0];
  return NextResponse.json({
    ok: true,
    quickReply: row ? normalizeWhatsAppQuickReplyRow(row) : null,
  });
}

export async function PATCH(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const id = readId(body.id);
  if (!id) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const validation = validateWhatsAppQuickReplyInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const result = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
    body: { ...validation.value, updated_at: new Date().toISOString() },
  });

  if (!result.ok) {
    const duplicate = result.code === POSTGRES_UNIQUE_VIOLATION;
    return NextResponse.json(
      { error: duplicate ? DUPLICATE_MESSAGE : result.message },
      { status: duplicate ? 409 : result.status },
    );
  }
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "That quick reply no longer exists." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, quickReply: normalizeWhatsAppQuickReplyRow(result.rows[0]) });
}

export async function DELETE(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  const body = await readJsonBody(request);
  const id = readId(body?.id);
  if (!id) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const result = await mutateWhatsAppRest({
    method: "DELETE",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
  });

  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "That quick reply no longer exists." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
