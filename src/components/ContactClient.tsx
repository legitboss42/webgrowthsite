"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";

type Status = "idle" | "sending" | "success" | "error";

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

export default function ContactClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceOptions = useMemo(
    () => [
      "Business Website Design",
      "Website Redesign",
      "Landing Page Design",
      "Speed & Mobile Optimisation",
      "Lead Capture & Booking Setup",
      "Launch ($150)",
      "Launch + Blog ($250)",
    ],
    []
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("Business Website Design");
  const [message, setMessage] = useState("Here is the project I need help with:");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const isProduction = process.env.NODE_ENV === "production";
  const isTurnstileEnabled = Boolean(turnstileSiteKey);
  const canSubmit = isTurnstileEnabled || !isProduction;

  useEffect(() => {
    const selected = searchParams.get("service");
    if (!selected) return;

    const decoded = decodeURIComponent(selected);
    const match = serviceOptions.find(
      (option) => option.toLowerCase() === decoded.toLowerCase()
    );

    setService(match ?? decoded);
  }, [searchParams, serviceOptions]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (status === "sending") {
      return;
    }

    if (isTurnstileEnabled && !turnstileToken) {
      setStatus("error");
      setStatusMsg("Complete the spam check, then send your request again.");
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
          formType: "contact",
          subject: `New Web Growth Project Enquiry - ${service}`,
          turnstileToken,
          fields: {
            name,
            email,
            service,
            message,
            page_path: typeof window !== "undefined" ? window.location.pathname : "",
          },
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setStatusMsg(data?.error || "Failed to send. Try again.");
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      setStatus("success");
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);

      const payload = {
        form_name: "contact_form",
        service,
        page_path: typeof window !== "undefined" ? window.location.pathname : "",
      };

      pushToDataLayer("wg_lead", payload);
      fireGtagEvent("generate_lead", { ...payload, method: "website_form" });

      window.setTimeout(() => {
        router.push("/contact/thanks");
      }, 800);
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
        Tell me what needs to be built
      </h2>
      <p className="mt-3 text-sm leading-7 text-white/70">
        Send the brief and get a direct reply on fit, likely scope, timing, and
        the strongest next step for the project.
      </p>

      <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/90">
          To get the most useful reply
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/78">
          <li className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>Say what the business does and what the website needs to improve.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>Mention whether this is a new build, redesign, launch package, or landing page.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>You do not need a polished brief. A clear summary is enough to start properly.</span>
          </li>
        </ul>
      </div>

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
          {status === "sending"
            ? "Sending..."
            : status === "success"
              ? "Message sent. Redirecting..."
              : statusMsg}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm text-white/70">
            Your name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-2 block text-sm text-white/70">
            Email address
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
          />
        </div>

        <div>
          <label htmlFor="contact-service" className="mb-2 block text-sm text-white/70">
            What do you need?
          </label>
          <select
            id="contact-service"
            required
            value={service}
            onChange={(event) => setService(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
          >
            {serviceOptions.map((option) => (
              <option key={option} value={option} className="bg-black">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm text-white/70">
            Project details
          </label>
          <textarea
            id="contact-message"
            rows={6}
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
          />
        </div>

        {isTurnstileEnabled ? (
          <div className="space-y-2">
            <p className="text-sm text-white/70">Spam check</p>
            <TurnstileWidget
              action="contact"
              onTokenChange={setTurnstileToken}
              resetKey={turnstileResetKey}
            />
          </div>
        ) : (
          <p className="rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Form protection is not configured yet. Add the Turnstile site key before using this form in production.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending" || !canSubmit}
          className={[
            "w-full rounded-2xl px-6 py-4 text-sm font-semibold text-white transition",
            status === "sending" || !canSubmit
              ? "cursor-not-allowed bg-emerald-600/60"
              : "bg-emerald-700 hover:bg-emerald-600",
          ].join(" ")}
        >
          {status === "sending" ? "Sending..." : "Request a Premium Website Quote"}
        </button>

        <p className="text-xs leading-6 text-white/55">
          Typical next step: a direct reply with fit, likely scope, timing, and the
          strongest way to approach the build.
        </p>
      </form>
    </div>
  );
}
