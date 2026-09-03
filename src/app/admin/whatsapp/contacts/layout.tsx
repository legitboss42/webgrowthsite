import type { ReactNode } from "react";
import { WorkspaceActionLink, WorkspaceRail } from "@/components/whatsapp/WorkspaceChrome";

const pipeline = [
  { label: "All contacts", href: "/admin/whatsapp/contacts/", icon: "contacts" as const, note: "Entire workspace" },
  { label: "New leads", href: "/admin/whatsapp/contacts/?stage=NEW", icon: "statusPending" as const, note: "Recently added" },
  { label: "Qualified", href: "/admin/whatsapp/contacts/?stage=QUALIFIED", icon: "statusDelivered" as const, note: "Ready to progress" },
  { label: "Follow up", href: "/admin/whatsapp/contacts/?stage=FOLLOW_UP", icon: "conversations" as const, note: "Needs attention" },
  { label: "Customers", href: "/admin/whatsapp/contacts/?stage=CUSTOMER", icon: "overview" as const, note: "Converted contacts" },
];

export default function ContactsWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wg-crm-workspace min-h-full min-w-0">
      <div className="grid min-h-full min-w-0 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <WorkspaceRail
          label="Contact views"
          items={pipeline}
          footer={
            <div className="grid gap-1 text-xs">
              <WorkspaceActionLink href="/admin/whatsapp/conversations/" icon="conversations">Inbox</WorkspaceActionLink>
              <WorkspaceActionLink href="/admin/whatsapp/campaigns/" icon="campaigns">Campaigns</WorkspaceActionLink>
              <WorkspaceActionLink href="/admin/whatsapp/quick-replies/" icon="quickReplies">Saved replies</WorkspaceActionLink>
            </div>
          }
        />
        <main className="min-w-0 overflow-hidden bg-[#070b10] [&>div]:!max-w-none">{children}</main>
      </div>
    </div>
  );
}
