import Link from "next/link";
import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/whatsapp/icons";

const pipeline = [
  ["All contacts", "/admin/whatsapp/contacts/"],
  ["New leads", "/admin/whatsapp/contacts/?stage=NEW"],
  ["Qualified", "/admin/whatsapp/contacts/?stage=QUALIFIED"],
  ["Follow up", "/admin/whatsapp/contacts/?stage=FOLLOW_UP"],
  ["Customers", "/admin/whatsapp/contacts/?stage=CUSTOMER"],
] as const;

export default function ContactsWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wg-crm-workspace w-full p-3 sm:p-5 lg:p-6">
      <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Customer workspace</div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Contacts</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Manage CRM stages, customer identity, consent, tags and conversation context in one operational view.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/whatsapp/conversations/" className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="conversations" className="h-4 w-4" />Inbox</Link>
          <Link href="/admin/whatsapp/campaigns/" className="inline-flex items-center gap-2 rounded-xl border border-ledger-bright/25 bg-ledger-tint px-3.5 py-2.5 text-xs font-semibold text-ledger-bright"><WhatsAppIcon name="campaigns" className="h-4 w-4" />Campaigns</Link>
        </div>
      </header>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[14.5rem_minmax(0,1fr)] xl:gap-5">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-rule bg-paper-raised p-2">
            <p className="px-3 pb-2 pt-2 text-[0.62rem] font-semibold uppercase tracking-[.16em] text-ink-faint">CRM pipeline</p>
            <nav className="flex gap-1 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
              {pipeline.map(([label, href]) => <Link key={label} href={href} className="flex flex-none items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-ink-soft transition hover:bg-ledger-tint hover:text-ledger-bright lg:w-full"><span className="h-2 w-2 rounded-full bg-rule-strong" />{label}</Link>)}
            </nav>
            <div className="mt-3 border-t border-rule px-3 py-3"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Quick links</p><div className="mt-2 grid gap-1"><Link href="/admin/whatsapp/quick-replies/" className="rounded-lg py-2 text-xs text-ink-faint hover:text-ink">Saved replies</Link><Link href="/admin/whatsapp/team/" className="rounded-lg py-2 text-xs text-ink-faint hover:text-ink">Team management</Link></div></div>
          </section>
        </aside>
        <main className="min-w-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised [&>div]:!p-0">{children}</main>
      </div>
    </div>
  );
}
