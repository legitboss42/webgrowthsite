import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/site";
import { IconBadge, MailIcon } from "./HomeIcons";
import SectionShell from "./SectionShell";

export default function NewsletterSection() {
  return (
    <SectionShell tone="canvas" spacing="compact">
      <div data-reveal className="border-t border-border-hairline pt-6">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="flex items-start gap-4">
            <IconBadge tone="purple" shape="circle" className="h-16 w-16 shrink-0 bg-accent-gold/10 text-accent-gold ring-1 ring-accent-gold/25">
              <MailIcon />
            </IconBadge>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">
                Stay ahead
              </p>
              <h2 className="font-display mt-2 text-2xl font-medium tracking-[-0.03em] text-text-primary">
                Growth insights. Delivered weekly.
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Actionable strategies on SEO, content, and monetization.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/contact/"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-gold px-6 text-sm font-bold text-bg-ink shadow-[0_16px_34px_rgba(232,163,61,0.18)] transition hover:bg-[#f1b75d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
            >
              Request updates
            </Link>
            <Link
              href={CONTACT_EMAIL_HREF}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-hairline bg-white/[0.04] px-6 text-sm font-semibold text-text-primary transition hover:border-accent-gold/55 hover:text-accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
            >
              Email {CONTACT_EMAIL}
            </Link>
            <p className="text-xs leading-6 text-text-muted sm:col-span-2">
              The newsletter backend is not live yet, so this section now points to
              honest working contact paths instead of a disabled signup form.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Link
            href="/blog/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-hairline bg-white/[0.04] px-5 text-sm font-semibold text-text-primary transition hover:border-accent-gold/55 hover:text-accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
          >
            Explore the Academy
          </Link>
          <Link
            href="/contact/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-hairline bg-white/[0.04] px-5 text-sm font-semibold text-text-primary transition hover:border-accent-gold/55 hover:text-accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
          >
            Request a Website Review
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
