"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarkConversationRead({
  conversationId,
  unreadCount,
  explicitSelection,
}: {
  conversationId: string;
  unreadCount: number;
  explicitSelection: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (unreadCount <= 0) return;

    const visibleOnThisDevice =
      explicitSelection || window.matchMedia("(min-width: 1024px)").matches;
    if (!visibleOnThisDevice) return;

    const controller = new AbortController();
    void fetch("/api/admin/whatsapp/conversations/read/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        router.refresh();
      })
      .catch(() => {
        // Losing a read receipt is harmless. The next render/open retries it.
      });

    return () => controller.abort();
  }, [conversationId, explicitSelection, router, unreadCount]);

  return null;
}
