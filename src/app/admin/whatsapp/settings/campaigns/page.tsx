import WorkspaceSettingsSection, { SettingsInfoGrid } from "../WorkspaceSettingsSection";

export default function CampaignSettingsPage() {
  return (
    <WorkspaceSettingsSection active="/admin/whatsapp/settings/campaigns/" title="Campaign settings" description="Sending defaults, limits and compliance behaviour for broadcasts.">
      <SettingsInfoGrid items={[
        { label: "Workspace limits", value: "Entitlement controlled", note: "Monthly recipient ceilings remain enforced by Stage 11 entitlements." },
        { label: "Opt-out handling", value: "Required", note: "Campaigns should continue to honor opt-out and suppression behaviour." },
        { label: "Failure handling", value: "Tracked", note: "Campaign event/runtime tables remain the source of truth for delivery failures." },
      ]} />
    </WorkspaceSettingsSection>
  );
}
