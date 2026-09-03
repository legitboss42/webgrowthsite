import type { ReactNode } from "react";

export default function AutomationsWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-automation-workspace min-h-full w-full">{children}</div>;
}
