import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import QuickReplyManager from "../QuickReplyManager";
import {
  canUseWhatsAppQuickReply,
  normalizeWhatsAppQuickReplyRow,
  sortWhatsAppQuickReplies,
  type WhatsAppQuickReply,
} from "../quickRepliesModel";

export const metadata: Metadata = { title: "WhatsApp Saved Replies | Web Growth", robots: { index: false, follow: false } };
type SavedReplyLoad = { replies: WhatsAppQuickReply[]; stage4Ready: boolean; mediaReady: boolean };

async function getSavedReplies(memberId: string | null): Promise<SavedReplyLoad> {
  const media = await readWhatsAppRows<Record<string, unknown>>("whatsapp_quick_replies?select=id,shortcut,title,body,scope,category,owner_member_id,created_by_member_id,media_kind,media_path,media_filename,media_mime_type,media_size,created_at,updated_at&order=category.asc,shortcut.asc");
  if (media !== null) return { replies: sortWhatsAppQuickReplies(media.map(normalizeWhatsAppQuickReplyRow).filter((reply) => canUseWhatsAppQuickReply(reply, memberId))), stage4Ready: true, mediaReady: true };
  const enriched = await readWhatsAppRows<Record<string, unknown>>("whatsapp_quick_replies?select=id,shortcut,title,body,scope,category,owner_member_id,created_by_member_id,created_at,updated_at&order=category.asc,shortcut.asc");
  if (enriched !== null) return { replies: sortWhatsAppQuickReplies(enriched.map(normalizeWhatsAppQuickReplyRow).filter((reply) => canUseWhatsAppQuickReply(reply, memberId))), stage4Ready: true, mediaReady: false };
  const legacy = await readWhatsAppRows<Record<string, unknown>>("whatsapp_quick_replies?select=id,shortcut,title,body,created_at,updated_at&order=shortcut.asc");
  return { replies: sortWhatsAppQuickReplies((legacy || []).map(normalizeWhatsAppQuickReplyRow)), stage4Ready: false, mediaReady: false };
}

export default async function WhatsAppQuickRepliesPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white"><div className="w-full max-w-4xl"><GoogleAdminPrompt nextPath="/admin/whatsapp/quick-replies/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} workspaceTeamAccess /></div></div>;
  const loaded = await getSavedReplies(access.memberId);
  const teamReplies = loaded.replies.filter((reply) => reply.scope === "TEAM").length;
  const personalReplies = loaded.replies.filter((reply) => reply.scope !== "TEAM").length;
  const mediaReplies = loaded.replies.filter((reply) => Boolean(reply.media_kind)).length;

  return <div className="w-full p-3 sm:p-5 lg:p-6">
    <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Agent productivity</div><h1 className="text-2xl font-semibold text-ink sm:text-3xl">Saved replies</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Build reusable answers, shortcuts and media responses for faster support conversations.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/whatsapp/conversations/" className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="conversations" className="h-4 w-4" />Open inbox</Link><Link href="/admin/whatsapp/team/" className="inline-flex items-center gap-2 rounded-xl border border-ledger-bright/25 bg-ledger-tint px-3.5 py-2.5 text-xs font-semibold text-ledger-bright"><WhatsAppIcon name="contacts" className="h-4 w-4" />Team</Link></div></header>
    <section className="mb-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Team replies</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{teamReplies}</p></div><div className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Personal replies</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{personalReplies}</p></div><div className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">With media</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{mediaReplies}</p></div></section>
    <section className="min-w-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised"><QuickReplyManager quickReplies={loaded.replies} stage4Ready={loaded.stage4Ready} mediaReady={loaded.mediaReady} currentMemberId={access.memberId} canManageTeam={canWhatsAppRoleSuperviseTeam(access.role)} role={access.role} /></section>
  </div>;
}
