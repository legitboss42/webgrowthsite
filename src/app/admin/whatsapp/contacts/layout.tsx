import type { ReactNode } from "react";
import { WorkspaceActionLink, WorkspaceRail, WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";

const pipeline = [
  { label: "All contacts", href: "/admin/whatsapp/contacts/", icon: "contacts" as const, note: "Entire workspace", active: true },
  { label: "New leads", href: "/admin/whatsapp/contacts/?stage=NEW", icon: "statusPending" as const, note: "Recently added" },
  { label: "Qualified", href: "/admin/whatsapp/contacts/?stage=QUALIFIED", icon: "statusDelivered" as const, note: "Ready to progress" },
  { label: "Follow up", href: "/admin/whatsapp/contacts/?stage=FOLLOW_UP", icon: "conversations" as const, note: "Needs attention" },
  { label: "Customers", href: "/admin/whatsapp/contacts/?stage=CUSTOMER", icon: "overview" as const, note: "Converted contacts" },
];

export default function ContactsWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wg-crm-workspace flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar
        eyebrow="CRM"
        title="Contacts"
        description="Customer records, stages, tags and conversation context."
        actions={
          <>
            <WorkspaceActionLink href="/admin/whatsapp/conversations/" icon="conversations">Inbox</WorkspaceActionLink>
            <WorkspaceActionLink href="/admin/whatsapp/campaigns/" icon="campaigns" primary>Campaigns</WorkspaceActionLink>
          </>
        }
      />
      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <WorkspaceRail
          label="Contact views"
          items={pipeline}
          footer={
            <div className="grid gap-1 text-xs">
              <WorkspaceActionLink href="/admin/whatsapp/quick-replies/" icon="quickReplies">Saved replies</WorkspaceActionLink>
              <WorkspaceActionLink href="/admin/whatsapp/team/" icon="contacts">Team</WorkspaceActionLink>
            </div>
          }
        />
        <main className="min-w-0 overflow-hidden bg-[#070b10] [&>div]:!max-w-none [&>div]:!p-0">{children}</main>
      </div>
    </div>
  );
}
