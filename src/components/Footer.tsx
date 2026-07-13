import Image from "next/image";
import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import { BUSINESS_PHONE_DISPLAY, CONTACT_EMAIL, CONTACT_EMAIL_HREF, buildWhatsAppUrl } from "@/lib/site";

const footerColumns = [
  {
    title: "Academy",
    links: [
      { href: "/blog/", label: "All Guides" },
      { href: "/blog/small-business-website-seo-checklist/", label: "SEO Guides" },
      { href: "/blog/how-to-build-a-small-business-website-that-converts/", label: "Website Strategy" },
      { href: "/blog/how-to-make-your-website-load-fast/", label: "Performance" },
      { href: "/blog/jluxe-medical-aesthetics-case-study/", label: "Case Study Lessons" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { href: "/tools/", label: "All Tools" },
      { href: "/tools/adsense-readiness-checker/", label: "AdSense Checker" },
      { href: "/tools/homepage-checklist/", label: "Homepage Checklist" },
      { href: "/tools/meta-description-generator/", label: "Meta Generator" },
      { href: "/tools/sitemap-validator/", label: "Sitemap Validator" },
      { href: "/tools/website-launch-checklist/", label: "Launch Checklist" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/services/", label: "Services" },
      { href: "/services/business-website-design/", label: "Business Websites" },
      { href: "/services/landing-page-design/", label: "Landing Pages" },
      { href: "/services/website-redesign/", label: "Website Redesign" },
      { href: "/services/ecommerce-website-design/", label: "eCommerce Websites" },
      { href: "/services/website-audit/", label: "Website Audit" },
      { href: "/services/search-engine-optimisation/", label: "SEO Setup" },
      { href: "/services/performance-optimisation/", label: "Speed Optimisation" },
      { href: "/portfolio/", label: "Case Studies" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about/", label: "About" },
      { href: "/victor-chinukwue/", label: "Founder" },
      { href: "/contact/", label: "Contact" },
      { href: "/pricing/", label: "Pricing" },
      { href: "/faq/", label: "FAQ" },
      { href: "/editorial-policy/", label: "Editorial Policy" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy/", label: "Privacy Policy" },
      { href: "/terms/", label: "Terms of Service" },
      { href: "/disclaimer/", label: "Disclaimer" },
    ],
  },
] as const;

export default function Footer() {
  const whatsappHref = buildWhatsAppUrl("Hello Web Growth, I would like to ask about a website project.");

  return (
    <footer className="border-t border-[var(--border-dark)] bg-[linear-gradient(180deg,var(--bg-ink)_0%,var(--bg-midnight)_100%)] text-[var(--text-primary)]">
      <div className="wg-shell-container py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_2.1fr]">
          <div>
            <Link
              href="/"
              aria-label="Web Growth home"
              className="inline-flex rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
            >
              <Image
                src="/images/brand/web-growth-logo.webp"
                alt="Web Growth"
                width={220}
                height={48}
                sizes="180px"
              quality={75}
                className="h-10 w-auto"
              />
            </Link>

            <p className="mt-5 max-w-sm font-display text-2xl font-medium leading-8 text-[var(--accent-electric)]">
              Build. Grow. Monetize.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--text-muted)]">
              Premium websites, practical Academy content, free tools, and growth systems for businesses that need credibility, traffic, leads, and revenue.
            </p>

            <div className="mt-6 space-y-2 text-sm text-[var(--text-muted)]">
              <p>
                <span className="font-semibold text-[var(--text-primary)]">Email:</span>{" "}
                <a
                  href={CONTACT_EMAIL_HREF}
                  className="text-[var(--accent-electric)] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <span className="font-semibold text-[var(--text-primary)]">Phone:</span>{" "}
                <span>{BUSINESS_PHONE_DISPLAY}</span>
              </p>
              <p>
                <span className="font-semibold text-[var(--text-primary)]">WhatsApp:</span>{" "}
                <TrackedLink
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  ctaName="whatsapp"
                  ctaLocation="footer"
                  destination="whatsapp"
                  pageType="sitewide_footer"
                  className="text-[var(--accent-electric)] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
                >
                  Chat on WhatsApp
                </TrackedLink>
              </p>
            </div>
          </div>

          <nav className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5" aria-label="Footer navigation">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-electric)]">
                  {column.title}
                </p>
                <div className="mt-4 grid gap-3 text-sm">
                  {column.links.map((item) => (
                    <Link
                      key={`${column.title}-${item.href}`}
                      href={item.href}
                      className="text-[var(--text-muted)] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
          <p>(c) {new Date().getFullYear()} Web Growth. All rights reserved.</p>
          <Link
            href="/contact/"
            className="inline-flex font-semibold text-[var(--accent-electric)] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
          >
            Work With Us -&gt;
          </Link>
        </div>
      </div>
    </footer>
  );
}
