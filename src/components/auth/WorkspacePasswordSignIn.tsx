"use client";

import { FormEvent, useState } from "react";

export default function WorkspacePasswordSignIn({
  nextPath,
  available,
}: {
  nextPath: string;
  available: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/auth/password/session/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, next: nextPath }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.redirectTo) {
        setError(payload?.error || "Email sign-in could not be completed.");
        setBusy(false);
        return;
      }

      window.location.assign(payload.redirectTo);
    } catch {
      setError("Email sign-in could not be completed.");
      setBusy(false);
    }
  }

  async function requestReset() {
    if (!available || resetBusy) return;
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setResetBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fetch("/api/auth/password/reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setNotice("If that email belongs to the workspace, a secure password link has been sent.");
    } catch {
      setNotice("If that email belongs to the workspace, a secure password link will be sent.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#22332b]">Email address</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          disabled={!available}
          className="h-12 w-full rounded-xl border border-[#d7ddd8] bg-white px-4 text-sm text-[#13241c] outline-none transition placeholder:text-[#8a9991] focus:border-[#1c7a54] focus:ring-2 focus:ring-[#1c7a54]/10 disabled:cursor-not-allowed disabled:bg-[#f3f5f3]"
          required
        />
      </label>

      <label className="block">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[#22332b]">Password</span>
          <button
            type="button"
            onClick={requestReset}
            disabled={!available || resetBusy}
            className="text-xs font-semibold text-[#1c7a54] transition hover:text-[#124a38] disabled:opacity-50"
          >
            {resetBusy ? "Sending…" : "Forgot password?"}
          </button>
        </div>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          disabled={!available}
          className="h-12 w-full rounded-xl border border-[#d7ddd8] bg-white px-4 text-sm text-[#13241c] outline-none transition placeholder:text-[#8a9991] focus:border-[#1c7a54] focus:ring-2 focus:ring-[#1c7a54]/10 disabled:cursor-not-allowed disabled:bg-[#f3f5f3]"
          required
        />
      </label>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800">{notice}</p> : null}

      <button
        type="submit"
        disabled={!available || busy}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#124a38] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(18,74,56,.18)] transition hover:bg-[#0f3d2f] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>

      {!available ? <p className="text-xs leading-5 text-amber-700">Email and password sign-in is not configured on this environment yet.</p> : null}
    </form>
  );
}
