import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";

export default function DataSettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/data/" title="Data & privacy" description="Workspace retention, export, deletion and privacy controls.">
      <SettingsInfoGrid items={[
        { label: "Conversation data", value: "Workspace scoped", note: "Stage 11 tenant boundaries remain enforced for messages, contacts and conversations." },
        { label: "Exports", value: "Owner controlled", note: "Data export belongs at workspace scope and must preserve tenant boundaries." },
        { label: "Deletion", value: "Protected action", note: "Workspace and customer data deletion should require explicit owner confirmation." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
