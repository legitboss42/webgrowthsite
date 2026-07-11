import Image from "next/image";
import Link from "next/link";
import CinematicHero from "@/components/platform/CinematicHero";
import {
  BuildIcon,
  GrowthChartIcon,
  IconBadge,
  MonetizeIcon,
  SearchIcon,
} from "@/components/home/HomeIcons";
import SectionShell from "@/components/home/SectionShell";

const principles = [
  {
    title: "Clarity before decoration",
    text: "Every page should make the offer, proof, and next step easier to understand.",
    icon: <BuildIcon />,
  },
  {
    title: "Performance as trust",
    text: "Speed, mobile quality, and technical stability are part of perceived brand value.",
    icon: <SearchIcon />,
  },
  {
    title: "Business-first execution",
    text: "The website should help generate enquiries, support SEO, and improve revenue potential.",
    icon: <GrowthChartIcon />,
  },
  {
    title: "Premium through discipline",
    text: "Polish comes from better hierarchy, structure, and implementation choices, not noise.",
    icon: <MonetizeIcon />,
  },
] as const;

const fitItems = [
  "Premium service businesses that need stronger trust and presentation",
  "Founders replacing a weak brochure site with a growth asset",
  "Local or national brands preparing for better SEO and conversion support",
  "Businesses that value senior-led implementation over cheap generic delivery",
] as const;

export default function AboutClient() {
  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <CinematicHero
        eyebrow="About Web Growth"
        title="A growth platform built with a human point of view."
        description="Web Growth is led by Victor Chinukwue for businesses that need more than a generic website: clearer trust, better search performance, stronger conversion flow, and responsible monetization."
        pageType="about"
        variant="split"
        primaryAction={{ label: "Request a Website Review", href: "/contact/", ctaName: "request_website_review", destination: "contact" }}
        secondaryAction={{ label: "View Services", href: "/services/", ctaName: "view_services", destination: "services" }}
        aside={
          <div className="relative ml-auto max-w-md overflow-hidden rounded-[2rem] border border-border-hairline shadow-2xl">
            <div className="relative aspect-[4/4.5]">
              <Image src="/images/about/about-hero.webp" alt="Victor Chinukwue, founder of Web Growth" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 420px" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-ink/80 via-transparent to-transparent" />
            </div>
          </div>
        }
      />

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Direct answer
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              What is Web Growth?
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Web Growth is a premium website growth platform. It combines services,
              Academy content, case studies, and practical tools to help businesses
              build stronger websites, grow qualified traffic, and monetize digital
              attention more responsibly.
            </p>
          </article>

          <article className="rounded-[1.55rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Trust surfaces
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/editorial-policy/" className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200">
                <h3 className="text-sm font-semibold text-slate-950">Editorial Policy</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">See how Academy content is planned, reviewed, updated, and corrected.</p>
              </Link>
              <Link href="/disclaimer/" className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200">
                <h3 className="text-sm font-semibold text-slate-950">Disclaimer</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Understand the limits around results claims, platform advice, and examples.</p>
              </Link>
              <Link href="/services/" className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200">
                <h3 className="text-sm font-semibold text-slate-950">Services</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Explore implementation support across design, SEO, performance, and growth systems.</p>
              </Link>
              <Link href="/blog/" className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200">
                <h3 className="text-sm font-semibold text-slate-950">Academy</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Use practical guides if you want to understand the thinking before you invest.</p>
              </Link>
            </div>
          </article>
        </div>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              What Web Growth does
            </p>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Web Growth combines premium website services, Academy-led education,
              future tools, and proof-driven case studies into one platform designed
              to help businesses build better websites, grow search traffic, and
              monetize more effectively.
            </p>
          </article>
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              What Web Growth is not
            </p>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              It is not a cheap template shop, a made-for-ads content site, or a
              generic freelancer brochure. The platform is designed around trust,
              performance, and practical implementation.
            </p>
          </article>
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Operating principles
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
          The standards behind the platform
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {principles.map((item) => (
            <article key={item.title} className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
              <IconBadge tone="blue" className="h-11 w-11 rounded-[1rem]">
                {item.icon}
              </IconBadge>
              <h3 className="mt-5 text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Best fit
            </p>
            <ul className="mt-5 space-y-3">
              {fitItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-7 text-slate-600">
                  <span className="mt-[9px] h-2 w-2 rounded-full bg-blue-500/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Next step
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              If the website is no longer helping the business, start with a direct review.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Web Growth helps clarify what should be rebuilt, what should be improved,
              and what will likely create the strongest commercial return first.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.28)] transition hover:brightness-105"
              >
                Request a Website Review
              </Link>
              <Link
                href="/portfolio/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
              >
                View Case Studies
              </Link>
            </div>
          </article>
        </div>
      </SectionShell>
    </main>
  );
}
