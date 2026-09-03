import type { ReactNode } from "react";

export default function AccountWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-account-workspace min-h-full w-full">{children}</div>;
}
