import type { ReactNode } from "react";

export default function TemplatesWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-template-workspace min-h-full w-full">{children}</div>;
}
