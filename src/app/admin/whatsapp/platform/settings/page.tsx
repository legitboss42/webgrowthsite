import PlatformSettingsSection, { PlatformCard } from "./PlatformSettingsSection";

export default function PlatformSettingsPage() {
  return (
    <PlatformSettingsSection active="/admin/whatsapp/platform/settings/" title="Platform settings" description="Global Web Growth controls that apply across WhatsApp workspaces.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PlatformCard title="Platform identity" value="Web Growth WhatsApp" note="Global platform name and support identity." />
        <PlatformCard title="Default timezone" value="Africa/Lagos" note="Used as the platform default for new workspace configuration." />
        <PlatformCard title="Maintenance mode" value="Off" note="Reserved emergency control; normal traffic remains enabled." />
      </div>
    </PlatformSettingsSection>
  );
}
