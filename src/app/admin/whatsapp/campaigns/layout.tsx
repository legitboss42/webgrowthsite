import type { ReactNode } from "react";

export default function CampaignsWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-campaign-workspace min-h-full w-full">{children}</div>;
}
