import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canonicalContentAutomationAccess } from "@/lib/unifiedAuthorization";
import { readWebGrowthSessionFromCookieStore } from "@/lib/webGrowthSession";

export async function requireWebGrowthDashboardSession() {
  const cookieStore = await cookies();
  const session = readWebGrowthSessionFromCookieStore(cookieStore);
  if (!session) redirect("/sign-in/?next=/dashboard/");
  return { cookieStore, session };
}

export async function requireContentAutomationDashboardAdmin() {
  const result = await requireWebGrowthDashboardSession();
  if (!canonicalContentAutomationAccess(result.session)) {
    redirect("/dashboard/content/?access=restricted");
  }
  return result;
}
