import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, buildWhatsAppUrl } from "@/lib/site";

const footerLinks = [
  { href: "/launch/", label: "Launch" },
  { href: "/services/", label: "Services" },
  { href: "/about/", label: "About" },
  { href: "/portfolio/", label: "Portfolio" },
  { href: "/blog/", label: "Blog" },
  { href: "/pricing/", label: "Pricing" },
  { href: "/contact/", label: "Request a Website Review" },
];

const coreServiceLinks = [
  { href: "/services/business-website-design/", label: "Business Website Design" },
  { href: "/services/website-redesign/", label: "Website Redesign" },
  { href: "/services/landing-page-design/", label: "Landing Page Design" },
  { href: "/services/ecommerce-website-design/", label: "Ecommerce Website Design" },
  { href: "/services/website-audit/", label: "Website Audit" },
  { href: "/contact/", label: "Request a Website Review" },
];

export default function Footer() {
  const whatsappHref = buildWhatsAppUrl("Hello, I'd like to ask about a website project.");

  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-emerald-300/80">
              Web Growth
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white">
              Founder-led websites built to help businesses get more enquiries
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/62">
              Web Growth is run by Victor Chinukwue. The work is direct, mobile-first,
              and built for service businesses that want a site that feels sharper and
              easier to trust.
            </p>
          </div>

          <div className="md:justify-self-center">
            <p className="text-sm uppercase tracking-[0.18em] text-emerald-300/80">
              Links
            </p>
            <div className="mt-4 grid gap-2 text-sm text-white/64">
              {footerLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <p className="mt-8 text-sm uppercase tracking-[0.18em] text-emerald-300/80">
              Core services
            </p>
            <div className="mt-4 grid gap-2 text-sm text-white/64">
              {coreServiceLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:justify-self-end">
            <p className="text-sm uppercase tracking-[0.18em] text-emerald-300/80">
              Contact
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/64">
              <p>
                <span className="text-white/78">Email:</span>{" "}
                <a href={CONTACT_EMAIL_HREF} className="transition hover:text-white">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <span className="text-white/78">WhatsApp:</span>{" "}
                <TrackedLink
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  ctaName="whatsapp"
                  ctaLocation="footer"
                  destination="whatsapp"
                  pageType="sitewide_footer"
                  className="transition hover:text-white"
                >
                  Chat on WhatsApp
                </TrackedLink>
              </p>
              <p className="max-w-xs text-xs leading-6 text-white/48">
                Same-day replies in most cases. Best fit for service businesses,
                consultants, clinics, and premium local brands.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/48 md:flex-row md:items-center md:justify-between">
          <p>(c) {new Date().getFullYear()} Web Growth. All rights reserved.</p>

          <div className="flex flex-wrap gap-4">
            <Link href="/editorial-policy/" className="transition hover:text-white">
              Editorial Policy
            </Link>
            <Link href="/privacy/" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms/" className="transition hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
