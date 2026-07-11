"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  matchPaths?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/services/", label: "Services" },
  { href: "/blog/", label: "Academy" },
  { href: "/tools/", label: "Tools" },
  { href: "/portfolio/", label: "Case Studies" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];

function normalize(path: string) {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const activeRoute = useMemo(() => normalize(pathname || "/"), [pathname]);

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

  const isActive = (item: NavItem) => {
    if (item.href.includes("#")) return false;
    const href = normalize(item.href);

    if (activeRoute === href) return true;
    if (item.matchPaths?.some((path) => normalize(path) === activeRoute)) return true;
    if (href !== "/" && activeRoute.startsWith(`${href}/`)) return true;

    return false;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent">
      <div
        className={[
          "transition-all duration-300",
          scrolled
            ? "border-b border-border-hairline bg-bg-ink/88 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.22)]"
            : "border-b border-border-hairline/70 bg-bg-ink/58 backdrop-blur-xl",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Web Growth home">
            <Image
              src="/images/brand/web-growth-logo.webp"
              alt="Web Growth"
              width={220}
              height={48}
              sizes="(max-width: 768px) 154px, 210px"
              quality={60}
              className="h-8 w-auto md:h-10"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group relative text-[15px] font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold",
                    active ? "text-accent-gold" : "text-text-muted hover:text-text-primary",
                  ].join(" ")}
                >
                  {item.label}
                  <span
                    className={[
                      "absolute -bottom-2 left-0 h-[2px] rounded-full bg-accent-gold transition-all duration-200",
                      active ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border-hairline bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted shadow-sm md:inline-flex">
              Platform-first
            </span>

            <Link
              href="/contact/"
              className="hidden min-h-11 items-center justify-center rounded-full bg-accent-gold px-6 text-sm font-bold text-bg-ink shadow-[0_16px_32px_rgba(232,163,61,0.18)] transition hover:bg-[#f1b75d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold md:inline-flex"
            >
              Start With a Website Review
            </Link>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border-hairline bg-white/[0.04] text-text-primary transition hover:border-accent-gold/55 hover:text-accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold md:hidden"
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
          </div>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close mobile menu overlay"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-bg-ink/70 backdrop-blur-sm md:hidden"
          />
          <div className="fixed inset-x-0 top-[78px] z-50 px-5 md:hidden">
            <div className="mx-auto max-w-6xl rounded-2xl border border-border-hairline bg-bg-ink p-4 shadow-[0_22px_60px_rgba(0,0,0,0.34)]">
              <div className="flex flex-col gap-3">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "rounded-xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold",
                        active
                          ? "border-accent-gold/55 bg-accent-gold/10 text-accent-gold"
                          : "border-border-hairline bg-white/[0.035] text-text-muted hover:border-accent-gold/45 hover:text-text-primary",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <Link
                  href="/contact/"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 inline-flex min-h-12 items-center justify-center rounded-full bg-accent-gold px-5 py-3 text-sm font-bold text-bg-ink shadow-[0_16px_32px_rgba(232,163,61,0.18)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
                >
                  Start With a Website Review
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
