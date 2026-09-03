import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";

export default function NotificationsSettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/notifications/" title="Notification settings" description="Operational alerts for messages, mentions, failures, handoffs and summaries.">
      <SettingsInfoGrid items={[
        { label: "In-app alerts", value: "Available", note: "Use current push/in-app delivery paths for new-message and operational alerts." },
        { label: "Failure alerts", value: "Recommended", note: "Campaign, automation and Meta connection failures should surface here." },
        { label: "Summaries", value: "Daily / weekly", note: "Reserved for workspace summary delivery without changing current runtime behaviour." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
