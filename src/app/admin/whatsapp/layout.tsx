import type { ReactNode } from "react";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import WhatsAppShell from "@/components/whatsapp/WhatsAppShell";
import { MessageStatusVisibilityProvider } from "@/components/whatsapp/MessageStatusVisibility";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import {
  fetchWhatsAppPhoneNumbers,
  findConfiguredWhatsAppSender,
} from "@/lib/whatsapp/phoneNumbers";
import { getWhatsAppWorkspaceAccess } from "./auth";
import ConversationFlowLauncher from "./ConversationFlowLauncher";
import InstantInteractionLayer from "./InstantInteractionLayer";
import IncomingCallOverlay from "./IncomingCallOverlay";
import TeamPresenceWidget from "./TeamPresenceWidget";
import WorkspaceCollaborationLayer from "./WorkspaceCollaborationLayer";

export default async function WhatsAppConsoleLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const access = await getWhatsAppWorkspaceAccess(cookieStore);

  if (!access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/"
            adminEmail={getDefaultAdminGoogleEmail()}
            clientId={getGoogleClientId()}
            googleReady={isGoogleAuthConfigured()}
            workspaceTeamAccess
          />
        </div>
      </div>
    );
  }

  const senderConnected = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
  const quickSettings = await loadWhatsAppQuickSettings();

  let senderNumber: string | undefined;
  if (senderConnected) {
    const phoneResult = await fetchWhatsAppPhoneNumbers({ revalidateSeconds: 600 });
    if (phoneResult.ok) {
      senderNumber = findConfiguredWhatsAppSender(phoneResult.phoneNumbers)?.displayPhoneNumber;
    }
  }

  return (
    <WhatsAppShell
      senderConnected={senderConnected}
      senderNumber={senderNumber}
      role={access.role}
      memberName={access.displayName}
      presenceControl={<TeamPresenceWidget senderConnected={senderConnected} />}
    >
      <MessageStatusVisibilityProvider
        deliveryStatusVisible={quickSettings.deliveryStatusVisible}
        readStatusVisible={quickSettings.readStatusVisible}
      >
        <InstantInteractionLayer />
        <IncomingCallOverlay />
        <WorkspaceCollaborationLayer />
        <ConversationFlowLauncher />
        {children}
      </MessageStatusVisibilityProvider>
    </WhatsAppShell>
  );
}
