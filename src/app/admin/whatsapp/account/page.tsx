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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[.16em] text-ledger">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Manage your account and sign-in preferences.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
        <section className="rounded-2xl border border-rule bg-paper-raised p-5 sm:p-6">
          <h2 className="text-base font-semibold text-ink">Your account</h2>
          <dl className="mt-4 divide-y divide-rule text-sm">
            <div className="flex items-start justify-between gap-4 py-3 first:pt-0">
              <dt className="text-ink-faint">Name</dt>
              <dd className="text-right font-medium text-ink">{access.displayName}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-ink-faint">Email</dt>
              <dd className="max-w-[70%] break-all text-right text-ink">{access.email}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
              <dt className="text-ink-faint">Role</dt>
              <dd className="rounded-full border border-ledger-tint bg-ledger-tint/60 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[.08em] text-ledger">{access.role}</dd>
            </div>
          </dl>
          <p className="mt-5 rounded-xl bg-paper-sunk p-3 text-xs leading-5 text-ink-faint">You can continue using Google even after creating a workspace password.</p>
        </section>

        <section className="rounded-2xl border border-rule bg-paper-raised p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-ink">Password</h2>
            <p className="mt-1 text-xs leading-5 text-ink-faint">Change your email sign-in password, or request a secure setup/reset link if you normally sign in with Google.</p>
          </div>
          <ChangePasswordPanel email={access.email} />
        </section>
      </div>
    </div>
  );
}
