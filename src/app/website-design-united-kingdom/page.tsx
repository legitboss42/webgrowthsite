import Link from "next/link";
import AnswerHighlightsSection from "@/components/AnswerHighlightsSection";
import CorePageLinks from "@/components/CorePageLinks";
import CTASection from "@/components/CTASection";
import SectionHeading from "@/components/SectionHeading";
import StructuredData from "@/components/StructuredData";
import {
  buildFaqSchema,
  buildPageMetadata,
  buildProfessionalServiceSchema,
} from "@/lib/seo";

const pageDescription =
  "Remote web design for UK service businesses, backed by real client work for a London clinic.";

const buyerAnswers = [
  {
    title: "Why keep a UK page at all?",
    answer:
      "Because there is real UK client work behind it. J Luxe Medical Aesthetics in London is the clearest example, so this page is here to show the kind of work I can do.",
    href: "/blog/jluxe-medical-aesthetics-case-study",
    hrefLabel: "See the J Luxe case study",
  },
  {
    title: "Can a remote partner still handle a UK website project well?",
    answer:
      "Yes. If the communication is clear and the job is handled properly, remote work is not the problem. Poor work is.",
    href: "/launch",
    hrefLabel: "See the launch offer",
  },
  {
    title: "What should a strong UK service-business website improve first?",
    answer:
      "Usually the same things: clearer messaging, stronger proof, better mobile pages, and an easier way for people to get in touch.",
    href: "/blog/why-your-website-isnt-getting-leads",
    hrefLabel: "See what hurts conversions",
  },
  {
    title: "What if the business needs more than one landing page?",
    answer:
      "That is fine. We can start with the main page or pages first, then build it out if the business needs more.",
    href: "/services/website-redesign",
    hrefLabel: "See redesign support",
  },
] as const;

const faqs = [
  {
    question: "What type of UK businesses fit this service?",
    answer:
      "Usually clinics, consultants, agencies, specialists, and service businesses that know the current site is not doing enough.",
  },
  {
    question: "Is this page based on real UK work?",
    answer:
      "Yes. J Luxe Medical Aesthetics in London is the clearest public UK example and should be the proof anchor for this page.",
  },
  {
    question: "Why would a UK business use a remote web design partner?",
    answer:
      "Because clear communication and good execution matter more than where the designer is sitting.",
  },
  {
    question: "Should this page stay indexed if there is only one UK example?",
    answer:
      "Yes, but only if the page stays honest. One real UK project supports a modest claim. It does not justify pretending to dominate the whole market.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Remote Web Design for UK Service Businesses | Web Growth",
  description: pageDescription,
  path: "/website-design-united-kingdom",
  keywords: [
    "website design uk",
    "web designer uk",
    "remote web design uk",
    "service business website uk",
    "clinic website design london",
  ],
  image: "/images/portfolio/jluxe-mockup.webp",
});

const ukServiceSchema = {
  ...buildProfessionalServiceSchema("/website-design-united-kingdom", pageDescription),
  areaServed: [
    {
      "@type": "Country",
      name: "United Kingdom",
    },
  ],
};

