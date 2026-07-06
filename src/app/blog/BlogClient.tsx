import Image from "next/image";
import Link from "next/link";
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

const academyTopics = [
  {
    title: "SEO",
    description: "Rank higher and get discovered with proven SEO strategies.",
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
    title: "AdSense & Monetization",
    description: "Turn traffic into revenue with AdSense and smarter monetization.",
    icon: <DollarIcon />,
    slugs: [
      "why-your-website-isnt-getting-leads",
      "email-marketing-for-small-business",
      "email-automation-architecture",
    ],
  },
  {
    title: "Web Design",
    description: "Design websites that build trust and drive conversions.",
    icon: <CodeWindowIcon />,
    slugs: [
      "how-to-build-a-small-business-website-that-converts",
      "homepage-structure-that-converts-visitors-into-customers",
      "high-converting-service-page",
      "04-writing-service-pages-that-convert",
    ],
  },
  {
    title: "Website Speed",
    description: "Improve Core Web Vitals and deliver a faster experience.",
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
    description: "Attract, engage, and convert your ideal audience.",
    icon: <GrowthChartIcon />,
    slugs: [
      "high-converting-landing-pages-guide",
      "landing-page-wireframe-local-service-business",
      "conversion-audit-checklist-service-homepage",
    ],
  },
  {
    title: "Case Studies",
    description: "Real projects and the decisions behind them.",
    icon: <AuditIcon />,
    slugs: [
      "jluxe-medical-aesthetics-case-study",
      "01-why-we-rebuilt-not-redesigned",
      "02-the-audit-that-created-the-roadmap",
      "08-results-mistakes-and-reusable-playbook",
    ],
  },
] as const;

const learningPaths = [
  {
    title: "Start a Profitable Website",
    description: "From idea to live site. Build a solid foundation and launch with confidence.",
    meta: "Guided path",
    icon: <CapIcon />,
  },
  {
    title: "Rank in Google",
    description: "Learn SEO step-by-step and grow sustainable organic traffic.",
    meta: "SEO path",
    icon: <SearchIcon />,
  },
  {
    title: "Monetize with Confidence",
    description: "Build revenue streams that scale without sacrificing user experience.",
    meta: "Revenue path",
    icon: <MonetizeIcon />,
  },
  {
    title: "Optimize & Scale",
    description: "Improve speed, conversions, and automation to scale your growth.",
    meta: "Scale path",
    icon: <ShieldIcon />,
  },
] as const;

const academySupportPaths = [
  {
    href: "/services/website-audit/",
    title: "Get a Website Audit",
    text: "Move from reading to diagnosis when you need clarity on trust, SEO, speed, and conversion blockers.",
  },
  {
    href: "/services/search-engine-optimisation/",
    title: "Connect Learning to SEO Implementation",
    text: "Use the Academy for strategy, then move into SEO implementation when service pages need hands-on cleanup.",
  },
  {
    href: "/tools/",
    title: "Use the Free Tools",
    text: "Check metadata, sitemaps, homepage quality, and launch readiness with practical utilities.",
  },
  {
    href: "/contact/",
    title: "Request a Website Review",
    text: "Talk to Web Growth when you want help applying the guidance to a live website.",
  },
] as const;

