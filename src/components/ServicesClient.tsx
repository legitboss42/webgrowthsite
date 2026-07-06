import Link from "next/link";
import CinematicOrbitScene from "@/components/home/CinematicOrbitScene";
import {
  AttractIcon,
  BuildIcon,
  ConvertIcon,
  GrowthChartIcon,
  IconBadge,
  MonetizeIcon,
  OptimizeIcon,
  PlanIcon,
  SearchIcon,
  ShieldIcon,
  SpeedIcon,
  TargetIcon,
} from "@/components/home/HomeIcons";
import SectionShell from "@/components/home/SectionShell";
import { ProofDeviceMockup } from "@/components/home/HomepageVisuals";
import type { Post } from "@/lib/posts";
import { getPublicPosts } from "@/lib/posts";

export type Service = {
  title: string;
  short: string;
  slug: string;
  serviceParam: string;
  bullets: string[];
  image: string;
};

type Props = {
  services?: Service[];
};

const heroSteps = [
  {
    number: "1",
    title: "Strategy",
    description: "Growth diagnosis, site planning, and architecture.",
    angleClass: "-rotate-90",
    cardClass: "-translate-x-1/2 -translate-y-[20%]",
    icon: <PlanIcon />,
  },
  {
    number: "2",
    title: "Build",
    description: "Conversion-focused website development.",
    angleClass: "-rotate-[30deg]",
    cardClass: "translate-x-[20%] -translate-y-[24%]",
    icon: <BuildIcon />,
  },
  {
    number: "3",
    title: "Optimize",
    description: "Speed, SEO, and UX optimization.",
    angleClass: "rotate-[30deg]",
    cardClass: "translate-x-[22%] -translate-y-[24%]",
    icon: <OptimizeIcon />,
  },
  {
    number: "4",
    title: "Monetize",
    description: "Offers, affiliates, and revenue systems.",
    angleClass: "rotate-[145deg]",
    cardClass: "-translate-x-[124%] -translate-y-[26%]",
    icon: <MonetizeIcon />,
  },
  {
    number: "5",
    title: "Analyze",
    description: "Tracking, reporting, and insights.",
    angleClass: "rotate-90",
    cardClass: "-translate-x-1/2 -translate-y-[20%]",
    icon: <GrowthChartIcon />,
  },
  {
    number: "6",
    title: "Convert",
    description: "CRO, funnels, and user-journey optimization.",
    angleClass: "-rotate-[145deg]",
    cardClass: "-translate-x-[124%] -translate-y-[26%]",
    icon: <ConvertIcon />,
  },
] as const;

const processSteps = [
  {
    label: "01",
    title: "Discover",
    text: "Audit, research, and competitor analysis",
    icon: <SearchIcon />,
  },
  {
    label: "02",
    title: "Plan",
    text: "Strategy, architecture, and content roadmap",
    icon: <PlanIcon />,
  },
  {
    label: "03",
    title: "Build",
    text: "Design, develop, and quality assurance",
    icon: <BuildIcon />,
  },
  {
    label: "04",
    title: "Optimize",
    text: "Speed, SEO, UX, and conversion tuning",
    icon: <OptimizeIcon />,
  },
  {
    label: "05",
    title: "Grow",
    text: "Content, authority, and traffic compounding",
    icon: <AttractIcon />,
  },
  {
    label: "06",
    title: "Monetize",
    text: "Revenue systems and scaling strategy",
    icon: <MonetizeIcon />,
  },
] as const;

const faqItems = [
  {
    question: "How long does a project take?",
    answer:
      "The timeline depends on scope, page count, content readiness, integrations, and whether strategy work needs to happen before design or development.",
  },
  {
    question: "What do I need to get started?",
    answer:
      "A clear business offer, access to the current site or analytics where relevant, and enough context for us to diagnose whether the problem is trust, traffic, conversion, or technical performance.",
  },
  {
    question: "Do you work with multiple CMS platforms?",
    answer:
      "Yes. The right platform depends on your content needs, editing workflow, performance priorities, and how much growth flexibility the business needs over time.",
  },
  {
    question: "Do you offer ongoing support?",
    answer:
      "Yes, when the engagement needs maintenance, optimization, reporting, or iterative improvements after launch.",
  },
  {
    question: "Will my website be SEO-friendly?",
    answer:
      "That is part of the baseline. We build with search structure, performance, content intent, and indexation discipline in mind rather than treating SEO as a last-minute add-on.",
  },
  {
    question: "How do you measure success?",
    answer:
      "We look at the signals that matter for the service: stronger positioning, better lead quality, cleaner user journeys, improved search visibility, and more commercially useful website behavior.",
  },
] as const;

