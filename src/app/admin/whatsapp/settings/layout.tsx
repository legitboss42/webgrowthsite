import type { ReactNode } from "react";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import QuickSettingsPanel from "../QuickSettingsPanel";
import CallingSettingsPanel from "../CallingSettingsPanel";

export default async function WhatsAppSettingsLayout({ children }: { children: ReactNode }) {
  const [{ settings }, quickSettings] = await Promise.all([
    loadWhatsAppSettings({ maxAgeMs: 0 }),
    loadWhatsAppQuickSettings(),
  ]);

  return (
    <>
      <QuickSettingsPanel settings={settings} quickSettings={quickSettings} />
      <CallingSettingsPanel businessHours={settings.businessHours} />
      {children}
    </>
  );
}
