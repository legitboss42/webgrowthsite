import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { resolveWhatsAppMetaConfig } from "@/lib/whatsapp/workspaceCredentials";

export const runtime = "nodejs";
type MetaMediaMetadata = { url?: string; mime_type?: string; file_size?: number; messaging_product?: string };
export async function GET(request: Request, context: { params: Promise<{ mediaId: string }> }) {
  const access = await getWhatsAppWorkspaceAccess(await cookies()); if (!access) return NextResponse.json({ error: "Authentication required." }, { status:401 });
  const { mediaId } = await context.params; if (!/^[A-Za-z0-9_.:-]{6,256}$/.test(mediaId)) return NextResponse.json({ error: "Invalid WhatsApp media reference." }, { status:400 });
  const owned = await readWhatsAppRows<Record<string,unknown>>(`whatsapp_messages?media_id=eq.${encodeURIComponent(mediaId)}&select=id&limit=1`, { workspaceId: access.workspaceId });
  if (!owned?.[0]) return NextResponse.json({ error: "This media item does not belong to the active workspace." }, { status:404 });
  const config = await resolveWhatsAppMetaConfig({ workspaceId: access.workspaceId }); if (!config) return NextResponse.json({ error: "The WhatsApp sender is not configured for this workspace." }, { status:503 });
  const authorization = `Bearer ${config.token}`;
  try {
    const metadataResponse = await fetch(`https://graph.facebook.com/${config.apiVersion}/${encodeURIComponent(mediaId)}`, { headers:{Authorization:authorization}, cache:"no-store" }); if (!metadataResponse.ok) return NextResponse.json({ error: "Unable to load this WhatsApp media item." }, { status:502 });
    const metadata = await metadataResponse.json() as MetaMediaMetadata; if (!metadata.url) return NextResponse.json({ error: "WhatsApp media URL was not returned by Meta." }, { status:502 });
    const range = request.headers.get("range"); const mediaHeaders: Record<string,string> = { Authorization:authorization }; if (range) mediaHeaders.Range = range;
    const mediaResponse = await fetch(metadata.url,{headers:mediaHeaders,cache:"no-store"}); if (!mediaResponse.ok) return NextResponse.json({ error: "Unable to download this WhatsApp media item." }, { status:502 });
    const responseHeaders = new Headers({ "Content-Type":metadata.mime_type || mediaResponse.headers.get("content-type") || "application/octet-stream", "Cache-Control":"private, no-store", "Accept-Ranges":mediaResponse.headers.get("accept-ranges") || "bytes" }); for (const header of ["content-length","content-range","etag","last-modified"]) { const value=mediaResponse.headers.get(header); if(value) responseHeaders.set(header,value); }
    return new Response(mediaResponse.body,{status:mediaResponse.status,headers:responseHeaders});
  } catch (error) { console.error("WhatsApp media proxy failed", access.workspaceId, error); return NextResponse.json({ error: "Unable to load this WhatsApp media item." }, { status:502 }); }
}
