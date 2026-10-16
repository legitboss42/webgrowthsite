"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { WHATSAPP_REALTIME_EVENT, type WhatsAppRealtimeInvalidation } from "@/lib/whatsapp/pollingPolicy";

export default function WhatsAppRealtimeBridge({ topic }: { topic: string | null }) {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!topic || !url || !key) return;

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
    const channel = supabase
      .channel(topic)
      .on("broadcast", { event: "invalidate" }, ({ payload }) => {
        const detail = payload && typeof payload === "object" ? payload as WhatsAppRealtimeInvalidation : {};
        window.dispatchEvent(new CustomEvent<WhatsAppRealtimeInvalidation>(WHATSAPP_REALTIME_EVENT, { detail }));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [topic]);

  return null;
}
