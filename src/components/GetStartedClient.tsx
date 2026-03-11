"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BOOKING_URL,
  CONTACT_EMAIL_HREF,
  GET_STARTED_PATH,
  buildWhatsAppUrl,
} from "@/lib/site";

type NeedOption =
  | "New website"
  | "Improve my current website"
  | "Landing page"
  | "Not sure yet";

type DomainOption = "Yes" | "No";

type LeadPayload = {
  submittedAt: string;
  projectNeed: NeedOption;
  hasDomain: DomainOption;
  fullName: string;
  businessName: string;
  email: string;
  phoneOrWhatsApp: string;
  selectedPackage?: string;
};

const PROJECT_NEEDS: NeedOption[] = [
  "New website",
  "Improve my current website",
  "Landing page",
  "Not sure yet",
];

const DOMAIN_OPTIONS: DomainOption[] = ["Yes", "No"];

function isExternalUrl(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function GetStartedClient() {
  const searchParams = useSearchParams();
  const selectedPackage = searchParams.get("package") || "";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [projectNeed, setProjectNeed] = useState<NeedOption | null>(null);
  const [hasDomain, setHasDomain] = useState<DomainOption | null>(null);
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneOrWhatsApp, setPhoneOrWhatsApp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const whatsappHref = useMemo(() => {
    const intro = "Hello, I just completed the Get Started form.";
    const lines = [
      intro,
      selectedPackage ? `Package: ${selectedPackage}` : "",
      projectNeed ? `Need: ${projectNeed}` : "",
      hasDomain ? `Have domain: ${hasDomain}` : "",
      fullName ? `Name: ${fullName}` : "",
      businessName ? `Business: ${businessName}` : "",
      email ? `Email: ${email}` : "",
      phoneOrWhatsApp ? `Phone/WhatsApp: ${phoneOrWhatsApp}` : "",
    ].filter(Boolean);
    return buildWhatsAppUrl(lines.join("\n"));
  }, [
    businessName,
    email,
    fullName,
    hasDomain,
    phoneOrWhatsApp,
    projectNeed,
    selectedPackage,
  ]);

  const mailtoHref = useMemo(() => {
    const subject = "New Get Started Request - Website Launch";
    const bodyLines = [
      "Hi Web Growth,",
      "",
      "I just completed the Get Started flow.",
      selectedPackage ? `Selected package: ${selectedPackage}` : "",
      projectNeed ? `What I need: ${projectNeed}` : "",
      hasDomain ? `Domain already owned: ${hasDomain}` : "",
      `Full name: ${fullName}`,
      `Business name: ${businessName}`,
      `Email: ${email}`,
      `Phone / WhatsApp: ${phoneOrWhatsApp}`,
      "",
      "Please send me the next steps.",
    ].filter(Boolean);
    return `${CONTACT_EMAIL_HREF}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      bodyLines.join("\n")
    )}`;
  }, [
    businessName,
    email,
    fullName,
    hasDomain,
    phoneOrWhatsApp,
    projectNeed,
    selectedPackage,
  ]);

  function saveLead() {
    const payload: LeadPayload = {
      submittedAt: new Date().toISOString(),
      projectNeed: projectNeed || "Not sure yet",
      hasDomain: hasDomain || "No",
      fullName: fullName.trim(),
      businessName: businessName.trim(),
      email: email.trim(),
      phoneOrWhatsApp: phoneOrWhatsApp.trim(),
      selectedPackage: selectedPackage || undefined,
    };

    try {
      const key = "wg_get_started_submissions";
      const currentRaw = window.localStorage.getItem(key);
      const current = currentRaw ? (JSON.parse(currentRaw) as LeadPayload[]) : [];
      const next = Array.isArray(current) ? [...current, payload] : [payload];
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // no-op fallback: user can still continue via mailto/WhatsApp buttons
    }
  }

  async function onSubmitDetails(e: FormEvent) {
    e.preventDefault();
    if (!projectNeed || !hasDomain) return;
    if (!fullName.trim() || !businessName.trim() || !email.trim() || !phoneOrWhatsApp.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");

    const payload: LeadPayload = {
      submittedAt: new Date().toISOString(),
      projectNeed,
      hasDomain,
      fullName: fullName.trim(),
      businessName: businessName.trim(),
      email: email.trim(),
      phoneOrWhatsApp: phoneOrWhatsApp.trim(),
      selectedPackage: selectedPackage || undefined,
    };

    saveLead();

    try {
      const res = await fetch("/api/get-started", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setSubmitError(
          "We could not send this automatically right now. Use email, call booking, or WhatsApp below."
        );
      }
    } catch {
      setSubmitError("Network error. Use email, call booking, or WhatsApp below.");
    } finally {
      setIsSubmitting(false);
      setStep(4);
    }
  }

  return (
    <section className="border-b border-white/10 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-7 shadow-[0_18px_44px_rgba(0,0,0,0.22)] md:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Get Started
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white md:text-5xl">
            Start your website launch
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/72 md:text-base">
            Quick 3-step intake so we can review your project and send the next
            steps.
          </p>

          {selectedPackage ? (
            <div className="mt-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/95">
              Selected package: {selectedPackage}
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-2 text-xs text-white/60">
            {[1, 2, 3].map((index) => (
              <span
                key={index}
                className={[
                  "h-2 flex-1 rounded-full",
                  step >= index ? "bg-emerald-400/80" : "bg-white/10",
                ].join(" ")}
              />
            ))}
          </div>

          {step === 1 ? (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white">What do you need?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PROJECT_NEEDS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setProjectNeed(option)}
                    className={[
                      "rounded-xl border px-4 py-4 text-left text-sm font-semibold transition",
                      projectNeed === option
                        ? "border-emerald-400/45 bg-emerald-500/15 text-white"
                        : "border-white/10 bg-black/35 text-white/85 hover:border-white/20 hover:bg-black/45",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!projectNeed}
                  onClick={() => setStep(2)}
                  className={[
                    "inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition",
                    projectNeed
                      ? "bg-emerald-700 hover:bg-emerald-600"
                      : "cursor-not-allowed bg-emerald-700/45",
                  ].join(" ")}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white">
                Do you already have a domain?
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {DOMAIN_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHasDomain(option)}
                    className={[
                      "rounded-xl border px-4 py-4 text-left text-sm font-semibold transition",
                      hasDomain === option
                        ? "border-emerald-400/45 bg-emerald-500/15 text-white"
                        : "border-white/10 bg-black/35 text-white/85 hover:border-white/20 hover:bg-black/45",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-black/30 px-6 text-sm font-semibold text-white/85 transition hover:bg-black/45"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!hasDomain}
                  onClick={() => setStep(3)}
                  className={[
                    "inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition",
                    hasDomain
                      ? "bg-emerald-700 hover:bg-emerald-600"
                      : "cursor-not-allowed bg-emerald-700/45",
                  ].join(" ")}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <form className="mt-8 space-y-4" onSubmit={onSubmitDetails}>
              <h2 className="text-xl font-semibold text-white">Contact details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm text-white/70">Full name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm text-white/70">Business name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Phone / WhatsApp number
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneOrWhatsApp}
                    onChange={(e) => setPhoneOrWhatsApp(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-black/30 px-6 text-sm font-semibold text-white/85 transition hover:bg-black/45"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  {isSubmitting ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>
          ) : null}

          {step === 4 ? (
            <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
              <h2 className="text-2xl font-semibold text-white">
                Your request has been received.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/78">
                We&apos;ll review your project and send the next steps shortly.
              </p>

              {submitError ? (
                <p className="mt-3 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs leading-6 text-amber-100">
                  {submitError}
                </p>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  href={BOOKING_URL}
                  target={isExternalUrl(BOOKING_URL) ? "_blank" : undefined}
                  rel={isExternalUrl(BOOKING_URL) ? "noreferrer" : undefined}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Book a Call
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-black/35 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-black/50"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <div className="mt-4">
                <a
                  href={mailtoHref}
                  className="text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                >
                  Send this request by email
                </a>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <Link
                  href={GET_STARTED_PATH}
                  className="text-sm text-white/70 transition hover:text-white"
                >
                  Submit another request
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
