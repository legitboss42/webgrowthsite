"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { WhatsAppRealtimeEvent, WhatsAppRealtimeFeature } from "@/lib/whatsapp/realtime";
import { isWhatsAppRealtimeEventRelevant } from "@/lib/whatsapp/realtime";

type Listener = (event: WhatsAppRealtimeEvent) => void;
type RealtimeContextValue = {
  subscribe: (feature: WhatsAppRealtimeFeature, listener: Listener) => () => void;
};

const WhatsAppRealtimeContext = createContext<RealtimeContextValue | null>(null);

function createBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export default function WhatsAppRealtimeProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const listeners = useRef(new Set<{ feature: WhatsAppRealtimeFeature; listener: Listener }>());

  const subscribe = useCallback((feature: WhatsAppRealtimeFeature, listener: Listener) => {
    const entry = { feature, listener };
    listeners.current.add(entry);
    return () => listeners.current.delete(entry);
  }, []);

  useEffect(() => {
    const client = createBrowserClient();
    if (!client || !workspaceId) return;

    const channel = client
      .channel(`whatsapp:${workspaceId}`)
      .on("broadcast", { event: "changed" }, ({ payload }) => {
        const event: WhatsAppRealtimeEvent = {
          table: typeof payload?.table === "string" ? payload.table : "",
          operation: typeof payload?.operation === "string" ? payload.operation : "",
        };
        if (!event.table) return;
        for (const entry of listeners.current) {
          if (isWhatsAppRealtimeEventRelevant(entry.feature, event)) entry.listener(event);
        }
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [workspaceId]);

  const value = useMemo(() => ({ subscribe }), [subscribe]);
  return <WhatsAppRealtimeContext.Provider value={value}>{children}</WhatsAppRealtimeContext.Provider>;
}

export function useWhatsAppRealtime(
  feature: WhatsAppRealtimeFeature,
  listener: Listener,
) {
  const context = useContext(WhatsAppRealtimeContext);
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    if (!context) return;
    return context.subscribe(feature, (event) => listenerRef.current(event));
  }, [context, feature]);
}
