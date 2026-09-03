"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import TopbarActionPortal from "@/components/whatsapp/TopbarActionPortal";

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
    <>
      <TopbarActionPortal>
        <button type="button" onClick={() => { setOpen(true); setNotice(null); }} aria-expanded={open} className="inline-flex h-8 flex-none items-center rounded-lg border border-ledger/30 bg-ledger px-2.5 text-[0.68rem] font-semibold text-white shadow-sm hover:bg-ledger-bright">
          <span className="hidden sm:inline">Send Flow</span><span className="sm:hidden">Flow</span>
        </button>
      </TopbarActionPortal>

      {notice ? <div role="status" className={`fixed right-3 top-[7.65rem] z-[72] max-w-sm rounded-xl border px-3 py-2 text-xs shadow-lg sm:right-5 lg:top-[4.5rem] ${notice.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{notice.text}</div> : null}

      {open ? (
        <div className="fixed right-3 top-[7.65rem] z-[70] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-rule bg-paper p-3 shadow-xl sm:right-5 lg:top-[4.5rem]">
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
      ) : null}
    </>
  );
}
