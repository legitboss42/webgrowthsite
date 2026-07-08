import { Suspense } from "react";
import Link from "next/link";
import ContactClient from "@/components/ContactClient";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/analytics/TrackedLink";
import {
  AuditIcon,
  BuildIcon,
  ConvertIcon,
  GrowthChartIcon,
  IconBadge,
  SearchIcon,
} from "@/components/home/HomeIcons";
import SectionShell from "@/components/home/SectionShell";
import {
  buildPageMetadata,
  buildProfessionalServiceSchema,
} from "@/lib/seo";
import {
  BUSINESS_PHONE_DISPLAY,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  buildWhatsAppUrl,
} from "@/lib/site";
import { isEmailDeliveryConfigured } from "@/lib/email";

const pageDescription =
  "Request a website review from Web Growth. Send your website link or business details and get guidance on clarity, trust, speed, mobile experience, and enquiry flow.";

export const metadata = buildPageMetadata({
  title: "Contact Web Growth | Website Review, SEO, and Redesign Enquiries",
  description: pageDescription,
  path: "/contact/",
  keywords: [
    "contact web growth",
    "request a website review",
    "website review request",
    "website audit enquiry",
    "website redesign enquiry",
    "website speed review",
  ],
});

const reasons = [
  {
    title: "Website Review",
    text: "Get a comprehensive review of your website and growth opportunities.",
    icon: <SearchIcon />,
  },
  {
    title: "Growth Strategy",
    text: "Discuss your goals and get a custom roadmap to grow traffic, leads, and revenue.",
    icon: <GrowthChartIcon />,
  },
  {
    title: "Project Enquiry",
    text: "Planning a redesign, migration, or new build? Let's make it a success.",
    icon: <BuildIcon />,
  },
  {
    title: "Partnership",
    text: "Agencies, SaaS, and brands. We love building strategic partnerships.",
    icon: <ConvertIcon />,
  },
] as const;

const popularStartingPoints = [
  {
    href: "/services/website-audit/",
    title: "Website Audit",
    description:
      "Start here when you need to find the main trust, conversion, SEO, or performance blockers first.",
  },
  {
    href: "/services/website-redesign/",
    title: "Website Redesign",
    description:
      "Start here when the current site feels outdated, unclear, or too weak to support serious enquiries.",
  },
  {
    href: "/services/search-engine-optimisation/",
    title: "SEO Service",
    description:
      "Start here when you need stronger search visibility, internal linking, and better commercial page targeting.",
  },
  {
    href: "/blog/small-business-website-seo-checklist/",
    title: "SEO Checklist Guide",
    description:
      "Start here if you want a practical next read before deciding whether the problem is traffic, trust, or conversion.",
  },
] as const;

const nextSteps = [
  {
    number: "1",
    title: "We review your message",
    text: "Our team reviews your information and website.",
    meta: "Within 1 business day",
    icon: <SearchIcon />,
  },
  {
    number: "2",
    title: "We analyse & respond",
    text: "You will receive tailored insights and recommendations.",
    meta: "1-2 days",
    icon: <AuditIcon />,
  },
  {
    number: "3",
    title: "We hop on a call",
    text: "Optional strategy call to discuss opportunities in detail.",
    meta: "15-30 minutes",
    icon: <GrowthChartIcon />,
  },
  {
    number: "4",
    title: "We build your roadmap",
    text: "Clear next steps to grow your website and your business.",
    meta: "Actionable plan",
    icon: <BuildIcon />,
  },
] as const;

const faqItems = [
  {
    question: "How long does a website review take?",
    answer: "Most reviews are delivered within 1-2 business days.",
  },
  {
    question: "Is there a cost for the review?",
    answer: "No. Our website review is completely free.",
  },
  {
    question: "Do you work with businesses outside my niche?",
    answer: "Yes, we work with a wide range of industries.",
  },
] as const;

