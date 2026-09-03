import type { ReactNode } from "react";

export default function ConversationsWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-inbox-workspace h-full min-h-0 w-full overflow-hidden">{children}</div>;
}
