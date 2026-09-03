import type { ReactNode } from "react";

export default function QuickRepliesWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-replies-workspace min-h-full w-full">{children}</div>;
}
