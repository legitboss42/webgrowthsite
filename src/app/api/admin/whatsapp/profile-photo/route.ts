import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  fetchWhatsAppBusinessProfile,
  isWhatsAppProfilePictureUrl,
} from "@/lib/whatsapp/businessProfile";

export const runtime = "nodejs";

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

function metaConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion =
    process.env.WHATSAPP_API_VERSION?.trim() ||
    process.env.WHATSAPP_GRAPH_API_VERSION?.trim() ||
    "v26.0";
  return token && phoneNumberId ? { token, phoneNumberId, apiVersion } : null;
}

async function mutationGuard(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  return null;
}

/** Streams the profile picture Meta currently holds for the configured number. */
export async function GET() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const result = await fetchWhatsAppBusinessProfile({ revalidateSeconds: 0 });
  if (!result.ok) {
    const status = result.reason === "NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ error: "Unable to read the WhatsApp business profile." }, { status });
  }

  const url = result.profile.profilePictureUrl;
  if (!url) {
    return NextResponse.json({ error: "Meta holds no profile picture for this WhatsApp number." }, { status: 404 });
  }
  if (!isWhatsAppProfilePictureUrl(url)) {
    console.error("WhatsApp profile picture URL was not on an expected WhatsApp host");
    return NextResponse.json({ error: "Unexpected profile picture source." }, { status: 502 });
  }

  try {
    const imageResponse = await fetch(url, { cache: "no-store" });
    if (!imageResponse.ok) {
      console.error("WhatsApp profile picture download failed", { status: imageResponse.status });
      return NextResponse.json({ error: "Unable to download the WhatsApp profile picture." }, { status: 502 });
    }
    const contentType = imageResponse.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Unexpected profile picture content." }, { status: 502 });
    }
    return new Response(await imageResponse.arrayBuffer(), {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("WhatsApp profile picture proxy failed", error);
    return NextResponse.json({ error: "Unable to download the WhatsApp profile picture." }, { status: 502 });
  }
}

/**
 * Uploads JPEG/PNG bytes through Meta's Resumable Upload API, then applies the returned
 * handle to the WhatsApp Business profile. The access token never reaches the browser.
 */
export async function PUT(request: Request) {
  const blocked = await mutationGuard(request);
  if (blocked) return blocked;

  const config = metaConfig();
  if (!config) {
    return NextResponse.json({ error: "WhatsApp Business API is not configured." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const candidate = formData.get("photo");
  if (!(candidate instanceof File)) {
    return NextResponse.json({ error: "Choose a profile photo to upload." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(candidate.type)) {
    return NextResponse.json({ error: "Profile photo must be a JPEG or PNG image." }, { status: 400 });
  }
  if (candidate.size < 1 || candidate.size > MAX_PROFILE_PHOTO_BYTES) {
    return NextResponse.json({ error: "Profile photo must be smaller than 5 MB." }, { status: 400 });
  }

  const { token, phoneNumberId, apiVersion } = config;
  const query = new URLSearchParams({
    file_length: String(candidate.size),
    file_type: candidate.type,
    file_name: candidate.name || "whatsapp-profile-photo",
  });

  try {
    const sessionResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/app/uploads/?${query.toString()}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    const session = (await sessionResponse.json().catch(() => ({}))) as { id?: string; error?: unknown };
    if (!sessionResponse.ok || !session.id) {
      console.error("WhatsApp profile photo upload session failed", sessionResponse.status, session.error);
      return NextResponse.json({ error: "Meta could not start the profile photo upload." }, { status: 502 });
    }

    const uploadResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${session.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": candidate.type,
        file_offset: "0",
      },
      body: await candidate.arrayBuffer(),
      cache: "no-store",
    });
    const upload = (await uploadResponse.json().catch(() => ({}))) as { h?: string; error?: unknown };
    if (!uploadResponse.ok || !upload.h) {
      console.error("WhatsApp profile photo data upload failed", uploadResponse.status, upload.error);
      return NextResponse.json({ error: "Meta could not upload the profile photo." }, { status: 502 });
    }

    const profileResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/whatsapp_business_profile`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", profile_picture_handle: upload.h }),
        cache: "no-store",
      },
    );
    if (!profileResponse.ok) {
      const detail = await profileResponse.text().catch(() => "");
      console.error("WhatsApp profile photo apply failed", profileResponse.status, detail.slice(0, 500));
      return NextResponse.json({ error: "The image uploaded, but Meta could not apply it to the business profile." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WhatsApp profile photo update failed", error);
    return NextResponse.json({ error: "Could not reach Meta while updating the profile photo." }, { status: 502 });
  }
}
