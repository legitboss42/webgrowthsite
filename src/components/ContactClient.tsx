"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
  const searchParams = useSearchParams();
  const router = useRouter();

  const serviceOptions = useMemo(
    () => [
      "Launch ($150)",
      "Launch + Blog ($250)",
      "Business Website Design",
      "Landing Page Design",
      "Website Redesign",
      "Search Engine Optimisation (SEO)",
      "Lead Magnet Strategy and Build",
    ],
    []
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("Launch ($150)");
  const [message, setMessage] = useState(
    "I want a professional website live fast. Here are the basics of my business:"
  );
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const selected = searchParams.get("service");
    if (!selected) return;

    const decoded = decodeURIComponent(selected);
    const match = serviceOptions.find(
      (option) => option.toLowerCase() === decoded.toLowerCase()
    );

    setService(match ?? decoded);
  }, [searchParams, serviceOptions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setStatusMsg("");

    try {
      const res = await fetch("/api/forms/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "contact",
          subject: `New Web Growth Launch Request - ${service}`,
          fields: {
            name,
            email,
            service,
            message,
            page_path: typeof window !== "undefined" ? window.location.pathname : "",
          },
        }),
      });

      if (!res.ok) {
        setStatus("error");
        setStatusMsg("Failed to send. Try again.");
        return;
      }

      setStatus("success");
      const leadPayload = {
        form_name: "launch_contact",
        service,
        page_path: typeof window !== "undefined" ? window.location.pathname : "",
      };

      pushToDataLayer("wg_lead", leadPayload);
      fireGtagEvent("generate_lead", { ...leadPayload, method: "website_form" });

      setTimeout(() => {
        router.push("/contact/thanks");
      }, 800);
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Please try again.");
    }
  }

  return (
    <div id="contact-form" className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-7 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
      <h2 className="text-2xl font-semibold tracking-[-0.01em] text-white">
        Start your launch request
      </h2>
      <p className="mt-3 text-sm leading-6 text-white/70">
        Send the basics. You will get a clear response on scope, timing, and what is needed to launch.
      </p>

      {status !== "idle" ? (
        <div
          className={[
            "mt-6 rounded-xl border p-4 text-sm",
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
          <label className="mb-2 block text-sm text-white/70">Your name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Service</label>
          <select
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          >
            {serviceOptions.map((option) => (
              <option key={option} value={option} className="bg-black">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">Project details</label>
          <textarea
            rows={5}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className={[
            "w-full rounded-xl px-6 py-4 text-sm font-semibold text-white transition",
            status === "sending"
              ? "cursor-not-allowed bg-emerald-600/60"
              : "bg-emerald-700 hover:bg-emerald-600",
          ].join(" ")}
        >
          {status === "sending" ? "Sending..." : "Send Request"}
        </button>
      </form>
    </div>
  );
}
