import Image from "next/image";
import Link from "next/link";
import CinematicHero from "@/components/platform/CinematicHero";
import SectionReveal from "@/components/platform/SectionReveal";
import {
  BuildIcon,
  ConvertIcon,
  GrowthChartIcon,
  IconBadge,
  OptimizeIcon,
  PlanIcon,
  SearchIcon,
} from "@/components/home/HomeIcons";
import SectionShell from "@/components/home/SectionShell";
import { ProofDeviceMockup } from "@/components/home/HomepageVisuals";
import { portfolioCases } from "@/lib/portfolioCases";

const systemSteps = [
  {
    title: "Plan",
    text: "Research, positioning, and site architecture",
    icon: <PlanIcon />,
  },
  {
    title: "Build",
    text: "SEO-ready structure and content foundation",
    icon: <BuildIcon />,
  },
  {
    title: "Optimize",
    text: "Technical, analytics, and UX refinement",
    icon: <OptimizeIcon />,
  },
  {
    title: "Convert",
    text: "Turn traffic into revenue with CRO and offers",
    icon: <ConvertIcon />,
  },
] as const;

export default function PortfolioClient() {
  const featuredCase = portfolioCases[0];
  const supportingCases = portfolioCases.slice(1, 4);

  if (!featuredCase) {
    return null;
  }

  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <CinematicHero
        eyebrow={`Case studies / ${featuredCase.industry}`}
        title={<>The work, <span className="text-accent-gold">and the thinking behind it.</span></>}
        description="Real project context, strategic decisions, and implementation evidence. No invented performance claims and no gallery without explanation."
        pageType="portfolio_hub"
        variant="case-study"
        primaryAction={{ label: "Discuss Your Website", href: "/contact/", ctaName: "discuss_website", destination: "contact" }}
        secondaryAction={{ label: "Explore Services", href: "/services/", ctaName: "explore_services", destination: "services" }}
        aside={
          <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-border-hairline shadow-2xl">
            <Image src={featuredCase.imageUrl} alt={featuredCase.imageAlt} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 620px" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-ink via-bg-ink/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-gold">Featured project</p>
              <p className="mt-2 font-display text-3xl text-text-primary">{featuredCase.title}</p>
              <p className="mt-2 text-sm text-text-muted">{featuredCase.whatToNotice}</p>
            </div>
          </div>
        }
      />

      <SectionShell tone="dark" spacing="compact">
        <SectionReveal className="grid gap-px overflow-hidden rounded-2xl border border-border-hairline bg-border-hairline lg:grid-cols-3">
          <article className="bg-bg-ink p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">01</p>
            <h2 className="mt-4 font-display text-3xl font-normal tracking-[-0.04em] text-text-primary">
              The Challenge
            </h2>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              {featuredCase.purpose}
            </p>
            <ul className="mt-5 space-y-2">
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                <span>Trust and clarity needed to happen earlier in the journey.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                <span>Responsive presentation needed to feel more premium and useful.</span>
              </li>
            </ul>
          </article>

          <article className="bg-bg-ink p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">02</p>
            <h2 className="mt-4 font-display text-3xl font-normal tracking-[-0.04em] text-text-primary">
              Our Strategy
            </h2>
            <ul className="mt-4 space-y-3">
              {featuredCase.stack.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-slate-600">
                  <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="bg-bg-ink p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">03</p>
            <h2 className="mt-4 font-display text-3xl font-normal tracking-[-0.04em] text-text-primary">
              Implementation
            </h2>
            <ul className="mt-4 space-y-3">
              {featuredCase.results.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-slate-600">
                  <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </SectionReveal>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Direct answer
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              What do these case studies show?
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Web Growth case studies show how strategy, structure, trust design,
              SEO readiness, and conversion thinking come together on real business
              websites. They are meant to explain the reasoning behind the work, not
              inflate claims with invented metrics.
            </p>
          </article>

          <article className="rounded-[1.55rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Related paths
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/services/website-redesign/" className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200">
                <h3 className="text-sm font-semibold text-slate-950">Website Redesign</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">See the service used when trust, structure, and positioning need a broader reset.</p>
              </Link>
              <Link href="/services/website-audit/" className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200">
                <h3 className="text-sm font-semibold text-slate-950">Website Audit</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Start with diagnosis when you need clarity before committing to implementation.</p>
              </Link>
              <Link href="/blog/" className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200">
                <h3 className="text-sm font-semibold text-slate-950">Academy</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Use related Academy guides to understand the SEO, UX, and conversion decisions behind the work.</p>
              </Link>
              <Link href="/contact/" className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200">
                <h3 className="text-sm font-semibold text-slate-950">Request a Review</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Discuss your current website if you want a realistic next-step recommendation.</p>
              </Link>
            </div>
          </article>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_22px_54px_rgba(15,23,42,0.06)]">
          <div className="grid gap-8 px-6 py-7 md:px-8 md:py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                The Web Growth system in action
              </p>
              <div className="mt-6 space-y-3">
                {systemSteps.map((step) => (
                  <div
                    key={step.title}
                    className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <IconBadge tone="blue" className="h-10 w-10 rounded-[1rem]">
                      {step.icon}
                    </IconBadge>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
              <div>
                <h2 className="text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                  Strategic planning and architecture built for long-term growth.
                </h2>
                <ul className="mt-5 space-y-3">
                  {[
                    "Keyword and intent mapping",
                    "Competitor gap analysis",
                    "Content and internal linking plan",
                    "SEO-ready site structure",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-slate-600">
                      <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative min-h-[22rem]">
                <ProofDeviceMockup />
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Website screenshots
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[featuredCase, ...supportingCases].map((item) => (
            <article
              key={item.slug}
              className="overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.industry}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.45rem] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Related services
            </p>
            <div className="mt-5 space-y-4">
              {[
                { href: "/services/search-engine-optimisation/", label: "SEO Strategy & Growth" },
                { href: "/services/website-redesign/", label: "Website Redesign" },
                { href: "/services/performance-optimisation/", label: "Performance Optimisation" },
                { href: "/services/business-website-design/", label: "Business Website Design" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 text-sm font-medium text-slate-700 transition hover:text-blue-700"
                >
                  <IconBadge tone="blue" className="h-9 w-9 rounded-[0.9rem]">
                    <BuildIcon />
                  </IconBadge>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <Link
              href="/services/"
              className="mt-6 inline-flex text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              Explore all services -&gt;
            </Link>
          </article>

          <article className="rounded-[1.45rem] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Related Academy reads
            </p>
            <div className="mt-5 space-y-4">
              {[
                { href: "/blog/how-to-build-a-small-business-website-that-converts/", label: "How to Build a Small Business Website That Converts" },
                { href: "/blog/high-converting-service-page/", label: "High-Converting Service Page" },
                { href: "/blog/how-to-make-your-website-load-fast/", label: "How to Make Your Website Load Fast" },
                { href: "/blog/jluxe-medical-aesthetics-case-study/", label: "J Luxe Medical Aesthetics Case Study" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 text-sm font-medium text-slate-700 transition hover:text-blue-700"
                >
                  <IconBadge tone="purple" className="h-9 w-9 rounded-[0.9rem]">
                    <SearchIcon />
                  </IconBadge>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <Link
              href="/blog/"
              className="mt-6 inline-flex text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              Visit the Academy -&gt;
            </Link>
          </article>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="overflow-hidden rounded-[1.8rem] border border-blue-200 bg-[radial-gradient(circle_at_14%_24%,rgba(59,130,246,0.22),transparent_24%),radial-gradient(circle_at_92%_18%,rgba(124,92,255,0.22),transparent_22%),linear-gradient(135deg,#2f53ff_0%,#4f6bff_45%,#7c3aed_100%)] px-8 py-9 shadow-[0_26px_70px_rgba(79,107,255,0.18)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="max-w-2xl text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
                Ready to build your growth story?
              </h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-blue-100">
                Let&apos;s build a platform that attracts, converts, and compounds.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Start With a Website Review
              </Link>
              <Link
                href="/services/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Explore Our Services
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
