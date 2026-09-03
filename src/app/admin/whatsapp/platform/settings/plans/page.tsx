import PlatformSettingsSection, { PlatformCard } from "../PlatformSettingsSection";

export default function PlatformPlansSettingsPage() {
  return <PlatformSettingsSection active="/admin/whatsapp/platform/settings/plans/" title="Plans & entitlements" description="Global plan limits and feature entitlements."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PlatformCard title="Team limits" value="Entitlement enforced" note="Per-workspace team ceilings remain database-enforced." /><PlatformCard title="Automation & campaign limits" value="Entitlement enforced" note="Existing Stage 11 limits remain the source of truth." /><PlatformCard title="AI limits" value="Entitlement enforced" note="Daily AI request ceilings remain workspace-specific." /></div></PlatformSettingsSection>;
}
