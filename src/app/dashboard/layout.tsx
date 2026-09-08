import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { readWebGrowthSessionFromCookieStore } from "@/lib/webGrowthSession";

export const metadata: Metadata = {
  title: { default: "Automation Dashboard | Web Growth", template: "%s | Web Growth Automation" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = readWebGrowthSessionFromCookieStore(cookieStore);
  if (!session) redirect("/sign-in/?next=/dashboard/");
  return <DashboardShell session={session}>{children}</DashboardShell>;
}
