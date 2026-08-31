import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { hasWhatsAppAdminAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import QuickReplyManager from "../QuickReplyManager";
import {
  normalizeWhatsAppQuickReplyRow,
  sortWhatsAppQuickReplies,
  type WhatsAppQuickReply,
} from "../quickRepliesModel";

export const metadata: Metadata = {
  title: "WhatsApp Quick Replies | Web Growth",
  robots: { index: false, follow: false },
};

async function getQuickReplies(): Promise<WhatsAppQuickReply[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_quick_replies?select=id,shortcut,title,body,created_at,updated_at&order=shortcut.asc",
  );
  if (!rows) return [];
  return sortWhatsAppQuickReplies(rows.map(normalizeWhatsAppQuickReplyRow));
}

export default async function WhatsAppQuickRepliesPage() {
  const cookieStore = await cookies();
  const unlocked = hasWhatsAppAdminAccess(cookieStore);

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/quick-replies/"
            adminEmail={getDefaultAdminGoogleEmail()}
            googleReady={isGoogleAuthConfigured()}
          />
        </div>
      </div>
    );
  }

  const quickReplies = await getQuickReplies();

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <QuickReplyManager quickReplies={quickReplies} />
    </div>
  );
}
