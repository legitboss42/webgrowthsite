import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";

export default function IntegrationsSettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/integrations/" title="Integration settings" description="Webhooks, API connectivity and external service status for this workspace.">
      <SettingsInfoGrid items={[
        { label: "WhatsApp webhook", value: "Production routed", note: "Meta webhook routing remains workspace-aware from Stage 11." },
        { label: "External webhooks", value: "Automation managed", note: "Workflow webhook actions remain the current supported integration path." },
        { label: "API credentials", value: "Server only", note: "Secrets stay outside browser-visible workspace settings." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
