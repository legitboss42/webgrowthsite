import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, getGoogleClientId, isGoogleAuthConfigured } from "@/lib/googleAuth";
import ContactAvatar from "@/components/whatsapp/ContactAvatar";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import { ContactCreateButton, ContactProfileButton } from "../ContactCrmEditor";
import {
  WHATSAPP_CONTACT_FILTERS,
  WHATSAPP_CONTACT_PAGE_SIZE,
  buildWhatsAppContactSearchFilter,
  canAgentAccessWhatsAppContact,
  countWhatsAppContactsByTemperature,
  getWhatsAppContactName,
  isWhatsAppContactFilter,
  normalizeWhatsAppContactRow,
  sanitizeWhatsAppSearchTerm,
  type WhatsAppContactFilter,
  type WhatsAppContactRow,
} from "../contactsModel";

export const metadata: Metadata = {
  title: "WhatsApp Contacts | Web Growth",
  robots: { index: false, follow: false },
};

const CONTACT_SELECT =
  "id,wa_id,phone,display_name,business_name,email,website,source,lead_status,lead_temperature,created_at,updated_at,whatsapp_conversations(id,status,intent,last_message_at,human_review_required,assigned_member_id)";

async function getContacts(input: { filter: WhatsAppContactFilter; search: string }): Promise<WhatsAppContactRow[]> {
  const query = [
    `select=${CONTACT_SELECT}`,
    "order=updated_at.desc",
    `limit=${WHATSAPP_CONTACT_PAGE_SIZE}`,
  ];
  if (input.filter !== "ALL") query.push(`lead_temperature=eq.${input.filter}`);
  const searchFilter = buildWhatsAppContactSearchFilter(input.search);
  if (searchFilter) query.push(searchFilter);

  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_contacts?${query.join("&")}`);
  return rows?.map(normalizeWhatsAppContactRow) || [];
}

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Date(parsed).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function getTemperatureClasses(temperature: WhatsAppContactRow["lead_temperature"]) {
  if (temperature === "HOT") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  if (temperature === "WARM") return "bg-brass-tint text-[#6f4f16] ring-1 ring-brass/25";
  return "bg-paper-sunk text-ink-faint ring-1 ring-rule";
}

function getFilterHref(filter: WhatsAppContactFilter, search: string) {
  const query = new URLSearchParams();
  if (filter !== "ALL") query.set("temp", filter);
  if (search) query.set("q", search);
  const suffix = query.toString();
  return suffix ? `/admin/whatsapp/contacts/?${suffix}` : "/admin/whatsapp/contacts/";
}

function getConversationHref(contact: WhatsAppContactRow) {
  return contact.conversation
    ? `/admin/whatsapp/conversations/?lead=${encodeURIComponent(contact.conversation.id)}`
    : null;
}

export default async function WhatsAppContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ temp?: string; q?: string }>;
}) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] px-4 py-16 text-white">
        <div className="w-full max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/whatsapp/contacts/"
            adminEmail={getDefaultAdminGoogleEmail()}
            clientId={getGoogleClientId()}
            googleReady={isGoogleAuthConfigured()}
            workspaceTeamAccess
          />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const filter: WhatsAppContactFilter = isWhatsAppContactFilter(params.temp) ? params.temp : "ALL";
  const search = sanitizeWhatsAppSearchTerm(params.q);
  const loadedContacts = await getContacts({ filter, search });
  const contacts = access.role === "agent"
    ? loadedContacts.filter((contact) => canAgentAccessWhatsAppContact(contact, access.memberId))
    : loadedContacts;
  const counts = countWhatsAppContactsByTemperature(contacts);
  const canCreate = canWhatsAppRoleSuperviseTeam(access.role);
  const isCapped = loadedContacts.length >= WHATSAPP_CONTACT_PAGE_SIZE;
  const isFiltered = filter !== "ALL" || Boolean(search);

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Contact CRM</h1>
          <p className="mt-1 text-sm text-ink-faint">Customer profiles, lead status, contact details, and conversation links.</p>
          {access.role === "agent" ? (
            <p className="mt-1 text-xs text-ink-faint">Agents see contacts from their own and unassigned conversations only.</p>
          ) : null}
        </div>
        {canCreate ? <ContactCreateButton /> : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form method="get" action="/admin/whatsapp/contacts/" className="flex w-full gap-2 lg:max-w-md">
          {filter !== "ALL" ? <input type="hidden" name="temp" value={filter} /> : null}
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-rule bg-paper-raised px-3 focus-within:border-ledger-bright focus-within:ring-2 focus-within:ring-ledger-bright/20">
            <span className="sr-only">Search contacts</span>
            <WhatsAppIcon name="contacts" className="h-4 w-4 flex-none text-ink-faint" />
            <input type="search" name="q" defaultValue={search} placeholder="Search name, business, email, or number" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-faint/70" />
          </label>
          <button type="submit" className="flex-none rounded-lg bg-ledger-bright px-4 py-2 text-sm font-medium text-white transition hover:bg-ledger">Search</button>
        </form>

        <nav aria-label="Temperature filters" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <div className="flex w-max gap-2 pb-1">
            {WHATSAPP_CONTACT_FILTERS.map((item) => {
              const active = filter === item;
              return (
                <Link key={item} href={getFilterHref(item, search)} aria-current={active ? "page" : undefined} className={`inline-flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${active ? "bg-ledger-bright text-white" : "border border-rule bg-paper-raised text-ink-soft hover:border-rule-strong hover:text-ink"}`}>
                  {item}
                  <span className={`rounded-full px-1.5 text-[0.65rem] tabular-nums ${active ? "bg-white/20 text-white" : "bg-paper-sunk text-ink-faint"}`}>{counts[item]}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {search ? (
        <p className="mt-3 text-xs text-ink-faint">Showing matches for <span className="font-medium text-ink">{search}</span> · <Link href={getFilterHref(filter, "")} className="text-ledger underline decoration-ledger/30 underline-offset-4">Clear search</Link></p>
      ) : null}
      {isCapped ? (
        <p className="mt-3 rounded-lg border border-brass/25 bg-brass-tint px-3 py-2 text-xs text-[#6f4f16]">Showing the {WHATSAPP_CONTACT_PAGE_SIZE} most recently active matching contacts. Use search to find someone outside this list.</p>
      ) : null}

      <section className="mt-4 overflow-hidden rounded-xl border border-rule bg-paper-raised">
        <ul className="divide-y divide-rule lg:hidden">
          {contacts.map((contact) => {
            const conversationHref = getConversationHref(contact);
            return (
              <li key={contact.id} className="px-4 py-3.5">
                <div className="flex gap-3">
                  <ContactAvatar identity={{ displayName: contact.display_name, businessName: contact.business_name, waId: contact.wa_id }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{getWhatsAppContactName(contact)}</p>
                      <span className={`ml-auto flex-none rounded-full px-2 py-0.5 text-[0.6rem] font-semibold ${getTemperatureClasses(contact.lead_temperature)}`}>{contact.lead_temperature}</span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-xs text-ink-faint">{contact.phone || `+${contact.wa_id}`}</p>
                    {contact.business_name || contact.email ? <p className="mt-1 truncate text-xs text-ink-faint">{[contact.business_name, contact.email].filter(Boolean).join(" · ")}</p> : null}
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-ink-faint">
                      <span className="uppercase tracking-[.1em]">{contact.lead_status}</span><span>·</span><span>Added {formatDate(contact.created_at)}</span>
                      {contact.conversation?.human_review_required ? <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">Needs review</span> : null}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ContactProfileButton contact={contact} />
                      {conversationHref ? <Link href={conversationHref} className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper px-2.5 py-1.5 text-xs font-medium text-ledger transition hover:border-ledger"><WhatsAppIcon name="conversations" className="h-3.5 w-3.5" />Open conversation</Link> : <span className="self-center text-xs text-ink-faint">No conversation yet</span>}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          {contacts.length === 0 ? <li className="px-4 py-10 text-center text-sm text-ink-faint">{isFiltered ? "No accessible contacts match this search or filter." : "No accessible WhatsApp contacts stored yet."}</li> : null}
        </ul>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-paper-sunk text-ink-faint">
              <tr>{["Contact", "WhatsApp", "Email", "Source", "Temp", "Status", "Last contact", "Actions"].map((heading) => <th key={heading} scope="col" className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[.1em]">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const conversationHref = getConversationHref(contact);
                return (
                  <tr key={contact.id} className="border-t border-rule transition hover:bg-paper-sunk/60">
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><ContactAvatar identity={{ displayName: contact.display_name, businessName: contact.business_name, waId: contact.wa_id }} size="sm" /><div className="min-w-0"><p className="truncate font-medium text-ink">{getWhatsAppContactName(contact)}</p>{contact.business_name ? <p className="truncate text-xs text-ink-faint">{contact.business_name}</p> : null}</div></div></td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{contact.phone || `+${contact.wa_id}`}</td>
                    <td className="max-w-[14rem] truncate px-4 py-3 text-ink-soft">{contact.email || "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{contact.source || "WhatsApp"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTemperatureClasses(contact.lead_temperature)}`}>{contact.lead_temperature}</span></td>
                    <td className="px-4 py-3 text-xs uppercase tracking-[.12em] text-ink-faint">{contact.lead_status}</td>
                    <td className="px-4 py-3 text-ink-faint">{formatDate(contact.conversation?.last_message_at || contact.updated_at)}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><ContactProfileButton contact={contact} />{conversationHref ? <Link href={conversationHref} className="inline-flex items-center gap-1 rounded-lg border border-rule px-2.5 py-1.5 text-xs font-medium text-ledger hover:border-ledger">Open</Link> : <span className="text-xs text-ink-faint">No thread</span>}</div></td>
                  </tr>
                );
              })}
              {contacts.length === 0 ? <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-ink-faint">{isFiltered ? "No accessible contacts match this search or filter." : "No accessible contacts stored yet."}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
