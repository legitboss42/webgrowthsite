"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Google sign-in is not configured yet.");
  // detectSessionInUrl must be off here. Left on, the client exchanges the ?code=
  // itself while it initialises, consumes the one-time PKCE verifier, and the
  // explicit exchange below then fails on a race we cannot observe. Off, this
  // component owns the exchange and the order is deterministic.
  return createClient(url, anonKey, {
    auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: false },
  });
}

export default function GoogleAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing Google sign-in...");

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        // Google reports a refusal on the query string, not by omitting the code.
        // Reported as a fixed sentence rather than echoing the provider's text.
        const oauthError = searchParams.get("error");
        if (oauthError) {
          throw new Error(
            oauthError === "access_denied"
              ? "Google sign-in was cancelled. Nothing was changed."
              : "Google sign-in did not complete. Please try again.",
          );
        }

        const code = searchParams.get("code");
        if (!code) throw new Error("Google did not return an authorization code.");

        const supabase = createBrowserSupabaseClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const accessToken = data.session?.access_token;
        if (!accessToken) throw new Error("Google sign-in did not create a session.");

        const response = await fetch("/api/auth/google/session/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            next: searchParams.get("next") || "/",
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; redirectTo?: string; error?: string }
          | null;

        if (!response.ok || !payload?.ok || !payload.redirectTo) {
          throw new Error(payload?.error || "Unable to finish Google sign-in.");
        }

        // The sealed cookie the route just set is this app's only session authority,
        // so the Supabase session has done its job. Clear it from this browser rather
        // than leaving a Google-linked session in storage that nothing reads.
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

        if (!active) return;
        router.replace(payload.redirectTo);
        router.refresh();
      } catch (caughtError) {
        if (!active) return;
        setMessage(caughtError instanceof Error ? caughtError.message : "Unable to finish Google sign-in.");
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#070a08] px-6 py-20 text-white">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[36px] border border-[#d9c9ae]/16 bg-[#0d110d] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,182,120,0.16),transparent_40%),radial-gradient(circle_at_85%_18%,rgba(93,151,121,0.18),transparent_28%)]"
        />
        <div className="relative grid gap-6 p-8 md:grid-cols-[minmax(0,1.1fr)_16rem] md:p-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#d7c9b2]/72">Google sign-in</p>
            <h1 className="mt-5 font-display text-4xl font-medium tracking-[-0.04em] text-[#f8f1e7] md:text-5xl">
              Completing your admin session
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#e9dfcf]/74">{message}</p>
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-black/18 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#d7c9b2]/60">What happens next</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/68">
              <li>Google confirms the account identity</li>
              <li>The app seals its own session cookie</li>
              <li>You are redirected only if the email is approved</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
