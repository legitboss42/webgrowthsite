"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AIWorkspaceDeepLink() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("ai") === "1";

  useEffect(() => {
    if (!requested) return;
    router.replace("/admin/whatsapp/automations/?section=ai");
  }, [requested, router]);

  return null;
}
