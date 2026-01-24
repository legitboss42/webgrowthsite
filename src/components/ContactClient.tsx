"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const FORM_ENDPOINT = "https://formspree.io/f/xgoanbnr"; // <-- replace

export default function ContactClient() {
  const searchParams = useSearchParams();

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

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );
  const [statusMsg, setStatusMsg] = useState("");

  // Prefill service from URL
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

    if (!FORM_ENDPOINT || FORM_ENDPOINT.includes("XXXXXXX")) {
      setStatus("error");
      setStatusMsg("Form endpoint not set. Add your Formspree URL.");
      return;
    }

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
          _subject: `New Web Growth Quote Request — ${service || "No service selected"}`,
        }),
      });

      if (!res.ok) {
        // Formspree returns JSON, but keep this robust
        let errText = "Failed to send. Try again.";
        try {
          const data = await res.json();
          if (data?.errors?.length) errText = data.errors[0].message || errText;
        } catch {}
        setStatus("error");
        setStatusMsg(errText);
        return;
      }

      setStatus("success");
      setStatusMsg("Message sent. We’ll reply shortly.");

      // clear
      setName("");
      setEmail("");
      setMessage("");
      setService("");
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Check connection and try again.");
    }
  };

  return (
    <div className="bg-black text-white py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl md:text-5xl font-semibold">Request a Quote</h1>

        <p className="mt-4 text-white/70 text-lg">
          Tell us what you need. We’ll respond with the right next step.
        </p>

        {/* Status box */}
        {status !== "idle" ? (
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
            {status === "sending" ? "Sending..." : statusMsg}
          </div>
        ) : null}

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
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
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

              {/* Preserve custom service if passed */}
              {service && !serviceOptions.includes(service) ? (
                <option value={service} className="bg-black">
                  {service}
                </option>
              ) : null}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm mb-2 text-white/70">
              Project Details
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white"
              placeholder="Briefly describe what you need…"
              required
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