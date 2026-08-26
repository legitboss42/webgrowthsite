import type { ReactNode } from "react";

/**
 * Small inline icon set for the WhatsApp console shell.
 *
 * Kept local (rather than pulling an icon package) so the console ships no extra
 * dependency and every glyph shares one stroke weight with the Growth Ledger UI.
 */
export type WhatsAppIconName =
  | "overview"
  | "conversations"
  | "contacts"
  | "templates"
  | "quickReplies"
  | "campaigns"
  | "automations"
  | "phoneNumbers"
  | "analytics"
  | "settings"
  | "menu"
  | "close"
  | "chevronLeft"
  | "logo"
  | "statusPending"
  | "statusSent"
  | "statusDelivered"
  | "statusRead"
  | "statusFailed";

const ICON_PATHS: Record<WhatsAppIconName, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  conversations: <path d="M21 11.5a8.4 8.4 0 0 1-11.8 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5z" />,
  contacts: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.8" />
      <path d="M21 20c0-2.4-1.4-4.2-3.6-4.8" />
    </>
  ),
  templates: (
    <>
      <path d="M6 3h8.5L18 6.5V21H6z" />
      <path d="M9 8.5h6M9 12.5h6M9 16.5h4" />
    </>
  ),
  quickReplies: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
  campaigns: <path d="M3 11l18-7-4 18-5-6-4 4z" />,
  automations: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="2.5" />
      <path d="M12 8V4M8.5 13.5h.01M15.5 13.5h.01M9.5 17h5" />
    </>
  ),
  phoneNumbers: (
    <path d="M4 5c0-1.1.9-2 2-2h2l1.5 4-2 1.5a12 12 0 0 0 6 6L15 12.5l4 1.5V18c0 1.1-.9 2-2 2A16 16 0 0 1 4 5z" />
  ),
  analytics: <path d="M4 20V10.5M10 20V4M16 20v-7.5M22 20H2" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 12c0-.45-.04-.88-.11-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.2-1.3L14.5 3.3h-4L10.2 5.5a7 7 0 0 0-2.2 1.3l-2.3-1-2 3.4 2 1.5c-.07.42-.11.85-.11 1.3s.04.88.11 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.2 1.3l.3 2.2h4l.3-2.2a7 7 0 0 0 2.2-1.3l2.3 1 2-3.4-2-1.5c.07-.42.11-.85.11-1.3z" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  logo: (
    <>
      <path d="M3 20.5l1.7-4.4A8.7 8.7 0 1 1 8.4 19L3 20.5z" />
      <path d="M8.6 10.4c.5 2.1 2.6 4.1 4.7 4.7" />
    </>
  ),
  // Delivery states. Each silhouette differs from the others at message-bubble size,
  // so the state survives greyscale, a colour-vision difference, and a dark bubble.
  statusPending: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.5 2" />
    </>
  ),
  statusSent: <path d="M4 13l4.5 4.5L19.5 6.5" />,
  statusDelivered: (
    <>
      <path d="M1.5 13l4 4L13.5 8.5" />
      <path d="M9 13l4 4L21.5 8.5" />
    </>
  ),
  statusRead: (
    <>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  statusFailed: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.75v4.75M12 16.25h.01" />
    </>
  ),
};

export function WhatsAppIcon({
  name,
  className = "h-[1.15rem] w-[1.15rem]",
}: {
  name: WhatsAppIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
