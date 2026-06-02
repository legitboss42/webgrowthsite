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
  { href: "/website-build/", label: "Website Build" },
  { href: "/services/", label: "Services" },
  { href: "/local-business/", label: "Local Business" },
  { href: "/ecommerce/", label: "Ecommerce" },
  { href: "/portfolio/", label: "Portfolio" },
  { href: "/blog/", label: "Blog" },
  { href: "/pricing/", label: "Pricing" },
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
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (item: NavItem) => {
    const href = normalize(item.href);

    if (activeRoute === href) return true;
    if (item.matchPaths?.some((path) => normalize(path) === activeRoute)) return true;
    if (href !== "/" && activeRoute.startsWith(`${href}/`)) return true;

    return false;
  };

  const shellClass = scrolled
    ? "mt-2 border border-white/10 bg-black/78 px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl"
    : "mt-4 border border-emerald-300/10 bg-black/38 px-5 py-4 shadow-[0_18px_52px_rgba(16,185,129,0.08)] backdrop-blur-xl";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-400/10 via-black/20 to-transparent" />

      <div className="mx-auto max-w-6xl px-6">
        <div
          className={[
            "flex items-center justify-between rounded-2xl transition-all duration-300",
            shellClass,
          ].join(" ")}
        >
          <Link href="/" className="flex items-center gap-3" aria-label="Web Growth home">
            <Image
              src="/images/brand/web-growth-logo.webp"
              alt="Web Growth"
              width={220}
              height={48}
              sizes="(max-width: 768px) 160px, 220px"
              quality={60}
              className={[
                "w-auto transition-all duration-300",
                scrolled ? "h-7 md:h-8" : "h-8 md:h-9",
              ].join(" ")}
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "relative text-sm transition-colors",
                    active ? "text-white" : "text-white/68 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                  <span
                    className={[
                      "absolute -bottom-2 left-0 h-[2px] rounded-full bg-emerald-400 transition-all duration-300",
                      active ? "w-full opacity-100" : "w-0 opacity-0",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/contact/"
              className="hidden min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600 md:inline-flex"
            >
              Request a Quote
            </Link>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/35 text-white/82 transition hover:border-white/20 hover:text-white md:hidden"
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
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
          />
          <div className="fixed inset-x-0 top-[86px] z-50 px-6 md:hidden">
            <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#060907]/95 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="flex flex-col gap-4">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "rounded-xl border px-4 py-3 text-sm font-medium transition",
                        active
                          ? "border-emerald-400/30 bg-emerald-500/10 text-white"
                          : "border-white/8 bg-black/25 text-white/78 hover:border-white/16 hover:text-white",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <Link
                  href="/contact/"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Request a Quote
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
