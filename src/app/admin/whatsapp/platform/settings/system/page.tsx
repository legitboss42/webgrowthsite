import PlatformSettingsSection, { PlatformCard } from "../PlatformSettingsSection";

export default function PlatformSystemSettingsPage() {
  return <PlatformSettingsSection active="/admin/whatsapp/platform/settings/system/" title="System health" description="Platform-level database, webhook and processor monitoring."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PlatformCard title="Database monitoring" value="Enabled" note="Global settings seed Supabase health monitoring as enabled." /><PlatformCard title="Automation monitoring" value="Enabled" note="Automation processor health is included in the global system controls." /><PlatformCard title="Deployment" value="Vercel production" note="Runtime verification is performed after the single task deployment." /></div></PlatformSettingsSection>;
}
