import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";
import { cookies } from "next/headers";
import { getWhatsAppWorkspaceAccess } from "../../auth";
import { getWhatsAppWorkspaceConnection } from "@/lib/whatsapp/workspaces";

export default async function WhatsAppConnectionSettingsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  const connection = access ? await getWhatsAppWorkspaceConnection(access.workspaceId) : null;
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/whatsapp/" title="WhatsApp settings" description="Meta connection, sender identity, webhook routing and calling configuration.">
      <SettingsInfoGrid items={[
        { label: "Connection status", value: connection?.status || "Not connected", note: "Per-workspace Meta connection state from the Stage 11 connection registry." },
        { label: "WABA ID", value: connection?.wabaId || "Not set", note: "WhatsApp Business Account bound to this workspace." },
        { label: "Phone Number ID", value: connection?.phoneNumberId || "Not set", note: "Cloud API sender used for this workspace." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
