"use client";

import Link from "next/link";
import SectionShell from "@/components/home/SectionShell";

const CONTACT_EMAIL = "admin@webgrowth.info";

const sections = [
  {
    title: "Information we collect",
    body: [
      "We may collect information you submit directly, such as your name, email address, phone number, business details, and website details when you contact us or request a review.",
      "We may also collect technical information such as browser type, pages visited, referral source, approximate location, and device data through analytics or server logs.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use submitted information to respond to enquiries, deliver requested services, improve the website experience, and understand which content or service pages are helping visitors best.",
      "We may also use data for analytics, spam prevention, and operational security.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "This website may use cookies or similar technologies for analytics, performance measurement, security, and user experience improvements.",
      "Analytics tools help us understand how people use the site so we can improve content quality, navigation, and conversions.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "Some forms, analytics, or communication workflows may rely on third-party service providers. Those providers process data according to their own terms and privacy policies.",
      "We use only the services required to operate, measure, or protect the platform.",
    ],
  },
  {
    title: "Data sharing",
    body: [
      "We do not sell personal data. Information is only shared when required to deliver a requested service, operate the website, comply with law, or protect the platform and its users.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can contact us to request access, correction, or deletion of personal information you submitted directly, subject to any legal or operational requirements that still apply.",
    ],
  },
  {
    title: "Updates to this policy",
    body: [
      "We may update this Privacy Policy when the website, services, or legal requirements change. The latest version will always appear on this page.",
    ],
  },
] as const;

export default function PrivacyClient() {
  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <SectionShell tone="canvas" spacing="hero">
        <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
          Privacy Policy
        </p>
        <h1 className="mt-5 max-w-4xl text-balance text-[3.6rem] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-950 md:text-[4.6rem]">
          How Web Growth handles information submitted through the platform.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          This page explains how Web Growth collects, uses, and protects information
          on the website.
        </p>
      </SectionShell>

      <SectionShell tone="white" spacing="compact">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
              <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="canvas" spacing="compact">
        <article className="rounded-[1.45rem] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
            Contact
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Questions about privacy or data handling can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-blue-700 hover:text-blue-800">
              {CONTACT_EMAIL}
            </a>
            . For general project enquiries, use the{" "}
            <Link href="/contact/" className="font-medium text-blue-700 hover:text-blue-800">
              contact page
            </Link>
            .
          </p>
        </article>
      </SectionShell>
    </main>
  );
}
