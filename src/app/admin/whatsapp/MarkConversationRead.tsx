"use client";

import { useEffect, useLayoutEffect } from "react";
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

  // A conversation opens where the work actually is: the newest message. Run once for
  // the selected conversation, then repeat across two animation frames so hydration and
  // the native media controls have finished settling before the final scroll position is
  // locked in. Normal manual scrolling is untouched after that.
  useLayoutEffect(() => {
    const visibleOnThisDevice =
      explicitSelection || window.matchMedia("(min-width: 1024px)").matches;
    if (!visibleOnThisDevice) return;

    const scrollToLatest = () => {
      const editor = document.getElementById("whatsapp-composer-editor");
      const composerShell = editor?.closest("form")?.parentElement;
      const messageViewport = composerShell?.previousElementSibling;
      if (!(messageViewport instanceof HTMLElement)) return;
      messageViewport.scrollTop = messageViewport.scrollHeight;
    };

    scrollToLatest();
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      scrollToLatest();
      secondFrame = window.requestAnimationFrame(scrollToLatest);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [conversationId, explicitSelection]);

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
