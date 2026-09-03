import PlatformSettingsSection, { PlatformCard } from "../PlatformSettingsSection";

export default function PlatformSecuritySettingsPage() {
  return <PlatformSettingsSection active="/admin/whatsapp/platform/settings/security/" title="Platform security" description="Global platform-admin and sensitive-operation safeguards."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PlatformCard title="Platform admins" value="Dedicated role" note="Platform-admin access remains distinct from workspace membership." /><PlatformCard title="Sensitive actions" value="Confirmation enabled" note="Global settings seed sensitive-action confirmation as enabled." /><PlatformCard title="Session audit" value="Enabled" note="Platform security settings reserve session activity visibility." /></div></PlatformSettingsSection>;
}
