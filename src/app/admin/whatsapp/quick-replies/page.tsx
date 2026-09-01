import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
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

export const metadata: Metadata = {
  title: "WhatsApp Saved Replies | Web Growth",
  robots: { index: false, follow: false },
};

type SavedReplyLoad = { replies: WhatsAppQuickReply[]; stage4Ready: boolean; mediaReady: boolean };

async function getSavedReplies(memberId: string | null): Promise<SavedReplyLoad> {
  const media = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_quick_replies?select=id,shortcut,title,body,scope,category,owner_member_id,created_by_member_id,media_kind,media_path,media_filename,media_mime_type,media_size,created_at,updated_at&order=category.asc,shortcut.asc",
  );
  if (media !== null) {
    return {
      replies: sortWhatsAppQuickReplies(media.map(normalizeWhatsAppQuickReplyRow).filter((reply) => canUseWhatsAppQuickReply(reply, memberId))),
      stage4Ready: true,
      mediaReady: true,
    };
  }

  const enriched = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_quick_replies?select=id,shortcut,title,body,scope,category,owner_member_id,created_by_member_id,created_at,updated_at&order=category.asc,shortcut.asc",
  );
  if (enriched !== null) {
    return {
      replies: sortWhatsAppQuickReplies(enriched.map(normalizeWhatsAppQuickReplyRow).filter((reply) => canUseWhatsAppQuickReply(reply, memberId))),
      stage4Ready: true,
      mediaReady: false,
    };
  }

  const legacy = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_quick_replies?select=id,shortcut,title,body,created_at,updated_at&order=shortcut.asc",
  );
  return {
    replies: sortWhatsAppQuickReplies((legacy || []).map(normalizeWhatsAppQuickReplyRow)),
    stage4Ready: false,
    mediaReady: false,
  };
}

export default async function WhatsAppQuickRepliesPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/quick-replies/"
            adminEmail={getDefaultAdminGoogleEmail()}
            clientId={getGoogleClientId()}
            googleReady={isGoogleAuthConfigured()}
            workspaceTeamAccess
          />
        </div>
      </div>
    );
  }

  const loaded = await getSavedReplies(access.memberId);

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <QuickReplyManager
        quickReplies={loaded.replies}
        stage4Ready={loaded.stage4Ready}
        mediaReady={loaded.mediaReady}
        currentMemberId={access.memberId}
        canManageTeam={canWhatsAppRoleSuperviseTeam(access.role)}
        role={access.role}
      />
    </div>
  );
}
