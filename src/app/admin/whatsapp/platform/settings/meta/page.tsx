import PlatformSettingsSection, { PlatformCard } from "../PlatformSettingsSection";

export default function PlatformMetaSettingsPage() {
  return <PlatformSettingsSection active="/admin/whatsapp/platform/settings/meta/" title="Meta infrastructure" description="Global Meta/WhatsApp platform health and connection visibility."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PlatformCard title="Cloud API" value="Official Meta API" note="Platform continues to use the official WhatsApp Cloud API only." /><PlatformCard title="Webhook monitoring" value="Enabled" note="Global platform settings seed webhook monitoring as enabled." /><PlatformCard title="Connection registry" value="Per workspace" note="Phone/WABA routing remains workspace-specific rather than global." /></div></PlatformSettingsSection>;
}
