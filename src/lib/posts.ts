export type Category = "Conversion" | "Performance" | "Strategy" | "SEO" | "UX";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: Category;
  tags: string[];
  readTime: string;
  content: string;

  cover?: string;
};

const POSTS: Post[] = [

  // =================================================
  // POST 1 — HOSTING (Authority version)
  // =================================================
  {
    slug: "best-web-hosting-for-small-business-websites",
    title: "Best Web Hosting for Small Business Websites (Fast, Cheap & Reliable)",
    excerpt:
      "Slow hosting quietly kills your sales. Learn how to choose fast, reliable hosting that improves SEO, conversions and trust — plus the best options for small businesses.",
    date: "2026-02-01",
    category: "Performance",
    tags: ["Hosting", "Speed", "SEO"],
    readTime: "9 min read",
    cover: "/images/blog/hosting.png",

    content: `# Slow hosting is silently killing your sales

Most small business owners obsess over design.

Colors.
Logos.
Fonts.

Meanwhile their site takes **5 seconds to load**.

Visitors leave.
Google ranks them lower.
Sales disappear.

Bad hosting is the quiet business killer nobody talks about.

![Modern server racks glowing emerald green, cinematic datacenter, premium tech aesthetic, 16:9](/images/blog/hosting-hero.png)

## Why hosting matters more than design

Your hosting controls:

- speed
- uptime
- security
- SEO
- trust

If your site loads slowly, everything else collapses.

Speed is not a “nice to have”.

It’s survival.

## Must-have features

Never choose hosting without:

- SSD storage
- 99.9% uptime
- Free SSL
- Daily backups
- CDN
- Fast support

Anything less is gambling.

## Solid options most small businesses use

### Hostinger
Cheap + surprisingly fast

### Bluehost
Beginner friendly + stable

### Cloudways
Blazing fast performance

## Quick setup plan

1) Buy hosting  
2) Install your site  
3) Enable SSL  
4) Optimise images  
5) Launch  

Done.

## Free download

👉 **Free Hosting Setup Checklist (PDF)**  
Step-by-step list so you don’t miss anything.

## FAQ

### Does hosting affect SEO?
Yes. Speed directly affects rankings.

### Can cheap hosting work?
Yes, if optimized. Just avoid ultra-budget junk.

### When should I upgrade?
When traffic or sales grow consistently.

Speed wins. Always.
`,
  },

  // =================================================
  // POST 2 — WEBSITE BUILDERS (FULL LONG FORM)
  // =================================================
  {
    slug: "best-website-builders-for-small-business-2026",
    title: "Best Website Builders for Small Business (Fast, Affordable & Easy in 2026)",
    excerpt:
      "Trying to choose between WordPress, Webflow or Wix? This guide compares speed, SEO, cost and ease so you pick the right builder without wasting time or money.",
    date: "2026-02-05",
    category: "Strategy",
    tags: ["Website Builder", "Tools", "Small Business", "SEO"],
    readTime: "10 min read",
    cover: "/images/blog/builders.png",

    content: `![Clean modern workspace with laptop showing website builder dashboard, emerald accent lighting, professional aesthetic, 16:9](/images/blog/builders-hero.png)

# Best Website Builders for Small Business

Most websites don’t fail because of design.

They fail because they chose the wrong foundation.

The wrong builder.

Pick wrong and everything becomes painful:

- slow pages
- poor SEO
- hidden costs
- limited flexibility

Pick right and growth becomes easy.

## Why your builder matters

Your builder controls:

- speed
- Google rankings
- monthly cost
- editing ease
- scalability

Bad builder = permanent struggle.

## What a good builder must give you

- fast loading
- mobile responsive
- clean URLs
- meta tags
- SSL
- easy editing

No compromises.

---

## WordPress (Best long term + SEO)

![Minimal WordPress dashboard, clean UI, green accent lighting, 16:9](/images/blog/wordpress.png)

- unlimited flexibility
- best SEO
- lowest long-term cost
- full ownership

If you want traffic from Google, this is usually the best choice.

---

## Webflow (Best design + speed)

![Modern Webflow interface, sleek layout builder, futuristic glow, 16:9](/images/blog/webflow.png)

- beautiful design
- extremely fast
- hosting included
- premium feel

Great for agencies and startups.

---

## Wix (Best for beginners)

![Simple drag-and-drop website builder UI, beginner friendly, bright clean layout, 16:9](/images/blog/wix.png)

- easiest setup
- no tech skills needed
- quick launch

Good starter option, limited long term.

---

## Quick decision rule

Beginner → Wix  
SEO + growth → WordPress  
Premium look → Webflow  

Done.

## Lead magnet

👉 **Free Website Builder Decision Checklist (PDF)**  
Answer 10 questions → instantly know which builder to choose.

## FAQ

### Which builder ranks best on Google?
WordPress consistently wins.

### Is Wix bad?
Not bad, just limited.

### Can I switch later?
Yes, but it’s painful and expensive.

Choose once. Choose right.
`,
  },

  // =================================================
  // AUTHORITY POSTS
  // =================================================
  {
    slug: "why-your-site-isnt-getting-leads",
    title: "Why Your Website Isn’t Getting Leads (And How to Fix It)",
    excerpt:
      "Most websites fail for boring reasons: unclear offer, weak CTA, slow pages, and zero trust signals.",
    date: "2026-01-20",
    category: "Conversion",
    tags: ["Strategy", "Leads", "Messaging"],
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
4) Improve speed
`,
  },

  {
    slug: "speed-checklist-core-web-vitals",
    title: "Speed Checklist: Core Web Vitals That Actually Matter",
    excerpt:
      "A practical checklist to improve LCP, INP and CLS without guessing.",
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
3) Preload fonts
`,
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
5) CTA
`,
  },
];

export function getPosts(): Post[] {
  return POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}