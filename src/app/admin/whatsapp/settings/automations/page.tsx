import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";

export default function AutomationsSettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/automations/" title="Automation settings" description="Workspace automation runtime defaults and failure handling.">
      <SettingsInfoGrid items={[
        { label: "Runtime", value: "Enabled by workflow", note: "Draft/Active/Paused lifecycle remains the source of truth." },
        { label: "Business hours", value: "Workspace controlled", note: "Automation runtime continues to respect configured business hours." },
        { label: "No-reply handling", value: "Workflow based", note: "Existing no-reply triggers and delayed jobs remain intact." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
