import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { ensureWhatsAppVapidKeys } from "@/lib/whatsapp/webPush";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const keys = await ensureWhatsAppVapidKeys();
  if (!keys) {
    return NextResponse.json(
      { error: "Push notifications are not ready. Apply the WhatsApp push migration first." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, publicKey: keys.publicKey });
}
