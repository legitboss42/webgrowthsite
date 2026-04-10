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
  "Website design in Lagos for service businesses that need fast, credible websites with clearer messaging, stronger mobile UX, and easier enquiries.";

const buyerAnswers = [
  {
    title: "Who is this website design page for?",
    answer:
      "It is built for Lagos service businesses, founders, and lean teams that need a cleaner website to support enquiries, referrals, WhatsApp leads, and local search trust.",
    href: "/contact?service=Website Design Lagos",
    hrefLabel: "Discuss your project",
  },
  {
    title: "What should a good Lagos business website do first?",
    answer:
      "It should explain the offer clearly, build trust quickly, load well on mobile, and make the next action obvious for serious prospects.",
    href: "/blog/why-your-website-isnt-getting-leads",
    hrefLabel: "See what hurts conversions",
  },
  {
    title: "What if the current site already exists?",
    answer:
      "If the site is outdated, unclear, or underperforming, a focused redesign is usually better than patching the same problems forever.",
    href: "/services/website-redesign",
    hrefLabel: "See redesign support",
  },
  {
    title: "Can this also support search visibility in Lagos?",
    answer:
      "Yes. A stronger website can support Lagos search intent better when the page structure, metadata, internal links, and trust signals are handled properly.",
    href: "/services/google-my-business-setup-optimisation",
    hrefLabel: "See local visibility support",
  },
] as const;

const faqs = [
  {
    question: "What type of businesses need website design in Lagos?",
    answer:
      "Service businesses, consultants, clinics, agencies, property businesses, and lean teams that need a clear online presence and better enquiry flow are usually the best fit.",
  },
  {
    question: "Do you need to be physically in Lagos to work with Web Growth?",
    answer:
      "No. The page targets Lagos search intent, but the service can be delivered remotely as long as communication and approvals stay clear.",
  },
  {
    question: "What matters most on a business website in Lagos?",
    answer:
      "Clear messaging, strong trust signals, fast mobile performance, and an easy next step usually matter more than flashy visuals.",
  },
  {
    question: "Can website design in Lagos help with WhatsApp leads?",
    answer:
      "Yes. For many Lagos businesses, WhatsApp is a real sales channel, so the website should support that path instead of hiding it.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Website Design in Lagos for Service Businesses | Web Growth",
  description: pageDescription,
  path: "/website-design-lagos",
  keywords: [
    "website design lagos",
    "web designer lagos",
    "business website design lagos",
    "lagos web design",
    "small business website lagos",
  ],
  image: "/images/services/services-business.webp",
});

export default function WebsiteDesignLagosPage() {
  return (
    <>
      <StructuredData
        data={buildProfessionalServiceSchema("/website-design-lagos", pageDescription)}
      />
      <StructuredData data={buildFaqSchema(faqs)} />

      <main className="bg-black text-white">
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <div className="text-sm tracking-[0.25em] text-white/50">
                  WEBSITE DESIGN LAGOS
                </div>
                <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                  Website design in Lagos for businesses that need more trust and more enquiries
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-white/70">
                  If you need website design in Lagos, the website should do more than
                  look polished. It should explain the offer clearly, work properly on
                  mobile, support local buyer trust, and make it easier for serious
                  prospects to contact you.
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/contact?service=Website Design Lagos"
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
          title="What website design in Lagos should actually help you do"
          description="These are the buyer questions that usually need answering before a business decides whether the website needs a rebuild, a new launch, or stronger local conversion support."
          items={buyerAnswers}
        />

        <section className="bg-gray-950 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="OUTCOMES"
              title="What a better Lagos business website should improve first"
              description="The goal is not decoration. The goal is a website that makes the business easier to trust and easier to contact."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  "Clearer offer",
                  "Visitors should understand what you do, who you help, and what the next step is without guessing.",
                ],
                [
                  "Stronger trust",
                  "Proof, testimonials, business context, and professional presentation should reduce hesitation quickly.",
                ],
                [
                  "Better mobile UX",
                  "For many Lagos businesses, mobile performance and WhatsApp flow matter more than desktop polish.",
                ],
                [
                  "More enquiries",
                  "The page should guide serious visitors toward booking, contacting, or starting a conversation without friction.",
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
              title="How a website design project in Lagos moves"
              description="The work stays focused on offer clarity, conversion structure, speed, and a practical launch path."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-4">
              {[
                [
                  "Review",
                  "We assess the current site, trust gaps, messaging issues, and the conversion path that matters most.",
                ],
                [
                  "Structure",
                  "We plan the page order, CTA flow, proof placement, and mobile experience around real buyer behavior.",
                ],
                [
                  "Build",
                  "We create a cleaner, faster, more credible website built to support enquiries instead of confusion.",
                ],
                [
                  "Launch",
                  "We test key paths, polish the experience, and launch with the essentials in place for speed and usability.",
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
              title="Common questions about website design in Lagos"
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
              title="Use the next page that best matches the project"
              description="These pages connect website design in Lagos to redesign, landing pages, local search support, and direct contact."
              links={[
                {
                  href: "/services/website-redesign",
                  label: "Redesign",
                  title: "Need a broader website redesign first?",
                  description:
                    "Use the redesign service if the current website is old, unclear, or weak on trust and mobile UX.",
                },
                {
                  href: "/services/landing-page-design",
                  label: "Landing page",
                  title: "Need a more focused page for ads or offers?",
                  description:
                    "Use the landing page service if one campaign, offer, or lead path needs tighter structure.",
                },
                {
                  href: "/services/google-my-business-setup-optimisation",
                  label: "GBP",
                  title: "Need stronger local search visibility in Lagos?",
                  description:
                    "Use the Google Business Profile service if Maps and local search should support the website better.",
                },
              ]}
            />

            <div className="mt-14">
              <CTASection
                eyebrow="READY"
                title="Need a business website in Lagos that converts better?"
                description="If the current site is unclear, weak on mobile, or underperforming, we can rebuild it into something faster, cleaner, and more commercially useful."
                primaryCtaText="Request a Quote"
                primaryHref="/contact?service=Website Design Lagos"
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
