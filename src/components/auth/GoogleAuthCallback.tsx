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
    <main className="min-h-screen bg-[#050806] px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-black/35 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Google sign-in</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
          Completing your sign-in
        </h1>
        <p className="mt-4 text-base leading-7 text-white/72">{message}</p>
      </div>
    </main>
  );
}
