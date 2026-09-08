import { isAllowedGoogleAdminEmail } from "@/lib/googleAuth";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";

export async function resolveOwnerSchedulerIdentity(email: string | null | undefined) {
  if (!isAllowedGoogleAdminEmail(email)) return null;
  const openIds = (process.env.OWNER_TIKTOK_OPEN_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!openIds.length) return null;

  const store = await createSupabaseSchedulerStore();
  for (const openId of openIds) {
    const user = await store.getUserByTikTokOpenId(openId);
    if (user?.id) return { userId: String(user.id), openId };
  }
  return null;
}
