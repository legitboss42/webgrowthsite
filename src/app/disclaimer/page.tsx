import { buildPageMetadata } from "@/lib/seo";
import SectionShell from "@/components/home/SectionShell";

const pageDescription =
  "Read the Web Growth disclaimer on educational guidance, affiliate context, and the limits of results claims, platform advice, and implementation examples.";

export const metadata = buildPageMetadata({
  title: "Website Disclaimer and Affiliate Disclosure | Web Growth",
  description: pageDescription,
  path: "/disclaimer",
  keywords: [
    "web growth disclaimer",
    "website growth disclaimer",
    "affiliate disclosure",
    "results disclaimer",
    "educational content disclaimer",
  ],
});

const sections = [
  {
    title: "Educational content only",
    body:
      "Web Growth publishes educational content, implementation guidance, and strategic opinions to help business owners make better website decisions. Nothing on this site should be treated as legal, financial, tax, or guaranteed platform approval advice.",
  },
  {
    title: "No guaranteed results",
    body:
      "Search visibility, lead generation, conversion performance, and monetization outcomes depend on the quality of the offer, competition, traffic sources, implementation quality, market conditions, and decisions outside Web Growth's control. We do not guarantee rankings, revenue, AdSense approval, or a specific number of enquiries.",
  },
  {
    title: "Platform and policy references",
    body:
      "When Web Growth discusses Google Search, AdSense, analytics platforms, hosting companies, or software tools, the information is based on the best available source material and practical experience at the time of publication. Platform rules, eligibility standards, and interfaces can change without notice.",
  },
  {
    title: "Affiliate and partner context",
    body:
      "Some future recommendations or resource pages may include affiliate or partner links where relevant. If that happens, the presence of a commission opportunity will not change the standard that the recommendation must still be useful, relevant, and editorially defensible.",
  },
  {
    title: "Examples and proof",
    body:
      "Case studies, examples, workflows, and screenshots are shared to explain strategy, implementation choices, or project direction. They should not be interpreted as a promise that the same outcome will happen in another business context.",
  },
  {
    title: "External links and third-party tools",
    body:
      "External websites, software providers, and third-party resources are outside Web Growth's control. We are not responsible for changes, outages, security issues, pricing changes, or content updates on external services linked from this site.",
  },
] as const;

export default function DisclaimerPage() {
  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <SectionShell tone="canvas" spacing="hero">
        <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
          Disclaimer
        </p>
        <h1 className="mt-5 max-w-4xl text-balance text-[3.6rem] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-950 md:text-[4.6rem]">
          Clear boundaries around guidance, examples, and website growth claims.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          This page explains how to interpret the educational, strategic, and
          commercial information published on Web Growth.
        </p>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]"
            >
              <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                {section.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      </SectionShell>
    </main>
  );
}
