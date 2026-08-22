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
  automationDetails: string;
};

const AUTOMATION_HELP_OPTION = "Business automation / workflow integration";

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
  automationDetails: "",
};

const inputClassName = "contact-control";
const selectClassName = "contact-control";
const labelClassName = "contact-label";

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
      AUTOMATION_HELP_OPTION,
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
      "NGN 200,000 - 250,000",
      "NGN 250,000 - 500,000",
      "NGN 500,000+",
      "I need an audit first",
    ],
    []
  );

  const timelineOptions = useMemo(
    () => [
      "As soon as possible",
      "This week",
      "This month",
      "1-3 months",
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
      "business automation and workflow integration": AUTOMATION_HELP_OPTION,
      "business automation": AUTOMATION_HELP_OPTION,
      "workflow automation": AUTOMATION_HELP_OPTION,
      "workflow integration": AUTOMATION_HELP_OPTION,
      "automation": AUTOMATION_HELP_OPTION,
    };

    const matched =
      helpOptions.find((option) => option.toLowerCase() === normalized) || helpMap[normalized];

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
      automationDetails: values.automationDetails.trim(),
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
            ...(payload.helpNeeded === AUTOMATION_HELP_OPTION
              ? { automation_details: payload.automationDetails }
              : {}),
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
        router.push(data?.delivery === "setup_required" ? "/thank-you/?delivery=setup-required" : "/thank-you/");
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
      className="contact-form-shell"
    >
      <p className="contact-kicker">Website review request</p>
      <h2>
        Start your website review request
      </h2>
      <p className="contact-form-intro">
        Share the essentials and Web Growth can assess what may be hurting trust, clarity, speed,
        mobile experience, and enquiry flow.
      </p>

      <div className="contact-form-guidance">
        <p>To get the most useful response</p>
        <ul>
          <li>
            <span />
            <span>Add your website link if you already have one.</span>
          </li>
          <li>
            <span />
            <span>Choose the main issue so the response starts in the right place.</span>
          </li>
          <li>
            <span />
            <span>You do not need a polished brief. Clear business details are enough.</span>
          </li>
        </ul>
      </div>

      {!directDeliveryConfigured ? (
        <p className="contact-form-alert">
          Direct email delivery is still being connected. You can still submit this request safely,
          and WhatsApp is the fastest backup path for urgent reviews.
        </p>
      ) : null}

      {status !== "idle" ? (
        <div
          className={[
            "contact-form-status",
            status === "success"
              ? "contact-form-status-success"
              : status === "error"
                ? "contact-form-status-error"
                : "contact-form-status-neutral",
          ].join(" ")}
        >
          {status === "sending" ? "Sending..." : statusMsg}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="contact-form-fields">
        <div className="contact-form-grid">
          <div>
            <label htmlFor="contact-name" className={labelClassName}>
              Name <span className="text-blue-700">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="contact-email" className={labelClassName}>
              Email <span className="text-blue-700">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="contact-form-grid">
          <div>
            <label htmlFor="contact-whatsapp" className={labelClassName}>
              WhatsApp number
            </label>
            <input
              id="contact-whatsapp"
              type="tel"
              value={values.whatsappNumber}
              onChange={(event) => updateValue("whatsappNumber", event.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="contact-business-name" className={labelClassName}>
              Business name
            </label>
            <input
              id="contact-business-name"
              type="text"
              value={values.businessName}
              onChange={(event) => updateValue("businessName", event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-website-url" className={labelClassName}>
            Website URL
          </label>
          <input
            id="contact-website-url"
            type="url"
            value={values.websiteUrl}
            onChange={(event) => updateValue("websiteUrl", event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="contact-form-grid">
          <div>
            <label htmlFor="contact-help-needed" className={labelClassName}>
              What do you need help with? <span className="text-blue-700">*</span>
            </label>
            <select
              id="contact-help-needed"
              required
              value={values.helpNeeded}
              onChange={(event) => updateValue("helpNeeded", event.target.value)}
              className={selectClassName}
            >
              {helpOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact-main-issue" className={labelClassName}>
              Main issue <span className="text-blue-700">*</span>
            </label>
            <select
              id="contact-main-issue"
              required
              value={values.mainIssue}
              onChange={(event) => updateValue("mainIssue", event.target.value)}
              className={selectClassName}
            >
              {mainIssueOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {values.helpNeeded === AUTOMATION_HELP_OPTION ? (
          <div>
            <label htmlFor="contact-automation-details" className={labelClassName}>
              What would you like to automate?
            </label>
            <p id="contact-automation-help" className="contact-form-muted">
              Describe the repetitive task, workflow or systems you want connected.
            </p>
            <textarea
              id="contact-automation-details"
              rows={4}
              maxLength={1200}
              value={values.automationDetails}
              onChange={(event) => updateValue("automationDetails", event.target.value)}
              className={inputClassName}
              aria-describedby="contact-automation-help"
              placeholder="e.g. When a new lead submits the contact form, add them to our CRM and send a follow-up email."
            />
          </div>
        ) : null}

        <div className="contact-form-grid">
          <div>
            <label htmlFor="contact-budget-range" className={labelClassName}>
              Budget range
            </label>
            <select
              id="contact-budget-range"
              value={values.budgetRange}
              onChange={(event) => updateValue("budgetRange", event.target.value)}
              className={selectClassName}
            >
              {budgetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact-timeline" className={labelClassName}>
              Timeline
            </label>
            <select
              id="contact-timeline"
              value={values.timeline}
              onChange={(event) => updateValue("timeline", event.target.value)}
              className={selectClassName}
            >
              {timelineOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className={labelClassName}>
            Message
          </label>
          <textarea
            id="contact-message"
            rows={6}
            value={values.message}
            onChange={(event) => updateValue("message", event.target.value)}
            className={inputClassName}
          />
        </div>

        {isTurnstileEnabled ? (
          <div className="contact-spam-check">
            <p>Spam check</p>
            <TurnstileWidget
              action="website_review_request"
              onTokenChange={setTurnstileToken}
              resetKey={turnstileResetKey}
            />
          </div>
        ) : (
          <p className="contact-form-muted">
            Spam protection is not configured yet. This form still uses server-side validation and
            rate limiting, and WhatsApp is available if you need a faster route.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className={[
            "contact-submit",
            status === "sending"
              ? "contact-submit-disabled"
              : "contact-submit-ready",
          ].join(" ")}
        >
          {status === "sending" ? "Sending..." : "Submit Website Review Request"}
        </button>

        <p className="contact-form-footnote">
          No fake guarantees and no bloated sales process. Just a practical next step based on what
          you send.
        </p>
      </form>
    </div>
  );
}
