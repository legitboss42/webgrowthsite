"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type FlowOption = {
  id: string;
  name: string;
  categories: string[];
  dynamic: boolean;
};

type Notice = { tone: "ok" | "error"; text: string } | null;

export default function ConversationFlowLauncher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("lead")?.trim() || "";
  const visible = pathname === "/admin/whatsapp/conversations" || pathname === "/admin/whatsapp/conversations/";
  const [flows, setFlows] = useState<FlowOption[]>([]);
  const [flowId, setFlowId] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!visible || !conversationId) return;
    let cancelled = false;
    fetch("/api/admin/whatsapp/flows/send/", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { flows?: FlowOption[] };
        if (!cancelled && response.ok) setFlows(Array.isArray(payload.flows) ? payload.flows : []);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [visible, conversationId]);

  const selected = useMemo(() => flows.find((flow) => flow.id === flowId) || null, [flows, flowId]);
  if (!visible || !conversationId || !flows.length) return null;

  function send() {
    if (!flowId || pending) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/whatsapp/flows/send/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, flowId }),
        });
        const payload = await response.json().catch(() => ({})) as { error?: string; warning?: string };
        if (!response.ok) throw new Error(payload.error || "The Flow could not be sent.");
        setNotice({ tone: "ok", text: payload.warning || `${selected?.name || "Flow"} sent.` });
        setOpen(false);
        setFlowId("");
      } catch (error) {
        setNotice({ tone: "error", text: error instanceof Error ? error.message : "The Flow could not be sent." });
      }
    });
  }

  return (
    <div className="pointer-events-none fixed bottom-[5.35rem] right-3 z-40 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {notice ? <div role="status" className={`pointer-events-auto max-w-sm rounded-xl border px-3 py-2 text-xs shadow-lg ${notice.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{notice.text}</div> : null}
      {open ? (
        <div className="pointer-events-auto w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-rule bg-paper p-3 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[0.62rem] font-semibold uppercase tracking-[.12em] text-ledger">WhatsApp Flow</p><p className="mt-0.5 text-sm font-semibold text-ink">Send a published Flow</p></div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-sm text-ink-faint hover:bg-paper-sunk">Close</button>
          </div>
          <label className="mt-3 block text-xs font-semibold text-ink-soft">Flow
            <select autoFocus value={flowId} onChange={(event) => setFlowId(event.target.value)} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm text-ink">
              <option value="">Choose published Flow</option>
              {flows.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}{flow.dynamic ? " · Dynamic" : ""}</option>)}
            </select>
          </label>
          {selected ? <p className="mt-2 text-xs leading-5 text-ink-faint">{selected.categories.join(" · ") || "OTHER"}. A tracked submission is created automatically and Flow Started automations can run immediately.</p> : null}
          <button type="button" disabled={!flowId || pending} onClick={send} className="mt-3 w-full rounded-xl bg-ledger px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{pending ? "Sending…" : "Send Flow"}</button>
        </div>
      ) : (
        <button type="button" onClick={() => { setOpen(true); setNotice(null); }} className="pointer-events-auto rounded-full border border-ledger/20 bg-ledger px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-ledger-bright">Send Flow</button>
      )}
    </div>
  );
}
