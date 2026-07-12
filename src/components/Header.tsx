"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type NavLink = {
  href: string;
  label: string;
  matchPrefix?: string;
};

const primaryLinks: NavLink[] = [
  { href: "/blog/", label: "Academy", matchPrefix: "/blog" },
  { href: "/tools/", label: "Free Tools", matchPrefix: "/tools" },
  { href: "/services/", label: "Services", matchPrefix: "/services" },
  { href: "/portfolio/", label: "Case Studies", matchPrefix: "/portfolio" },
  { href: "/about/", label: "About", matchPrefix: "/about" },
];

const resourceLinks: NavLink[] = [
  { href: "/pricing/", label: "Pricing" },
  { href: "/faq/", label: "FAQ" },
  { href: "/editorial-policy/", label: "Editorial Policy" },
  { href: "/disclaimer/", label: "Disclaimer" },
];

const mobileLinks: Array<NavLink & { group?: string }> = [
  ...primaryLinks,
  ...resourceLinks.map((link) => ({ ...link, group: "Resources" })),
];

function normalize(path: string) {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
}

function isActivePath(pathname: string, item: NavLink) {
  const current = normalize(pathname);
  const href = normalize(item.href);
  const matchPrefix = item.matchPrefix ? normalize(item.matchPrefix) : href;

  if (current === href) return true;
  return matchPrefix !== "/" && current.startsWith(`${matchPrefix}/`);
}

export default function Header() {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  const activeRoute = useMemo(() => normalize(pathname), [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={[
          "border-b transition-all duration-300",
          scrolled
            ? "border-white/70 bg-white/88 shadow-[0_14px_38px_rgba(16,21,37,0.08)] backdrop-blur-2xl"
            : "border-white/45 bg-white/72 backdrop-blur-xl",
        ].join(" ")}
      >
        <div className="wg-shell-container flex min-h-[4.5rem] items-center justify-between gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
            aria-label="Web Growth home"
          >
            <Image
              src="/images/brand/web-growth-logo.webp"
              alt="Web Growth"
              width={220}
              height={48}
              sizes="(max-width: 768px) 150px, 186px"
              quality={75}
              className="h-8 w-auto md:h-9"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {primaryLinks.map((item) => {
              const active = isActivePath(activeRoute, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group relative rounded-md px-1 py-2 text-[13px] font-semibold text-[var(--text-ink)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]",
                    active ? "text-[var(--accent-blue-strong)]" : "hover:text-[var(--accent-blue-strong)]",
                  ].join(" ")}
                >
                  {item.label}
                  <span
                    className={[
                      "absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-[var(--accent-blue)] transition-all duration-200",
                      active ? "opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100",
                    ].join(" ")}
                  />
                </Link>
              );
            })}

            <div className="group relative">
              <button
                type="button"
                className="rounded-md px-1 py-2 text-[13px] font-semibold text-[var(--text-ink)] transition-colors hover:text-[var(--accent-blue-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
                aria-haspopup="true"
              >
                Resources
                <span aria-hidden="true" className="ml-1 text-[10px]">
                  v
                </span>
              </button>
              <div className="invisible absolute left-1/2 top-full w-56 -translate-x-1/2 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-white shadow-[var(--shadow-soft)]">
                  {resourceLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-3 text-sm font-medium text-[var(--text-soft)] transition hover:bg-[var(--bg-surface-soft)] hover:text-[var(--accent-blue-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--focus-ring)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-white text-[var(--text-ink)] transition hover:border-[var(--accent-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)] lg:hidden"
            >
              <span className="relative block h-4 w-5">
                <span
                  className={[
                    "absolute left-0 top-0 h-[2px] w-5 bg-current transition",
                    menuOpen ? "translate-y-[7px] rotate-45" : "",
                  ].join(" ")}
                />
                <span
                  className={[
                    "absolute left-0 top-[7px] h-[2px] w-5 bg-current transition",
                    menuOpen ? "opacity-0" : "opacity-100",
                  ].join(" ")}
                />
                <span
                  className={[
                    "absolute left-0 top-[14px] h-[2px] w-5 bg-current transition",
                    menuOpen ? "-translate-y-[7px] -rotate-45" : "",
                  ].join(" ")}
                />
              </span>
            </button>

            <Link
              href="/contact/"
              className="hidden min-h-11 items-center justify-center rounded-lg bg-[var(--accent-blue-strong)] px-5 text-sm font-bold text-white shadow-[var(--shadow-blue)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)] sm:inline-flex"
            >
              Work With Us <span aria-hidden="true" className="ml-2">-&gt;</span>
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close mobile menu overlay"
              className="fixed inset-0 z-40 bg-[var(--bg-ink)]/55 backdrop-blur-sm lg:hidden"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
            />
            <motion.div
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed inset-x-0 top-[4.75rem] z-50 px-4 lg:hidden"
              initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <nav
                aria-label="Mobile navigation"
                className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_26px_64px_rgba(16,21,37,0.18)]"
              >
                <div className="grid gap-1 p-3">
                  {mobileLinks.map((item) => {
                    const active = isActivePath(activeRoute, item);

                    return (
                      <Link
                        key={`${item.group ?? "primary"}-${item.href}`}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
                          active
                            ? "bg-[var(--accent-violet-soft)] text-[var(--accent-blue-strong)]"
                            : "text-[var(--text-ink)] hover:bg-[var(--bg-surface-soft)]",
                        ].join(" ")}
                      >
                        {item.group ? (
                          <span className="mr-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                            {item.group}
                          </span>
                        ) : null}
                        {item.label}
                      </Link>
                    );
                  })}

                  <Link
                    href="/contact/"
                    className="mt-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--accent-blue-strong)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-blue)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    Work With Us <span aria-hidden="true" className="ml-2">-&gt;</span>
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
