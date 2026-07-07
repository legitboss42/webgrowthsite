import Image from "next/image";
import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, buildWhatsAppUrl } from "@/lib/site";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { href: "/services/", label: "Services" },
      { href: "/services/business-website-design/", label: "Business Websites" },
      { href: "/services/website-redesign/", label: "Website Redesign" },
      { href: "/services/landing-page-design/", label: "Landing Pages" },
      { href: "/services/ecommerce-website-design/", label: "Ecommerce Websites" },
      { href: "/services/website-audit/", label: "Website Audit" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about/", label: "About" },
      { href: "/contact/", label: "Contact" },
      { href: "/pricing/", label: "Pricing" },
      { href: "/blog/", label: "Academy" },
      { href: "/portfolio/", label: "Case Studies" },
      { href: "/tools/", label: "Tools" },
    ],
  },
  {
    title: "Growth Systems",
    links: [
      { href: "/services/analytics-tracking-setup/", label: "Analytics Setup" },
      { href: "/services/crm-system-setup-configuration/", label: "CRM Setup" },
      { href: "/services/booking-platform-setup-integration/", label: "Booking Integration" },
      { href: "/services/email-marketing-setup-strategy/", label: "Email Marketing" },
      { href: "/services/marketing-automation-build-implementation/", label: "Marketing Automation" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/services/google-my-business-setup-optimisation/", label: "Google Business Profile" },
      { href: "/services/domain-registration-hosting-guidance/", label: "Domain and Hosting" },
      { href: "/services/website-maintenance/", label: "Website Maintenance" },
      { href: "/tools/homepage-checklist/", label: "Homepage Checklist" },
      { href: "/tools/adsense-readiness-checker/", label: "AdSense Checker" },
      { href: "/tools/sitemap-validator/", label: "Sitemap Validator" },
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
      { href: "/contact/", label: "Support" },
    ],
  },
] as const;

export default function Footer() {
  const whatsappHref = buildWhatsAppUrl("Hello, I'd like to ask about a website project.");

  return (
    <footer className="border-t border-white/10 bg-[linear-gradient(180deg,#081226_0%,#091122_100%)] text-white">
      <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_2.05fr]">
          <div>
            <Link href="/" aria-label="Web Growth home" className="inline-flex">
              <Image
                src="/images/brand/web-growth-logo.webp"
                alt="Web Growth"
                width={220}
                height={48}
                sizes="180px"
                quality={60}
                className="h-10 w-auto"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Build. Grow. Monetize.
            </p>

            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>
                <span className="font-semibold text-white">Email:</span>{" "}
                <a
                  href={CONTACT_EMAIL_HREF}
                  className="text-blue-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <span className="font-semibold text-white">WhatsApp:</span>{" "}
                <TrackedLink
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  ctaName="whatsapp"
                  ctaLocation="footer"
                  destination="whatsapp"
                  pageType="sitewide_footer"
                  className="text-blue-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Chat on WhatsApp
                </TrackedLink>
              </p>
            </div>
          </div>

          <nav className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5" aria-label="Footer navigation">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  {column.title}
                </p>
                <div className="mt-4 grid gap-3 text-sm">
                  {column.links.map((item) => (
                    <Link
                      key={`${column.title}-${item.label}`}
                      href={item.href}
                      className="text-slate-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          <p>(c) {new Date().getFullYear()} Web Growth. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
