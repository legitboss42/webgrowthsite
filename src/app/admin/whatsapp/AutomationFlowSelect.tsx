"use client";

import { useEffect, useState } from "react";

type FlowOption = {
  id: string;
  name: string;
  categories: string[];
  dynamic: boolean;
};

type Props = {
  value: string;
  disabled?: boolean;
  allowAny?: boolean;
  label?: string;
  onChange(value: string): void;
};

export default function AutomationFlowSelect({ value, disabled, allowAny = false, label = "Published Flow", onChange }: Props) {
  const [flows, setFlows] = useState<FlowOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/whatsapp/flows/send/", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { flows?: FlowOption[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Published Flows could not be loaded.");
        if (!cancelled) {
          setFlows(Array.isArray(payload.flows) ? payload.flows : []);
          setError("");
        }
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Published Flows could not be loaded.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <label className="mt-3 block text-xs font-semibold text-ink-soft">{label}
      <select disabled={disabled || loading} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm">
        <option value="">{loading ? "Loading published Flows…" : allowAny ? "Any published Flow" : "Choose published Flow"}</option>
        {flows.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}{flow.dynamic ? " · Dynamic" : ""}</option>)}
      </select>
      {error ? <span className="mt-1 block text-[0.68rem] font-normal text-rose-700">{error}</span> : null}
      {!loading && !error && !flows.length ? <span className="mt-1 block text-[0.68rem] font-normal text-ink-faint">No Published Flows yet. Publish one from WhatsApp → Flows first.</span> : null}
    </label>
  );
}
