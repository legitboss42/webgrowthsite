export type PublicToolSlug =
  | "adsense-readiness-checker"
  | "website-cost-calculator"
  | "homepage-checklist"
  | "meta-description-generator"
  | "sitemap-validator"
  | "website-launch-checklist";

export type PublicToolConfig = {
  slug: PublicToolSlug;
  title: string;
  shortTitle: string;
  description: string;
  intro: string;
  category: string;
  keywords: string[];
  eyebrow: string;
  status: "live";
};

export const PUBLIC_TOOLS: PublicToolConfig[] = [
  {
    slug: "adsense-readiness-checker",
    title: "AdSense Readiness Checker",
    shortTitle: "AdSense Checker",
    description:
      "Score your website against trust, content, UX, and policy-alignment signals before applying for Google AdSense.",
    intro:
      "Use a practical review checklist to spot trust gaps, thin-content risks, and layout issues that commonly block AdSense approval.",
    category: "Monetization",
    keywords: [
      "adsense readiness checker",
      "adsense approval checklist",
      "website adsense audit",
      "adsense safe website",
    ],
    eyebrow: "Monetization tool",
    status: "live",
  },
  {
    slug: "website-cost-calculator",
    title: "Website Cost Calculator",
    shortTitle: "Cost Calculator",
    description:
      "Estimate likely website project scope and investment based on page count, integrations, content readiness, and performance requirements.",
    intro:
      "Use this calculator to get a realistic planning range before requesting a build, redesign, or growth-focused website project.",
    category: "Planning",
    keywords: [
      "website cost calculator",
      "website redesign cost",
      "web design pricing calculator",
      "website budget estimator",
    ],
    eyebrow: "Planning tool",
    status: "live",
  },
  {
    slug: "homepage-checklist",
    title: "Homepage Checklist",
    shortTitle: "Homepage Checklist",
    description:
      "Audit your homepage for messaging clarity, trust, structure, CTA flow, and conversion quality.",
    intro:
      "Run through the exact homepage checks that matter most for search visitors, lead quality, and first-impression trust.",
    category: "Conversion",
    keywords: [
      "homepage checklist",
      "homepage conversion checklist",
      "website homepage audit",
      "homepage UX review",
    ],
    eyebrow: "Conversion tool",
    status: "live",
  },
  {
    slug: "meta-description-generator",
    title: "Meta Description Generator",
    shortTitle: "Meta Generator",
    description:
      "Generate cleaner, search-focused meta descriptions for service pages, blog posts, and landing pages.",
    intro:
      "Turn your page topic, audience, and offer into a sharper meta description that reads naturally and supports click-through.",
    category: "SEO",
    keywords: [
      "meta description generator",
      "seo meta description tool",
      "service page meta description",
      "blog meta generator",
    ],
    eyebrow: "SEO tool",
    status: "live",
  },
  {
    slug: "sitemap-validator",
    title: "Sitemap Validator",
    shortTitle: "Sitemap Validator",
    description:
      "Validate sitemap XML structure, URL quality, duplicates, protocol issues, and index-child sitemap setup.",
    intro:
      "Paste sitemap XML or enter a sitemap URL to check whether the file is structurally sound and aligned with indexable website growth pages.",
    category: "Technical SEO",
    keywords: [
      "sitemap validator",
      "xml sitemap checker",
      "sitemap audit tool",
      "technical seo sitemap validator",
    ],
    eyebrow: "Technical SEO tool",
    status: "live",
  },
  {
    slug: "website-launch-checklist",
    title: "Website Launch Checklist",
    shortTitle: "Launch Checklist",
    description:
      "Review the final SEO, UX, analytics, trust, and conversion checks before launching a website.",
    intro:
      "Use a structured pre-launch checklist so the site goes live with the right pages, metadata, forms, tracking, and technical basics in place.",
    category: "Launch",
    keywords: [
      "website launch checklist",
      "website launch qa",
      "seo launch checklist",
      "website prelaunch checklist",
    ],
    eyebrow: "Launch tool",
    status: "live",
  },
];

export const PUBLIC_TOOL_MAP = Object.fromEntries(
  PUBLIC_TOOLS.map((tool) => [tool.slug, tool])
) as Record<PublicToolSlug, PublicToolConfig>;

export function getPublicTool(slug: string) {
  return PUBLIC_TOOL_MAP[slug as PublicToolSlug];
}
