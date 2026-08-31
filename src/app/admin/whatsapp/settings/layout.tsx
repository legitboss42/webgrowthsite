import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { hasWhatsAppAdminAccess } from "../auth";
import QuickSettingsPanel from "../QuickSettingsPanel";
import CallingSettingsPanel from "../CallingSettingsPanel";
import MessageVisibilitySettingsPanel from "../MessageVisibilitySettingsPanel";
import TeamSettingsPanel from "../TeamSettingsPanel";

export default async function WhatsAppSettingsLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return (
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">
          Owner access is required for WhatsApp integration settings.
        </div>
      </div>
    );
  }

  const [{ settings }, quickSettings] = await Promise.all([
    loadWhatsAppSettings({ maxAgeMs: 0 }),
    loadWhatsAppQuickSettings(),
  ]);

  return (
    <>
      <QuickSettingsPanel settings={settings} quickSettings={quickSettings} />
      <TeamSettingsPanel viewerRole="owner" />
      <MessageVisibilitySettingsPanel quickSettings={quickSettings} />
      <CallingSettingsPanel businessHours={settings.businessHours} />
      {children}
    </>
  );
}
