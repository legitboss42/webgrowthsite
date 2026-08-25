import type { ReactNode } from "react";
import { cookies } from "next/headers";
import InternalUtilityUnlockForm from "@/components/internal/InternalUtilityUnlockForm";
import { getInternalUtilityLocalPassphrase } from "@/lib/internalUtilityAuth";
import WhatsAppShell from "@/components/whatsapp/WhatsAppShell";
import {
  fetchWhatsAppPhoneNumbers,
  findConfiguredWhatsAppSender,
} from "@/lib/whatsapp/phoneNumbers";
import { hasWhatsAppAdminAccess } from "./auth";

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
          <InternalUtilityUnlockForm localHint={getInternalUtilityLocalPassphrase() || undefined} />
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

  return (
    <WhatsAppShell senderConnected={senderConnected} senderNumber={senderNumber}>
      {children}
    </WhatsAppShell>
  );
}
