import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getWhatsAppWorkspaceAccess } from "../auth";
import ChangePasswordPanel from "./ChangePasswordPanel";

export const metadata: Metadata = {
  title: "Workspace Settings | Web Growth",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WhatsAppAccountSettingsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) redirect("/admin/whatsapp/");

  return (
    <div className="w-full px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
      <header className="mb-5 border-b border-rule pb-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright">Workspace account</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">Account & sign-in</h1>
        <p className="mt-1 text-sm text-ink-faint">Manage your identity, role and sign-in preferences without leaving the application.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,.75fr)_minmax(0,1.25fr)]">
        <section className="rounded-xl border border-rule bg-paper-raised p-4 sm:p-5">
          <div className="flex items-center gap-3 border-b border-rule pb-4">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-ledger-tint text-sm font-bold text-ledger-bright">{access.displayName.trim().slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0"><h2 className="truncate text-base font-semibold text-ink">{access.displayName}</h2><p className="truncate text-xs text-ink-faint">{access.email}</p></div>
          </div>
          <dl className="divide-y divide-rule text-sm">
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-ink-faint">Workspace</dt>
              <dd className="max-w-[65%] text-right font-medium text-ink">{access.workspaceName}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-ink-faint">Email</dt>
              <dd className="max-w-[70%] break-all text-right text-ink">{access.email}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-ink-faint">Role</dt>
              <dd className="rounded-full border border-ledger-bright/20 bg-ledger-tint px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[.08em] text-ledger-bright">{access.role}</dd>
            </div>
          </dl>
          <p className="mt-2 rounded-lg border border-rule bg-paper-sunk p-3 text-xs leading-5 text-ink-faint">Google sign-in remains available after creating a workspace password.</p>

          <div className="mt-5 border-t border-rule pt-4">
            <form action="/api/auth/workspace/logout/" method="post">
              <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100">Log out</button>
            </form>
            <p className="mt-2 text-center text-[11px] leading-5 text-ink-faint">Ends this workspace session and returns you to sign in.</p>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4 sm:p-5">
          <div className="mb-5 border-b border-rule pb-4">
            <h2 className="text-base font-semibold text-ink">Password & security</h2>
            <p className="mt-1 text-xs leading-5 text-ink-faint">Change your email sign-in password, or request a secure setup/reset link if you normally sign in with Google.</p>
          </div>
          <ChangePasswordPanel email={access.email} />
        </section>
      </div>
    </div>
  );
}