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
  "Web design for real estate businesses in Lagos that need faster, credible property websites to showcase listings and generate qualified enquiries.";

const buyerAnswers = [
  {
    title: "Who is this real estate website service for?",
    answer:
      "It is best for realtors, agencies, property marketers, and developers in Lagos that need a website which builds trust quickly and turns listing interest into enquiries.",
    href: "/contact?service=Web Design for Real Estate Lagos",
    hrefLabel: "Discuss your project",
  },
  {
    title: "What should the website improve first?",
    answer:
      "The biggest gains usually come from clearer property presentation, stronger trust signals, faster mobile performance, and an enquiry path that is easy to use.",
    href: "/services/website-redesign",
    hrefLabel: "See redesign support",
  },
  {
    title: "Can this support ads or listing campaigns?",
    answer:
      "Yes. A strong property website should support paid traffic, Google Business Profile visibility, referrals, and agent follow-up without sending buyers into confusion.",
    href: "/services/landing-page-design",
    hrefLabel: "See landing page support",
  },
  {
    title: "What if the current website is too weak to keep fixing?",
    answer:
      "If the existing website is slow, outdated, or difficult to manage, a cleaner rebuild is usually more profitable than patching the same problems again.",
    href: "/services/website-audit",
    hrefLabel: "Start with an audit",
  },
] as const;

const faqs = [
  {
    question: "What should a real estate website include?",
    answer:
      "A strong real estate website should include clear property presentation, location context, enquiry options, trust signals, mobile-friendly structure, and fast load speed.",
  },
  {
    question: "Can you build around my current listings and content?",
    answer:
      "Yes. We can work with your current property content, listing categories, and brand assets, then restructure the experience around trust and conversion.",
  },
  {
    question: "Is this only for Lagos-based agencies?",
    answer:
      "The page is targeted to Lagos intent, but the service can also support property businesses serving wider Nigerian or international buyers.",
  },
  {
    question: "Can this connect to WhatsApp or lead forms?",
    answer:
      "Yes. We can structure the website around WhatsApp, enquiry forms, calls, or a mix of direct response paths depending on how your team closes leads.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Real Estate Web Design in Lagos | Web Growth",
  description: pageDescription,
  path: "/web-design-for-real-estate-lagos",
  keywords: [
    "web design for real estate lagos",
    "real estate website design lagos",
    "property website design nigeria",
    "real estate web designer lagos",
    "real estate website nigeria",
  ],
  image: "/images/services/services-business.webp",
});

export default function Page() {
  return (
    <>
      <StructuredData
        data={buildProfessionalServiceSchema(
          "/web-design-for-real-estate-lagos",
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
                  WEB DESIGN FOR REAL ESTATE LAGOS
                </div>
                <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                  Web design for real estate in Lagos that helps property brands win more enquiries.
                </h1>
                <p className="mt-6 text-lg text-white/70 leading-relaxed">
                  If you need web design for real estate in Lagos, the website
                  should do more than look polished. It should present listings
                  clearly, build trust fast, load well on mobile, and make it
                  easy for serious buyers or renters to contact you.
                </p>

                <div className="mt-10 flex gap-3 flex-col sm:flex-row">
                  <a
                    href="/contact?service=Web Design for Real Estate Lagos"
                    className="rounded-md bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                  >
                    Request a Quote
                  </a>
                  <a
                    href="/portfolio"
                    className="rounded-md border border-white/15 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white/90 text-center hover:bg-black/50 transition"
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
          title="The questions property businesses usually need answered first"
          description="These answers help buyers understand what this page is for and why a real estate website needs to support trust, speed, and lead quality together."
          items={buyerAnswers}
        />

        <section className="py-24 bg-gray-950">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="OUTCOMES"
              title="What web design for real estate in Lagos should help you do"
              description="A better real-estate website should make the business easier to trust, the listings easier to browse, and the next action easier to take."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  "Show listings clearly",
                  "Property pages, location information, and visuals should be easy to scan on both desktop and mobile.",
                ],
                [
                  "Build trust faster",
                  "Buyers need proof, professionalism, and a presentation standard that matches the value of the properties.",
                ],
                [
                  "Generate better enquiries",
                  "A strong site should make it easy to request details, book viewings, or start a serious conversation.",
                ],
                [
                  "Support local visibility",
                  "The website should work with Maps visibility, referrals, and campaign traffic instead of fighting them.",
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
              title="How a real estate website project moves"
              description="The process stays focused on clarity, listing presentation, buyer trust, and a practical enquiry path."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-4">
              {[
                [
                  "Review",
                  "We assess the current website, listing flow, trust gaps, and the type of enquiries the business wants more of.",
                ],
                [
                  "Structure",
                  "We plan the pages, sections, and enquiry flow around the properties, services, and audiences that matter most.",
                ],
                [
                  "Build",
                  "We create a cleaner, mobile-friendly experience with stronger messaging, proof, and conversion guidance.",
                ],
                [
                  "Launch",
                  "We test the key paths, polish the experience, and launch with the essentials in place for speed and usability.",
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

        <section className="py-24 bg-gray-950">
          <div className="mx-auto max-w-4xl px-6">
            <SectionHeading
              eyebrow="FAQ"
              title="Common questions"
              description="Quick answers before you request a quote."
            />

            <div className="mt-10 space-y-4">
              {faqs.map((item) => (
                <div
                  key={item.question}
                  className="rounded-2xl border border-white/10 bg-black/40 p-6"
                >
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-3 text-white/70 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12">
              <CorePageLinks
                eyebrow="Useful next steps"
                title="Use the next page that best supports the project"
                description="These related pages help connect the real-estate website project to redesign, landing pages, local visibility, and direct contact."
                links={[
                  {
                    href: "/services/website-redesign",
                    label: "Redesign",
                    title: "Need a full property website redesign first?",
                    description:
                      "Use the redesign service if the existing site is outdated and needs broader structural improvement.",
                  },
                  {
                    href: "/services/landing-page-design",
                    label: "Landing page",
                    title: "Need a focused page for one property campaign?",
                    description:
                      "Use the landing page service if you need a more focused conversion page for ads, launches, or premium listings.",
                  },
                  {
                    href: "/services/google-my-business-setup-optimisation",
                    label: "GBP",
                    title: "Need stronger local search visibility as well?",
                    description:
                      "Use the Google Business Profile page if Maps visibility and local discovery should support the website better.",
                  },
                  {
                    href: "/contact?service=Web Design for Real Estate Lagos",
                    label: "Contact",
                    title: "Ready to discuss your real estate website in Lagos?",
                    description:
                      "Go to contact if you already know the website needs to support listings, credibility, and better enquiry flow.",
                  },
                ]}
              />
            </div>

            <CTASection
              eyebrow="READY"
              title="Need a real estate website that feels credible and converts better?"
              description="If your current property website is weak on trust, speed, or enquiry flow, we can rebuild it into something clearer and more commercially useful."
              primaryCtaText="Request a Quote"
              primaryHref="/contact?service=Web Design for Real Estate Lagos"
              secondaryCtaText="View Portfolio"
              secondaryHref="/portfolio"
              imageUrl="/images/services/services-business-2.webp"
            />
          </div>
        </section>
      </main>
    </>
  );
}
