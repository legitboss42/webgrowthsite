import PlatformSettingsSection, { PlatformCard } from "../PlatformSettingsSection";

export default function PlatformFeaturesSettingsPage() {
  return <PlatformSettingsSection active="/admin/whatsapp/platform/settings/features/" title="Feature flags" description="Controlled rollout and beta availability across workspaces."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PlatformCard title="Workspace features" value="Entitlement backed" note="Feature availability can be represented by workspace entitlement flags." /><PlatformCard title="Beta rollout" value="Platform controlled" note="Use platform-admin controls for selective workspace rollout." /><PlatformCard title="Global disable" value="Supported by design" note="Critical features should be globally suppressible without deleting workspace data." /></div></PlatformSettingsSection>;
}
