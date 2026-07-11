import Image from "next/image";
import Link from "next/link";
import CinematicHero from "@/components/platform/CinematicHero";
import SectionReveal from "@/components/platform/SectionReveal";
import ClarityPageTags from "@/components/analytics/ClarityPageTags";
import EditorialTrustNote from "@/components/EditorialTrustNote";
import {
  AuditIcon,
  CapIcon,
  CodeWindowIcon,
  DollarIcon,
  GrowthChartIcon,
  IconBadge,
  MonetizeIcon,
  PencilIcon,
  SearchIcon,
  ShieldIcon,
  SpeedIcon,
} from "@/components/home/HomeIcons";
import SectionShell from "@/components/home/SectionShell";
import { NEW_SERVICES_LIST } from "@/lib/newServiceConfigs";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/site";
import { PUBLIC_TOOLS } from "@/lib/tools";

type BlogPostPreview = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  readTime: string;
  cover?: string;
};

type Props = {
  posts: BlogPostPreview[];
};

const FALLBACK_COVER = "/images/hero/Hero-Image-1.webp";

const topicDefinitions = [
  {
    title: "SEO",
    description: "Rank higher and get discovered with practical search-growth guidance.",
    icon: <SearchIcon />,
    slugs: [
      "small-business-website-seo-checklist",
      "03-seo-migration-without-losing-traffic",
      "local-seo-for-small-business-google-maps-ranking-guide",
      "local-seo-basics-service-business-lagos",
      "best-web-hosting-for-small-business-websites",
    ],
  },
  {
    title: "AdSense and Monetization",
    description: "Build revenue paths without undermining trust or content quality.",
    icon: <DollarIcon />,
    slugs: [
      "why-your-website-isnt-getting-leads",
      "email-marketing-for-small-business",
      "email-automation-architecture",
    ],
  },
  {
    title: "Web Design and Conversion",
    description: "Improve structure, messaging, and buyer clarity across key pages.",
    icon: <CodeWindowIcon />,
    slugs: [
      "how-to-build-a-small-business-website-that-converts",
      "homepage-structure-that-converts-visitors-into-customers",
      "high-converting-service-page",
      "04-writing-service-pages-that-convert",
    ],
  },
  {
    title: "Performance",
    description: "Protect speed, Core Web Vitals, and technical stability as the site grows.",
    icon: <SpeedIcon />,
    slugs: [
      "how-to-make-your-website-load-fast",
      "how-to-audit-slow-wordpress-site",
      "stop-using-cheap-hosting",
      "05-premium-design-without-slow-pages",
    ],
  },
  {
    title: "Lead Generation",
    description: "Turn search, traffic, and landing-page intent into better enquiries.",
    icon: <GrowthChartIcon />,
    slugs: [
      "high-converting-landing-pages-guide",
      "landing-page-wireframe-local-service-business",
      "conversion-audit-checklist-service-homepage",
    ],
  },
  {
    title: "Case Studies and Series",
    description: "Study first-hand rebuild decisions, tradeoffs, and reusable lessons.",
    icon: <AuditIcon />,
    slugs: [
      "jluxe-medical-aesthetics-case-study",
      "01-why-we-rebuilt-not-redesigned",
      "02-the-audit-that-created-the-roadmap",
      "08-results-mistakes-and-reusable-playbook",
    ],
  },
] as const;

