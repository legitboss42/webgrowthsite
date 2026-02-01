export type Category = "Conversion" | "Performance" | "Strategy" | "SEO" | "UX";

export type AffiliateBlock = {
  title: string;
  description: string;
  url: string;
  cta: string;
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO string
  category: Category;
  tags: string[];
  readTime: string;
  content: string;

  // Optional extras
  cover?: string; // e.g. "/images/blog/leads.jpg"
  affiliate?: AffiliateBlock;
};

const POSTS: Post[] = [
  {
    slug: "why-your-site-isnt-getting-leads",
    title: "Why Your Website Isn’t Getting Leads (And How to Fix It)",
    excerpt:
      "Most websites fail for boring reasons: unclear offer, weak CTA, slow pages, and zero trust signals. Let’s fix the real blockers.",
    date: "2026-02-01",
    category: "Conversion",
    tags: ["Strategy", "Messaging", "Trust"],
    readTime: "6 min read",
    cover: "/images/blog/leads.jpg",
    affiliate: {
      title: "Need a faster website that converts?",
      description:
        "If you want us to rebuild your site for speed + leads, this is the quickest way to get started.",
      url: "/contact",
      cta: "Get a Quote",
    },
    content: `## The real reason you’re not getting leads

Your website isn’t “bad”. It’s just not doing the sales job.

- Your offer isn’t clear
- Your CTA is weak
- You have no trust signals
- Your site is slow

## Fix order

1) Clarify offer
2) Add proof
3) Make CTA obvious
4) Improve speed`,
  },
  {
    slug: "speed-checklist-core-web-vitals",
    title: "Speed Checklist: Core Web Vitals That Actually Matter",
    excerpt:
      "A practical checklist to improve LCP, INP and CLS without guessing. What to change, why it matters, and how to verify results.",
    date: "2026-01-26",
    category: "Performance",
    tags: ["SEO", "CWV", "Speed"],
    readTime: "7 min read",
    cover: "/images/blog/speed.jpg",
    content: `## The only 3 metrics most people should care about

- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)

## Quick wins

1) Compress images
2) Reduce JS
3) Preload fonts`,
  },
  {
    slug: "homepage-structure-that-converts",
    title: "Homepage Structure That Converts Visitors Into Enquiries",
    excerpt:
      "Your homepage is a sales page. Here’s the section order that builds clarity, trust, and action—without fluff.",
    date: "2026-01-20",
    category: "UX",
    tags: ["Conversion", "Layout", "Hierarchy"],
    readTime: "5 min read",
    cover: "/images/blog/homepage.jpg",
    content: `## Use this order

1) Clear headline + who it's for
2) Proof (results, testimonials)
3) Services / Offer
4) Process
5) CTA

Most people do it backwards.`,
  },
];

export function getPosts(): Post[] {
  return POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}