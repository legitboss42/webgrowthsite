"use client";

import Link from "next/link";
import SectionShell from "@/components/home/SectionShell";

const CONTACT_EMAIL = "admin@webgrowth.info";

const sections = [
  {
    title: "Use of the website",
    body: [
      "You agree to use this website for lawful purposes only. You must not attempt to disrupt, damage, or gain unauthorized access to any part of the website or related systems.",
    ],
  },
  {
    title: "Enquiries and proposals",
    body: [
      "Information on this site is provided for general purposes. Any quote, proposal, or timeline is confirmed only after we review your project requirements and agree on scope in writing.",
    ],
  },
  {
    title: "Scope of work",
    body: [
      "Project scope is defined in writing through a proposal, statement of work, or agreement. Work outside the agreed scope may require additional fees and timeline adjustments.",
    ],
  },
  {
    title: "Client responsibilities",
    body: [
      "Clients are responsible for providing timely approvals, accurate business information, and access to required tools or accounts where needed.",
      "Delays in providing these may affect delivery timelines.",
    ],
  },
  {
    title: "Payments and revisions",
    body: [
      "Payment terms, deposits, milestones, and revision limits are defined in the relevant proposal or invoice. Additional work or excessive revisions may require extra fees.",
    ],
  },
  {
    title: "Intellectual property",
    body: [
      "Unless stated otherwise, once final payment is received, you own the final deliverables created specifically for your project.",
      "Web Growth may continue using general techniques, reusable components, and non-client-specific code.",
    ],
  },
  {
    title: "Third-party tools and limitations",
    body: [
      "Websites may rely on hosting, analytics, plugins, payment tools, or other third-party services. Web Growth is not responsible for outages, policy changes, or service limitations imposed by those providers.",
    ],
  },
  {
    title: "Results and liability",
    body: [
      "Web Growth provides services with reasonable care and skill, but does not guarantee specific rankings, sales, traffic, or revenue outcomes.",
      "Business performance depends on many factors outside our control.",
    ],
  },
  {
    title: "Termination and updates",
    body: [
      "Either party may end a project with written notice. Work completed up to termination remains payable.",
      "These Terms may be updated from time to time, and the latest version will appear on this page.",
    ],
  },
] as const;

export default function TermsClient() {
  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <SectionShell tone="canvas" spacing="hero">
        <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
          Terms of Service
        </p>
        <h1 className="mt-5 max-w-4xl text-balance text-[3.6rem] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-950 md:text-[4.6rem]">
          The terms that govern use of the platform and project engagement with Web Growth.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          These terms apply to use of the website and, where applicable, the terms
          under which Web Growth provides website and growth services.
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
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-blue-700 hover:text-blue-800">
              {CONTACT_EMAIL}
            </a>
            . For project enquiries, use the{" "}
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
