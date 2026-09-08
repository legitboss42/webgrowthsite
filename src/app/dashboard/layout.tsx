import type { Metadata } from "next";
import type { ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireWebGrowthDashboardSession } from "@/lib/dashboardSession";

export const metadata: Metadata = {
  title: { default: "Automation Dashboard | Web Growth", template: "%s | Web Growth Automation" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { session } = await requireWebGrowthDashboardSession();
  return <DashboardShell session={session}>{children}</DashboardShell>;
}
