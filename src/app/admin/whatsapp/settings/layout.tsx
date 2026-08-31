import type { ReactNode } from "react";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import QuickSettingsPanel from "../QuickSettingsPanel";
import CallingSettingsPanel from "../CallingSettingsPanel";
import MessageVisibilitySettingsPanel from "../MessageVisibilitySettingsPanel";
import TeamSettingsPanel from "../TeamSettingsPanel";

export default async function WhatsAppSettingsLayout({ children }: { children: ReactNode }) {
  const [{ settings }, quickSettings] = await Promise.all([
    loadWhatsAppSettings({ maxAgeMs: 0 }),
    loadWhatsAppQuickSettings(),
  ]);

  return (
    <>
      <QuickSettingsPanel settings={settings} quickSettings={quickSettings} />
      <TeamSettingsPanel />
      <MessageVisibilitySettingsPanel quickSettings={quickSettings} />
      <CallingSettingsPanel businessHours={settings.businessHours} />
      {children}
    </>
  );
}
