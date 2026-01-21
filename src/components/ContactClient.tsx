"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  const [message, setMessage] = useState("");
  const [service, setService] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      email,
      service,
      message,
    };

    console.log("Form submission:", payload);

    // TEMP: replace later with email / API / backend
    alert("Form submitted (check console)");

    setName("");
    setEmail("");
    setMessage("");
    setService("");
  };

  return (
    <div className="bg-black text-white py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl md:text-5xl font-semibold">
          Request a Quote
        </h1>

        <p className="mt-4 text-white/70 text-lg">
          Tell us what you need. We’ll respond with the right next step.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-12 space-y-6"
        >
          {/* Name */}
          <div>
            <label className="block text-sm mb-2 text-white/70">
              Your Name
            </label>
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
            <label className="block text-sm mb-2 text-white/70">
              Service
            </label>
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
              {service &&
              !serviceOptions.includes(service) ? (
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
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 px-6 py-4 text-sm font-semibold text-white hover:bg-emerald-500 transition"
          >
            Send Request
          </button>
        </form>
      </div>
    </div>
  );
}
