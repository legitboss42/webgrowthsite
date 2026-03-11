import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import StructuredData from "@/components/StructuredData";
import { launchFaqs } from "@/lib/launchOffer";
import { buildFaqSchema, buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Frequently asked questions about Web Growth's 48-hour website launch service for businesses in Nigeria and remote international clients.";

export const metadata = buildPageMetadata({
  title: "48-Hour Website Launch FAQ | Pricing, Timing, and Ownership",
  description: pageDescription,
  path: "/faq",
  keywords: [
    "website launch faq",
    "48 hour website faq",
    "website design nigeria faq",
  ],
});

export default function FaqPage() {
  return (
    <>
      <StructuredData
        data={[
          buildProfessionalServiceSchema("/faq", pageDescription),
          buildFaqSchema(launchFaqs),
        ]}
      />

      <main className="bg-[#050806] text-white">
        <section className="border-b border-white/10 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">FAQ</p>
              <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-6xl">
                48-hour website launch FAQ for business owners who want clear answers
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/72">
                Clear answers about timing, ownership, revisions, and support for the 48-hour website launch service.
              </p>
            </div>
          </div>
        </section>

        <FAQSection
          items={launchFaqs}
          title="Everything people ask before they start"
          description="Short, direct answers so you can decide if the 48-hour offer matches your business."
        />
        <FinalCTASection title="Ready to stop delaying the launch?" />
      </main>
    </>
  );
}
