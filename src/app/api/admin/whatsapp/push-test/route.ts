import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { sendWhatsAppPushNotification } from "@/lib/whatsapp/webPush";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const result = await sendWhatsAppPushNotification({
    id: `test-${Date.now()}`,
    title: "Web Growth WhatsApp test",
    body: "Background notifications are working on this subscribed device.",
    url: "/admin/whatsapp/conversations/",
  });
  return NextResponse.json({ ok: true, ...result });
}
