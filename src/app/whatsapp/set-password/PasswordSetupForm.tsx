"use client";

import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function PasswordSetupForm({
  supabaseUrl,
  anonKey,
  tokenHash,
  tokenType,
}: {
  supabaseUrl: string;
  anonKey: string;
  tokenHash: string;
  tokenType: "invite" | "recovery" | "";
}) {
  const client = useMemo(
    () =>
      supabaseUrl && anonKey
        ? createClient(supabaseUrl, anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: false,
            },
          })
        : null,
    [anonKey, supabaseUrl],
  );

  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!client || !tokenHash || !tokenType) {
      setReady(true);
      return;
    }

    let active = true;
    void (async () => {
      const { data, error: verifyError } = await client.auth.verifyOtp({
        token_hash: tokenHash,
        type: tokenType as EmailOtpType,
      });
      if (!active) return;
      setValidSession(Boolean(!verifyError && (data.session?.user || data.user)));
      setReady(true);
      if (!verifyError) window.history.replaceState(null, "", "/whatsapp/set-password/");
    })();

    return () => {
      active = false;
    };
  }, [client, tokenHash, tokenType]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;

    if (password.length < 10) {
      setError("Use at least 10 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);
    const { error: updateError } = await client.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "Your password could not be saved.");
      setBusy(false);
      return;
    }

    try {
      const { data: sessionData } = await client.auth.getSession();
      const accessToken = sessionData.session?.access_token?.trim();
      if (accessToken) {
        await fetch("/api/auth/password/changed/", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (notificationError) {
      console.warn("Password change notification could not be sent", notificationError);
    }

    await client.auth.signOut();
    setDone(true);
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#07120e] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-lg items-center">
        <section className="w-full rounded-[28px] border border-white/10 bg-[#0d1b15] p-6 shadow-[0_30px_90px_rgba(0,0,0,.35)] sm:p-8">
          <Image
            src="/images/brand/web-growth-logo.webp"
            alt="Web Growth"
            width={270}
            height={40}
            sizes="180px"
            quality={75}
            priority
            className="h-auto w-[180px]"
          />

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300/70">WhatsApp workspace</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">Choose your password</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">Create a password for email sign-in. Google sign-in will still remain available.</p>
          </div>

          {!ready ? <p className="mt-8 text-sm text-white/55">Checking your secure invitation…</p> : null}

          {ready && !client ? (
            <p className="mt-8 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">Password setup is not configured on this environment.</p>
          ) : null}

          {ready && client && !validSession && !done ? (
            <div className="mt-8 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm leading-6 text-rose-100">
              This password link is invalid or has expired. Return to the workspace login and request a new setup/reset link.
            </div>
          ) : null}

          {ready && validSession && !done ? (
            <form onSubmit={submit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/12 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/15"
                  placeholder="At least 10 characters"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/12 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/15"
                  placeholder="Repeat your password"
                  required
                />
              </label>

              {error ? <p className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p> : null}

              <button
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1c7a54] px-5 text-sm font-semibold text-white transition hover:bg-[#228b61] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Saving password…" : "Save password"}
              </button>
            </form>
          ) : null}

          {done ? (
            <div className="mt-8">
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">Your password is ready.</div>
              <a href="/admin/whatsapp/" className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#0d1b15] transition hover:bg-white/90">Go to workspace sign in</a>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
