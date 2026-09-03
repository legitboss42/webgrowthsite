import Link from "next/link";
import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { WorkspaceActionLink, WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";

export default function TeamWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wg-team-workspace flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar
        eyebrow="Workspace access"
        title="Team"
        description="Manage members, roles, availability and conversation access."
        actions={
          <>
            <WorkspaceActionLink href="/admin/whatsapp/conversations/" icon="conversations">Inbox</WorkspaceActionLink>
            <WorkspaceActionLink href="/admin/whatsapp/analytics/" icon="analytics" primary>Team analytics</WorkspaceActionLink>
          </>
        }
      />
      <div className="grid min-h-0 min-w-0 flex-1 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <main className="min-w-0 bg-[#060a0e] xl:border-r xl:border-rule">{children}</main>
        <aside className="wg-inspector-rail hidden min-h-0 overflow-y-auto p-3 xl:block">
          <p className="wg-cw-rail-label">Team workspace</p>
          <nav className="grid gap-1">
            <Link href="/admin/whatsapp/team/" className="wg-cw-rail-link" data-active="true"><span className="wg-cw-rail-icon"><WhatsAppIcon name="contacts" className="h-4 w-4" /></span><span>Members</span></Link>
            <Link href="/admin/whatsapp/conversations/" className="wg-cw-rail-link"><span className="wg-cw-rail-icon"><WhatsAppIcon name="conversations" className="h-4 w-4" /></span><span>Assignments</span></Link>
            <Link href="/admin/whatsapp/analytics/" className="wg-cw-rail-link"><span className="wg-cw-rail-icon"><WhatsAppIcon name="analytics" className="h-4 w-4" /></span><span>Performance</span></Link>
            <Link href="/admin/whatsapp/settings/" className="wg-cw-rail-link"><span className="wg-cw-rail-icon"><WhatsAppIcon name="settings" className="h-4 w-4" /></span><span>Access settings</span></Link>
          </nav>
          <div className="mt-4 border-t border-rule pt-4 text-[0.7rem] leading-5 text-ink-faint">
            <p className="font-semibold text-ink">Roles stay functional</p>
            <p className="mt-1">Owner, Manager and Agent controls continue to use the existing workspace permission model.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
