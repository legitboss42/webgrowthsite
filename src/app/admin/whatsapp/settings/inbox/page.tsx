import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";

export default function InboxSettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/inbox/" title="Inbox settings" description="Conversation behaviour, status visibility and agent-facing inbox preferences.">
      <SettingsInfoGrid items={[
        { label: "Delivery & read status", value: "Managed", note: "Visibility controls are active through workspace quick settings." },
        { label: "24-hour window warning", value: "Enabled", note: "Agents are warned before sending outside the customer-service window." },
        { label: "Conversation lifecycle", value: "Automatic", note: "Existing session close/reopen behaviour remains unchanged." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
