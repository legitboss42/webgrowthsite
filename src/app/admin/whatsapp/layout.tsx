import type { ReactNode } from "react";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import WhatsAppShell from "@/components/whatsapp/WhatsAppShell";
import {
  fetchWhatsAppPhoneNumbers,
  findConfiguredWhatsAppSender,
} from "@/lib/whatsapp/phoneNumbers";
import { hasWhatsAppAdminAccess } from "./auth";
import InstantInteractionLayer from "./InstantInteractionLayer";
import IncomingCallOverlay from "./IncomingCallOverlay";

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

  const senderConnected = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );

  let senderNumber: string | undefined;
  if (senderConnected) {
    const phoneResult = await fetchWhatsAppPhoneNumbers({ revalidateSeconds: 600 });
    if (phoneResult.ok) {
      senderNumber = findConfiguredWhatsAppSender(phoneResult.phoneNumbers)?.displayPhoneNumber;
    }
  }

  return (
    <WhatsAppShell senderConnected={senderConnected} senderNumber={senderNumber}>
      <InstantInteractionLayer />
      <IncomingCallOverlay />
      {children}
    </WhatsAppShell>
  );
}