export default function ContactPage() {
  const directDeliveryConfigured = isEmailDeliveryConfigured();
  const whatsappHref = buildWhatsAppUrl(
    "Hello Web Growth, I would like a website review. Here is my website/business detail:"
  );

  return (
    <>
      <StructuredData data={buildProfessionalServiceSchema("/contact/", pageDescription)} />

      <main className="bg-[#f7f8fc] text-slate-950">
        <SectionShell tone="canvas" spacing="hero" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="absolute left-[-10%] top-[-6%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.12),transparent_70%)]" />
            <div className="absolute right-[-6%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.12),transparent_70%)]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
                Let&apos;s grow together
              </p>
              <h1 className="mt-5 max-w-[35rem] text-balance text-[3.7rem] font-semibold leading-[0.92] tracking-[-0.065em] text-slate-950 md:text-[5rem]">
                Request a Website Review and build your next{" "}
                <span className="bg-[linear-gradient(90deg,#3557ff_0%,#7c5cff_70%,#5e7cff_100%)] bg-clip-text text-transparent">
                  growth chapter.
                </span>
              </h1>
              <p className="mt-4 max-w-[33rem] text-[1.02rem] leading-8 text-slate-600">
                Get a website review, ask a question, or discuss a project. We&apos;ll
                respond within 1 business day.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  ["Strategic first", "We look at the big picture."],
                  ["Data-backed", "Our recommendations are evidence-driven."],
                  ["Results-focused", "Everything we do ties to growth."],
                ].map(([title, text]) => (
                  <div key={title} className="flex gap-3">
                    <IconBadge tone="blue" className="mt-1 h-8 w-8 rounded-[0.9rem]">
                      <SearchIcon className="h-4 w-4" />
                    </IconBadge>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#contact-form"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.28)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                >
                  Start With a Website Review
                </Link>
                <Link
                  href="/portfolio/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                >
                  See Case Studies
                </Link>
              </div>
            </div>

            <div className="relative min-h-[23rem]">
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_62%_16%,rgba(124,92,255,0.14),transparent_30%),radial-gradient(circle_at_20%_72%,rgba(79,107,255,0.1),transparent_30%)]" />
              <div className="absolute right-6 top-2 w-[21rem] rotate-[12deg] rounded-[1.9rem] border border-white/80 bg-white/90 p-5 shadow-[0_30px_70px_rgba(15,23,42,0.09)] backdrop-blur">
                <p className="text-sm font-semibold text-slate-950">Website Review</p>
                <div className="mt-4 space-y-3">
                  {["SEO", "Performance", "UX", "Monetization"].map((item, index) => (
                    <div key={item}>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>{item}</span>
                        <span>{index < 2 ? "Priority" : "Review"}</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#4f6bff_0%,#7c5cff_100%)]"
                          style={{ width: `${58 + index * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-6 left-8 w-[19rem] rotate-[-8deg] rounded-[1.8rem] border border-white/80 bg-white/80 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="text-sm font-semibold text-slate-950">What happens next</p>
                <div className="mt-4 space-y-3">
                  {["We review your message", "We analyse and respond", "We recommend the next step"].map((item) => (
                    <div key={item} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell tone="white" spacing="compact">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Suspense
              fallback={
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-600 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
                  Loading form...
                </div>
              }
            >
              <ContactClient directDeliveryConfigured={directDeliveryConfigured} />
            </Suspense>

            <div className="space-y-5">
              <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  Good reasons to reach out
                </h2>
                <div className="mt-6 space-y-5">
                  {reasons.map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <IconBadge tone="blue" className="h-10 w-10 rounded-[1rem] shrink-0">
                        {item.icon}
                      </IconBadge>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Popular Starting Points
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  If you already know the type of help you need, start with the page that best matches the problem.
                </p>
                <div className="mt-6 space-y-4">
                  {popularStartingPoints.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.6rem] border border-blue-950/60 bg-[radial-gradient(circle_at_88%_14%,rgba(108,84,255,0.42),transparent_24%),linear-gradient(135deg,#091226_0%,#0c1631_48%,#0b1230_100%)] p-6 text-white shadow-[0_26px_70px_rgba(6,14,35,0.28)]">
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">Need a quick answer?</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Chat with our growth team on WhatsApp for faster support.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Response time: usually within a few hours.
                </p>
                <TrackedLink
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/16"
                  ctaName="whatsapp"
                  ctaLocation="contact_whatsapp_section"
                  destination="whatsapp"
                  pageType="contact"
                  offerType="website_review"
                >
                  Message us on WhatsApp
                </TrackedLink>
                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  <p>
                    Email:{" "}
                    <a href={CONTACT_EMAIL_HREF} className="text-blue-200 hover:text-white">
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                  <p>
                    WhatsApp:{" "}
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className="text-blue-200 hover:text-white">
                      {BUSINESS_PHONE_DISPLAY}
                    </a>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </SectionShell>

        <SectionShell tone="canvas" spacing="compact">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Our process
          </p>
          <h2 className="mt-4 text-center text-4xl font-semibold tracking-[-0.05em] text-slate-950">
            What happens next?
          </h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {nextSteps.map((step) => (
              <article
                key={step.number}
                className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-700">{step.number}</span>
                  <IconBadge tone="blue" className="h-10 w-10 rounded-[1rem]">
                    {step.icon}
                  </IconBadge>
                </div>
                <h3 className="mt-5 text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
                <p className="mt-5 text-sm font-semibold text-blue-700">{step.meta}</p>
              </article>
            ))}
          </div>
        </SectionShell>

        <SectionShell tone="canvas" spacing="compact">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Common questions
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                Have a different question?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Here are quick answers to what we hear most.
              </p>
            </div>
            <Link
              href="/faq/"
              className="inline-flex min-h-11 items-center rounded-xl text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            >
              View all FAQs -&gt;
            </Link>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
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
          <div className="overflow-hidden rounded-[1.8rem] border border-blue-950/60 bg-[radial-gradient(circle_at_88%_14%,rgba(108,84,255,0.42),transparent_24%),linear-gradient(135deg,#091226_0%,#0c1631_48%,#0b1230_100%)] px-8 py-9 shadow-[0_26px_70px_rgba(6,14,35,0.28)]">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="max-w-2xl text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
                  Ready to grow your website the right way?
                </h2>
                <p className="mt-3 max-w-xl text-base leading-8 text-blue-100">
                  Start with a free review and get a clear path to more traffic, leads,
                  and revenue.
                </p>
              </div>

              <Link
                href="#contact-form"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Start With a Website Review
              </Link>
            </div>
          </div>
        </SectionShell>
      </main>
    </>
  );
}
