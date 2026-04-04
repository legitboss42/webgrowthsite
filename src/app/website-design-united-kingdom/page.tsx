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
  "Website design for United Kingdom service businesses that need a fast, credible, conversion-focused website and a remote web design partner who can deliver without agency drag.";

const buyerAnswers = [
  {
    title: "Who is this UK website design page for?",
    answer:
      "It is built for United Kingdom service businesses, consultants, clinics, agencies, and lean teams that need a stronger website to support trust, enquiries, and cleaner conversion flow.",
    href: "/contact?service=Website Design United Kingdom",
    hrefLabel: "Discuss your project",
  },
  {
    title: "Can this work if you are not physically based in the UK?",
    answer:
      "Yes. The page targets United Kingdom search intent, but the delivery model is remote and built for businesses that want speed, clarity, and direct communication.",
    href: "/launch",
    hrefLabel: "See the launch offer",
  },
  {
    title: "What should a strong UK business website improve first?",
    answer:
      "The first gains usually come from clearer positioning, stronger trust signals, better mobile experience, and a more obvious next step for serious buyers.",
    href: "/blog/why-your-website-isnt-getting-leads",
    hrefLabel: "See what hurts conversions",
  },
  {
    title: "What if the business needs more than one page?",
    answer:
      "That is fine. The project can start with a focused launch or move into redesign, service pages, and broader SEO support if the scope needs it.",
    href: "/services/website-redesign",
    hrefLabel: "See redesign support",
  },
] as const;

const faqs = [
  {
    question: "What type of UK businesses fit this service?",
    answer:
      "Consultants, agencies, clinics, specialists, and service businesses that need a clearer online presence and more qualified enquiries are usually a strong fit.",
  },
  {
    question: "Is this only for London businesses?",
    answer:
      "No. The page targets broader United Kingdom intent, so it can support businesses serving London or wider UK markets.",
  },
  {
    question: "Why would a UK business use a remote web design partner?",
    answer:
      "Because speed, clarity, and commercial focus often matter more than physical proximity, especially when the workflow is simple and the deliverables are clear.",
  },
  {
    question: "Can this support SEO and lead generation too?",
    answer:
      "Yes. The strongest websites support both search visibility and conversion quality, not just visual presentation.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Design United Kingdom | Fast Websites for UK Service Businesses",
  description: pageDescription,
  path: "/website-design-united-kingdom",
  keywords: [
    "website design united kingdom",
    "web designer united kingdom",
    "website design uk",
    "web designer uk",
    "business website design uk",
  ],
  image: "/images/services/services-business.webp",
});

export default function WebsiteDesignUnitedKingdomPage() {
  return (
    <>
      <StructuredData
        data={buildProfessionalServiceSchema(
          "/website-design-united-kingdom",
          pageDescription
        )}
      />
      <StructuredData data={buildFaqSchema(faqs)} />

      <main className="bg-black text-white">
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <div className="text-sm tracking-[0.25em] text-white/50">
                  WEBSITE DESIGN UNITED KINGDOM
                </div>
                <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                  Website design for United Kingdom businesses that need trust, clarity, and faster lead flow
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-white/70">
                  If you need website design in the United Kingdom, the website
                  should make the business easier to understand, easier to trust,
                  and easier to contact. The goal is not agency theatre. The goal
                  is a faster, conversion-focused website that supports real
                  commercial action.
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/contact?service=Website Design United Kingdom"
                    className="rounded-md bg-emerald-600 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Request a Quote
                  </a>
                  <a
                    href="/portfolio"
                    className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-center text-sm font-semibold text-white/90 transition hover:bg-black/50"
                  >
                    View Portfolio
                  </a>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div
                  className="h-[360px] bg-cover bg-center opacity-80"
                  style={{ backgroundImage: "url(/images/services/services-business.webp)" }}
                />
                <div className="absolute inset-0 bg-black/35" />
              </div>
            </div>
          </div>
        </section>

        <AnswerHighlightsSection
          eyebrow="Quick answers"
          title="What UK businesses usually need clarified before hiring a web designer"
          description="These answers help filter whether the project needs a fast launch, a broader redesign, or a stronger website foundation first."
          items={buyerAnswers}
        />

        <section className="bg-gray-950 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="OUTCOMES"
              title="What a better UK business website should improve"
              description="A stronger website should improve trust, clarify the offer, reduce friction, and move more serious visitors toward the next step."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  "Stronger positioning",
                  "The website should make the offer easier to understand and easier to compare against weaker competitors.",
                ],
                [
                  "More trust",
                  "Proof, process clarity, and professional presentation should reduce buyer hesitation faster.",
                ],
                [
                  "Better mobile experience",
                  "The site should feel clean, fast, and usable across the devices where buyers are actually browsing.",
                ],
                [
                  "Cleaner conversion flow",
                  "Serious prospects should know exactly how to book, enquire, or start a conversation without confusion.",
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

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="PROCESS"
              title="How website design for UK businesses moves"
              description="The work stays simple: review the business, tighten the offer, build the page flow, then launch with the right commercial signals in place."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-4">
              {[
                [
                  "Review",
                  "We assess the current website, market positioning, trust gaps, and the conversion action that matters most.",
                ],
                [
                  "Plan",
                  "We shape the page flow, messaging blocks, CTA path, and proof structure around actual buyer intent.",
                ],
                [
                  "Build",
                  "We create a faster, cleaner, conversion-focused website that supports both credibility and lead generation.",
                ],
                [
                  "Launch",
                  "We test the main paths, tighten the details, and launch with the essentials in place for performance and usability.",
                ],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-black/40 p-7"
                >
                  <h3 className="text-xl font-semibold">{title}</h3>
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
              title="Common questions about website design in the United Kingdom"
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
              title="Use the next page that best matches the scope"
              description="These pages connect website design in the United Kingdom to redesign, SEO support, pricing, and direct contact."
              links={[
                {
                  href: "/services/website-redesign",
                  label: "Redesign",
                  title: "Need a broader website redesign first?",
                  description:
                    "Use the redesign service if the current website is outdated, generic, or underperforming.",
                },
                {
                  href: "/services/search-engine-optimisation",
                  label: "SEO",
                  title: "Need search visibility support too?",
                  description:
                    "Use the SEO service if rankings, page targeting, and organic lead flow need work alongside the website.",
                },
                {
                  href: "/pricing",
                  label: "Pricing",
                  title: "Need to compare launch scope first?",
                  description:
                    "Review pricing if you want to understand the fast-entry offer before starting the conversation.",
                },
              ]}
            />

            <div className="mt-14">
              <CTASection
                eyebrow="READY"
                title="Need a UK business website that feels sharper and converts better?"
                description="If the current site is vague, slow, or not producing enough enquiries, we can rebuild it into something clearer, faster, and more commercially useful."
                primaryCtaText="Request a Quote"
                primaryHref="/contact?service=Website Design United Kingdom"
                secondaryCtaText="View Portfolio"
                secondaryHref="/portfolio"
                imageUrl="/images/services/services-business-2.webp"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
