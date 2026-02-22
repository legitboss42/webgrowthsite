"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type NavKey = "services" | "about" | "portfolio" | "contact";

const HOME_SECTIONS: NavKey[] = ["services", "about", "portfolio", "contact"];

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavKey | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Scroll lock when mobile menu open
  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Header blend + shrink: transparent at top, solid + tighter after scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section highlight on HOME only
  useEffect(() => {
    if (!isHome) return;

    const els = HOME_SECTIONS.map((id) => document.getElementById(id)).filter(
      Boolean
    ) as HTMLElement[];

    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0)
          )[0];

        if (!visible?.target?.id) return;
        setActiveSection(visible.target.id as NavKey);
      },
      {
        root: null,
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.1, 0.2, 0.35, 0.5, 0.65],
      }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  const activeRoute = useMemo(() => {
    const p = (pathname || "/").replace(/\/+$/, "") || "/";
    return p;
  }, [pathname]);

  const isActive = (href: string, section?: NavKey) => {
    if (isHome && section) return activeSection === section;
    const h = href.replace(/\/+$/, "") || "/";
    return activeRoute === h;
  };

  const NavLink = ({
    href,
    label,
    section,
    onClick,
  }: {
    href: string;
    label: string;
    section?: NavKey;
    onClick?: () => void;
  }) => {
    const active = isActive(href, section);

    return (
      <Link
        href={href}
        onClick={onClick}
        className={[
          "transition",
          "text-sm",
          active ? "text-white" : "text-white/70 hover:text-white",
          active ? "relative" : "",
        ].join(" ")}
      >
        <span className="relative">
          {label}
          {active && (
            <span className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-emerald-400/80" />
          )}
        </span>
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Soft hero melt only at top */}
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-24 transition-opacity duration-300",
          scrolled ? "opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <div className="h-full bg-gradient-to-b from-emerald-500/10 via-black/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* SHRINK happens here: mt + padding changes */}
        <div
          className={[
            "flex items-center justify-between rounded-xl backdrop-blur",
            "transition-all duration-300",
            scrolled ? "mt-2 px-5 py-3" : "mt-4 px-5 py-4",
            scrolled
              ? "border border-white/10 bg-black/75 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
              : "border border-white/5 bg-black/25 shadow-[0_18px_60px_rgba(16,185,129,0.08)]",
          ].join(" ")}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/brand/web-growth-logo.webp"
              alt="Web Growth"
              width={220}
              height={48}
              sizes="(max-width: 768px) 160px, 220px"
              quality={60}
              className={["w-auto transition-all duration-300", scrolled ? "h-7 md:h-8" : "h-8 md:h-9"].join(" ")}
              style={{
                filter: "saturate(1.15) contrast(1.05) brightness(1.05)",
                opacity: 0.95,
              }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="/services" label="Services" />
            <NavLink href="/about" label="About" />
            <NavLink href="/portfolio" label="Portfolio" />
            <NavLink href="/blog" label="Blog" />
            <NavLink href="/pricing" label="Pricing" />
            <NavLink href="/contact" label="Contact" />
          </nav>

          {/* Right: CTA + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className={[
                "hidden md:inline-flex items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition",
                scrolled ? "py-2 bg-emerald-700 hover:bg-emerald-600" : "py-2.5 bg-emerald-700/95 hover:bg-emerald-600",
              ].join(" ")}
            >
              Request a Quote
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className={[
                "md:hidden inline-flex items-center justify-center rounded-lg border text-white/80 hover:text-white transition",
                scrolled ? "h-9 w-9 border-white/10 bg-black/55" : "h-10 w-10 border-white/10 bg-black/30",
              ].join(" ")}
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

      {/* Mobile Menu */}
      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />

          <div className="fixed top-[88px] left-0 right-0 z-50 md:hidden">
            <div className="mx-auto max-w-6xl px-6">
              <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur p-5">
                <div className="flex flex-col gap-4">
                  <NavLink
                    href="/services"
                    label="Services"
                    onClick={() => setMenuOpen(false)}
                  />
                  <NavLink
                    href="/about"
                    label="About"
                    onClick={() => setMenuOpen(false)}
                  />
                  <NavLink
                    href="/portfolio"
                    label="Portfolio"
                    onClick={() => setMenuOpen(false)}
                  />
                  <NavLink
                    href="/blog"
                    label="Blog"
                    onClick={() => setMenuOpen(false)}
                  />
                  <NavLink
                    href="/pricing"
                    label="Pricing"
                    onClick={() => setMenuOpen(false)}
                  />
                  <NavLink
                    href="/contact"
                    label="Contact"
                    onClick={() => setMenuOpen(false)}
                  />

                  <Link
                    href="/contact"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Request a Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
