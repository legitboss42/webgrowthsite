"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";

type Status = "idle" | "sending" | "success" | "error";

type ContactClientProps = {
  directDeliveryConfigured: boolean;
};

type FormValues = {
  name: string;
  email: string;
  whatsappNumber: string;
  businessName: string;
  websiteUrl: string;
  helpNeeded: string;
  mainIssue: string;
  budgetRange: string;
  timeline: string;
  message: string;
};

const INITIAL_VALUES: FormValues = {
  name: "",
  email: "",
  whatsappNumber: "",
  businessName: "",
  websiteUrl: "",
  helpNeeded: "Website audit / review",
  mainIssue: "My website is not getting enquiries",
  budgetRange: "Not sure yet",
  timeline: "As soon as possible",
  message: "",
};

function pushToDataLayer(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const win = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({ event: eventName, ...payload });
}

function fireGtagEvent(eventName: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const win = window as Window & {
    gtag?: (action: string, event: string, payload: Record<string, unknown>) => void;
  };
  if (typeof win.gtag === "function") {
    win.gtag("event", eventName, params);
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ContactClient({ directDeliveryConfigured }: ContactClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const helpOptions = useMemo(
    () => [
      "Website audit / review",
      "New business website",
      "Website redesign",
      "Landing page",
      "Online store / ecommerce website",
      "Website speed improvement",
      "Not sure yet",
    ],
    []
  );

  const mainIssueOptions = useMemo(
    () => [
      "My website is not getting enquiries",
      "I need a more professional website",
      "My website looks outdated",
      "My website is slow",
      "I need a landing page for an offer",
      "I want to sell products online",
      "I am not sure what is wrong",
    ],
    []
  );

  const budgetOptions = useMemo(
    () => [
      "Not sure yet",
      "Below ₦100,000",
      "₦100,000 – ₦250,000",
      "₦250,000 – ₦500,000",
      "₦500,000+",
      "I need an audit first",
    ],
    []
  );

  const timelineOptions = useMemo(
    () => [
      "As soon as possible",
      "This week",
      "This month",
      "1–3 months",
      "I am planning ahead",
    ],
    []
  );

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const isTurnstileEnabled = Boolean(turnstileSiteKey);

  useEffect(() => {
    const selected = searchParams.get("service");
    if (!selected) return;

    const decoded = decodeURIComponent(selected);
    const normalized = decoded.toLowerCase();

    const helpMap: Record<string, string> = {
      "website audit": "Website audit / review",
      "website review": "Website audit / review",
      "business website design": "New business website",
      "website redesign": "Website redesign",
      "landing page design": "Landing page",
      "ecommerce website design": "Online store / ecommerce website",
      "speed & mobile optimisation": "Website speed improvement",
      "speed optimization": "Website speed improvement",
      "website speed improvement": "Website speed improvement",
    };

    const matched =
      helpOptions.find((option) => option.toLowerCase() === normalized) ||
      helpMap[normalized];

    if (matched) {
      setValues((current) => ({ ...current, helpNeeded: matched }));
    }
  }, [helpOptions, searchParams]);

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
      whatsappNumber: values.whatsappNumber.trim(),
      businessName: values.businessName.trim(),
      websiteUrl: normalizeUrl(values.websiteUrl),
      message: values.message.trim(),
    };

    if (!payload.name || !payload.email || !payload.helpNeeded || !payload.mainIssue) {
      setStatus("error");
      setStatusMsg("Please complete the required fields before submitting.");
      return;
    }

    if (!isValidUrl(payload.websiteUrl)) {
      setStatus("error");
      setStatusMsg("Please enter a valid website URL, or leave it blank.");
      return;
    }

    if (isTurnstileEnabled && !turnstileToken) {
      setStatus("error");
      setStatusMsg("Please complete the spam check and try again.");
      return;
    }

    setStatus("sending");
    setStatusMsg("");

    try {
      const response = await fetch("/api/forms/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "website_review_request",
          subject: `Website Review Request - ${payload.helpNeeded}`,
          turnstileToken: turnstileToken || undefined,
          fields: {
            name: payload.name,
            email: payload.email,
            whatsapp_number: payload.whatsappNumber,
            business_name: payload.businessName,
            website_url: payload.websiteUrl,
            help_needed: payload.helpNeeded,
            main_issue: payload.mainIssue,
            budget_range: payload.budgetRange,
            timeline: payload.timeline,
            message: payload.message,
            page_path: typeof window !== "undefined" ? window.location.pathname : "/contact/",
          },
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; ok?: boolean; delivery?: string }
        | null;

      if (!response.ok) {
        setStatus("error");
        setStatusMsg(data?.error || "Could not send your request right now. Please try again.");
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      setStatus("success");
      setStatusMsg(
        data?.delivery === "setup_required"
          ? "Request accepted. Direct email delivery is still being connected, so WhatsApp is the fastest backup path right now."
          : "Request received. Redirecting..."
      );

      const analyticsPayload = {
        form_name: "website_review_request",
        help_needed: payload.helpNeeded,
        main_issue: payload.mainIssue,
        page_path: typeof window !== "undefined" ? window.location.pathname : "/contact/",
      };

      pushToDataLayer("wg_lead", analyticsPayload);
      fireGtagEvent("generate_lead", { ...analyticsPayload, method: "website_form" });

      setValues(INITIAL_VALUES);
      setTurnstileResetKey((current) => current + 1);

      window.setTimeout(() => {
        router.push(
          data?.delivery === "setup_required"
            ? "/thank-you/?delivery=setup-required"
            : "/thank-you/"
        );
      }, 700);
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Please try again.");
      setTurnstileResetKey((current) => current + 1);
    }
  }

  return (
    <div
      id="contact-form"
      className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">
        Start your website review request
      </h2>
      <p className="mt-3 text-sm leading-7 text-white/70">
        Share the essentials and Web Growth can assess what may be hurting trust,
        clarity, speed, mobile experience, and enquiry flow.
      </p>

      <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/90">
          To get the most useful response
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/78">
          <li className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>Add your website link if you already have one.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>Choose the main issue so the response starts in the right place.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>You do not need a polished brief. Clear business details are enough.</span>
          </li>
        </ul>
      </div>

      {!directDeliveryConfigured ? (
        <p className="mt-5 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
          Direct email delivery is still being connected. You can still submit this
          request safely, and WhatsApp is the fastest backup path for urgent reviews.
        </p>
      ) : null}

      {status !== "idle" ? (
        <div
          className={[
            "mt-6 rounded-2xl border p-4 text-sm",
            status === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : status === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-white/10 bg-white/5 text-white/70",
          ].join(" ")}
        >
          {status === "sending" ? "Sending..." : statusMsg}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="mb-2 block text-sm text-white/70">
              Name <span className="text-emerald-300">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="mb-2 block text-sm text-white/70">
              Email <span className="text-emerald-300">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="contact-whatsapp" className="mb-2 block text-sm text-white/70">
              WhatsApp number
            </label>
            <input
              id="contact-whatsapp"
              type="tel"
              value={values.whatsappNumber}
              onChange={(event) => updateValue("whatsappNumber", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
            />
          </div>

          <div>
            <label htmlFor="contact-business-name" className="mb-2 block text-sm text-white/70">
              Business name
            </label>
            <input
              id="contact-business-name"
              type="text"
              value={values.businessName}
              onChange={(event) => updateValue("businessName", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-website-url" className="mb-2 block text-sm text-white/70">
            Website URL
          </label>
          <input
            id="contact-website-url"
            type="url"
            value={values.websiteUrl}
            onChange={(event) => updateValue("websiteUrl", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="contact-help-needed" className="mb-2 block text-sm text-white/70">
              What do you need help with? <span className="text-emerald-300">*</span>
            </label>
            <select
              id="contact-help-needed"
              required
              value={values.helpNeeded}
              onChange={(event) => updateValue("helpNeeded", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
            >
              {helpOptions.map((option) => (
                <option key={option} value={option} className="bg-black">
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact-main-issue" className="mb-2 block text-sm text-white/70">
              Main issue <span className="text-emerald-300">*</span>
            </label>
            <select
              id="contact-main-issue"
              required
              value={values.mainIssue}
              onChange={(event) => updateValue("mainIssue", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
            >
              {mainIssueOptions.map((option) => (
                <option key={option} value={option} className="bg-black">
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="contact-budget-range" className="mb-2 block text-sm text-white/70">
              Budget range
            </label>
            <select
              id="contact-budget-range"
              value={values.budgetRange}
              onChange={(event) => updateValue("budgetRange", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
            >
              {budgetOptions.map((option) => (
                <option key={option} value={option} className="bg-black">
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact-timeline" className="mb-2 block text-sm text-white/70">
              Timeline
            </label>
            <select
              id="contact-timeline"
              value={values.timeline}
              onChange={(event) => updateValue("timeline", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
            >
              {timelineOptions.map((option) => (
                <option key={option} value={option} className="bg-black">
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm text-white/70">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={6}
            value={values.message}
            onChange={(event) => updateValue("message", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
          />
        </div>

        {isTurnstileEnabled ? (
          <div className="space-y-2">
            <p className="text-sm text-white/70">Spam check</p>
            <TurnstileWidget
              action="website_review_request"
              onTokenChange={setTurnstileToken}
              resetKey={turnstileResetKey}
            />
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/62">
            Spam protection is not configured yet. This form still uses server-side
            validation and rate limiting, and WhatsApp is available if you need a
            faster route.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className={[
            "w-full rounded-2xl px-6 py-4 text-sm font-semibold text-white transition",
            status === "sending"
              ? "cursor-not-allowed bg-emerald-600/60"
              : "bg-emerald-700 hover:bg-emerald-600",
          ].join(" ")}
        >
          {status === "sending" ? "Sending..." : "Submit Website Review Request"}
        </button>

        <p className="text-xs leading-6 text-white/55">
          No fake guarantees and no bloated sales process. Just a practical next
          step based on what you send.
        </p>
      </form>
    </div>
  );
}
