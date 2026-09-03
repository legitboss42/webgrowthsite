import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";

export default function TeamSettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/team/" title="Team settings" description="Workspace membership, roles, assignment and access controls.">
      <SettingsInfoGrid items={[
        { label: "Team members", value: "Managed in workspace", note: "Owner/manager/agent roles remain enforced by the Stage 11 workspace membership model." },
        { label: "Assignment", value: "Existing runtime", note: "Conversation assignment and transfer rules continue to use the current team runtime." },
        { label: "Workspace access", value: "Tenant scoped", note: "Membership cannot be carried across workspaces." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
