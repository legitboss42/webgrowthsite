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

  // Close menu on route change (prevents stuck open menu)
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Scroll lock (mobile menu open => body cannot scroll)
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

  // Active section highlight on HOME only
  useEffect(() => {
    if (!isHome) return;

    const els = HOME_SECTIONS
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!visible?.target?.id) return;
        setActiveSection(visible.target.id as NavKey);
      },
      {
        // tweak for your fixed header: the section becomes "active" a bit earlier
        root: null,
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.1, 0.2, 0.35, 0.5, 0.65],
      }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  // Active nav for non-home pages
  const activeRoute = useMemo(() => {
    // normalize in case of trailing slashes
    const p = (pathname || "/").replace(/\/+$/, "") || "/";
    return p;
  }, [pathname]);

  const isActive = (href: string, section?: NavKey) => {
    // If we are on HOME, highlight section based on scroll position
    if (isHome && section) return activeSection === section;

    // Otherwise highlight based on route
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

  // For sections: if you're NOT on home, go to "/#section"
  const sectionHref = (id: NavKey) => (isHome ? `/#${id}` : `/#${id}`);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-5 py-4 backdrop-blur">
          {/* Logo => Home */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/brand/web-growth-logo.png"
              alt="Web Growth"
              width={220}
              height={48}
              priority
              className="h-8 w-auto md:h-9"
              // Blend the gold into your site palette (subtle, not messy)
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
            <NavLink href="/pricing" label="Pricing" />
            <NavLink href="/contact" label="Contact" />
          </nav>

          {/* Right side: CTA + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Request a Quote
            </Link>

            {/* Hamburger (mobile) */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-white/80 hover:text-white transition"
            >
              {/* Simple icon */}
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

      {/* Mobile Menu Panel */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />

          {/* Drawer */}
          <div className="fixed top-[88px] left-0 right-0 z-50 md:hidden">
            <div className="mx-auto max-w-6xl px-6">
              <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur p-5">
                <div className="flex flex-col gap-4">
                  <NavLink href="/services" label="Services" onClick={() => setMenuOpen(false)} />
                  <NavLink href="/about" label="About" onClick={() => setMenuOpen(false)} />
                  <NavLink href="/portfolio" label="Portfolio" onClick={() => setMenuOpen(false)} />
                  <NavLink href="/pricing" label="Pricing" onClick={() => setMenuOpen(false)} />
                  <NavLink href="/contact" label="Contact" onClick={() => setMenuOpen(false)} />

                  <Link
                    href="/contact"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
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