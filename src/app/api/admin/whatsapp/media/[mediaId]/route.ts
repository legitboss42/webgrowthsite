import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";

export const runtime = "nodejs";

type MetaMediaMetadata = {
  url?: string;
  mime_type?: string;
  file_size?: number;
  messaging_product?: string;
};

function getWhatsAppConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";
  return token ? { token, apiVersion } : null;
}

export async function GET(_request: Request, context: { params: Promise<{ mediaId: string }> }) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { mediaId } = await context.params;
  if (!/^[A-Za-z0-9_.:-]{6,256}$/.test(mediaId)) {
    return NextResponse.json({ error: "Invalid WhatsApp media reference." }, { status: 400 });
  }

  const config = getWhatsAppConfig();
  if (!config) {
    return NextResponse.json({ error: "The WhatsApp sender is not configured on this deployment." }, { status: 503 });
  }

  const headers = { Authorization: `Bearer ${config.token}` };
  try {
    const metadataResponse = await fetch(`https://graph.facebook.com/${config.apiVersion}/${encodeURIComponent(mediaId)}`, {
      headers,
      cache: "no-store",
    });
    if (!metadataResponse.ok) {
      console.error("WhatsApp Cloud API media metadata fetch failed", { status: metadataResponse.status });
      return NextResponse.json({ error: "Unable to load this WhatsApp media item." }, { status: 502 });
    }

    const metadata = (await metadataResponse.json()) as MetaMediaMetadata;
    if (!metadata.url) {
      return NextResponse.json({ error: "WhatsApp media URL was not returned by Meta." }, { status: 502 });
    }

    const mediaResponse = await fetch(metadata.url, { headers, cache: "no-store" });
    if (!mediaResponse.ok) {
      console.error("WhatsApp Cloud API media download failed", { status: mediaResponse.status });
      return NextResponse.json({ error: "Unable to download this WhatsApp media item." }, { status: 502 });
    }

    const body = await mediaResponse.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": metadata.mime_type || mediaResponse.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("WhatsApp media proxy failed", error);
    return NextResponse.json({ error: "Unable to load this WhatsApp media item." }, { status: 502 });
  }
}
