"use client";

import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import { BOOKING_URL, buildWhatsAppUrl } from "@/lib/site";

const launchHref = "/launch";
const whatsappHref = buildWhatsAppUrl(
  "Hello, I want to ask about website design in 48 hours."
);

export default function BlogInlineCTA({
  compact = false,
  pageType = "content_page",
  ctaLocation = "content_inline",
  contentGroup,
  blogSlug,
  blogTitle,
  blogCategory,
}: {
  compact?: boolean;
  pageType?: string;
  ctaLocation?: string;
  contentGroup?: string;
  blogSlug?: string;
  blogTitle?: string;
  blogCategory?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-emerald-400/20 bg-emerald-500/10",
        compact ? "p-5" : "p-6",
      ].join(" ")}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">Launch offer</div>
      <h3 className={compact ? "mt-2 text-lg font-semibold text-white" : "mt-2 text-2xl font-semibold text-white"}>
        Need website design in 48 hours?
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/75">
        If you need a professional website live fast for Nigeria-based or international clients, the launch offer is built for that exact use case.
      </p>
      <p className="mt-3 text-sm leading-6 text-white/72">
        Explore the full service at{" "}
        <Link href="/launch" className="font-semibold text-emerald-200 hover:text-emerald-100">
          website design in 48 hours
        </Link>
        , see how to{" "}
        <Link href="/launch" className="font-semibold text-emerald-200 hover:text-emerald-100">
          launch your website in 48 hours
        </Link>
        , or review the{" "}
        <Link href="/launch" className="font-semibold text-emerald-200 hover:text-emerald-100">
          done-for-you website launch
        </Link>
        {" "}details.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <TrackedLink
          href={launchHref}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          ctaName="start_your_website"
          ctaLocation={ctaLocation}
          destination={launchHref}
          pageType={pageType}
          offerType="website_launch"
          contentGroup={contentGroup}
          blogSlug={blogSlug}
          blogTitle={blogTitle}
          blogCategory={blogCategory}
        >
          View Launch Offer
        </TrackedLink>
        <TrackedLink
          href={BOOKING_URL}
          target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
          rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/30 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
          ctaName="booking"
          ctaLocation={ctaLocation}
          destination="booking"
          pageType={pageType}
          offerType="consultation"
          contentGroup={contentGroup}
          blogSlug={blogSlug}
          blogTitle={blogTitle}
          blogCategory={blogCategory}
        >
          Book a Call
        </TrackedLink>
      </div>
      <div className="mt-3">
        <TrackedLink
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
          ctaName="whatsapp"
          ctaLocation={ctaLocation}
          destination="whatsapp"
          pageType={pageType}
          offerType="consultation"
          contentGroup={contentGroup}
          blogSlug={blogSlug}
          blogTitle={blogTitle}
          blogCategory={blogCategory}
        >
          Chat on WhatsApp
        </TrackedLink>
      </div>
    </div>
  );
}
