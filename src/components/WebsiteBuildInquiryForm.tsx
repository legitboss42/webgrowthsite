"use client";

import { useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";

type Status = "idle" | "sending" | "success" | "error";

type FormValues = {
  name: string;
  businessName: string;
  email: string;
  websiteUrl: string;
  help: string;
};

const INITIAL_VALUES: FormValues = {
  name: "",
  businessName: "",
  email: "",
  websiteUrl: "",
  help: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function pushLeadEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const win = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (action: string, event: string, params: Record<string, unknown>) => void;
  };

  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({ event: "wg_lead", ...payload });

  if (typeof win.gtag === "function") {
    win.gtag("event", "generate_lead", { ...payload, method: "website_form" });
  }
}

export default function WebsiteBuildInquiryForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const isDevelopment = process.env.NODE_ENV !== "production";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const isTurnstileEnabled = Boolean(turnstileSiteKey);
  const allowLocalBypass = !isTurnstileEnabled && isDevelopment;
  const requiresSpamCheck = !allowLocalBypass;
  const formAction = "website_build_inquiry";

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = values.name.trim();
    const businessName = values.businessName.trim();
    const email = values.email.trim();
    const websiteUrl = normalizeUrl(values.websiteUrl);
    const help = values.help.trim();

    if (!name || !businessName || !email || !websiteUrl || !help) {
      setStatus("error");
      setStatusMessage("Please complete all fields before submitting.");
      return;
    }

    if (!isValidEmail(email)) {
      setStatus("error");
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    if (!isValidUrl(websiteUrl)) {
      setStatus("error");
      setStatusMessage("Please enter a valid website URL.");
      return;
    }

    if (requiresSpamCheck && !turnstileToken) {
      setStatus("error");
      setStatusMessage("Please complete the spam check and try again.");
      return;
    }

    setStatus("sending");
    setStatusMessage("");

    try {
      const response = await fetch("/api/forms/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: formAction,
          subject: `Website Build Inquiry - ${businessName}`,
          turnstileToken: turnstileToken || undefined,
          fields: {
            name,
            business_name: businessName,
            email,
            website_url: websiteUrl,
            help_needed: help,
            page_path: typeof window !== "undefined" ? window.location.pathname : "/website-build",
            local_spam_bypass: allowLocalBypass ? "true" : "false",
          },
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setStatusMessage(payload?.error || "Could not send your inquiry right now. Please try again.");
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      setStatus("success");
      setStatusMessage("Inquiry received. We will send your next steps within one business day.");
      setValues(INITIAL_VALUES);
      setTurnstileResetKey((current) => current + 1);

      pushLeadEvent({
        form_name: "website_build_inquiry",
        page_type: "website_build_landing",
        offer_type: "website_build",
      });
    } catch {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
      setTurnstileResetKey((current) => current + 1);
    }
  }

  return (
    <div
      id="inquiry-form"
      className="rounded-3xl border border-emerald-400/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))] p-6 shadow-[0_22px_58px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-8"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">
        Private inquiry
      </p>
      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
        Book Your Website Build
      </h3>
      <p className="mt-2 text-sm leading-7 text-white/72">
        Share the essentials and get a direct recommendation on scope, timeline,
        and the fastest path to launch.
      </p>
      <p className="mt-2 text-xs text-emerald-200/80">
        You receive next steps, scope direction, and timeline clarity within one business day.
      </p>

      {status !== "idle" ? (
        <div
          className={[
            "mt-5 rounded-2xl border px-4 py-3 text-sm",
            status === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : status === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-white/10 bg-white/5 text-white/70",
          ].join(" ")}
        >
          {status === "sending" ? "Sending your inquiry..." : statusMessage}
        </div>
      ) : null}

      {!isTurnstileEnabled && allowLocalBypass ? (
        <p className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Development mode: spam check is bypassed locally.
        </p>
      ) : null}
      {!isTurnstileEnabled && !allowLocalBypass ? (
        <p className="mt-5 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Turnstile is not configured. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` before using this form in production.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="wb-name" className="mb-2 block text-sm text-white/75">
              Name
            </label>
            <input
              id="wb-name"
              type="text"
              required
              placeholder="Your full name"
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              className="w-full rounded-xl border border-white/12 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/55"
            />
          </div>

          <div>
            <label htmlFor="wb-business-name" className="mb-2 block text-sm text-white/75">
              Business Name
            </label>
            <input
              id="wb-business-name"
              type="text"
              required
              placeholder="Business name"
              value={values.businessName}
              onChange={(event) => updateValue("businessName", event.target.value)}
              className="w-full rounded-xl border border-white/12 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/55"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="wb-email" className="mb-2 block text-sm text-white/75">
              Email
            </label>
            <input
              id="wb-email"
              type="email"
              required
              placeholder="you@company.com"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              className="w-full rounded-xl border border-white/12 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/55"
            />
          </div>

          <div>
            <label htmlFor="wb-website-url" className="mb-2 block text-sm text-white/75">
              Website URL
            </label>
            <input
              id="wb-website-url"
              type="text"
              required
              placeholder="yourwebsite.com"
              value={values.websiteUrl}
              onChange={(event) => updateValue("websiteUrl", event.target.value)}
              className="w-full rounded-xl border border-white/12 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/55"
            />
          </div>
        </div>

        <div>
          <label htmlFor="wb-help" className="mb-2 block text-sm text-white/75">
            What do you need help with?
          </label>
          <textarea
            id="wb-help"
            rows={5}
            required
            placeholder="Tell us what is underperforming and what outcome you want next."
            value={values.help}
            onChange={(event) => updateValue("help", event.target.value)}
            className="w-full rounded-xl border border-white/12 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/55"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/62">
          We only take a limited number of builds each month to maintain premium execution quality.
        </div>

        <div className="space-y-2">
          <p className="text-sm text-white/70">Spam check</p>
          {requiresSpamCheck ? (
            <TurnstileWidget
              action={formAction}
              onTokenChange={setTurnstileToken}
              resetKey={turnstileResetKey}
            />
          ) : (
            <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Spam check disabled in development mode.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "sending" || (!isTurnstileEnabled && !allowLocalBypass)}
          className={[
            "mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(5,150,105,0.32)] transition",
            status === "sending" || (!isTurnstileEnabled && !allowLocalBypass)
              ? "cursor-not-allowed bg-emerald-700/60"
              : "bg-emerald-700 hover:bg-emerald-600",
          ].join(" ")}
        >
          {status === "sending" ? "Sending..." : "Secure Your Build Slot"}
        </button>
        <p className="text-xs text-white/55">
          No bloated sales process. Just a direct recommendation and next-step plan.
        </p>
      </form>
    </div>
  );
}
