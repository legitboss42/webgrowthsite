"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  WhatsAppContactTimelineItem,
  WhatsAppContactTimelineKind,
} from "./contactTimelineModel";

type Filter = "all" | WhatsAppContactTimelineKind;

function formatDateTime(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

function kindLabel(kind: WhatsAppContactTimelineKind) {
  if (kind === "message") return "Message";
  if (kind === "call") return "Call";
  return "Activity";
}

function kindClasses(kind: WhatsAppContactTimelineKind) {
  if (kind === "message") return "bg-ledger-tint text-ledger ring-1 ring-ledger/20";
  if (kind === "call") return "bg-brass-tint text-[#6f4f16] ring-1 ring-brass/25";
  return "bg-paper-sunk text-ink-soft ring-1 ring-rule";
}

export default function ContactTimeline({ contactId }: { contactId: string }) {
  const [items, setItems] = useState<WhatsAppContactTimelineItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/whatsapp/contacts/timeline/?id=${encodeURIComponent(contactId)}`, {
          cache: "no-store",
        });
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
          items?: WhatsAppContactTimelineItem[];
        };
        if (!response.ok) throw new Error(result.error || "Contact history could not be loaded.");
        if (!cancelled) setItems(Array.isArray(result.items) ? result.items : []);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Contact history could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  const visible = useMemo(
    () => filter === "all" ? items : items.filter((item) => item.kind === filter),
    [filter, items],
  );

  const counts = useMemo(() => ({
    all: items.length,
    message: items.filter((item) => item.kind === "message").length,
    call: items.filter((item) => item.kind === "call").length,
    activity: items.filter((item) => item.kind === "activity").length,
  }), [items]);

  return (
    <section className="border-t border-rule px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Contact timeline</h3>
          <p className="mt-1 text-xs text-ink-faint">Messages, WhatsApp calls, CRM edits and team activity in one ordered history.</p>
        </div>
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex w-max gap-1.5">
            {(["all", "message", "call", "activity"] as const).map((item) => {
              const active = filter === item;
              const label = item === "all" ? "All" : kindLabel(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold transition ${active ? "bg-ledger-bright text-white" : "border border-rule bg-paper text-ink-soft hover:border-rule-strong"}`}
                >
                  {label} {counts[item]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? <p className="mt-4 rounded-lg bg-paper-sunk px-3 py-4 text-center text-xs text-ink-faint">Loading contact history…</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-700">{error}</p> : null}
      {!loading && !error && visible.length === 0 ? (
        <p className="mt-4 rounded-lg bg-paper-sunk px-3 py-4 text-center text-xs text-ink-faint">No {filter === "all" ? "timeline" : filter} records for this contact yet.</p>
      ) : null}

      {!loading && !error && visible.length ? (
        <ol className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {visible.map((item) => (
            <li key={item.id} className="rounded-xl border border-rule bg-paper px-3 py-3">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex-none rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[.08em] ${kindClasses(item.kind)}`}>
                  {kindLabel(item.kind)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <p className="text-xs font-semibold text-ink">{item.title}</p>
                    <time className="flex-none text-[0.65rem] text-ink-faint" dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time>
                  </div>
                  {item.detail ? <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-ink-soft">{item.detail}</p> : null}
                  <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[0.65rem] text-ink-faint">
                    {item.direction ? <span>{item.direction === "outbound" ? "Business → customer" : "Customer → business"}</span> : null}
                    {item.status ? <span className="capitalize">{item.status.replaceAll("_", " ")}</span> : null}
                    {item.actor ? <span>{item.actor}</span> : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