const masterResources = [
  {
    title: "Top Guides",
    description: "Step-by-step tutorials for every stage.",
    icon: <CapIcon />,
    href: "/blog/",
    cta: "Explore Guides",
  },
  {
    title: "Toolkits",
    description: "Free tools and resources to get more done.",
    icon: <AuditIcon />,
    href: "/tools/",
    cta: "Explore Tools",
  },
  {
    title: "Downloads",
    description: "Checklists, templates, and swipe files.",
    icon: <PencilIcon />,
    href: "/blog/",
    cta: "Browse Downloads",
  },
  {
    title: "Updates",
    description: "What is new in SEO, AdSense, and more.",
    icon: <GrowthChartIcon />,
    href: "/blog/",
    cta: "Read Updates",
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

export default function BlogClient({ posts }: Props) {
  const featured =
    findPost(posts, "how-to-build-a-small-business-website-that-converts") ?? posts[0];
  const latestPosts = posts.slice(0, 4);

  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <ClarityPageTags tags={{ page_type: "blog_index", content_group: "academy" }} />

      <SectionShell tone="canvas" spacing="hero" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
          <div className="absolute left-[-10%] top-[-6%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.12),transparent_70%)]" />
          <div className="absolute right-[-6%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.12),transparent_70%)]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              Web Growth Academy
            </p>
            <h1 className="mt-5 text-balance text-[3.8rem] font-semibold leading-[0.92] tracking-[-0.065em] text-slate-950 md:text-[5rem]">
              Learn. Apply.{" "}
              <span className="bg-[linear-gradient(90deg,#3557ff_0%,#7c5cff_70%,#5e7cff_100%)] bg-clip-text text-transparent">
                Grow.
              </span>
            </h1>
            <p className="mt-4 max-w-[33rem] text-[1.02rem] leading-8 text-slate-600">
              The Web Growth Academy is your hub for practical guides, strategies,
              and tools to build better websites, rank higher, and monetize with
              confidence.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/blog/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.28)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                Start With Foundations
              </Link>
              <Link
                href="#academy-topics"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                Browse All Topics
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((item) => (
                  <span
                    key={item}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#dbeafe_0%,#ede9fe_100%)] text-[11px] font-bold text-blue-700 shadow-sm"
                  >
                    WG
                  </span>
                ))}
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Join growth-focused website owners
              </p>
            </div>
          </div>

          {featured ? (
            <article className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
              <div className="relative h-32 bg-[linear-gradient(135deg,#7aa2ff_0%,#4f6bff_36%,#7c5cff_100%)] md:h-36">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
              </div>
              <div className="p-7 md:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  Featured insight
                </p>
                <h2 className="mt-4 text-[1.95rem] font-semibold leading-tight tracking-[-0.05em] text-slate-950 md:text-[2.15rem]">
                  {featured.title}
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">{featured.excerpt}</p>
                <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                  <span>By Web Growth</span>
                  <span>{formatPostDate(featured.date)}</span>
                  <span>{featured.readTime}</span>
                </div>
                <Link
                  href={`/blog/${featured.slug}/`}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                >
                  Read featured guide
                </Link>
              </div>
            </article>
          ) : null}
        </div>
      </SectionShell>

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
              strategy, conversions, performance, and growth systems so businesses
              can understand what to improve before they invest.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Each article is meant to answer a clear website-growth question,
              connect to related resources, and create a sensible next step into
              tools, services, or implementation planning.
            </p>
          </article>

          <article className="rounded-[1.55rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Implementation paths
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {academySupportPaths.map((item) => (
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
              Find exactly what you need to grow your website.
            </p>
          </div>
          <Link
            href="/blog/"
            className="inline-flex min-h-11 items-center rounded-xl text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            View all topics -&gt;
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {academyTopics.map((topic) => {
            const count = topic.slugs.filter((slug) => posts.some((post) => post.slug === slug)).length;

            return (
              <Link
                key={topic.title}
                href="/blog/"
                className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(79,107,255,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                <IconBadge tone="blue" className="h-11 w-11 rounded-[1rem]">
                  {topic.icon}
                </IconBadge>
                <h3 className="mt-5 text-[1.3rem] font-semibold tracking-[-0.03em] text-slate-950">
                  {topic.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{topic.description}</p>
                <p className="mt-5 text-sm font-semibold text-blue-700">
                  {count} {count === 1 ? "article" : "articles"}
                </p>
              </Link>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Learning paths
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Structured paths to take you from where you are to where you want to be.
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
              href="/blog/"
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
              <p className="mt-5 text-sm font-semibold text-blue-700">{path.meta}</p>
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
              Actionable insights, strategies, and tutorials.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "SEO", "Monetization", "Web Design", "Speed"].map((label, index) => (
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
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Master your growth
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-[3.05rem]">
            Curated resources to help you implement faster
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Move from reading to action with tools, downloads, and strategic resource hubs.
          </p>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-4">
          {masterResources.map((item) => (
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
                Stay ahead
              </p>
              <h2 className="mt-3 max-w-xl text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
                Get the latest growth strategies delivered to your inbox.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-blue-100">
                Weekly insights, new guides, and proven tactics to grow your website.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="email"
                placeholder="Enter your email address"
                aria-label="Email address"
                disabled
                className="min-h-12 rounded-xl border border-white/30 bg-white px-4 text-sm text-slate-500 shadow-sm disabled:cursor-not-allowed disabled:opacity-100"
              />
              <button
                type="button"
                disabled
                className="min-h-12 rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.22)] disabled:cursor-not-allowed disabled:opacity-100"
              >
                Subscribe Now
              </button>
              <p className="text-xs leading-6 text-blue-100 sm:col-span-2">
                Newsletter UI is shown as part of the rebuild direction. The live
                backend will only be enabled when the audience system is ready.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