const learningPathDefinitions = [
  {
    title: "Start and Launch",
    description: "Use these guides when the website still needs its foundation, launch plan, and first conversion structure.",
    href: "/blog/how-to-build-a-small-business-website-that-converts/",
    slugs: [
      "how-to-build-a-small-business-website-that-converts",
      "website-launch-checklist-for-small-businesses",
      "small-business-website-launch-qa-checklist",
    ],
    tools: ["website-launch-checklist", "website-cost-calculator"],
    icon: <CapIcon />,
  },
  {
    title: "Rank in Google",
    description: "Move from broad SEO theory to concrete page, snippet, and local-visibility improvements.",
    href: "/blog/small-business-website-seo-checklist/",
    slugs: [
      "small-business-website-seo-checklist",
      "local-seo-for-small-business-google-maps-ranking-guide",
      "03-seo-migration-without-losing-traffic",
    ],
    tools: ["meta-description-generator", "sitemap-validator"],
    icon: <SearchIcon />,
  },
  {
    title: "Convert and Monetize",
    description: "Tighten lead quality, nurture systems, and monetization decisions without cheapening the user experience.",
    href: "/blog/why-your-website-isnt-getting-leads/",
    slugs: [
      "why-your-website-isnt-getting-leads",
      "email-marketing-for-small-business",
      "email-automation-architecture",
    ],
    tools: ["adsense-readiness-checker", "homepage-checklist"],
    icon: <MonetizeIcon />,
  },
  {
    title: "Optimize and Scale",
    description: "Improve speed, tracking, and operating discipline once the website is already doing meaningful work.",
    href: "/blog/how-to-make-your-website-load-fast/",
    slugs: [
      "how-to-make-your-website-load-fast",
      "website-tracking-setup-for-small-businesses",
      "ga4-meta-tiktok-clarity-setup-guide",
    ],
    tools: ["homepage-checklist", "sitemap-validator"],
    icon: <ShieldIcon />,
  },
] as const;

function formatPostDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function findPost(posts: BlogPostPreview[], slug: string) {
  return posts.find((post) => post.slug === slug);
}

function countByCategory(posts: BlogPostPreview[], category: string) {
  return posts.filter((post) => post.category.toLowerCase() === category.toLowerCase()).length;
}