const growthInfrastructureServices = [
  {
    href: "/services/google-my-business-setup-optimisation/",
    title: "Google Business Profile Optimization",
    text: "Improve local visibility, Maps trust signals, and service-area clarity.",
  },
  {
    href: "/services/crm-system-setup-configuration/",
    title: "CRM System Setup",
    text: "Create cleaner lead routing, pipeline visibility, and follow-up structure.",
  },
  {
    href: "/services/booking-platform-setup-integration/",
    title: "Booking Platform Integration",
    text: "Reduce booking friction and improve completed appointments from the website.",
  },
  {
    href: "/services/analytics-tracking-setup/",
    title: "Analytics and Tracking Setup",
    text: "Measure enquiries, calls, and paid traffic performance with cleaner data.",
  },
  {
    href: "/services/email-marketing-setup-strategy/",
    title: "Email Marketing Strategy",
    text: "Build nurture systems that turn subscribers into better sales conversations.",
  },
  {
    href: "/services/marketing-automation-build-implementation/",
    title: "Marketing Automation",
    text: "Automate lead follow-up, lifecycle messaging, and conversion support.",
  },
  {
    href: "/services/domain-registration-hosting-guidance/",
    title: "Hosting and Launch Guidance",
    text: "Choose the right domain, DNS, SSL, and hosting setup before launch or migration.",
  },
  {
    href: "/services/website-maintenance/",
    title: "Website Maintenance",
    text: "Protect trust, uptime, and conversion-critical flows after launch.",
  },
] as const;

function pickServiceIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("seo")) return <SearchIcon />;
  if (lower.includes("landing")) return <TargetIcon />;
  if (lower.includes("performance")) return <SpeedIcon />;
  if (lower.includes("maintenance")) return <ShieldIcon />;
  if (lower.includes("analytics")) return <GrowthChartIcon />;
  if (lower.includes("booking")) return <ConvertIcon />;
  if (lower.includes("crm")) return <ConvertIcon />;
  if (lower.includes("marketing")) return <MonetizeIcon />;
  return <BuildIcon />;
}

function pickServiceLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

function selectCoreServices(services: Service[]) {
  const preferred = [
    "business-website-design",
    "website-redesign",
    "search-engine-optimisation",
    "performance-optimisation",
    "landing-page-design",
    "analytics-tracking-setup",
    "lead-magnet-strategy-build",
    "google-my-business-setup-optimisation",
    "website-maintenance",
  ];

  const map = new Map(services.map((service) => [service.slug.replace(/^\/services\/|\/$/g, ""), service]));
  const curated = preferred
    .map((slug) => map.get(slug))
    .filter((service): service is Service => Boolean(service));

  if (curated.length >= 9) return curated;
  return services.slice(0, 9);
}

function selectResources(): Post[] {
  const posts = getPublicPosts();
  const desired = [
    "small-business-website-seo-checklist",
    "how-to-make-your-website-load-fast",
    "homepage-structure-that-converts-visitors-into-customers",
    "jluxe-medical-aesthetics-case-study",
  ];

  const map = new Map(posts.map((post) => [post.slug, post]));
  return desired
    .map((slug) => map.get(slug))
    .filter((post): post is Post => Boolean(post));
}

