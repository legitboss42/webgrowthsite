"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type MouseEvent } from "react";
import type { WhatsAppContactRow } from "./contactsModel";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Date(parsed).toLocaleString();
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose(): void;
  children: React.ReactNode;
}) {
  function closeOnBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/45 px-3 py-8 sm:px-6"
      onMouseDown={closeOnBackdrop}
      role="presentation"
    >
      <section className="w-full max-w-3xl rounded-2xl border border-rule bg-paper-raised shadow-2xl" role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-start gap-4 border-b border-rule px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-ink-faint">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-rule px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink">
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder, type = "text", required = false, readOnly = false }: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel";
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[.1em] text-ink-faint">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        className={`mt-1.5 w-full rounded-lg border border-rule px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/15 ${readOnly ? "bg-paper-sunk text-ink-faint" : "bg-paper"}`}
      />
    </label>
  );
}

function ContactForm({ mode, contact, onClose }: { mode: "create" | "edit"; contact?: WhatsAppContactRow; onClose(): void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const payload: Record<string, string> = {
      displayName: String(data.get("displayName") || ""),
      businessName: String(data.get("businessName") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      website: String(data.get("website") || ""),
      source: String(data.get("source") || ""),
      leadStatus: String(data.get("leadStatus") || "open"),
      leadTemperature: String(data.get("leadTemperature") || "COLD"),
    };
    if (mode === "create") payload.whatsappNumber = String(data.get("whatsappNumber") || "");
    if (mode === "edit" && contact) payload.id = contact.id;

    try {
      const response = await fetch("/api/admin/whatsapp/contacts/", {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error || "The contact could not be saved.");
      onClose();
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The contact could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const conversationHref = contact?.conversation
    ? `/admin/whatsapp/conversations/?lead=${encodeURIComponent(contact.conversation.id)}`
    : null;

  return (
    <form onSubmit={submit}>
      {mode === "edit" && contact ? (
        <div className="grid gap-3 border-b border-rule bg-paper-sunk/55 px-5 py-4 text-xs sm:grid-cols-4 sm:px-6">
          <div><p className="text-ink-faint">WhatsApp ID</p><p className="mt-1 break-all font-mono text-ink">+{contact.wa_id}</p></div>
          <div><p className="text-ink-faint">Created</p><p className="mt-1 text-ink">{formatDateTime(contact.created_at)}</p></div>
          <div><p className="text-ink-faint">Updated</p><p className="mt-1 text-ink">{formatDateTime(contact.updated_at)}</p></div>
          <div><p className="text-ink-faint">Last contacted</p><p className="mt-1 text-ink">{formatDateTime(contact.conversation?.last_message_at)}</p></div>
          <div className="sm:col-span-4">
            {conversationHref ? (
              <Link href={conversationHref} className="font-semibold text-ledger underline decoration-ledger/30 underline-offset-4">Open conversation</Link>
            ) : (
              <span className="text-ink-faint">No conversation yet. A thread will appear when this contact messages the business.</span>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
        {mode === "create" ? (
          <Field label="WhatsApp number" name="whatsappNumber" type="tel" placeholder="+2348066706336" required />
        ) : null}
        <Field label="Display name" name="displayName" defaultValue={contact?.display_name} placeholder="Customer name" />
        <Field label="Business" name="businessName" defaultValue={contact?.business_name} placeholder="Company or business" />
        <Field label="Email" name="email" type="email" defaultValue={contact?.email} placeholder="name@example.com" />
        <Field label="Phone" name="phone" type="tel" defaultValue={contact?.phone} placeholder="Optional display number" />
        <Field label="Website" name="website" defaultValue={contact?.website} placeholder="example.com" />
        <Field label="Source" name="source" defaultValue={contact?.source || (mode === "create" ? "Manual" : "")} placeholder="WhatsApp, Website, Referral..." />
        <Field label="Lead status" name="leadStatus" defaultValue={contact?.lead_status || "open"} placeholder="open" required />
        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[.1em] text-ink-faint">Temperature</span>
          <select name="leadTemperature" defaultValue={contact?.lead_temperature || "COLD"} className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/15">
            <option value="COLD">Cold</option>
            <option value="WARM">Warm</option>
            <option value="HOT">Hot</option>
          </select>
        </label>
      </div>

      {error ? <p className="mx-5 mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 sm:mx-6">{error}</p> : null}
      <div className="flex items-center justify-end gap-2 border-t border-rule px-5 py-4 sm:px-6">
        <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-rule px-4 py-2 text-sm font-medium text-ink-soft disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-ledger-bright px-4 py-2 text-sm font-semibold text-white transition hover:bg-ledger disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Saving…" : mode === "create" ? "Create contact" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export function ContactCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center rounded-lg bg-ledger-bright px-4 py-2 text-sm font-semibold text-white transition hover:bg-ledger">
        + Add contact
      </button>
      {open ? (
        <ModalShell title="Add contact" subtitle="Create a CRM contact before they message the business. Duplicate WhatsApp numbers are blocked automatically." onClose={() => setOpen(false)}>
          <ContactForm mode="create" onClose={() => setOpen(false)} />
        </ModalShell>
      ) : null}
    </>
  );
}

export function ContactProfileButton({ contact }: { contact: WhatsAppContactRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center rounded-lg border border-rule bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-ledger hover:text-ledger">
        Profile
      </button>
      {open ? (
        <ModalShell title={contact.display_name || contact.business_name || `+${contact.wa_id}`} subtitle="CRM profile. Changes here are internal and do not alter what the customer sees in WhatsApp." onClose={() => setOpen(false)}>
          <ContactForm mode="edit" contact={contact} onClose={() => setOpen(false)} />
        </ModalShell>
      ) : null}
    </>
  );
}
