import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess, type WhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import {
  mutateWhatsAppRest,
  POSTGRES_UNIQUE_VIOLATION,
  readWhatsAppRows,
} from "@/app/admin/whatsapp/data";
import {
  canAgentAccessWhatsAppContact,
  isValidWhatsAppContactEmail,
  isWhatsAppContactTemperature,
  normalizeWhatsAppContactNumber,
  normalizeWhatsAppContactRow,
  normalizeWhatsAppContactWebsite,
} from "@/app/admin/whatsapp/contactsModel";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

const CONTACT_SELECT =
  "id,wa_id,phone,display_name,business_name,email,website,source,lead_status,lead_temperature,created_at,updated_at,whatsapp_conversations(id,status,intent,last_message_at,human_review_required,assigned_member_id)";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function hasOwn(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

async function getAccess() {
  return getWhatsAppWorkspaceAccess(await cookies());
}

async function getContact(contactId: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_contacts?id=eq.${encodeURIComponent(contactId)}&select=${CONTACT_SELECT}&limit=1`,
  );
  return rows?.[0] ? normalizeWhatsAppContactRow(rows[0]) : null;
}

function canAccessContact(access: WhatsAppWorkspaceAccess, contact: ReturnType<typeof normalizeWhatsAppContactRow>) {
  if (canWhatsAppRoleSuperviseTeam(access.role)) return true;
  return canAgentAccessWhatsAppContact(contact, access.memberId);
}

async function recordContactActivity(input: {
  access: WhatsAppWorkspaceAccess;
  contactId: string;
  eventType: "contact_created" | "contact_updated";
  fields: string[];
}) {
  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_team_activity",
    body: {
      actor_member_id: input.access.memberId || null,
      actor_email: input.access.email,
      target_member_id: null,
      event_type: input.eventType,
      metadata: { contactId: input.contactId, fields: input.fields },
    },
  });
}

function readEditableFields(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};

  if (hasOwn(body, "displayName")) patch.display_name = cleanText(body.displayName, 120) || null;
  if (hasOwn(body, "businessName")) patch.business_name = cleanText(body.businessName, 160) || null;
  if (hasOwn(body, "phone")) patch.phone = cleanText(body.phone, 50) || null;
  if (hasOwn(body, "source")) patch.source = cleanText(body.source, 80) || null;

  if (hasOwn(body, "email")) {
    const email = cleanText(body.email, 254).toLowerCase();
    if (!isValidWhatsAppContactEmail(email)) return { error: "Enter a valid email address." } as const;
    patch.email = email || null;
  }

  if (hasOwn(body, "website")) {
    const website = normalizeWhatsAppContactWebsite(body.website);
    if (website === null) return { error: "Enter a valid website address." } as const;
    patch.website = website || null;
  }

  if (hasOwn(body, "leadStatus")) {
    const leadStatus = cleanText(body.leadStatus, 40);
    if (!leadStatus) return { error: "Lead status cannot be blank." } as const;
    patch.lead_status = leadStatus;
  }

  if (hasOwn(body, "leadTemperature")) {
    if (!isWhatsAppContactTemperature(body.leadTemperature)) {
      return { error: "Choose Cold, Warm, or Hot." } as const;
    }
    patch.lead_temperature = body.leadTemperature;
  }

  return { patch } as const;
}

export async function POST(request: Request) {
  const access = await getAccess();
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canWhatsAppRoleSuperviseTeam(access.role)) {
    return NextResponse.json({ error: "Manager or Owner access is required to create contacts." }, { status: 403 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const waId = normalizeWhatsAppContactNumber(body.whatsappNumber);
  if (!waId) {
    return NextResponse.json(
      { error: "Enter a valid WhatsApp number with its country code, or a Nigerian mobile number." },
      { status: 400 },
    );
  }

  const duplicate = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_contacts?wa_id=eq.${encodeURIComponent(waId)}&select=id&limit=1`,
  );
  if (duplicate?.length) {
    return NextResponse.json({ error: "A contact with that WhatsApp number already exists." }, { status: 409 });
  }

  const editable = readEditableFields({
    displayName: body.displayName,
    businessName: body.businessName,
    email: body.email,
    phone: body.phone,
    website: body.website,
    source: body.source ?? "Manual",
    leadStatus: body.leadStatus ?? "open",
    leadTemperature: body.leadTemperature ?? "COLD",
  });
  if ("error" in editable) return NextResponse.json({ error: editable.error }, { status: 400 });

  const now = new Date().toISOString();
  const created = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_contacts",
    body: {
      wa_id: waId,
      phone: cleanText(body.phone, 50) || `+${waId}`,
      ...editable.patch,
      updated_at: now,
    },
  });

  if (!created.ok) {
    if (created.code === POSTGRES_UNIQUE_VIOLATION) {
      return NextResponse.json({ error: "A contact with that WhatsApp number already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: created.message }, { status: created.status });
  }

  const contact = created.rows[0] ? normalizeWhatsAppContactRow(created.rows[0]) : null;
  if (contact) {
    await recordContactActivity({
      access,
      contactId: contact.id,
      eventType: "contact_created",
      fields: ["wa_id", ...Object.keys(editable.patch)],
    });
  }

  return NextResponse.json({ ok: true, contact }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await getAccess();
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const contactId = cleanText(body.id, 80);
  if (!contactId) return NextResponse.json({ error: "Contact id is required." }, { status: 400 });

  const existing = await getContact(contactId);
  if (!existing) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  if (!canAccessContact(access, existing)) {
    return NextResponse.json({ error: "You do not have access to this contact." }, { status: 403 });
  }

  const editable = readEditableFields(body);
  if ("error" in editable) return NextResponse.json({ error: editable.error }, { status: 400 });
  const fields = Object.keys(editable.patch);
  if (!fields.length) return NextResponse.json({ error: "No changes were provided." }, { status: 400 });

  const updated = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_contacts?id=eq.${encodeURIComponent(contactId)}`,
    body: { ...editable.patch, updated_at: new Date().toISOString() },
  });
  if (!updated.ok) return NextResponse.json({ error: updated.message }, { status: updated.status });
  if (!updated.rows[0]) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

  const contact = normalizeWhatsAppContactRow(updated.rows[0]);
  await recordContactActivity({ access, contactId, eventType: "contact_updated", fields });
  return NextResponse.json({ ok: true, contact });
}
