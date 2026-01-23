"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="text-white font-semibold">Web Growth</div>
            <p className="mt-3 text-white/60 leading-relaxed">
              We design professional websites focused on real results — clarity,
              usability, and performance.
            </p>
          </div>

          {/* Links */}
          <div className="md:justify-self-center">
            <div className="text-white font-semibold">Links</div>
            <div className="mt-3 flex flex-col gap-2 text-white/60">
              <Link className="hover:text-white transition" href="/services">
                Services
              </Link>
              <Link className="hover:text-white transition" href="/about">
                About
              </Link>
              <Link className="hover:text-white transition" href="/portfolio">
                Portfolio
              </Link>
              <Link className="hover:text-white transition" href="/contact">
                Contact
              </Link>
              <Link className="hover:text-white transition" href="/pricing">
                Pricing
              </Link>
            </div>
          </div>

          {/* Contact */}
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
                <a
                  className="hover:text-white transition"
                  href="https://wa.me/2348066706336"
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} Web Growth. All rights reserved.
          </div>
          <div className="flex gap-4">
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