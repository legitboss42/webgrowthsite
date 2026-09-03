"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export default function TopbarActionPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("wg-whatsapp-topbar-actions"));
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}
