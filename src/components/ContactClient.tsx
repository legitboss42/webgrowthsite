"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const FORM_ENDPOINT = "https://formspree.io/f/xgoanbnr";

type Status = "idle" | "sending" | "success" | "error";

// ---- Analytics helpers (safe)
function pushToDataLayer(eventName: string, payload: Record<string, any>) {
  if (typeof window === "undefined") return;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: eventName, ...payload });
}

function fireGtagEvent(eventName: string, params: Record<string, any>) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("event", eventName, params);
  }
}

export default function ContactClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const serviceOptions = useMemo(
    () => [
      "Business Website Design",
      "Landing Page Design",
      "Website Redesign",
      "E-commerce Website Design",
      "Website Maintenance & Support",
      "Speed & Performance Optimisation",
      "Website Audit & Consultation",
    ],
    []
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Prefill service from URL (?service=...)
  useEffect(() => {
    const s = searchParams.get("service");
    if (!s) return;

    const decoded = decodeURIComponent(s);
    const match = serviceOptions.find(
      (opt) => opt.toLowerCase() === decoded.toLowerCase()
    );

    setService(match ?? decoded);
  }, [searchParams, serviceOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus("sending");
    setStatusMsg("");

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          service,
          message,
          _subject: `New Web Growth Quote Request — ${
            service || "No service selected"
          }`,
        }),
      });

      if (!res.ok) {
        let err = "Failed to send. Try again.";
        try {
          const data = await res.json();
          if (data?.errors?.length) err = data.errors[0].message || err;
        } catch {}
        setStatus("error");
        setStatusMsg(err);
        return;
      }

      // ✅ SUCCESS
      setStatus("success");

      // --- Conversion tracking (fires once, only on success)
      const leadPayload = {
        form_name: "contact_quote",
        service: service || "(none)",
        page_path: typeof window !== "undefined" ? window.location.pathname : "",
      };

      // GTM path (recommended)
      pushToDataLayer("wg_lead", leadPayload);

      // GA4 direct (if gtag exists)
      fireGtagEvent("generate_lead", {
        ...leadPayload,
        method: "formspree",
      });

      // redirect to thank-you page
      setTimeout(() => {
        router.push("/contact/thanks");
      }, 800);
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Please try again.");
    }
  };

  return (
    <div className="bg-black text-white py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl md:text-5xl font-semibold">Request a Quote</h1>

        <p className="mt-4 text-white/70 text-lg">
          Tell us what you need. We’ll respond with the right next step.
        </p>

        {/* Status message */}
        {status !== "idle" && (
          <div
            className={[
              "mt-8 rounded-xl border p-4 text-sm",
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
        )}

        <form onSubmit={handleSubmit} className="mt-12 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm mb-2 text-white/70">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2 text-white/70">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white"
            />
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm mb-2 text-white/70">Service</label>
            <select
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white"
            >
              <option value="" disabled>
                Select a service
              </option>

              {serviceOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-black">
                  {opt}
                </option>
              ))}

              {service && !serviceOptions.includes(service) && (
                <option value={service} className="bg-black">
                  {service}
                </option>
              )}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm mb-2 text-white/70">
              Project Details
            </label>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white"
              placeholder="Briefly describe what you need…"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "sending"}
            className={[
              "w-full rounded-md px-6 py-4 text-sm font-semibold text-white transition",
              status === "sending"
                ? "bg-emerald-600/60 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500",
            ].join(" ")}
          >
            {status === "sending" ? "Sending..." : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
}