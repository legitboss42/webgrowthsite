import { getTikTokMediaHeaders, normalizeTikTokMediaPath, normalizeTikTokPhoto } from "@/lib/scheduler/mediaDelivery";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  let objectPath: string;
  try {
    objectPath = normalizeTikTokMediaPath((await context.params).path);
  } catch {
    return new Response("Not found.", { status: 404 });
  }

  const supabase = createSchedulerSupabaseClient();
  const { data, error } = await supabase.storage.from("tiktok-publishing-staging").download(objectPath);
  if (error || !data) return new Response("Not found.", { status: 404 });

  if (data.type.startsWith("image/")) {
    const normalized = await normalizeTikTokPhoto(await data.arrayBuffer());
    const responseBody = new Blob([new Uint8Array(normalized)], { type: "image/jpeg" });
    return new Response(responseBody, {
      status: 200,
      headers: getTikTokMediaHeaders("image/jpeg", responseBody.size),
    });
  }

  return new Response(data, {
    status: 200,
    headers: getTikTokMediaHeaders(data.type, data.size),
  });
}