export default function WebsiteDesignUnitedKingdomPage() {
  return (
    <>
      <StructuredData data={ukServiceSchema} />
      <StructuredData data={buildFaqSchema(faqs)} />

      <main className="bg-black text-white">
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <div className="text-sm tracking-[0.25em] text-white/50">
                  UK CLIENT WORK
                </div>
                <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                  Remote web design for UK service businesses, backed by real client work
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-white/70">
                  This page is here because there is real UK work behind it.
                  J Luxe Medical Aesthetics in London is the main example. If
                  your site feels dated, unclear, or weak on mobile, I can help
                  you clean it up and make it easier for people to trust.
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
                  <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                    Real UK clinic project
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                    Remote delivery
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">
                    Direct contact
                  </span>
                </div>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/contact?service=Website Design United Kingdom"
                    className="rounded-md bg-emerald-600 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Request a Quote
                  </a>
                  <Link
                    href="/blog/jluxe-medical-aesthetics-case-study"
                    className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-center text-sm font-semibold text-white/90 transition hover:bg-black/50"
                  >
                    See UK Case Study
                  </Link>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div
                  className="h-[360px] bg-cover bg-center opacity-80"
                  style={{ backgroundImage: "url(/images/portfolio/jluxe-mockup.webp)" }}
                />
                <div className="absolute inset-0 bg-black/35" />
              </div>
            </div>
          </div>
        </section>

        <AnswerHighlightsSection
          eyebrow="Quick answers"
          title="What UK businesses usually need clarified before hiring a remote web designer"
          description="These are the main questions people ask before hiring someone remote."
          items={buyerAnswers}
        />

        <section className="bg-gray-950 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="PROOF"
              title="The UK project behind this page"
              description="J Luxe is the reason this page exists. One real project says more than a pile of vague claims."
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div
                  className="h-[320px] bg-cover bg-center"
                  style={{ backgroundImage: "url(/images/portfolio/jluxe-mockup.webp)" }}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-7">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/85">
                  J Luxe Medical Aesthetics
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  London clinic website rebuild
                </h2>
                <p className="mt-4 leading-relaxed text-white/70">
                  The brief was simple: make the clinic look more trustworthy,
                  make the treatment pages easier to follow, and improve the
                  overall first impression.
                </p>

                <ul className="mt-6 space-y-3 text-sm leading-7 text-white/74">
                  <li className="flex gap-3">
                    <span className="mt-[11px] h-2 w-2 rounded-full bg-emerald-400/80" />
                    <span>A cleaner clinic presentation that feels more considered</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-[11px] h-2 w-2 rounded-full bg-emerald-400/80" />
                    <span>Treatment pages that are easier to follow</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-[11px] h-2 w-2 rounded-full bg-emerald-400/80" />
                    <span>A clearer path to contact and booking</span>
                  </li>
                </ul>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="https://www.jluxemedicalaesthetics.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    View Live Site
                  </a>
                  <Link
                    href="/blog/jluxe-medical-aesthetics-case-study"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                  >
                    Read Case Study
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="OUTCOMES"
              title="What a better website should fix first"
              description="A stronger website should make the business easier to understand, easier to trust, and easier to contact."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  "Clearer message",
                  "People should understand what the business does without digging through the page.",
                ],
                [
                  "More trust",
                  "The site should feel more reassuring, especially for someone landing on it for the first time.",
                ],
                [
                  "Better mobile experience",
                  "The site should feel clean, quick, and easy to use on the phones where a lot of first visits happen.",
                ],
                [
                  "Easier next step",
                  "People should know how to enquire or book without having to think about it.",
                ],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-black/40 p-7"
                >
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="mt-3 text-white/65">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-950 py-24">
          <div className="mx-auto max-w-4xl px-6">
            <SectionHeading
              eyebrow="FAQ"
              title="Common questions about UK website projects"
              description="Quick answers before you request a quote."
            />

            <div className="mt-10 space-y-4">
              {faqs.map((item) => (
                <div
                  key={item.question}
                  className="rounded-2xl border border-white/10 bg-black/40 p-6"
                >
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-3 leading-relaxed text-white/70">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <CorePageLinks
              eyebrow="Useful next steps"
              title="Use the next page that best matches the project scope"
              description="These pages connect the UK proof story to redesign, launch scope, pricing, and direct contact."
              links={[
                {
                  href: "/services/website-redesign",
                  label: "Redesign",
                  title: "Need a broader website redesign first?",
                  description:
                    "Use the redesign service if the current website is outdated, generic, or underperforming.",
                },
                {
                  href: "/launch",
                  label: "Launch",
                  title: "Need a faster entry point first?",
                  description:
                    "Use the launch offer if the business needs a cleaner website live quickly before expanding the scope.",
                },
                {
                  href: "/pricing",
                  label: "Pricing",
                  title: "Need to compare launch scope first?",
                  description:
                    "Review pricing if you want the fast-entry option before starting the conversation.",
                },
              ]}
            />

            <div className="mt-14">
              <CTASection
                eyebrow="READY"
                title="Need a UK business website that feels better than what you have now?"
                description="If the current site feels vague, slow, or hard to trust, I can help you clean it up and make it easier for people to act."
                primaryCtaText="Request a Quote"
                primaryHref="/contact?service=Website Design United Kingdom"
                secondaryCtaText="See UK Case Study"
                secondaryHref="/blog/jluxe-medical-aesthetics-case-study"
                imageUrl="/images/portfolio/jluxe-mockup.webp"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
