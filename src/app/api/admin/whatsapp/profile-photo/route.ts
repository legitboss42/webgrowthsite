import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { fetchWhatsAppBusinessProfile, isWhatsAppProfilePictureUrl } from "@/lib/whatsapp/businessProfile";
import { resolveWhatsAppMetaConfig } from "@/lib/whatsapp/workspaceCredentials";

export const runtime = "nodejs";
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024; const ALLOWED_TYPES = new Set(["image/jpeg","image/png"]);
async function access() { return getWhatsAppWorkspaceAccess(await cookies()); }
async function mutationGuard(request: Request) { const current = await access(); if (!current) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const; if (current.role !== "owner") return { response: NextResponse.json({ error: "Workspace owner access is required." }, { status: 403 }) } as const; if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const; return { access: current } as const; }
export async function GET() {
  const current = await access(); if (!current) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const result = await fetchWhatsAppBusinessProfile({ workspaceId: current.workspaceId, revalidateSeconds: 0 }); if (!result.ok) return NextResponse.json({ error: "Unable to read the WhatsApp business profile." }, { status: result.reason === "NOT_CONFIGURED" ? 503 : 502 });
  const url = result.profile.profilePictureUrl; if (!url) return NextResponse.json({ error: "Meta holds no profile picture for this WhatsApp number." }, { status: 404 }); if (!isWhatsAppProfilePictureUrl(url)) return NextResponse.json({ error: "Unexpected profile picture source." }, { status: 502 });
  try { const imageResponse = await fetch(url,{cache:"no-store"}); if (!imageResponse.ok) return NextResponse.json({ error: "Unable to download the WhatsApp profile picture." }, { status: 502 }); const contentType = imageResponse.headers.get("content-type") || ""; if (!contentType.startsWith("image/")) return NextResponse.json({ error: "Unexpected profile picture content." }, { status: 502 }); return new Response(await imageResponse.arrayBuffer(), { status:200, headers:{"Content-Type":contentType,"Cache-Control":"private, no-store"} }); } catch { return NextResponse.json({ error: "Unable to download the WhatsApp profile picture." }, { status:502 }); }
}
export async function PUT(request: Request) {
  const checked = await mutationGuard(request); if ("response" in checked) return checked.response; const config = await resolveWhatsAppMetaConfig({ workspaceId: checked.access.workspaceId }); if (!config) return NextResponse.json({ error: "This workspace WhatsApp connection is not configured." }, { status:503 });
  let formData: FormData; try { formData = await request.formData(); } catch { return NextResponse.json({ error: "Invalid upload." }, { status:400 }); }
  const candidate = formData.get("photo"); if (!(candidate instanceof File)) return NextResponse.json({ error: "Choose a profile photo to upload." }, { status:400 }); if (!ALLOWED_TYPES.has(candidate.type)) return NextResponse.json({ error: "Profile photo must be a JPEG or PNG image." }, { status:400 }); if (candidate.size < 1 || candidate.size > MAX_PROFILE_PHOTO_BYTES) return NextResponse.json({ error: "Profile photo must be smaller than 5 MB." }, { status:400 });
  const query = new URLSearchParams({ file_length:String(candidate.size), file_type:candidate.type, file_name:candidate.name || "whatsapp-profile-photo" });
  try {
    const sessionResponse = await fetch(`https://graph.facebook.com/${config.apiVersion}/app/uploads/?${query.toString()}`, { method:"POST", headers:{Authorization:`Bearer ${config.token}`}, cache:"no-store" }); const session = await sessionResponse.json().catch(() => ({})) as {id?:string;error?:unknown}; if (!sessionResponse.ok || !session.id) return NextResponse.json({ error: "Meta could not start the profile photo upload." }, { status:502 });
    const uploadResponse = await fetch(`https://graph.facebook.com/${config.apiVersion}/${session.id}`, { method:"POST", headers:{Authorization:`Bearer ${config.token}`,"Content-Type":candidate.type,file_offset:"0"}, body:await candidate.arrayBuffer(), cache:"no-store" }); const upload = await uploadResponse.json().catch(() => ({})) as {h?:string;error?:unknown}; if (!uploadResponse.ok || !upload.h) return NextResponse.json({ error: "Meta could not upload the profile photo." }, { status:502 });
    const profileResponse = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/whatsapp_business_profile`, { method:"POST", headers:{Authorization:`Bearer ${config.token}`,"Content-Type":"application/json"}, body:JSON.stringify({messaging_product:"whatsapp",profile_picture_handle:upload.h}), cache:"no-store" }); if (!profileResponse.ok) return NextResponse.json({ error: "The image uploaded, but Meta could not apply it to the business profile." }, { status:502 }); return NextResponse.json({ok:true});
  } catch (error) { console.error("WhatsApp profile photo update failed", error); return NextResponse.json({ error: "Could not reach Meta while updating the profile photo." }, { status:502 }); }
}
