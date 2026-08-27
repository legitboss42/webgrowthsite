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
  // Composer controls.
  | "plus"
  | "smile"
  | "paperclip"
  | "microphone"
  | "send"
  | "trash"
  | "stop"
  | "reply"
  | "image"
  | "video"
  | "document"
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
  // Composer controls. Same 24×24 box and stroke weight as the navigation glyphs, so a
  // row of them lines up without per-icon nudging.
  plus: <path d="M12 5v14M5 12h14" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  paperclip: (
    <path d="M20.5 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />
  ),
  microphone: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M9 21h6" />
    </>
  ),
  // Filled so it reads as the one primary action in the composer even at 20px. The
  // per-element fill overrides the shared `fill="none"` on the <svg>.
  send: (
    <path
      fill="currentColor"
      stroke="none"
      d="M4.2 11.5 20 4.3a.62.62 0 0 1 .82.82L13.6 20.9a.62.62 0 0 1-1.14-.02l-2.6-6.24-6.24-2.6a.62.62 0 0 1-.02-1.14z"
    />
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </>
  ),
  // Reply: the arrow curls back on itself, the same shape WhatsApp uses on a quoted message.
  reply: (
    <>
      <path d="M9.5 6.5 4 12l5.5 5.5" />
      <path d="M4 12h9.5a6.5 6.5 0 0 1 6.5 6.5V20" />
    </>
  ),
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.75" cy="9.75" r="1.6" />
      <path d="M3.5 17l4.8-4.8a1.8 1.8 0 0 1 2.5 0L15 16.4l1.9-1.9a1.8 1.8 0 0 1 2.5 0l1.1 1.1" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="M15.5 11l5-3v8l-5-3z" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h7.5L18 7.5V21H6z" />
      <path d="M13.5 3v4.5H18" />
      <path d="M9 12.5h6M9 16.5h4" />
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
