import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { getWhatsAppFlowPublicKey, isWhatsAppFlowEncryptionConfigured } from "@/lib/whatsapp/flowCrypto";
import { getMetaWhatsAppFlowPublicKey, setMetaWhatsAppFlowPublicKey } from "@/lib/whatsapp/flows";

export const runtime = "nodejs";

async function owner() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (access.role !== "owner") return { response: NextResponse.json({ error: "Owner access is required to manage Flow encryption." }, { status: 403 }) } as const;
  return { access } as const;
}

export async function GET() {
  const auth = await owner(); if ("response" in auth) return auth.response;
  const configured = isWhatsAppFlowEncryptionConfigured();
  const remote = await getMetaWhatsAppFlowPublicKey();
  return NextResponse.json({ configured, publicKeyAvailable: Boolean(configured && getWhatsAppFlowPublicKey()), meta: remote.ok ? { registered: Boolean(remote.publicKey), signatureStatus: remote.signatureStatus || null } : { registered: false, error: remote.error } });
}

export async function POST(request: Request) {
  const auth = await owner(); if ("response" in auth) return auth.response;
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const publicKey = getWhatsAppFlowPublicKey();
  if (!publicKey) return NextResponse.json({ error: "WHATSAPP_FLOW_PRIVATE_KEY is not configured on this deployment." }, { status: 503 });
  const result = await setMetaWhatsAppFlowPublicKey(publicKey);
  return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.error }, { status: 502 });
}
