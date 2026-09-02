"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

function openWorkspace() {
  const button = document.querySelector<HTMLButtonElement>('button[aria-label="Open AI workspace"]');
  if (!button) return false;
  button.click();
  return true;
}

export default function AIWorkspaceDeepLink() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("ai") === "1";

  useEffect(() => {
    if (!requested) return;
    if (openWorkspace()) return;

    const first = window.setTimeout(() => {
      if (openWorkspace()) return;
      window.setTimeout(openWorkspace, 350);
    }, 120);

    return () => window.clearTimeout(first);
  }, [requested]);

  return null;
}
