import type { ReactNode } from "react";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import WhatsAppShell from "@/components/whatsapp/WhatsAppShell";
import WorkspaceSwitcher from "@/components/whatsapp/WorkspaceSwitcher";
import { MessageStatusVisibilityProvider } from "@/components/whatsapp/MessageStatusVisibility";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { fetchWhatsAppPhoneNumbers, findConfiguredWhatsAppSender } from "@/lib/whatsapp/phoneNumbers";
import { resolveWhatsAppMetaConfig } from "@/lib/whatsapp/workspaceCredentials";
import { getWhatsAppWorkspaceAccess } from "./auth";
import AIWorkspaceDeepLink from "./AIWorkspaceDeepLink";
import AIWorkspaceLayer from "./AIWorkspaceLayer";
import ConversationFlowLauncher from "./ConversationFlowLauncher";
import InstantInteractionLayer from "./InstantInteractionLayer";
import IncomingCallOverlay from "./IncomingCallOverlay";
import TeamPresenceWidget from "./TeamPresenceWidget";
import WorkspaceCollaborationLayer from "./WorkspaceCollaborationLayer";

export default async function WhatsAppConsoleLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const access = await getWhatsAppWorkspaceAccess(cookieStore);
  if (!access) {
    return <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-10 text-white sm:px-6 sm:py-14"><div className="w-full max-w-6xl"><GoogleAdminPrompt nextPath="/admin/whatsapp/" adminEmail={getDefaultAdminGoogleEmail()} clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} workspaceTeamAccess /></div></div>;
  }

  const [meta, quickSettings] = await Promise.all([
    resolveWhatsAppMetaConfig({ workspaceId: access.workspaceId }),
    loadWhatsAppQuickSettings({ workspaceId: access.workspaceId }),
  ]);
  const senderConnected = Boolean(meta?.token && meta.phoneNumberId);
  let senderNumber: string | undefined;
  if (meta?.wabaId) {
    const phoneResult = await fetchWhatsAppPhoneNumbers({ workspaceId: access.workspaceId, revalidateSeconds: 600 });
    if (phoneResult.ok) senderNumber = findConfiguredWhatsAppSender(phoneResult.phoneNumbers, meta.phoneNumberId)?.displayPhoneNumber;
  }

  return (
    <WhatsAppShell
      senderConnected={senderConnected}
      senderNumber={senderNumber}
      role={access.role}
      memberName={access.displayName}
      workspaceName={access.workspaceName}
      workspaceControl={<WorkspaceSwitcher currentWorkspaceId={access.workspaceId} workspaces={access.availableWorkspaces} platformAdmin={access.platformAdmin} />}
      presenceControl={<TeamPresenceWidget senderConnected={senderConnected} />}
    >
      <MessageStatusVisibilityProvider deliveryStatusVisible={quickSettings.deliveryStatusVisible} readStatusVisible={quickSettings.readStatusVisible}>
        <InstantInteractionLayer />
        <IncomingCallOverlay />
        <WorkspaceCollaborationLayer />
        <ConversationFlowLauncher />
        <AIWorkspaceDeepLink />
        <AIWorkspaceLayer role={access.role} />
        {children}
      </MessageStatusVisibilityProvider>
    </WhatsAppShell>
  );
}
