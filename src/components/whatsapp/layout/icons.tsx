import type { SVGProps } from "react";

/**
 * Inline icon set. The repository has no icon dependency and the brief forbids
 * adding one, so these are hand-written 24px stroke icons that inherit
 * `currentColor` and stay optically consistent at 16-20px.
 *
 * Icons are decorative here: every usage sits next to a text label or inside a
 * control that carries its own accessible name, so each renders
 * `aria-hidden="true"` and is excluded from the accessibility tree.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* Navigation ------------------------------------------------------------- */

export function OverviewIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Icon>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 11.5a8 8 0 0 1-11.7 7.08L4 19.8l1.28-4.66A8 8 0 1 1 20.5 11.5Z" />
      <path d="M8.8 11.5h6.4" />
      <path d="M8.8 8.6h4.3" />
    </Icon>
  );
}

export function ContactsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.6 20.4v-1.6a3.6 3.6 0 0 0-3.6-3.6H6.9a3.6 3.6 0 0 0-3.6 3.6v1.6" />
      <circle cx="9.45" cy="7.8" r="3.4" />
      <path d="M20.7 20.4v-1.6a3.6 3.6 0 0 0-2.7-3.48" />
      <path d="M15.9 4.6a3.4 3.4 0 0 1 0 6.44" />
    </Icon>
  );
}

export function TemplateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.3" y="3.8" width="17.4" height="16.4" rx="2.2" />
      <path d="M3.3 9h17.4" />
      <path d="M7.4 12.6h6.6" />
      <path d="M7.4 16.2h9.2" />
    </Icon>
  );
}

export function QuickReplyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.4 2.8 4.6 13.6h5.1l-1.1 7.6 8.8-10.8h-5.1l1.1-7.6Z" />
    </Icon>
  );
}

export function CampaignIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.6 9.6v4.8a1 1 0 0 0 1 1h2.6l5.9 4.2V4.4L7.2 8.6H4.6a1 1 0 0 0-1 1Z" />
      <path d="M17 8.4a5.1 5.1 0 0 1 0 7.2" />
      <path d="M19.8 5.6a9 9 0 0 1 0 12.8" />
    </Icon>
  );
}

export function AutomationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8.6" y="2.9" width="6.8" height="4.6" rx="1.4" />
      <rect x="2.6" y="16.5" width="6.8" height="4.6" rx="1.4" />
      <rect x="14.6" y="16.5" width="6.8" height="4.6" rx="1.4" />
      <path d="M12 7.5v3.6" />
      <path d="M6 16.5v-2.1a1.3 1.3 0 0 1 1.3-1.3h9.4a1.3 1.3 0 0 1 1.3 1.3v2.1" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.6" />
      <path d="M10.6 18.4h2.8" />
      <path d="M10.2 5.8h3.6" />
    </Icon>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20.2V4.4" />
      <path d="M4 20.2h16" />
      <path d="M8 16.6V12" />
      <path d="M12.4 16.6V7.8" />
      <path d="M16.8 16.6v-5.6" />
    </Icon>
  );
}

export function WebhookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="6.6" r="3" />
      <circle cx="6" cy="17.4" r="3" />
      <circle cx="18" cy="17.4" r="3" />
      <path d="M10.5 9.2 7.4 14.7" />
      <path d="M9 17.4h6" />
      <path d="M13.5 9.2l3.1 5.5" />
    </Icon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="2.9" />
      <path d="M12 2.8v2.2M12 19v2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M2.8 12H5M19 12h2.2M5.5 18.5l1.6-1.6M16.9 7.1l1.6-1.6" />
    </Icon>
  );
}

/* Interface -------------------------------------------------------------- */

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="M15.6 15.6 20.4 20.4" />
    </Icon>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.6 3.4 10.9 13.1" />
      <path d="M20.6 3.4 14.4 20.8l-3.5-7.7-7.7-3.5Z" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.8 12.6 9.4 17.2 19.2 7.4" />
    </Icon>
  );
}

/** Two overlapping ticks, the conventional delivered/read marker. */
export function DoubleCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.4 12.8 6.2 16.6 13.4 9.4" />
      <path d="M10 16.6 10.8 17.4 21.6 6.6" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3 1.9" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 8.2v4.4" />
      <path d="M12 15.8h.01" />
    </Icon>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.2 3.4H6.6a2 2 0 0 0-2 2v13.2a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2V8.4Z" />
      <path d="M14.2 3.4v5h5.2" />
      <path d="M8.4 13.2h7.2M8.4 16.6h4.8" />
    </Icon>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="5.4" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="12" cy="18.6" r="1.3" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.4 5.6 15.8 12l-6.4 6.4" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.6 9.4 12 15.8l6.4-6.4" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5" />
      <path d="M11.4 5.4 4.8 12l6.6 6.6" />
    </Icon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" />
      <path d="M8.6 7H17v8.4" />
    </Icon>
  );
}

export function ArrowDownRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 7l10 10" />
      <path d="M17 8.6V17H8.6" />
    </Icon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 12h12" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5.4v13.2M5.4 12h13.2" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11.2v4.6" />
      <path d="M12 8.3h.01" />
    </Icon>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.2 13.4 13.4 20.2a1.7 1.7 0 0 1-2.4 0l-7.2-7.2V3.8h9.2l7.2 7.2a1.7 1.7 0 0 1 0 2.4Z" />
      <path d="M7.6 7.6h.01" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.8" y="10.6" width="14.4" height="9.6" rx="2" />
      <path d="M8.4 10.6V7.8a3.6 3.6 0 0 1 7.2 0v2.8" />
    </Icon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.2 11.4a8.2 8.2 0 0 0-14-4.6L3.8 9.2" />
      <path d="M3.8 4.6v4.6h4.6" />
      <path d="M3.8 12.6a8.2 8.2 0 0 0 14 4.6l2.4-2.4" />
      <path d="M20.2 19.4v-4.6h-4.6" />
    </Icon>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9.4" y="2.8" width="5.2" height="10.4" rx="2.6" />
      <path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0" />
      <path d="M12 17.6v3.6" />
    </Icon>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.2" />
      <circle cx="8.8" cy="9.8" r="1.6" />
      <path d="M3.4 16.4 8.6 12l4.2 3.4 3-2.4 4.8 3.8" />
    </Icon>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.8 3.2H7a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.4Z" />
      <path d="M13.8 3.2v5.2H19" />
    </Icon>
  );
}

export function VideoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.8" y="6" width="12.6" height="12" rx="2.2" />
      <path d="M15.4 10.6 21.2 7.4v9.2l-5.8-3.2Z" />
    </Icon>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 10.4c0 5.2-7 10.8-7 10.8s-7-5.6-7-10.8a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </Icon>
  );
}

/**
 * Channel mark for the connected account block. A speech bubble with a handset,
 * drawn in the same stroke language as the rest of the set rather than lifted
 * from Meta's brand assets, which we have no licence to reproduce.
 */
export function WhatsAppGlyphIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.44L3.6 20.4l1.38-4.5A8.4 8.4 0 1 1 20.5 11.6Z" />
      <path d="M9.3 8.7c-.3 0-.6.14-.8.4-.28.36-.5.86-.4 1.5.18 1.2.92 2.3 1.72 3.1.8.8 1.9 1.54 3.1 1.72.64.1 1.14-.12 1.5-.4a1 1 0 0 0 .4-.8l-.06-.7-1.6-.72-.86.86c-.9-.4-1.98-1.48-2.38-2.38l.86-.86-.72-1.6Z" />
    </Icon>
  );
}
