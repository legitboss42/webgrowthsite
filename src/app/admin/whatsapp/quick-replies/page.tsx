import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { WorkspaceActionLink, WorkspaceRail, WorkspaceStat, WorkspaceSurface, WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import QuickReplyManager from "../QuickReplyManager";
import { canUseWhatsAppQuickReply, normalizeWhatsAppQuickReplyRow, sortWhatsAppQuickReplies, type WhatsAppQuickReply } from "../quickRepliesModel";

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

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar eyebrow="Agent productivity" title="Saved replies" description="Reusable text and media responses for faster, consistent conversations." actions={<><WorkspaceActionLink href="/admin/whatsapp/conversations/" icon="conversations" primary>Open inbox</WorkspaceActionLink><WorkspaceActionLink href="/admin/whatsapp/team/" icon="contacts">Team</WorkspaceActionLink></>} />
      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <WorkspaceRail label="Reply workspace" items={[
          { label: "Saved replies", href: "/admin/whatsapp/quick-replies/", icon: "quickReplies", note: `${loaded.replies.length} available`, active: true },
          { label: "Inbox", href: "/admin/whatsapp/conversations/", icon: "conversations", note: "Use shortcuts" },
          { label: "Templates", href: "/admin/whatsapp/templates/", icon: "templates", note: "Meta-approved messages" },
          { label: "Team", href: "/admin/whatsapp/team/", icon: "contacts", note: "Agent access" },
        ]} />
        <main className="min-w-0 bg-[#060a0e] p-3 sm:p-4">
          <section className="mb-3 grid gap-2 sm:grid-cols-3">
            <WorkspaceStat label="Team" value={teamReplies} note="Shared replies" icon="contacts" />
            <WorkspaceStat label="Personal" value={personalReplies} note="Private shortcuts" icon="quickReplies" />
            <WorkspaceStat label="With media" value={mediaReplies} note={loaded.mediaReady ? "Media enabled" : "Media storage unavailable"} icon="templates" tone={loaded.mediaReady ? "good" : "warn"} />
          </section>
          <WorkspaceSurface><QuickReplyManager quickReplies={loaded.replies} stage4Ready={loaded.stage4Ready} mediaReady={loaded.mediaReady} currentMemberId={access.memberId} canManageTeam={canWhatsAppRoleSuperviseTeam(access.role)} role={access.role} /></WorkspaceSurface>
        </main>
      </div>
    </div>
  );
}
