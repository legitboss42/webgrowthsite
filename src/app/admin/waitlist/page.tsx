import type { Metadata } from "next";
import { cookies } from "next/headers";
import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { getDefaultAdminGoogleEmail, isGoogleAuthConfigured } from "@/lib/googleAuth";
import { NO_VALUE, getBusinessSizeLabel, getInterestLabel } from "@/lib/waitlist/schema";
import { isWaitlistStorageConfigured, listWaitlistSignups } from "@/lib/waitlist/store";
import { hasWaitlistAdminAccess } from "./auth";
import {
  WAITLIST_FILTERS,
  WAITLIST_FILTER_LABELS,
  filterWaitlistSignups,
  formatSignupDate,
  getEmailStatusLabel,
  parseWaitlistFilter,
  summariseWaitlist,
  type WaitlistDashboardRow,
} from "./dashboard";

/**
 * Internal dashboard for the /automation early-access waitlist.
 *
 * Every number and every row on this page comes from public.automation_waitlist
 * via the server-only store. There is no sample data, no seeded row and no
 * hard-coded count anywhere in this file. An empty table means the table really
 * is empty.
 *
 * Access is the repository's existing internal-utility session (see ./auth.ts).
 * The page reads nothing from the TikTok scheduler or the WhatsApp systems.
 */

export const metadata: Metadata = {
  title: "Automation Waitlist | Web Growth",
  robots: { index: false, follow: false },
};

type LoadResult =
  | { ok: true; rows: WaitlistDashboardRow[] }
  | { ok: false; reason: "unconfigured" | "failed" };

async function loadSignups(): Promise<LoadResult> {
  if (!isWaitlistStorageConfigured()) return { ok: false, reason: "unconfigured" };

  try {
    return { ok: true, rows: await listWaitlistSignups() };
  } catch (error) {
    // Logged server-side only. The page shows a plain sentence instead of the
    // database error, so no query, table name or driver message is rendered.
    console.error("Unable to load the automation waitlist", error);
    return { ok: false, reason: "failed" };
  }
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center text-sm text-white/70">
      {children}
    </div>
  );
}

function emailStatusClass(status: string): string {
  if (status === "sent") return "text-emerald-300";
  if (status === "failed") return "text-amber-300";
  return "text-white/60";
}

export default async function AutomationWaitlistAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const cookieStore = await cookies();

  if (!hasWaitlistAdminAccess(cookieStore)) {
    return (
      <main className="min-h-screen bg-[#050806] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/waitlist/"
            adminEmail={getDefaultAdminGoogleEmail()}
            googleReady={isGoogleAuthConfigured()}
          />
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const filter = parseWaitlistFilter(params.filter);
  const loaded = await loadSignups();
  const rows = loaded.ok ? loaded.rows : [];
  const summary = summariseWaitlist(rows);
  const visible = filterWaitlistSignups(rows, filter);

  const cards = [
    { label: "Total signups", value: summary.total },
    { label: "WhatsApp interest", value: summary.whatsappInterest },
    { label: "TikTok interest", value: summary.tiktokInterest },
    { label: "Both products", value: summary.both },
    { label: "Last 7 days", value: summary.lastSevenDays },
  ];

  const columns = [
    "Name",
    "Email",
    "Business",
    "Interest",
    "Business size",
    "Status",
    "Confirmation email",
    "Signed up (UTC)",
  ];

  return (
    <main className="min-h-screen bg-[#050806] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[.2em] text-emerald-300">Internal waitlist</p>
        <h1 className="mt-3 text-4xl font-semibold">Automation waitlist</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/60">
          Early-access signups from the /automation page. Interest counts include everyone who
          selected both products.
        </p>

        {loaded.ok ? (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {cards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                  <p className="text-xs uppercase tracking-[.14em] text-white/50">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">{card.value}</p>
                </div>
              ))}
            </div>

            <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter by interest">
              {WAITLIST_FILTERS.map((item) => (
                <a
                  key={item}
                  href={`/admin/waitlist/?filter=${item}`}
                  aria-current={filter === item ? "true" : undefined}
                  className={`rounded-full px-4 py-2 text-sm ${
                    filter === item ? "bg-emerald-500 font-medium text-black" : "bg-white/10 text-white/80"
                  }`}
                >
                  {WAITLIST_FILTER_LABELS[item]}
                </a>
              ))}
            </nav>

            <p className="mt-4 text-xs text-white/50">
              Showing {visible.length} of {summary.total}
              {summary.total === 1 ? " signup" : " signups"}.
            </p>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-white/5 text-white/60">
                  <tr>
                    {columns.map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-3 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.id} className="border-t border-white/10 align-top">
                      <td className="px-4 py-4">{row.full_name}</td>
                      <td className="px-4 py-4 break-all">{row.email}</td>
                      <td className="px-4 py-4">{row.business_name || NO_VALUE}</td>
                      <td className="px-4 py-4">{getInterestLabel(row.interest)}</td>
                      <td className="px-4 py-4">{getBusinessSizeLabel(row.business_size)}</td>
                      <td className="px-4 py-4">{row.status}</td>
                      <td className={`px-4 py-4 ${emailStatusClass(row.confirmation_email_status)}`}>
                        {getEmailStatusLabel(row.confirmation_email_status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatSignupDate(row.created_at)}</td>
                    </tr>
                  ))}
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-10 text-center text-white/60">
                        {summary.total === 0
                          ? "No signups yet."
                          : "No signups match this filter yet."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Panel>
            {loaded.reason === "unconfigured"
              ? "The waitlist database is not configured in this environment, so there is nothing to show."
              : "The waitlist could not be loaded. The reason has been logged on the server."}
          </Panel>
        )}
      </div>
    </main>
  );
}
