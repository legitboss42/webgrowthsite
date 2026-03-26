"use client";

import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";

const WHATSAPP_NUMBER = "2348066706336";
const WHATSAPP_MESSAGE = "Hello, I'd like to request a quote for a website.";

function buildWhatsAppUrl() {
  const text = encodeURIComponent(WHATSAPP_MESSAGE);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function Footer() {
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="text-white font-semibold">Web Growth</div>
            <p className="mt-3 text-white/60 leading-relaxed">
              We build fast, conversion-focused websites for businesses in Nigeria and
              international clients that need a credible launch without unnecessary
              complexity.
            </p>
          </div>

          <div className="md:justify-self-center">
            <div className="text-white font-semibold">Links</div>

            <div className="mt-3 flex flex-col gap-2 text-white/60">
              <Link className="hover:text-white transition" href="/launch">
                Website design in 48 hours
              </Link>
              <Link className="hover:text-white transition" href="/pricing">
                48-hour launch pricing
              </Link>
              <Link className="hover:text-white transition" href="/faq">
                Launch FAQ
              </Link>
              <Link className="hover:text-white transition" href="/services">
                Services
              </Link>
              <Link className="hover:text-white transition" href="/about">
                About
              </Link>
              <Link className="hover:text-white transition" href="/portfolio">
                Portfolio
              </Link>
              <Link className="hover:text-white transition" href="/blog">
                Blog
              </Link>
              <Link className="hover:text-white transition" href="/contact">
                Contact
              </Link>
            </div>
          </div>

          <div className="md:justify-self-end">
            <div className="text-white font-semibold">Contact</div>

            <div className="mt-3 space-y-2 text-white/60">
              <div>
                <span className="text-white/70">Email: </span>
                <a
                  className="hover:text-white transition"
                  href="mailto:admin@webgrowth.info"
                >
                  admin@webgrowth.info
                </a>
              </div>

              <div>
                <span className="text-white/70">WhatsApp: </span>
                <TrackedLink
                  className="hover:text-white transition"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  ctaName="whatsapp"
                  ctaLocation="footer"
                  destination="whatsapp"
                  pageType="sitewide_footer"
                >
                  Chat on WhatsApp
                </TrackedLink>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <div>(c) {new Date().getFullYear()} Web Growth. All rights reserved.</div>

          <div className="flex gap-4">
            <Link className="hover:text-white transition" href="/editorial-policy">
              Editorial Policy
            </Link>

            <Link className="hover:text-white transition" href="/privacy">
              Privacy Policy
            </Link>

            <Link className="hover:text-white transition" href="/terms">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
