"use client";

import { FormEvent, useState } from "react";

export default function ChangePasswordPanel({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    if (newPassword.length < 10) {
      setError("Use at least 10 characters for your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/auth/password/change/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || "Password could not be changed.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password changed successfully.");
    } catch {
      setError("Password could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendSetupLink() {
    if (resetBusy) return;
    setResetBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fetch("/api/auth/password/reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setNotice("A secure password setup/reset link has been sent to your workspace email.");
    } catch {
      setError("The password email could not be requested right now.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-4 sm:max-w-xl">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-rule bg-paper px-3.5 text-sm text-ink outline-none transition focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/10"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 10 characters"
            className="h-11 w-full rounded-xl border border-rule bg-paper px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/10"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-rule bg-paper px-3.5 text-sm text-ink outline-none transition focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/10"
            required
          />
        </label>

        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {notice ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center rounded-xl bg-ledger px-5 text-sm font-semibold text-white transition hover:bg-ledger-deep disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Changing…" : "Change password"}
          </button>
          <button type="button" onClick={sendSetupLink} disabled={resetBusy} className="inline-flex h-11 items-center justify-center rounded-xl border border-rule bg-paper-raised px-4 text-sm font-semibold text-ink-soft transition hover:border-rule-strong hover:text-ink disabled:opacity-60">
            {resetBusy ? "Sending…" : "Set/reset by email instead"}
          </button>
        </div>
      </form>
    </div>
  );
}
