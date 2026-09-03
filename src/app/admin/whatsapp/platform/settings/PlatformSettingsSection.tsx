import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getWhatsAppWorkspaceAccess } from "../../auth";
import { WHATSAPP_PLATFORM_SETTINGS_ROUTES } from "@/lib/whatsapp/settingsNavigation";

export default async function PlatformSettingsSection({
  active,
  title,
  description,
  children,
}: {
  active: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) redirect("/admin/whatsapp/");
  if (!access.platformAdmin) redirect("/admin/whatsapp/");

  return (
    <div className="w-full px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
      <header className="mb-5 border-b border-rule pb-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright">Platform administration</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-faint">{description}</p>
      </header>
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-rule bg-paper-raised p-2 text-xs font-semibold lg:sticky lg:top-[5.25rem] lg:flex-col lg:self-start lg:overflow-visible" aria-label="Platform settings">
          {WHATSAPP_PLATFORM_SETTINGS_ROUTES.map((item) => (
            <Link key={item.href} href={item.href} className={`flex-none rounded-lg border-l-2 px-3 py-2.5 ${active === item.href ? "border-ledger-bright bg-ledger-tint text-ledger-bright" : "border-transparent text-ink-faint hover:bg-paper-sunk hover:text-ink"}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function PlatformCard({ title, value, note }: { title: string; value: React.ReactNode; note: string }) {
  return (
    <section className="rounded-xl border border-rule bg-paper-raised p-4 sm:p-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">{title}</p>
      <div className="mt-2 text-sm font-medium text-ink">{value}</div>
      <p className="mt-2 text-xs leading-5 text-ink-faint">{note}</p>
    </section>
  );
}