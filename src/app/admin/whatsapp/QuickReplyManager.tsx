"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  WHATSAPP_QUICK_REPLY_DEFAULT_CATEGORIES,
  WHATSAPP_QUICK_REPLY_LIMITS,
  WHATSAPP_QUICK_REPLY_VARIABLES,
  extractWhatsAppQuickReplyVariables,
  normalizeWhatsAppQuickReplyShortcut,
  validateWhatsAppQuickReplyInput,
  type WhatsAppQuickReply,
  type WhatsAppQuickReplyScope,
} from "./quickRepliesModel";
import {
  formatWhatsAppMediaSize,
  getWhatsAppMediaAccept,
  validateWhatsAppMediaFile,
} from "@/lib/whatsapp/media";

type Draft = { shortcut: string; title: string; body: string; scope: WhatsAppQuickReplyScope; category: string };
type Notice = { tone: "ok" | "error"; text: string } | null;
type SavedReplyResponse = { ok?: boolean; error?: string; quickReply?: WhatsAppQuickReply | null };

const newDraft = (scope: WhatsAppQuickReplyScope): Draft => ({ shortcut: "", title: "", body: "", scope, category: "General" });
const MEDIA_ROUTE = "/api/admin/whatsapp/quick-replies/media/";

function ReplyFields({ draft, setDraft, canManageTeam, disabled }: {
  draft: Draft;
  setDraft(next: Draft): void;
  canManageTeam: boolean;
  disabled: boolean;
}) {
  const variables = extractWhatsAppQuickReplyVariables(draft.body);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Shortcut</span>
        <input value={draft.shortcut} onChange={(e) => setDraft({ ...draft, shortcut: e.target.value })} disabled={disabled} maxLength={WHATSAPP_QUICK_REPLY_LIMITS.shortcutMax + 8} placeholder="pricing" className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-ledger-bright" />
        <span className="mt-1 block text-[0.65rem] text-ink-faint">/{normalizeWhatsAppQuickReplyShortcut(draft.shortcut) || "shortcut"}</span>
      </label>
      <label>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Title</span>
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={disabled} maxLength={WHATSAPP_QUICK_REPLY_LIMITS.titleMax} placeholder="Pricing overview" className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ledger-bright" />
      </label>
      <label>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Category</span>
        <input list="saved-reply-categories" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} disabled={disabled} maxLength={WHATSAPP_QUICK_REPLY_LIMITS.categoryMax} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ledger-bright" />
      </label>
      <label>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Visibility</span>
        {canManageTeam ? (
          <select value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value as WhatsAppQuickReplyScope })} disabled={disabled} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ledger-bright">
            <option value="TEAM">Team reply</option><option value="PERSONAL">Personal reply</option>
          </select>
        ) : <div className="mt-1 rounded-lg border border-rule bg-paper-sunk px-3 py-2 text-sm text-ink-soft">Personal reply</div>}
      </label>
      <label className="sm:col-span-2">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Message</span>
        <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} disabled={disabled} rows={5} maxLength={WHATSAPP_QUICK_REPLY_LIMITS.bodyMax} placeholder="Hello {{first_name}}, I’m {{agent_name}}..." className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-ledger-bright" />
        <span className="mt-1 block text-right text-[0.65rem] text-ink-faint">{draft.body.length} / {WHATSAPP_QUICK_REPLY_LIMITS.bodyMax}</span>
      </label>
      {variables.length ? <div className="sm:col-span-2 flex flex-wrap gap-1.5">{variables.map((v) => <span key={v} className="rounded-full bg-ledger-tint px-2 py-1 font-mono text-[0.65rem] text-ledger">{`{{${v}}}`}</span>)}</div> : null}
      <datalist id="saved-reply-categories">{WHATSAPP_QUICK_REPLY_DEFAULT_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
    </div>
  );
}

