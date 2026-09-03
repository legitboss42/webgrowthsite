import PlatformSettingsSection, { PlatformCard } from "../PlatformSettingsSection";

export default function PlatformEmailSettingsPage() {
  return <PlatformSettingsSection active="/admin/whatsapp/platform/settings/email/" title="Platform email" description="Transactional, invitation and security email controls."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PlatformCard title="Sender" value="Web Growth" note="Uses the standardized transactional email shell introduced in the latest account-email work." /><PlatformCard title="Invitations" value="Enabled" note="Workspace invitations and password setup flows remain active." /><PlatformCard title="Security notices" value="Enabled" note="Password, role and activation-state notices remain enabled." /></div></PlatformSettingsSection>;
}
