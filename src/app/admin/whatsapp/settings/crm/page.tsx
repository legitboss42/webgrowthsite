import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { cookies } from "next/headers";
import { getWhatsAppWorkspaceAccess } from "../../auth";

export default async function CRMSettingsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  const settings = access ? (await loadWhatsAppSettings({ workspaceId: access.workspaceId, maxAgeMs: 0 })).settings : null;
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/crm/" title="CRM settings" description="Lead classification and contact handling for this workspace.">
      <SettingsInfoGrid items={[
        { label: "Hot lead keywords", value: settings?.leadKeywords.hot.length ?? 0, note: "Keywords that force a HOT lead classification." },
        { label: "Warm lead keywords", value: settings?.leadKeywords.warm.length ?? 0, note: "Keywords that lift otherwise cold enquiries to WARM." },
        { label: "Spam suppression", value: settings?.leadKeywords.spam.length ?? 0, note: "Keywords that suppress automatic replies and force COLD." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
