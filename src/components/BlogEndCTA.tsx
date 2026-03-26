import TrackedLink from "@/components/analytics/TrackedLink";
import { BOOKING_URL, buildWhatsAppUrl } from "@/lib/site";

const whatsappHref = buildWhatsAppUrl(
  "Hello, I want to launch my business website in 48 hours."
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
    <div className="rounded-3xl border border-emerald-400/24 bg-[radial-gradient(circle_at_16%_-10%,rgba(16,185,129,0.22),rgba(3,14,11,0.94)_46%,rgba(2,8,7,0.98)_100%)] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/90">Ready to launch</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">
        Launch your website in 48 hours with a done-for-you setup
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74">
        If this article helped you clarify the next step, the launch offer gives you a
        mobile-first business website, domain guidance, hosting setup, and a clear CTA
        flow without dragging the project out.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <TrackedLink
          href="/launch"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          ctaName="start_your_website"
          ctaLocation="blog_end"
          destination="/launch"
          pageType="blog_post"
          offerType="website_launch"
          contentGroup="blog"
          blogSlug={blogSlug}
          blogTitle={blogTitle}
          blogCategory={blogCategory}
          trackView
        >
          View the 48-hour launch offer
        </TrackedLink>
        <TrackedLink
          href={BOOKING_URL}
          target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
          rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/30 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
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
        className="mt-4 inline-flex text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
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
