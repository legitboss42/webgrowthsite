import type { ReactNode } from "react";

export default function PhoneNumbersWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="wg-numbers-workspace min-h-full w-full">{children}</div>;
}
