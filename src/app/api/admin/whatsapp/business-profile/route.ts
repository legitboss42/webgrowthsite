import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

const VERTICALS = new Set([
  "UNDEFINED",
  "OTHER",
  "AUTO",
  "BEAUTY",
  "APPAREL",
  "EDU",
  "ENTERTAIN",
  "EVENT_PLAN",
  "FINANCE",
  "GROCERY",
  "GOVT",
  "HOTEL",
  "HEALTH",
  "NONPROFIT",
  "PROF_SERVICES",
  "RETAIL",
  "TRAVEL",
  "RESTAURANT",
  "NOT_A_BIZ",
]);

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

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PUT(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion =
    process.env.WHATSAPP_API_VERSION?.trim() ||
    process.env.WHATSAPP_GRAPH_API_VERSION?.trim() ||
    "v26.0";

  if (!token || !phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp Business API is not configured." }, { status: 503 });
  }

  let raw: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    raw = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const about = text(raw.about, 139);
  const address = text(raw.address, 256);
  const description = text(raw.description, 256);
  const email = text(raw.email, 128);
  const vertical = text(raw.vertical, 40).toUpperCase() || "UNDEFINED";
  const websites = Array.isArray(raw.websites)
    ? raw.websites
        .map((entry) => text(entry, 256))
        .filter(Boolean)
        .slice(0, 2)
    : [];

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid business email address." }, { status: 400 });
  }
  if (!VERTICALS.has(vertical)) {
    return NextResponse.json({ error: "Choose a valid WhatsApp business category." }, { status: 400 });
  }
  if (websites.some((url) => !validUrl(url))) {
    return NextResponse.json({ error: "Website links must start with http:// or https://." }, { status: 400 });
  }

  const payload = {
    messaging_product: "whatsapp",
    about,
    address,
    description,
    email,
    vertical,
    websites,
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/whatsapp_business_profile`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("WhatsApp business profile update failed", response.status, detail.slice(0, 500));
      return NextResponse.json(
        { error: response.status === 401 || response.status === 403 ? "Meta rejected the WhatsApp credential." : "Meta could not update the business profile." },
        { status: response.status === 401 || response.status === 403 ? 403 : 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to update WhatsApp business profile", error);
    return NextResponse.json({ error: "Could not reach Meta." }, { status: 502 });
  }
}
