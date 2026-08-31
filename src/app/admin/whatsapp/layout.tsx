import type { ReactNode } from "react";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import WhatsAppShell from "@/components/whatsapp/WhatsAppShell";
import {
  fetchWhatsAppPhoneNumbers,
  findConfiguredWhatsAppSender,
} from "@/lib/whatsapp/phoneNumbers";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { hasWhatsAppAdminAccess } from "./auth";
import QuickSettingsPanel from "./QuickSettingsPanel";

/**
 * Console chrome for every /admin/whatsapp route.
 *
 * When the session is locked the shell is skipped entirely so the unlock form is
 * the only thing on screen (it keeps its own dark treatment, shared with the other
 * internal utilities).
 */
export default async function WhatsAppConsoleLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();

  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/"
            adminEmail={getDefaultAdminGoogleEmail()}
            clientId={getGoogleClientId()}
            googleReady={isGoogleAuthConfigured()}
          />
        </div>
      </div>
    );
  }

  // Only a boolean crosses to the client — credentials never leave the server.
  const senderConnected = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );

  // The real display number comes from Meta. This layout renders on every console page,
  // so the response is cached for 10 minutes rather than fetched per navigation. A
  // failure just leaves the number off the sidebar; it never blocks the page.
  let senderNumber: string | undefined;
  if (senderConnected) {
    const phoneResult = await fetchWhatsAppPhoneNumbers({ revalidateSeconds: 600 });
    if (phoneResult.ok) {
      senderNumber = findConfiguredWhatsAppSender(phoneResult.phoneNumbers)?.displayPhoneNumber;
    }
  }

  const [{ settings }, quickSettings] = await Promise.all([
    loadWhatsAppSettings({ maxAgeMs: 0 }),
    loadWhatsAppQuickSettings(),
  ]);

  return (
    <WhatsAppShell senderConnected={senderConnected} senderNumber={senderNumber}>
      <QuickSettingsPanel settings={settings} quickSettings={quickSettings} />
      {children}
    </WhatsAppShell>
  );
}
