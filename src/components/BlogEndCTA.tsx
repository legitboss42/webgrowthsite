import TrackedLink from "@/components/analytics/TrackedLink";
import { BOOKING_URL, buildWhatsAppUrl } from "@/lib/site";

const whatsappHref = buildWhatsAppUrl(
  "Hello, I want help reviewing and improving my website."
);

export default function BlogEndCTA({
  blogSlug,
  blogTitle,
  blogCategory,
}: {
  blogSlug?: string;
  blogTitle?: string;
  blogCategory?: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(79,107,255,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(124,92,255,0.1),transparent_30%),#ffffff] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <p className="text-xs uppercase tracking-[0.2em] text-blue-700">Need implementation support?</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
        Turn the strategy into a sharper website, stronger SEO, and clearer conversion paths.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        If this guide clarified the next move, Web Growth can help you translate it into a
        better website build, redesign, audit, or conversion-focused improvement plan.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <TrackedLink
          href="/contact/"
          className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f6bff_0%,#7c5cff_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(79,107,255,0.22)] transition hover:brightness-105"
          ctaName="website_review"
          ctaLocation="blog_end"
          destination="/contact/"
          pageType="blog_post"
          offerType="website_review"
          contentGroup="blog"
          blogSlug={blogSlug}
          blogTitle={blogTitle}
          blogCategory={blogCategory}
          trackView
        >
          Start With a Website Review
        </TrackedLink>
        <TrackedLink
          href={BOOKING_URL}
          target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
          rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:text-blue-700"
          ctaName="booking"
          ctaLocation="blog_end"
          destination="booking"
          pageType="blog_post"
          offerType="consultation"
          contentGroup="blog"
          blogSlug={blogSlug}
          blogTitle={blogTitle}
          blogCategory={blogCategory}
        >
          Book a Call
        </TrackedLink>
      </div>

      <TrackedLink
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex text-sm font-semibold text-blue-700 transition hover:text-blue-900"
        ctaName="whatsapp"
        ctaLocation="blog_end"
        destination="whatsapp"
        pageType="blog_post"
        offerType="consultation"
        contentGroup="blog"
        blogSlug={blogSlug}
        blogTitle={blogTitle}
        blogCategory={blogCategory}
      >
        Chat on WhatsApp
      </TrackedLink>
    </div>
  );
}
