import type { ReactNode } from "react";

export default function CallsWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-calls-workspace min-h-full w-full">{children}</div>;
}
