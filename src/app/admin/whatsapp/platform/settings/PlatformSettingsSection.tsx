import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";
import { getWhatsAppWorkspaceAccess } from "../../auth";
import { WHATSAPP_PLATFORM_SETTINGS_ROUTES } from "@/lib/whatsapp/settingsNavigation";

export default async function PlatformSettingsSection({ active, title, description, children }: { active: string; title: string; description: string; children: React.ReactNode }) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) redirect("/admin/whatsapp/");
  if (!access.platformAdmin) redirect("/admin/whatsapp/");

  return (
    <div className="wg-platform-settings flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar eyebrow="Platform administration" title={title} description={description} />
      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="wg-cw-section-rail border-r border-rule">
          <p className="wg-cw-rail-label">Platform settings</p>
          <nav className="wg-cw-rail-nav" aria-label="Platform settings">
            {WHATSAPP_PLATFORM_SETTINGS_ROUTES.map((item) => (
              <Link key={item.href} href={item.href} aria-current={active === item.href ? "page" : undefined} className="wg-cw-rail-link" data-active={active === item.href ? "true" : "false"}>
                <span className="wg-cw-rail-icon"><WhatsAppIcon name="settings" className="h-4 w-4" /></span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 bg-[#060a0e] p-3 sm:p-4">{children}</main>
      </div>
    </div>
  );
}

export function PlatformCard({ title, value, note }: { title: string; value: React.ReactNode; note: string }) {
  return (
    <section className="rounded-xl border border-rule bg-paper-raised p-4">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[.12em] text-ink-faint">{title}</p>
      <div className="mt-2 text-sm font-medium text-ink">{value}</div>
      <p className="mt-1.5 text-[0.68rem] leading-5 text-ink-faint">{note}</p>
    </section>
  );
}
