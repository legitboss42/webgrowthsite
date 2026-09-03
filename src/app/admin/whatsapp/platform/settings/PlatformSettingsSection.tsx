import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getWhatsAppWorkspaceAccess } from "../../../auth";
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
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
      <header className="mb-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[.16em] text-ledger">Platform administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-soft">{description}</p>
      </header>
      <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-rule bg-paper-raised p-2 text-xs font-semibold" aria-label="Platform settings">
        {WHATSAPP_PLATFORM_SETTINGS_ROUTES.map((item) => (
          <Link key={item.href} href={item.href} className={`flex-none rounded-lg px-3 py-2 ${active === item.href ? "bg-ledger/10 text-ledger ring-1 ring-ledger/15" : "text-ink-soft hover:bg-paper-sunk hover:text-ink"}`}>
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

export function PlatformCard({ title, value, note }: { title: string; value: React.ReactNode; note: string }) {
  return (
    <section className="rounded-2xl border border-rule bg-paper-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-faint">{title}</p>
      <div className="mt-2 text-sm font-medium text-ink">{value}</div>
      <p className="mt-2 text-xs leading-5 text-ink-faint">{note}</p>
    </section>
  );
}
