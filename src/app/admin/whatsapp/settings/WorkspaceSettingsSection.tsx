import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getWhatsAppWorkspaceAccess } from "../../auth";
import { WHATSAPP_WORKSPACE_SETTINGS_ROUTES } from "@/lib/whatsapp/settingsNavigation";

export default async function WorkspaceSettingsSection({
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
  if (access.role !== "owner") redirect("/admin/whatsapp/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
      <header className="mb-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[.16em] text-ledger">{access.workspaceName}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-soft">{description}</p>
      </header>
      <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-rule bg-paper-raised p-2 text-xs font-semibold" aria-label="Workspace settings">
        {WHATSAPP_WORKSPACE_SETTINGS_ROUTES.map((item) => (
          <Link key={item.href} href={item.href} className={`flex-none rounded-lg px-3 py-2 ${active === item.href ? "bg-ledger/10 text-ledger ring-1 ring-ledger/15" : "text-ink-soft hover:bg-paper-sunk hover:text-ink"}`}>
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

export function SettingsInfoGrid({ items }: { items: Array<{ label: string; value: React.ReactNode; note?: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <section key={item.label} className="rounded-2xl border border-rule bg-paper-raised p-5">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-faint">{item.label}</p>
          <div className="mt-2 text-sm font-medium text-ink">{item.value}</div>
          {item.note ? <p className="mt-2 text-xs leading-5 text-ink-faint">{item.note}</p> : null}
        </section>
      ))}
    </div>
  );
}
