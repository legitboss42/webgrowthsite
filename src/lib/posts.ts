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
  cover?: string; // e.g. "/images/blog/leads.png"
  affiliate?: AffiliateBlock; // you can re-enable later if you want
};

const POSTS: Post[] = [
  // =================================================
  // MONEY POST #1 — HOSTING (Affiliate REMOVED)
  // =================================================
  {
    slug: "best-web-hosting-for-small-business-websites",
    title: "Best Web Hosting for Small Business Websites (Fast, Cheap & Reliable)",
    excerpt:
      "Slow hosting quietly kills your sales. Here’s how to choose fast, affordable and reliable hosting for small business websites — plus the best providers in 2026.",
    date: "2026-02-01",
    category: "Performance",
    tags: ["Hosting", "Tools", "Speed", "SEO"],
    readTime: "9 min read",
    cover: "/images/blog/hosting.png",

    // ❌ affiliate removed

    content: `# Slow hosting is silently killing your sales

Bad hosting quietly murders conversions.

- slow pages
- high bounce rates
- poor SEO
- lost trust

## Why hosting matters more than design

Hosting controls:

- speed
- uptime
- security
- SEO

If your site loads in 4 seconds, half your visitors disappear.

No design can fix slow.

## Must-have features

- SSD storage
- 99.9% uptime
- Free SSL
- Daily backups
- CDN
- Fast support

## Solid hosting options most small businesses use

### Hostinger

Cheap + surprisingly fast

### Bluehost

Beginner friendly

### Cloudways

Blazing fast performance

## Quick setup

1) Buy hosting
2) Install site
3) Enable SSL
4) Optimise images
5) Launch`,
  },

  // =================================================
  // MONEY POST #2 — WEBSITE BUILDERS (Affiliate REMOVED)
  // =================================================
  {
    slug: "best-website-builders-for-small-business-2026",
    title: "Best Website Builders for Small Business (Fast, Affordable & Easy in 2026)",
    excerpt:
      "Choosing the wrong website builder wastes time and kills conversions. Here are the best builders based on speed, cost and real business results.",
    date: "2026-02-01",
    category: "Strategy",
    tags: ["Tools", "Website Builder", "Small Business"],
    readTime: "10 min read",
    cover: "/images/blog/builders.png",

    // ❌ affiliate removed

    content: `# Most small business websites fail before they even launch

Not because of design.

Because they chose the wrong builder.

- slow pages
- bloated templates
- hidden fees
- poor SEO

## Why your builder matters

Your builder controls:

- speed
- SEO
- mobile performance
- editing ease
- scalability

Bad builder = permanent pain.

## Best website builders

### 1) WordPress (Best long term)

Unlimited flexibility + best SEO

### 2) Webflow (Best design + speed)

Modern + very fast

### 3) Wix (Best beginner option)

Easiest setup

## How to choose

Small budget → Wix  
Serious SEO → WordPress  
Premium design → Webflow  

Speed beats perfection.`,
  },

  // =================================================
  // AUTHORITY POSTS (Trust builders)
  // =================================================
  {
    slug: "why-your-site-isnt-getting-leads",
    title: "Why Your Website Isn’t Getting Leads (And How to Fix It)",
    excerpt:
      "Most websites fail for boring reasons: unclear offer, weak CTA, slow pages, and zero trust signals.",
    date: "2026-01-20",
    category: "Conversion",
    tags: ["Strategy", "Messaging", "Trust"],
    readTime: "6 min read",
    cover: "/images/blog/leads.png",
    content: `## The real problem

Your website isn’t doing the sales job.

- unclear offer
- weak CTA
- no proof
- slow speed

## Fix order

1) Clarify offer
2) Add proof
3) Make CTA obvious
4) Improve speed`,
  },

  {
    slug: "speed-checklist-core-web-vitals",
    title: "Speed Checklist: Core Web Vitals That Actually Matter",
    excerpt: "A practical checklist to improve LCP, INP and CLS without guessing.",
    date: "2026-01-10",
    category: "Performance",
    tags: ["SEO", "Speed"],
    readTime: "7 min read",
    cover: "/images/blog/speed.png",
    content: `## The only 3 metrics that matter

- LCP
- INP
- CLS

## Quick wins

1) Compress images
2) Reduce JS
3) Preload fonts`,
  },

  {
    slug: "homepage-structure-that-converts",
    title: "Homepage Structure That Converts Visitors Into Enquiries",
    excerpt:
      "Your homepage is a sales page. Here’s the section order that builds clarity and trust.",
    date: "2026-01-01",
    category: "UX",
    tags: ["Conversion", "Layout"],
    readTime: "5 min read",
    cover: "/images/blog/homepage.png",
    content: `## Use this order

1) Clear headline
2) Proof
3) Services
4) Process
5) CTA`,
  },
];

export function getPosts(): Post[] {
  return POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}