export default function ServicesClient({ services = [] }: Props) {
  const coreServices = selectCoreServices(services);
  const resources = selectResources();

  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <SectionShell tone="canvas" spacing="hero" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
          <div className="absolute left-[-8%] top-[-8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.15),transparent_66%)]" />
          <div className="absolute right-[-6%] top-[2%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.14),transparent_72%)]" />
        </div>

        <CinematicOrbitScene className="relative">
          <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div className="relative z-10 pt-4">
              <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
                Services
              </p>

              <h1 className="mt-4 max-w-[34rem] text-balance text-[3.85rem] font-semibold leading-[0.89] tracking-[-0.075em] text-slate-950 md:text-[5.2rem]">
                Growth-Focused
                <br />
                Web Solutions
                <br />
                That Deliver Real{" "}
                <span className="bg-[linear-gradient(90deg,#3557ff_0%,#7c5cff_65%,#5e7cff_100%)] bg-clip-text text-transparent">
                  Results.
                </span>
              </h1>

              <p className="mt-4 max-w-[33rem] text-[1.02rem] leading-8 text-slate-600">
                We build, optimize, and scale websites that attract the right traffic,
                earn trust, and convert visitors into customers more consistently.
              </p>

              <ul className="mt-4 space-y-3">
                {[
                  "Strategy-led solutions. Not cookie-cutter builds.",
                  "Built for SEO, speed, and long-term growth.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                    <IconBadge tone="blue" shape="circle" className="mt-0.5 h-6 w-6 shrink-0">
                      <SearchIcon className="h-3.5 w-3.5" />
                    </IconBadge>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(79,107,255,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                >
                  Start With a Website Review
                </Link>
                <Link
                  href="/blog/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-transparent px-3 text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                >
                  Explore the Academy -&gt;
                </Link>
              </div>
            </div>

            <div className="relative z-10">
              <div className="relative mx-auto flex w-full max-w-[44rem] items-center justify-center translate-x-2 lg:translate-x-4">
                <div className="relative aspect-square w-full">
                  <div
                    data-orbit-glow
                    className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.18)_0%,rgba(124,92,255,0.14)_38%,transparent_72%)] blur-3xl"
                  />
                  <div data-orbit-ring className="pointer-events-none absolute inset-[0.2%] rounded-full border border-blue-100/70" />
                  <div data-orbit-ring className="pointer-events-none absolute inset-[4%] rounded-full border border-dashed border-violet-200/70" />
                  <div data-orbit-ring className="pointer-events-none absolute inset-[8%] rounded-full border-2 border-blue-500/80 border-r-violet-500 border-b-blue-300" />
                  <div data-orbit-ring className="pointer-events-none absolute inset-[16%] rounded-full border border-blue-100/70" />
                  <div data-orbit-ring className="pointer-events-none absolute inset-[24%] rounded-full border border-dashed border-slate-200" />

                  <div className="absolute left-1/2 top-1/2 z-20 flex h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/97 text-center shadow-[0_24px_60px_rgba(15,23,42,0.09)]">
                    <div className="px-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                        Web Growth
                      </p>
                      <p className="mt-2 text-[2rem] font-semibold leading-tight tracking-[-0.055em] text-slate-950">
                        Service
                        <br />
                        Architecture
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        A connected system for compounding growth.
                      </p>
                    </div>
                  </div>

                  {heroSteps.map((step) => (
                    <div
                      key={step.number}
                      data-orbit-track
                      className={["absolute inset-[0.5%]", step.angleClass].join(" ")}
                    >
                      <div className="relative h-full w-full">
                        <div
                          data-orbit-card
                          className={[
                            "absolute left-1/2 top-0 w-[7rem] md:w-[7.4rem]",
                            step.cardClass,
                          ].join(" ")}
                        >
                          <div className="rounded-[1.35rem] border border-white/85 bg-white/96 p-2.5 text-center shadow-[0_12px_24px_rgba(79,107,255,0.06)] backdrop-blur">
                            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[1rem] border border-blue-100 bg-[linear-gradient(135deg,#eef4ff_0%,#f5efff_100%)] text-sm font-bold text-blue-700 shadow-sm">
                              {step.icon}
                            </div>
                            <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.18em] text-blue-700">
                              {step.number}
                            </p>
                            <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-950">
                              {step.title}
                            </p>
                            <p className="mt-1 text-[9px] leading-4 text-slate-500">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CinematicOrbitScene>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Direct answer
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              What do Web Growth services actually help with?
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Web Growth services help businesses build stronger websites, improve
              search visibility, fix conversion blockers, and install the tracking,
              automation, and support systems needed to grow and monetize more
              reliably.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              This page covers both the visible website work and the growth
              infrastructure behind it, so buyers can move from diagnosis to
              implementation without piecing together separate providers.
            </p>
          </article>

          <article className="rounded-[1.55rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Growth infrastructure
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {growthInfrastructureServices.map((item) => (
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

      <SectionShell tone="white" spacing="default">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-[0_28px_70px_rgba(15,23,42,0.06)] md:px-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Our core services
          </p>
          <h2 className="mt-4 text-center text-4xl font-semibold tracking-[-0.06em] text-slate-950 md:text-[3.2rem]">
            Everything Your Website Needs to Grow
          </h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {coreServices.map((service, index) => (
              <Link
                key={service.slug}
                href={service.slug}
                className="rounded-[1.45rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_38px_rgba(79,107,255,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                <div className="flex items-start gap-3">
                  <IconBadge tone="blue" className="h-11 w-11 rounded-[1rem]">
                    {pickServiceIcon(service.title)}
                  </IconBadge>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      {pickServiceLabel(index)}
                    </p>
                    <h3 className="mt-1 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                      {service.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{service.short}</p>
                <p className="mt-4 text-sm font-semibold text-blue-700">Learn more -&gt;</p>
              </Link>
            ))}
          </div>

          <div className="mt-7 text-center">
            <Link
              href="/services/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            >
              See All Services -&gt;
            </Link>
          </div>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Our process. Your outcomes.
        </p>
        <h2 className="mt-4 text-center text-4xl font-semibold tracking-[-0.06em] text-slate-950 md:text-[3.1rem]">
          A Growth System, Not Just a Checklist
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-8 text-slate-600">
          We follow a proven framework that turns your website into your strongest
          growth asset.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-6">
          {processSteps.map((step) => (
            <div key={step.label} className="relative rounded-[1.3rem] bg-transparent p-2 text-center">
              <IconBadge tone="blue" shape="circle" className="mx-auto h-11 w-11">
                {step.icon}
              </IconBadge>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                {step.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="overflow-hidden rounded-[1.9rem] border border-blue-950/60 bg-[radial-gradient(circle_at_86%_18%,rgba(108,84,255,0.42),transparent_24%),linear-gradient(135deg,#091226_0%,#0c1631_48%,#0b1230_100%)] px-6 py-7 shadow-[0_26px_70px_rgba(6,14,35,0.28)] md:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                Proof built on real implementation
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {[
                  ["Live website launches", "Across service, redesign, and local business projects."],
                  ["SEO-ready structure", "Built around performance, content, and indexation discipline."],
                  ["Conversion clarity", "Offers, trust, and user journeys designed to work together."],
                  ["Long-term support", "Ongoing care, updates, tracking, and optimization where needed."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-white">
                    <p className="text-lg font-semibold tracking-[-0.03em]">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="relative min-h-[18rem]">
                <ProofDeviceMockup />
              </div>
              <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4 text-white">
                <p className="text-sm font-semibold">Featured live project</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">J Luxe Medical Aesthetics</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Premium treatment presentation, calmer trust signals, and a clearer
                  consultation path across devices.
                </p>
                <Link href="/portfolio/" className="mt-3 inline-flex text-sm font-semibold text-blue-200">
                  View case study -&gt;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Learn. Apply. Grow.
        </p>
        <h2 className="mt-4 text-center text-4xl font-semibold tracking-[-0.06em] text-slate-950 md:text-[3.1rem]">
          Resources to Help You Win Online
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-8 text-slate-600">
          Step-by-step strategies, guides, and playbooks from our Academy.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {resources.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="group rounded-[1.45rem] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(79,107,255,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            >
              <div
                className={[
                  "h-28 rounded-[1.1rem]",
                  index === 0
                    ? "bg-[linear-gradient(135deg,#2647ff_0%,#4f6bff_40%,#7c5cff_100%)]"
                    : index === 1
                      ? "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_60%,#334155_100%)]"
                      : index === 2
                        ? "bg-[linear-gradient(135deg,#f3f4f6_0%,#ffffff_52%,#eef4ff_100%)]"
                        : "bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_80%,#312e81_100%)]",
                ].join(" ")}
              />
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                {post.category}
              </p>
              <h3 className="mt-2 text-[1.15rem] font-semibold leading-6 tracking-[-0.03em] text-slate-950">
                {post.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
              <p className="mt-4 text-sm font-semibold text-blue-700">
                {index === 1 ? "View Tutorial" : index === 3 ? "View Case Study" : "Read Guide"} -&gt;
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-7 text-center">
          <Link
            href="/blog/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            Explore All Academy Resources -&gt;
          </Link>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Common questions
        </p>
        <h2 className="mt-4 text-center text-4xl font-semibold tracking-[-0.05em] text-slate-950">
          Quick Answers to Common Questions
        </h2>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-[1.2rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-950">
                <span>{item.question}</span>
                <span className="text-blue-700 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="overflow-hidden rounded-[1.8rem] border border-blue-200 bg-[radial-gradient(circle_at_14%_24%,rgba(59,130,246,0.22),transparent_24%),radial-gradient(circle_at_92%_18%,rgba(124,92,255,0.22),transparent_22%),linear-gradient(135deg,#2f53ff_0%,#4f6bff_45%,#7c3aed_100%)] px-8 py-9 shadow-[0_26px_70px_rgba(79,107,255,0.18)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="max-w-2xl text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
                Ready to Build, Grow & Monetize Your Website?
              </h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-blue-100">
                Get a free website review and a custom growth plan built for your
                goals.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-[1.3rem] bg-white/12 p-4 backdrop-blur">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Start My Website Review -&gt;
              </Link>
              <p className="text-sm text-blue-100">
                No obligation. Just actionable insights.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
