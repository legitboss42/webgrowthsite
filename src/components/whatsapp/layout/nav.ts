import type { ComponentType, SVGProps } from "react";
import {
  AutomationIcon,
  CampaignIcon,
  ChartIcon,
  ContactsIcon,
  InboxIcon,
  OverviewIcon,
  PhoneIcon,
  QuickReplyIcon,
  SettingsIcon,
  TemplateIcon,
  WebhookIcon,
} from "./icons";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * Shown as a small count on the right of the row when greater than zero.
   * `review` is backed by `whatsapp_conversations.human_review_required`, the
   * only unattended-work signal the current schema actually stores.
   */
  badge?: "review";
};

export type NavGroup = {
  /** Null renders the group with no heading, used for the first group. */
  label: string | null;
  items: NavItem[];
};

/**
 * Sidebar structure. Grouped rather than flat so the wider platform modules
 * (Email, SMS, CRM, Marketing) can be added as new groups without touching the
 * shell components.
 */
export const WHATSAPP_NAV: NavGroup[] = [
  {
    label: null,
    items: [
      { label: "Overview", href: "/admin/whatsapp/overview/", icon: OverviewIcon },
    ],
  },
  {
    label: "Inbox",
    items: [
      {
        label: "Conversations",
        href: "/admin/whatsapp/conversations/",
        icon: InboxIcon,
        badge: "review",
      },
      { label: "Contacts", href: "/admin/whatsapp/contacts/", icon: ContactsIcon },
    ],
  },
  {
    label: "Messaging",
    items: [
      { label: "Message templates", href: "/admin/whatsapp/templates/", icon: TemplateIcon },
      { label: "Quick replies", href: "/admin/whatsapp/quick-replies/", icon: QuickReplyIcon },
      { label: "Campaigns", href: "/admin/whatsapp/campaigns/", icon: CampaignIcon },
      { label: "Automations", href: "/admin/whatsapp/automations/", icon: AutomationIcon },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Phone numbers", href: "/admin/whatsapp/phone-numbers/", icon: PhoneIcon },
      { label: "Analytics", href: "/admin/whatsapp/analytics/", icon: ChartIcon },
      { label: "Webhook & API", href: "/admin/whatsapp/webhook/", icon: WebhookIcon },
      { label: "Settings", href: "/admin/whatsapp/settings/", icon: SettingsIcon },
    ],
  },
];

/**
 * Longest-prefix match so `/admin/whatsapp/conversations/?conversation=x` still
 * highlights Conversations, while `/admin/whatsapp/overview/` does not light up
 * every row.
 */
export function findActiveNavHref(pathname: string) {
  const normalised = pathname.endsWith("/") ? pathname : `${pathname}/`;
  let best: string | null = null;
  for (const group of WHATSAPP_NAV) {
    for (const item of group.items) {
      if (normalised === item.href || normalised.startsWith(item.href)) {
        if (!best || item.href.length > best.length) best = item.href;
      }
    }
  }
  // `/admin/whatsapp/` is the overview, so treat the bare root as Overview.
  if (!best && (normalised === "/admin/whatsapp/" || normalised === "/admin/")) {
    return "/admin/whatsapp/overview/";
  }
  return best;
}

export function findNavItem(href: string | null) {
  if (!href) return null;
  for (const group of WHATSAPP_NAV) {
    const match = group.items.find((item) => item.href === href);
    if (match) return match;
  }
  return null;
}
