import Link from "next/link";
import type { ReactNode } from "react";
import { WhatsAppIcon, type WhatsAppIconName } from "./icons";

type WorkspaceToolbarProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function WorkspaceToolbar({ eyebrow, title, description, actions }: WorkspaceToolbarProps) {
  return (
    <header className="wg-cw-workspace-toolbar">
      <div className="min-w-0">
        {eyebrow ? <p className="wg-cw-eyebrow">{eyebrow}</p> : null}
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="wg-cw-workspace-title">{title}</h1>
        </div>
        {description ? <p className="wg-cw-workspace-description">{description}</p> : null}
      </div>
      {actions ? <div className="wg-cw-workspace-actions">{actions}</div> : null}
    </header>
  );
}

type RailItem = {
  label: string;
  href: string;
  icon: WhatsAppIconName;
  note?: string;
  active?: boolean;
};

export function WorkspaceRail({ label, items, footer }: { label: string; items: RailItem[]; footer?: ReactNode }) {
  return (
    <aside className="wg-cw-section-rail">
      <p className="wg-cw-rail-label">{label}</p>
      <nav className="wg-cw-rail-nav" aria-label={label}>
        {items.map((item) => (
          <Link key={`${item.href}-${item.label}`} href={item.href} aria-current={item.active ? "page" : undefined} className="wg-cw-rail-link" data-active={item.active ? "true" : "false"}>
            <span className="wg-cw-rail-icon"><WhatsAppIcon name={item.icon} className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{item.label}</span>
              {item.note ? <span className="mt-0.5 block truncate text-[0.66rem] font-normal text-ink-faint">{item.note}</span> : null}
            </span>
          </Link>
        ))}
      </nav>
      {footer ? <div className="wg-cw-rail-footer">{footer}</div> : null}
    </aside>
  );
}

export function WorkspaceStat({ label, value, note, icon, tone = "default" }: { label: string; value: ReactNode; note?: string; icon?: WhatsAppIconName; tone?: "default" | "good" | "warn" | "bad" }) {
  return (
    <article className="wg-cw-stat" data-tone={tone}>
      <div className="min-w-0">
        <p className="wg-cw-stat-label">{label}</p>
        <p className="wg-cw-stat-value">{value}</p>
        {note ? <p className="wg-cw-stat-note">{note}</p> : null}
      </div>
      {icon ? <span className="wg-cw-stat-icon"><WhatsAppIcon name={icon} className="h-4 w-4" /></span> : null}
    </article>
  );
}

export function WorkspaceSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`wg-cw-surface ${className}`.trim()}>{children}</section>;
}

export function WorkspaceActionLink({ href, children, icon, primary = false }: { href: string; children: ReactNode; icon?: WhatsAppIconName; primary?: boolean }) {
  return (
    <Link href={href} className="wg-cw-action" data-primary={primary ? "true" : "false"}>
      {icon ? <WhatsAppIcon name={icon} className="h-4 w-4" /> : null}
      {children}
    </Link>
  );
}
