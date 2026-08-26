"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import MessageStatus from "@/components/whatsapp/MessageStatus";
import {
  pruneStoredWhatsAppOutbound,
  type WhatsAppPendingOutbound,
} from "./outboundQueueModel";

/**
 * The optimistic outbound bubbles for the open thread.
 *
 * The states, and the rule that decides when a bubble has become a real row, live in
 * `outboundQueueModel.ts`. This file is only the React plumbing around them.
 */
export type {
  WhatsAppPendingOutbound,
  WhatsAppPendingOutboundState,
} from "./outboundQueueModel";
export { pruneStoredWhatsAppOutbound } from "./outboundQueueModel";

type WhatsAppOutboundQueueApi = {
  pending: WhatsAppPendingOutbound[];
  /** Adds a bubble and returns the key used to settle or drop it. */
  queueOutbound(text: string): string;
  settleOutbound(key: string, messageId?: string): void;
  markOutboundUnconfirmed(key: string, note: string): void;
  dropOutbound(key: string): void;
};

const NOOP_QUEUE: WhatsAppOutboundQueueApi = {
  pending: [],
  queueOutbound: () => "",
  settleOutbound: () => {},
  markOutboundUnconfirmed: () => {},
  dropOutbound: () => {},
};

const OutboundQueueContext = createContext<WhatsAppOutboundQueueApi>(NOOP_QUEUE);

/**
 * Falls back to a no-op queue when a composer is rendered outside the provider.
 * Optimistic display is a convenience; sending is not, and must never depend on it.
 */
export function useWhatsAppOutboundQueue() {
  return useContext(OutboundQueueContext);
}

export default function OutboundQueueProvider({
  storedMessageIds,
  children,
}: {
  /** WhatsApp message ids already present in the server-rendered thread. */
  storedMessageIds: string[];
  children: ReactNode;
}) {
  const [pending, setPending] = useState<WhatsAppPendingOutbound[]>([]);
  const counterRef = useRef(0);

  // Joined rather than passed as an array: the server hands us a fresh array on every
  // render, and this effect must only run when the set of stored ids actually changes.
  const storedKey = storedMessageIds.join("|");

  useEffect(() => {
    const stored = storedKey ? storedKey.split("|") : [];
    setPending((current) => {
      const next = pruneStoredWhatsAppOutbound(current, stored);
      // Returning the same array when nothing was pruned keeps this from re-rendering
      // the thread on every poll.
      return next.length === current.length ? current : next;
    });
  }, [storedKey]);

  const queueOutbound = useCallback((text: string) => {
    counterRef.current += 1;
    const key = `pending-${counterRef.current}`;
    setPending((current) => [...current, { key, text, state: "sending" }]);
    return key;
  }, []);

  const settleOutbound = useCallback((key: string, messageId?: string) => {
    setPending((current) =>
      current.map((item) => (item.key === key ? { ...item, state: "sent", messageId } : item)),
    );
  }, []);

  const markOutboundUnconfirmed = useCallback((key: string, note: string) => {
    setPending((current) =>
      current.map((item) => (item.key === key ? { ...item, state: "unconfirmed", note } : item)),
    );
  }, []);

  const dropOutbound = useCallback((key: string) => {
    setPending((current) => current.filter((item) => item.key !== key));
  }, []);

  return (
    <OutboundQueueContext.Provider
      value={{ pending, queueOutbound, settleOutbound, markOutboundUnconfirmed, dropOutbound }}
    >
      {children}
    </OutboundQueueContext.Provider>
  );
}

/**
 * The optimistic bubbles, rendered at the end of the stored thread so ordering stays
 * chronological: everything here is newer than everything the server sent.
 */
export function PendingOutboundList() {
  const { pending, dropOutbound } = useWhatsAppOutboundQueue();
  if (!pending.length) return null;

  return (
    <>
      {pending.map((item) => (
        <article
          key={item.key}
          className={`ml-auto max-w-[min(32rem,85%)] rounded-2xl rounded-br-md px-3.5 py-2.5 shadow-sm ${
            item.state === "unconfirmed"
              ? "border border-brass/40 bg-brass-tint text-[#4a3410]"
              : "bg-ledger-bright/85 text-white"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-6">{item.text}</p>
          {item.state === "unconfirmed" ? (
            <div className="mt-1.5 flex flex-wrap items-center justify-end gap-2 text-[0.65rem]">
              <span className="mr-auto font-medium">Not confirmed</span>
              <span className="text-[#6f4f16]">{item.note}</span>
              <button
                type="button"
                onClick={() => dropOutbound(item.key)}
                className="rounded-full border border-brass/40 px-2 py-0.5 font-medium transition hover:bg-brass/15"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <p className="mt-1 flex items-center justify-end gap-1.5 text-[0.65rem] tabular-nums">
              {/*
                No timestamp: the stored row's own `message_timestamp` is the honest one,
                and inventing a clock time here would only disagree with it a second later.
              */}
              <MessageStatus status={undefined} direction="outbound" onDark />
            </p>
          )}
        </article>
      ))}
    </>
  );
}
