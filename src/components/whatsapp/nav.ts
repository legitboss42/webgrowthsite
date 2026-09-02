import type { WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import type { WhatsAppIconName } from "./icons";

export type WhatsAppNavStatus = "live" | "soon";
export type WhatsAppLayoutMode = "scroll" | "fill";
export type WhatsAppNavItem = { label: string; href: string; icon: WhatsAppIconName; description: string; status: WhatsAppNavStatus; layout?: WhatsAppLayoutMode; roles?: WhatsAppTeamRole[] };
export type WhatsAppNavSection = { label: string; items: WhatsAppNavItem[] };
export const WHATSAPP_CONSOLE_ROOT = "/admin/whatsapp";
const OWNER: WhatsAppTeamRole[] = ["owner"];
const SUPERVISORS: WhatsAppTeamRole[] = ["owner", "manager"];

export const WHATSAPP_NAV_SECTIONS: WhatsAppNavSection[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: `${WHATSAPP_CONSOLE_ROOT}`, icon: "overview", description: "Connection health and message activity at a glance.", status: "live", roles: OWNER },
      { label: "Conversations", href: `${WHATSAPP_CONSOLE_ROOT}/conversations`, icon: "conversations", description: "Inbound WhatsApp leads, full threads, and replies.", status: "live", layout: "fill" },
      { label: "Calls", href: `${WHATSAPP_CONSOLE_ROOT}/calls`, icon: "phoneNumbers", description: "Incoming and outgoing WhatsApp call history.", status: "live" },
      { label: "Contacts", href: `${WHATSAPP_CONSOLE_ROOT}/contacts`, icon: "contacts", description: "CRM profiles, lead details, and conversation links.", status: "live" },
      { label: "Templates", href: `${WHATSAPP_CONSOLE_ROOT}/templates`, icon: "templates", description: "Approved Meta message templates.", status: "live", roles: OWNER },
      { label: "Quick Replies", href: `${WHATSAPP_CONSOLE_ROOT}/quick-replies`, icon: "quickReplies", description: "Saved snippets for fast, consistent answers.", status: "live", roles: OWNER },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Campaigns", href: `${WHATSAPP_CONSOLE_ROOT}/campaigns`, icon: "campaigns", description: "Opt-in template campaigns, audiences, scheduling, and delivery performance.", status: "live", roles: SUPERVISORS },
      { label: "Flows", href: `${WHATSAPP_CONSOLE_ROOT}/flows`, icon: "templates", description: "Build, publish, send, and track interactive WhatsApp Flows.", status: "live", roles: SUPERVISORS },
      { label: "Automations", href: `${WHATSAPP_CONSOLE_ROOT}/automations`, icon: "automations", description: "Trigger, condition, and action workflows for WhatsApp operations.", status: "live", roles: SUPERVISORS },
      { label: "Analytics", href: `${WHATSAPP_CONSOLE_ROOT}/analytics`, icon: "analytics", description: "Response times, volumes, and lead quality.", status: "live", roles: OWNER },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Team", href: `${WHATSAPP_CONSOLE_ROOT}/team`, icon: "contacts", description: "Team members, roles, availability, and access.", status: "live", roles: SUPERVISORS },
      { label: "Phone Numbers", href: `${WHATSAPP_CONSOLE_ROOT}/phone-numbers`, icon: "phoneNumbers", description: "Connected senders, quality rating, and limits.", status: "live", roles: OWNER },
      { label: "Settings", href: `${WHATSAPP_CONSOLE_ROOT}/settings`, icon: "settings", description: "Integration configuration and connection readiness reporting.", status: "live", roles: OWNER },
    ],
  },
];
export const WHATSAPP_NAV_ITEMS: WhatsAppNavItem[] = WHATSAPP_NAV_SECTIONS.flatMap((section) => section.items);
export function getWhatsAppNavSectionsForRole(role: WhatsAppTeamRole) { return WHATSAPP_NAV_SECTIONS.map((section) => ({ ...section, items: section.items.filter((item) => !item.roles || item.roles.includes(role)) })).filter((section) => section.items.length > 0); }
export function normalizeWhatsAppPath(pathname: string | null | undefined) { if (!pathname) return ""; const [withoutQuery] = pathname.split("?"); const trimmed = withoutQuery.replace(/\/+$/, ""); return trimmed || "/"; }
export function isWhatsAppNavItemActive(pathname: string | null | undefined, href: string) { const current = normalizeWhatsAppPath(pathname); const target = normalizeWhatsAppPath(href); if (!current || !target) return false; if (current === target) return true; if (target === normalizeWhatsAppPath(WHATSAPP_CONSOLE_ROOT)) return false; return current.startsWith(`${target}/`); }
export function findWhatsAppNavItem(pathname: string | null | undefined) { return WHATSAPP_NAV_ITEMS.find((item) => isWhatsAppNavItemActive(pathname, item.href)) || null; }
export function getWhatsAppPageMeta(pathname: string | null | undefined) { const item = findWhatsAppNavItem(pathname); return { title: item?.label || "WhatsApp", description: item?.description || "Web Growth WhatsApp business console." }; }
export function getWhatsAppLayoutMode(pathname: string | null | undefined): WhatsAppLayoutMode { return findWhatsAppNavItem(pathname)?.layout || "scroll"; }
export function getWhatsAppSenderStatusText(senderConnected: boolean) { return senderConnected ? "Sender connected" : "Sender not configured"; }
