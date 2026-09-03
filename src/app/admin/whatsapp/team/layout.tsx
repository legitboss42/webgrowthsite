import type { ReactNode } from "react";

export default function TeamWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-team-workspace min-h-full w-full">{children}</div>;
}