function ExistingMedia({ reply }: { reply: WhatsAppQuickReply }) {
  if (!reply.media_kind || !reply.media_path) return null;
  const src = `${MEDIA_ROUTE}?id=${encodeURIComponent(reply.id)}`;
  const label = reply.media_filename || `${reply.media_kind} attachment`;
  return (
    <div className="mt-3 rounded-xl border border-rule bg-paper p-3">
      {reply.media_kind === "image" ? <div role="img" aria-label={label} style={{ backgroundImage: `url(${src})` }} className="h-36 rounded-lg bg-paper-sunk bg-contain bg-center bg-no-repeat" /> : null}
      {reply.media_kind === "video" ? <video controls preload="metadata" src={src} className="max-h-48 w-full rounded-lg bg-black" /> : null}
      {reply.media_kind === "audio" ? <audio controls preload="metadata" src={src} className="w-full" /> : null}
      {reply.media_kind === "document" ? <a href={src} target="_blank" rel="noreferrer" className="font-semibold text-ledger underline decoration-ledger/30 underline-offset-4">Open {label}</a> : null}
      <p className="mt-2 text-[0.68rem] text-ink-faint">{label}{reply.media_size ? ` · ${formatWhatsAppMediaSize(reply.media_size)}` : ""}</p>
    </div>
  );
}

