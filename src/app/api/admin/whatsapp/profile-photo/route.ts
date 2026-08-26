import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import {
  fetchWhatsAppBusinessProfile,
  isWhatsAppProfilePictureUrl,
} from "@/lib/whatsapp/businessProfile";

export const runtime = "nodejs";

/**
 * Streams the WhatsApp Business profile picture Meta actually holds for our number.
 *
 * The point of proxying rather than embedding the URL is that this proves the picture
 * exists on Meta's side: the bytes come from `pps.whatsapp.net` by way of a URL only
 * the Graph API can hand us. A local file rendered in its place would prove nothing.
 *
 * Two deliberate constraints:
 *  - the client never supplies a URL, so there is no request-forgery surface. The URL
 *    is read from the profile and checked against WhatsApp's own CDN before it is
 *    followed.
 *  - the Meta bearer token is sent to Graph only. The CDN URL is already signed, and
 *    attaching our credential to a third host would leak it.
 */
export async function GET() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const result = await fetchWhatsAppBusinessProfile({ revalidateSeconds: 300 });
  if (!result.ok) {
    const status = result.reason === "NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ error: "Unable to read the WhatsApp business profile." }, { status });
  }

  const url = result.profile.profilePictureUrl;
  if (!url) {
    return NextResponse.json(
      { error: "Meta holds no profile picture for this WhatsApp number." },
      { status: 404 },
    );
  }

  if (!isWhatsAppProfilePictureUrl(url)) {
    console.error("WhatsApp profile picture URL was not on an expected WhatsApp host");
    return NextResponse.json({ error: "Unexpected profile picture source." }, { status: 502 });
  }

  try {
    const imageResponse = await fetch(url, { cache: "no-store" });
    if (!imageResponse.ok) {
      console.error("WhatsApp profile picture download failed", { status: imageResponse.status });
      return NextResponse.json(
        { error: "Unable to download the WhatsApp profile picture." },
        { status: 502 },
      );
    }

    const contentType = imageResponse.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Unexpected profile picture content." }, { status: 502 });
    }

    return new Response(await imageResponse.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Short private cache: the signed CDN URL rotates, and a console reload should
        // not re-download the same 33 KB every time.
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("WhatsApp profile picture proxy failed", error);
    return NextResponse.json(
      { error: "Unable to download the WhatsApp profile picture." },
      { status: 502 },
    );
  }
}
