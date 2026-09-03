import WorkspaceSettingsSection from "../WorkspaceSettingsSection";
import AISettingsPanel from "../../AISettingsPanel";

export default function AISettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/ai/" title="AI settings" description="Workspace-wide AI Assist, Agent, model, budget and safety controls.">
      <AISettingsPanel />
    </WorkspaceSettingsSection>
  );
}
