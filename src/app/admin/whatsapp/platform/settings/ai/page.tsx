import PlatformSettingsSection, { PlatformCard } from "../PlatformSettingsSection";

export default function PlatformAISettingsPage() {
  return <PlatformSettingsSection active="/admin/whatsapp/platform/settings/ai/" title="Global AI" description="Platform-wide AI availability, defaults and emergency controls."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><PlatformCard title="Global AI" value="Disabled by default" note="Existing zero-cost safety rule remains intact." /><PlatformCard title="Emergency kill switch" value="Available" note="Global platform settings include a hard stop for AI execution." /><PlatformCard title="Default limits" value="0 requests / $0" note="New workspace AI defaults remain non-spending until explicitly enabled." /></div></PlatformSettingsSection>;
}