export default function BlogClient({ posts }: Props) {
  const availableSlugs = new Set(posts.map((post) => post.slug));
  const uniqueCategories = new Set(posts.map((post) => post.category));
  const featured =
    findPost(posts, "how-to-build-a-small-business-website-that-converts") ?? posts[0];
  const latestPosts = posts.slice(0, 4);
  const caseStudyAndSeriesCount =
    countByCategory(posts, "Case Study") + countByCategory(posts, "Series");
  const academyTopics = topicDefinitions.map((topic) => {
    const liveSlugs = topic.slugs.filter((slug) => availableSlugs.has(slug));
    return {
      ...topic,
      count: liveSlugs.length,
      href: liveSlugs[0] ? `/blog/${liveSlugs[0]}/` : "/blog/",
    };
  });
  const learningPaths = learningPathDefinitions.map((path) => ({
    ...path,
    guideCount: path.slugs.filter((slug) => availableSlugs.has(slug)).length,
    toolCount: path.tools.filter((slug) =>
      PUBLIC_TOOLS.some((tool) => tool.slug === slug)
    ).length,
  }));
  const implementationPaths = [
    {
      href: "/services/website-audit/",
      title: "Start with a Website Audit",
      text: "Use an audit when you need clarity on the main trust, SEO, speed, or conversion bottleneck first.",
    },
    {
      href: "/services/",
      title: "Move into Implementation",
      text: `Connect Academy learning to ${NEW_SERVICES_LIST.length} live service paths when you need hands-on execution.`,
    },
    {
      href: "/tools/",
      title: "Use the Tool Stack",
      text: `Open ${PUBLIC_TOOLS.length} live public tools for homepage, launch, SEO, sitemap, and AdSense checks.`,
    },
    {
      href: "/contact/",
      title: "Request a Website Review",
      text: "Use the contact route when you want tailored advice applied to a real business website.",
    },
  ] as const;
  const academyResources = [
    {
      title: "Published Guides",
      description: `${posts.length} Academy guides are live now across strategy, SEO, performance, conversion, and case-study content.`,
      icon: <CapIcon />,
      href: "/blog/",
      cta: "Browse all guides",
    },
    {
      title: "Live Tools",
      description: `${PUBLIC_TOOLS.length} public utilities support launch reviews, snippet writing, sitemap checks, and monetization readiness.`,
      icon: <AuditIcon />,
      href: "/tools/",
      cta: "Open the tools hub",
    },
    {
      title: "Service Connections",
      description: `${NEW_SERVICES_LIST.length} service routes connect education to implementation without hiding the commercial next step.`,
      icon: <PencilIcon />,
      href: "/services/",
      cta: "View services",
    },
    {
      title: "Editorial Coverage",
      description: `${uniqueCategories.size} active content categories now support a broader platform model than a standard blog archive.`,
      icon: <GrowthChartIcon />,
      href: "/editorial-policy/",
      cta: "Read the editorial policy",
    },
  ] as const;

  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <ClarityPageTags tags={{ page_type: "blog_index", content_group: "academy" }} />

      <CinematicHero
        eyebrow="Web Growth Academy / Field notes"
        title={<>Learn the system. <span className="text-accent-gold">Apply it with confidence.</span></>}
        description="Practical, evidence-aware guidance for building stronger websites, earning search visibility, improving conversion, and preparing responsible revenue systems."
        pageType="blog_index"
        variant="editorial"
        primaryAction={{ label: "Start With Foundations", href: featured ? `/blog/${featured.slug}/` : "/blog/", ctaName: "start_with_foundations", destination: "featured_article" }}
        secondaryAction={{ label: "Browse All Topics", href: "#academy-topics", ctaName: "browse_topics", destination: "academy_topics" }}
        aside={featured ? (
          <article className="border-l border-border-hairline pl-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-teal">Editor&apos;s selection</p>
            <h2 className="mt-5 font-display text-3xl font-normal leading-tight text-text-primary">{featured.title}</h2>
            <p className="mt-4 text-sm leading-7 text-text-muted">{featured.excerpt}</p>
            <p className="mt-5 text-xs uppercase tracking-[0.14em] text-accent-gold">{featured.category} / {featured.readTime}</p>
          </article>
        ) : undefined}
        footer={
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border-hairline bg-border-hairline sm:grid-cols-3">
            {[[posts.length, "published guides"], [uniqueCategories.size, "active categories"], [caseStudyAndSeriesCount, "case studies + series"]].map(([value, label]) => (
              <div key={label} className="bg-bg-ink px-5 py-4"><span className="font-display text-2xl text-text-primary">{value}</span><span className="ml-3 text-sm text-text-muted">{label}</span></div>
            ))}
          </div>
        }
      />

      <SectionShell tone="white" spacing="compact">
        <EditorialTrustNote />
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Direct answer
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              What is the Web Growth Academy?
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              The Web Growth Academy is the educational arm of Web Growth. It
              publishes practical guides on SEO, AdSense readiness, website
              strategy, performance, conversion, and real rebuild lessons so
              businesses can understand what to improve before they invest.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Every strong article should answer one clear question, connect to
              related implementation paths, and move the reader toward a useful next
              step instead of trapping them inside a dead archive.
            </p>
          </article>

          <article className="rounded-[1.55rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Implementation paths
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {implementationPaths.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200 hover:text-blue-700"
                >
                  <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </SectionShell>

      <SectionShell id="academy-topics" tone="canvas" spacing="compact">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Explore by topic
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Start with the topic that matches your immediate website-growth bottleneck.
            </p>
          </div>
          <Link
            href="/blog/"
            className="inline-flex min-h-11 items-center rounded-xl text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            View all topics -&gt;
          </Link>
        </div>

        <SectionReveal className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-border-hairline bg-border-hairline sm:grid-cols-2 xl:grid-cols-3">
          {academyTopics.map((topic) => (
            <Link
              key={topic.title}
              href={topic.href}
              className="bg-[#11161f] p-6 transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-gold"
            >
              <IconBadge tone="blue" className="h-11 w-11 rounded-[1rem]">
                {topic.icon}
              </IconBadge>
              <h3 className="mt-5 font-display text-[1.55rem] font-normal tracking-[-0.03em] text-text-primary">
                {topic.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-text-muted">{topic.description}</p>
              <p className="mt-5 text-sm font-semibold text-accent-gold">
                {topic.count} live {topic.count === 1 ? "guide" : "guides"}
              </p>
            </Link>
          ))}
        </SectionReveal>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Learning paths
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Follow a path that matches your stage instead of guessing which guide to read next.
            </p>
          </div>
          <Link
            href="/blog/"
            className="inline-flex min-h-11 items-center rounded-xl text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            View all paths -&gt;
          </Link>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-4">
          {learningPaths.map((path) => (
            <Link
              key={path.title}
              href={path.href}
              className="group rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(79,107,255,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            >
              <div className="flex items-center justify-between">
                <IconBadge tone="purple" className="h-11 w-11 rounded-[1rem]">
                  {path.icon}
                </IconBadge>
                <span className="text-blue-700">&gt;</span>
              </div>
              <h3 className="mt-6 text-[1.25rem] font-semibold tracking-[-0.03em] text-slate-950">
                {path.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{path.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-blue-700">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
                  {path.guideCount} guides
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
                  {path.toolCount} tools
                </span>
              </div>
            </Link>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Latest articles
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The most recent published guides across the live Academy inventory.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...uniqueCategories].slice(0, 5).map((label, index) => (
              <span
                key={label}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  index === 0
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600",
                ].join(" ")}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-4">
          {latestPosts.map((post, index) => (
            <article
              key={post.slug}
              className="overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(79,107,255,0.08)]"
            >
              <Link href={`/blog/${post.slug}/`} className="block">
                <div className="relative aspect-[16/11] border-b border-slate-100 bg-slate-100">
                  {post.cover ? (
                    <Image
                      src={post.cover}
                      alt={post.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className={[
                        "h-full w-full",
                        index === 0
                          ? "bg-[linear-gradient(135deg,#141b4d_0%,#4f6bff_60%,#7c5cff_100%)]"
                          : index === 1
                            ? "bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_70%,#5b21b6_100%)]"
                            : index === 2
                              ? "bg-[linear-gradient(135deg,#2f1f73_0%,#4f46e5_50%,#7c3aed_100%)]"
                              : "bg-[linear-gradient(135deg,#0f172a_0%,#111827_40%,#1d4ed8_100%)]",
                      ].join(" ")}
                    />
                  )}
                </div>
              </Link>

              <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  {post.category}
                </p>
                <h3 className="mt-3 text-[1.2rem] font-semibold leading-7 tracking-[-0.03em] text-slate-950">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                <div className="mt-5 flex items-center gap-4 text-xs text-slate-500">
                  <span>{formatPostDate(post.date)}</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-7 text-center">
          <Link
            href="/blog/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            View all articles -&gt;
          </Link>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Resource connections
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Move from reading to action with tools, services, and clearer platform paths.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-4">
          {academyResources.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(79,107,255,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
                <IconBadge tone="blue" className="h-11 w-11 rounded-[1rem]">
                  {item.icon}
                </IconBadge>
              </div>
              <p className="mt-5 text-sm font-semibold text-blue-700">{item.cta} -&gt;</p>
            </Link>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="overflow-hidden rounded-[1.8rem] border border-blue-200 bg-[radial-gradient(circle_at_14%_24%,rgba(59,130,246,0.18),transparent_24%),radial-gradient(circle_at_92%_18%,rgba(124,92,255,0.22),transparent_22%),linear-gradient(135deg,#425eff_0%,#566fff_46%,#7c3aed_100%)] px-8 py-9 shadow-[0_26px_70px_rgba(79,107,255,0.18)]">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                Newsletter status
              </p>
              <h2 className="mt-3 max-w-xl text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
                The Academy newsletter is being rolled out carefully, not faked with a dead form.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-blue-100">
                If you want updates before the live newsletter system is enabled, use
                the contact route or email directly and ask to be added to the early
                interest list.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Request updates
              </Link>
              <Link
                href={CONTACT_EMAIL_HREF}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Email {CONTACT_EMAIL}
              </Link>
              <p className="text-xs leading-6 text-blue-100 sm:col-span-2">
                This keeps the conversion path honest until a real newsletter backend
                and onboarding sequence are ready.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
