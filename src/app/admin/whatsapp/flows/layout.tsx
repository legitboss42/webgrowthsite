import type { ReactNode } from "react";

export default function FlowsWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-flow-workspace min-h-full w-full">{children}</div>;
}
