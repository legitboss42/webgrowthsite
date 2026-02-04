"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  formAction: string; // MailerLite subscribe URL
  downloadUrl: string; // /downloads/file.pdf
};

export default function LeadMagnetModal({
  open,
  onClose,
  title = "Download Guide",
  subtitle = "Enter your email to get instant access.",
  buttonText = "Download",
  formAction,
  downloadUrl,
}: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && email.includes("@"),
    [email],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!canSubmit) {
      setErr("Please enter a valid email.");
      return;
    }

    setLoading(true);

    try {
      // MailerLite JSONP endpoint accepts POST with fields[email]
      const body = new URLSearchParams();
      body.set("fields[email]", email);
      body.set("ml-submit", "1");
      body.set("anticsrf", "true");

      await fetch(formAction, {
        method: "POST",
        mode: "no-cors", // MailerLite blocks CORS; this prevents errors
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const fileName = downloadUrl.split("/").pop() || "download";
      const slug = fileName.replace(/\.pdf$/i, "") || "download";
      window.location.href = `/thank-you/${encodeURIComponent(slug)}?file=${encodeURIComponent(downloadUrl)}`;
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/65">{subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/35 outline-none"
          />

          {err ? <div className="text-sm text-red-300">{err}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? "Submitting..." : buttonText}
          </button>

          <div className="text-xs text-white/45">No spam. Instant download.</div>
        </form>
      </div>
    </div>
  );
}
