import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";

export default function SecuritySettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/security/" title="Security settings" description="Workspace account security, sessions and sensitive-action protections.">
      <SettingsInfoGrid items={[
        { label: "Password security", value: "Active", note: "Workspace password setup/reset and security notices remain in the existing account flow." },
        { label: "Session controls", value: "Protected", note: "Workspace access remains tied to authenticated identity and active workspace context." },
        { label: "Sensitive actions", value: "Owner gated", note: "Connection, team and workspace settings remain restricted to authorized roles." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
