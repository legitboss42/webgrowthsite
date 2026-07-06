"use client";

import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import { buildWhatsAppUrl } from "@/lib/site";

const reviewHref = "/contact/";
const whatsappHref = buildWhatsAppUrl(
  "Hello, I want to ask about a website review and the right next step for my website."
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
        "rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9ff_100%)] shadow-[0_20px_50px_rgba(15,23,42,0.06)]",
        compact ? "p-5" : "p-6",
      ].join(" ")}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-blue-700">Implementation support</div>
      <h3 className={compact ? "mt-2 text-lg font-semibold text-slate-950" : "mt-2 text-2xl font-semibold text-slate-950"}>
        Need help turning the strategy into a stronger website?
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        If this article helped you spot the real issue, the next step is a website review, service recommendation, or direct implementation plan.
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Start with a{" "}
        <Link href="/contact/" className="font-semibold text-blue-700 hover:text-blue-800">
          Website Review
        </Link>
        , explore the{" "}
        <Link href="/services/" className="font-semibold text-blue-700 hover:text-blue-800">
          full service lineup
        </Link>
        , or keep learning inside the Academy before you commit.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <TrackedLink
          href={reviewHref}
          className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          ctaName="website_review"
          ctaLocation={ctaLocation}
          destination={reviewHref}
          pageType={pageType}
          offerType="website_review"
          contentGroup={contentGroup}
          blogSlug={blogSlug}
          blogTitle={blogTitle}
          blogCategory={blogCategory}
        >
          Start With a Website Review
        </TrackedLink>
        <TrackedLink
          href="/services/"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          ctaName="view_services"
          ctaLocation={ctaLocation}
          destination="/services/"
          pageType={pageType}
          offerType="services"
          contentGroup={contentGroup}
          blogSlug={blogSlug}
          blogTitle={blogTitle}
          blogCategory={blogCategory}
        >
          View Services
        </TrackedLink>
      </div>
      <div className="mt-3">
        <TrackedLink
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
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