function FileField({ file, setFile, mediaReady, disabled }: { file: File | null; setFile(file: File | null): void; mediaReady: boolean; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  function pick(next: File | null) {
    if (!next) return setFile(null);
    const checked = validateWhatsAppMediaFile({ mimeType: next.type, size: next.size, name: next.name });
    if (!checked.ok) {
      window.alert(checked.error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(next);
  }
  return (
    <label className="mt-3 block rounded-xl border border-dashed border-rule-strong bg-paper px-3 py-3">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Optional attachment</span>
      <input ref={inputRef} type="file" accept={getWhatsAppMediaAccept()} disabled={disabled || !mediaReady} onChange={(e) => pick(e.target.files?.[0] || null)} className="mt-2 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-ledger-bright file:px-3 file:py-2 file:font-semibold file:text-white disabled:opacity-50" />
      {!mediaReady ? <span className="mt-1 block text-[0.68rem] text-ink-faint">Attachments unlock after the Stage 4 media migration.</span> : file ? <span className="mt-1 block text-[0.68rem] text-ink-faint">{file.name} · {formatWhatsAppMediaSize(file.size)}</span> : <span className="mt-1 block text-[0.68rem] text-ink-faint">One image, video, document or audio file.</span>}
    </label>
  );
}

export default function QuickReplyManager({ quickReplies, stage4Ready, mediaReady, currentMemberId, canManageTeam, role }: {
  quickReplies: WhatsAppQuickReply[];
  stage4Ready: boolean;
  mediaReady: boolean;
  currentMemberId: string | null;
  canManageTeam: boolean;
  role: "owner" | "manager" | "agent";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<WhatsAppQuickReplyScope>("TEAM");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [draft, setDraft] = useState<Draft>(newDraft(canManageTeam ? "TEAM" : "PERSONAL"));
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(newDraft("PERSONAL"));
  const [editFile, setEditFile] = useState<File | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

  const scoped = useMemo(() => quickReplies.filter((r) => r.scope === tab), [quickReplies, tab]);
  const categories = useMemo(() => Array.from(new Set(scoped.map((r) => r.category))).sort(), [scoped]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((r) => (category === "ALL" || r.category === category) && (!q || [r.shortcut, r.title, r.body, r.category].some((v) => v.toLowerCase().includes(q))));
  }, [scoped, query, category]);
  const canEdit = (reply: WhatsAppQuickReply) => reply.scope === "TEAM" ? canManageTeam : Boolean(currentMemberId && reply.owner_member_id === currentMemberId);

  async function mutate(method: "POST" | "PATCH" | "DELETE", payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/whatsapp/quick-replies/", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = (await response.json().catch(() => ({}))) as SavedReplyResponse;
    if (!response.ok || !body.ok) throw new Error(body.error || "The saved reply could not be changed.");
    return body;
  }

  async function uploadMedia(id: string, file: File) {
    const data = new FormData(); data.set("id", id); data.set("file", file, file.name);
    const response = await fetch(MEDIA_ROUTE, { method: "POST", body: data });
    const body = (await response.json().catch(() => ({}))) as SavedReplyResponse;
    if (!response.ok || !body.ok) throw new Error(body.error || "The attachment could not be saved.");
  }

  async function deleteMedia(id: string) {
    const response = await fetch(MEDIA_ROUTE, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const body = (await response.json().catch(() => ({}))) as SavedReplyResponse;
    if (!response.ok || !body.ok) throw new Error(body.error || "The attachment could not be removed.");
  }

  function createReply(e: React.FormEvent) {
    e.preventDefault(); setNotice(null);
    const checked = validateWhatsAppQuickReplyInput(draft);
    if (!checked.ok) return setNotice({ tone: "error", text: checked.error });
    startTransition(async () => {
      try {
        const created = await mutate("POST", checked.value);
        const id = created.quickReply?.id;
        if (createFile && id) {
          try { await uploadMedia(id, createFile); }
          catch (error) {
            setNotice({ tone: "error", text: `Saved reply created, but the attachment failed: ${error instanceof Error ? error.message : "upload failed"}` });
            router.refresh(); return;
          }
        }
        setDraft(newDraft(canManageTeam ? checked.value.scope : "PERSONAL")); setCreateFile(null); setTab(checked.value.scope);
        setNotice({ tone: "ok", text: "Saved reply created." }); router.refresh();
      } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not create saved reply." }); }
    });
  }

  function updateReply(e: React.FormEvent) {
    e.preventDefault(); if (!editId) return; setNotice(null);
    const checked = validateWhatsAppQuickReplyInput(editDraft);
    if (!checked.ok) return setNotice({ tone: "error", text: checked.error });
    startTransition(async () => {
      try {
        await mutate("PATCH", { id: editId, ...checked.value });
        if (removeMedia) await deleteMedia(editId);
        if (editFile) await uploadMedia(editId, editFile);
        setEditId(null); setEditFile(null); setRemoveMedia(false); setTab(checked.value.scope);
        setNotice({ tone: "ok", text: "Saved reply updated." }); router.refresh();
      } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not update saved reply." }); }
    });
  }

  function removeReply(id: string) {
    if (!window.confirm("Delete this saved reply?")) return;
    startTransition(async () => {
      try { await mutate("DELETE", { id }); setNotice({ tone: "ok", text: "Saved reply deleted." }); router.refresh(); }
      catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not delete saved reply." }); }
    });
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-ink">Saved Replies</h1>
      <p className="mt-1 text-sm text-ink-faint">Team replies are shared. Personal replies are visible only to their owner.</p>
      <p className="mt-1 text-xs text-ink-faint">Signed in as {role}. Saved replies fill the composer and never auto-send.</p>
      {!stage4Ready ? <p className="mt-4 rounded-lg border border-brass/25 bg-brass-tint px-3 py-2.5 text-xs text-[#6f4f16]">Stage 4 ownership and categories are waiting for the additive Supabase migration. Existing Team replies remain readable; changes are disabled.</p> : null}
      {notice ? <p className={`mt-4 rounded-lg px-3 py-2 text-xs ${notice.tone === "ok" ? "bg-ledger-tint text-ledger" : "bg-rose-50 text-rose-700"}`}>{notice.text}</p> : null}

      <div className="mt-4 rounded-xl border border-rule bg-paper px-4 py-3">
        <p className="text-xs font-semibold text-ink">Variables</p>
        <div className="mt-2 flex flex-wrap gap-1.5">{WHATSAPP_QUICK_REPLY_VARIABLES.map((v) => <span key={v} className="rounded-full bg-paper-sunk px-2 py-1 font-mono text-[0.65rem] text-ink-soft">{`{{${v}}}`}</span>)}<span className="rounded-full bg-paper-sunk px-2 py-1 font-mono text-[0.65rem] text-ink-soft">{"{{custom.FieldName}}"}</span></div>
        <p className="mt-2 text-[0.68rem] text-ink-faint">Missing customer values stay visible in the preview so an agent can fix them before sending.</p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_27rem]">
        <section className="overflow-hidden rounded-xl border border-rule bg-paper-raised">
          <div className="border-b border-rule p-4">
            <div className="flex flex-wrap gap-2">{(["TEAM", "PERSONAL"] as const).map((scope) => <button key={scope} type="button" onClick={() => { setTab(scope); setCategory("ALL"); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === scope ? "bg-ledger-bright text-white" : "border border-rule text-ink-soft"}`}>{scope === "TEAM" ? "Team Replies" : "My Replies"} · {quickReplies.filter((r) => r.scope === scope).length}</button>)}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_12rem]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shortcut, text or category" className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ledger-bright" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink"><option value="ALL">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          {visible.length === 0 ? <p className="px-5 py-12 text-center text-sm text-ink-faint">No matching saved replies.</p> : <ul className="divide-y divide-rule">{visible.map((reply) => <li key={reply.id} className="p-4 sm:p-5">{editId === reply.id ? <form onSubmit={updateReply}><ReplyFields draft={editDraft} setDraft={setEditDraft} canManageTeam={canManageTeam} disabled={pending || !stage4Ready} />{reply.media_kind && !removeMedia ? <ExistingMedia reply={reply} /> : null}{reply.media_kind ? <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft"><input type="checkbox" checked={removeMedia} onChange={(e) => setRemoveMedia(e.target.checked)} disabled={!mediaReady} /> Remove current attachment</label> : null}<FileField file={editFile} setFile={setEditFile} mediaReady={mediaReady} disabled={pending} /><div className="mt-3 flex gap-2"><button disabled={pending} className="rounded-full bg-ledger-bright px-4 py-1.5 text-xs font-semibold text-white">Save</button><button type="button" onClick={() => { setEditId(null); setEditFile(null); setRemoveMedia(false); }} className="rounded-full border border-rule px-4 py-1.5 text-xs text-ink-soft">Cancel</button></div></form> : <div className="flex gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-ledger-tint px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-ledger">/{reply.shortcut}</span><span className="rounded-full bg-paper-sunk px-2 py-0.5 text-[0.65rem] text-ink-soft">{reply.category}</span><span className="rounded-full border border-rule px-2 py-0.5 text-[0.65rem] text-ink-faint">{reply.scope === "TEAM" ? "Team" : "Personal"}</span>{reply.media_kind ? <span className="rounded-full bg-brass-tint px-2 py-0.5 text-[0.65rem] text-[#6f4f16]">{reply.media_kind}</span> : null}</div><p className="mt-2 text-sm font-semibold text-ink">{reply.title}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{reply.body}</p>{extractWhatsAppQuickReplyVariables(reply.body).length ? <div className="mt-2 flex flex-wrap gap-1">{extractWhatsAppQuickReplyVariables(reply.body).map((v) => <span key={v} className="rounded bg-paper-sunk px-1.5 py-0.5 font-mono text-[0.62rem] text-ink-faint">{`{{${v}}}`}</span>)}</div> : null}<ExistingMedia reply={reply} /></div>{canEdit(reply) && stage4Ready ? <div className="flex flex-none flex-col gap-2"><button type="button" onClick={() => { setEditId(reply.id); setEditDraft({ shortcut: reply.shortcut, title: reply.title, body: reply.body, scope: reply.scope, category: reply.category }); setEditFile(null); setRemoveMedia(false); }} className="rounded-lg border border-rule px-2.5 py-1.5 text-xs text-ink-soft">Edit</button><button type="button" onClick={() => removeReply(reply.id)} className="rounded-lg border border-rule px-2.5 py-1.5 text-xs text-rose-700">Delete</button></div> : null}</div>}</li>)}</ul>}
        </section>

        <section className="rounded-xl border border-rule bg-paper-raised p-5 xl:sticky xl:top-5 xl:self-start"><h2 className="text-sm font-semibold text-ink">New saved reply</h2><p className="mt-1 text-xs text-ink-faint">{canManageTeam ? "Create a Team reply or keep one Personal." : "Agents can create Personal replies only."}</p><form onSubmit={createReply} className="mt-4"><ReplyFields draft={draft} setDraft={(next) => setDraft(canManageTeam ? next : { ...next, scope: "PERSONAL" })} canManageTeam={canManageTeam} disabled={pending || !stage4Ready} /><FileField file={createFile} setFile={setCreateFile} mediaReady={mediaReady} disabled={pending} /><button disabled={pending || !stage4Ready} className="mt-3 w-full rounded-full bg-ledger-bright px-4 py-2 text-sm font-semibold text-white disabled:bg-paper-sunk disabled:text-ink-faint">{pending ? "Saving…" : "Save reply"}</button></form></section>
      </div>
    </div>
  );
}
