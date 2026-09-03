import PlatformSettingsSection, { PlatformCard } from "../PlatformSettingsSection";

export default function PlatformAuditSettingsPage() {
  return <PlatformSettingsSection active="/admin/whatsapp/platform/settings/audit/" title="Audit logs" description="Platform-level visibility into security and administrative activity."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PlatformCard title="Team activity" value="Existing audit stream" note="Workspace team activity remains available as an audit source." /><PlatformCard title="Security events" value="Tracked by account flows" note="Role, password and activation changes already generate security notices." /><PlatformCard title="Platform changes" value="Reserved" note="Global settings changes should record actor, timestamp and changed fields." /></div></PlatformSettingsSection>;
}
