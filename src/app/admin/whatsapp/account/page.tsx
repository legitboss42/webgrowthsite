import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceSurface, WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";
import { getWhatsAppWorkspaceAccess } from "../auth";
import ChangePasswordPanel from "./ChangePasswordPanel";

export const metadata: Metadata = { title: "Workspace Settings | Web Growth", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function WhatsAppAccountSettingsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) redirect("/admin/whatsapp/");

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar eyebrow="Personal settings" title="Account & sign-in" description="Your workspace identity, role and authentication controls." />
      <main className="min-w-0 bg-[#060a0e] p-3 sm:p-4">
        <div className="grid gap-3 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <WorkspaceSurface className="self-start">
            <div className="flex items-center gap-3 border-b border-rule p-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-ledger-bright/15 bg-ledger-tint text-xs font-bold text-ledger-bright">{access.displayName.trim().slice(0, 2).toUpperCase()}</span>
              <div className="min-w-0"><h2 className="truncate text-sm font-semibold text-ink">{access.displayName}</h2><p className="truncate text-xs text-ink-faint">{access.email}</p></div>
            </div>
            <dl className="divide-y divide-rule px-4 text-xs">
              <div className="flex items-start justify-between gap-4 py-3"><dt className="text-ink-faint">Workspace</dt><dd className="max-w-[65%] text-right font-medium text-ink">{access.workspaceName}</dd></div>
              <div className="flex items-start justify-between gap-4 py-3"><dt className="text-ink-faint">Role</dt><dd className="rounded-full border border-ledger-bright/20 bg-ledger-tint px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[.08em] text-ledger-bright">{access.role}</dd></div>
            </dl>
            <div className="border-t border-rule p-4">
              <form action="/api/auth/workspace/logout/" method="post"><button type="submit" className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-rose-900/40 bg-rose-950/30 px-4 text-xs font-semibold text-rose-300 hover:bg-rose-950/50">Log out</button></form>
            </div>
          </WorkspaceSurface>

          <WorkspaceSurface>
            <div className="border-b border-rule px-4 py-3"><h2 className="text-sm font-semibold text-ink">Password & security</h2><p className="mt-1 text-[0.68rem] leading-5 text-ink-faint">Change your email password or request a secure setup/reset link. Google sign-in remains available.</p></div>
            <div className="p-4"><ChangePasswordPanel email={access.email} /></div>
          </WorkspaceSurface>
        </div>
      </main>
    </div>
  );
}
