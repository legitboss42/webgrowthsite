"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Status = "idle" | "sending" | "success" | "error";

type AIResult = {
  summary: string;
  mockup: {
    pages: string[];
    homepageCopy: {
      headline: string;
      subheadline: string;
      cta: string;
    };
  };
  tips: string[];
};

export default function AiAssistantWidget() {
  const questions = useMemo(
    () => [
      {
        key: "businessName",
        label: "What’s your business name?",
        placeholder: "e.g. J Luxe Medical Aesthetics",
      },
      {
        key: "niche",
        label: "What do you do? (your niche)",
        placeholder: "e.g. Aesthetic clinic, hair brand, logistics…",
      },
      {
        key: "audience",
        label: "Who is your ideal customer?",
        placeholder: "e.g. women 25–45 in London",
      },
      {
        key: "goal",
        label: "What do you want the website to achieve?",
        placeholder: "e.g. bookings, calls, WhatsApp enquiries",
      },
    ],
    []
  );

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({
    businessName: "",
    niche: "",
    audience: "",
    goal: "",
  });

  // Auto-open once per session (first visit)
  useEffect(() => {
    const key = "wg_ai_popup_seen";
    const seen = sessionStorage.getItem(key);
    if (!seen) {
      setOpen(true);
      sessionStorage.setItem(key, "1");
    }
  }, []);

  // Lock scroll when modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onChange = (k: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [k]: v }));
  };

  const close = () => {
    setOpen(false);
    setStatus("idle");
    setStatusMsg("");
  };

  const resetAll = () => {
    setAnswers({ businessName: "", niche: "", audience: "", goal: "" });
    setResult(null);
    setStatus("idle");
    setStatusMsg("");
  };

  const generate = async () => {
    // basic validation
    const missing = questions.find((q) => !answers[q.key]?.trim());
    if (missing) {
      setStatus("error");
      setStatusMsg(`Please answer: ${missing.label}`);
      return;
    }

    setStatus("sending");
    setStatusMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        setStatus("error");
        setStatusMsg("Failed to generate. Try again.");
        return;
      }

      const data = (await res.json()) as AIResult;
      setResult(data);
      setStatus("success");
      setStatusMsg("Done. Review your mockup below.");
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Try again.");
    }
  };

  // A small button that can reopen the popup later
  const ReopenButton = (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-5 right-5 z-40 rounded-full border border-white/10 bg-black/70 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur hover:bg-black/80 transition"
      type="button"
    >
      Website Mockup AI
    </button>
  );

  return (
    <>
      {ReopenButton}

      {!open ? null : (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-black/70"
          />

          {/* Modal */}
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/85 backdrop-blur">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                  <div className="text-xs font-semibold tracking-[0.25em] text-white/50">
                    WEB GROWTH
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Instant website mockup + conversion tips
                  </h2>
                  <p className="mt-2 text-white/70">
                    Answer 4 questions. We’ll generate a rough website structure and tell you what will help it sell.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                {/* Status */}
                {status !== "idle" && (
                  <div
                    className={[
                      "mb-6 rounded-xl border p-4 text-sm",
                      status === "success"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : status === "error"
                        ? "border-red-500/30 bg-red-500/10 text-red-200"
                        : "border-white/10 bg-white/5 text-white/70",
                    ].join(" ")}
                  >
                    {status === "sending" ? "Generating..." : statusMsg}
                  </div>
                )}

                {/* Form */}
                <div className="grid gap-4 md:grid-cols-2">
                  {questions.map((q) => (
                    <div key={q.key} className="md:col-span-1">
                      <label className="block text-sm mb-2 text-white/70">
                        {q.label}
                      </label>
                      <input
                        value={answers[q.key] || ""}
                        onChange={(e) => onChange(q.key, e.target.value)}
                        placeholder={q.placeholder}
                        className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/35"
                      />
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={generate}
                    disabled={status === "sending"}
                    className={[
                      "inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white transition",
                      status === "sending"
                        ? "bg-emerald-600/60 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500",
                    ].join(" ")}
                  >
                    {status === "sending" ? "Generating..." : "Generate Mockup"}
                  </button>

                  <button
                    type="button"
                    onClick={resetAll}
                    className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
                  >
                    Reset
                  </button>

                  <Link
                    href="/contact"
                    onClick={() => setOpen(false)}
                    className="sm:ml-auto inline-flex items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
                  >
                    Let Web Growth build it →
                  </Link>
                </div>

                {/* Result */}
                {result && (
                  <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">
                    <p className="text-white font-semibold">Summary</p>
                    <p className="mt-2 text-white/70">{result.summary}</p>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="text-white font-semibold">
                          Mock website pages
                        </p>
                        <ul className="mt-3 list-disc pl-6 text-white/70 space-y-2">
                          {result.mockup.pages.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-white font-semibold">
                          Suggested homepage copy
                        </p>
                        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-white/90 font-semibold">
                            {result.mockup.homepageCopy.headline}
                          </p>
                          <p className="mt-2 text-white/70">
                            {result.mockup.homepageCopy.subheadline}
                          </p>
                          <p className="mt-3 text-emerald-200 font-semibold">
                            CTA: {result.mockup.homepageCopy.cta}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-6 text-white font-semibold">
                      Conversion tips
                    </p>
                    <ul className="mt-3 list-disc pl-6 text-white/70 space-y-2">
                      {result.tips.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href="/pricing"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center rounded-md bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition"
                      >
                        See Pricing
                      </Link>

                      <Link
                        href="/contact"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
                      >
                        Request a Quote
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
                This is a mock generator for now (no paid AI yet). We’ll swap to real AI after you confirm the flow.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}