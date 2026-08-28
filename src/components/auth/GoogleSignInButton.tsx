"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

type GoogleSignInButtonProps = {
  nextPath: string;
  label: string;
  pendingLabel: string;
  className: string;
  loginHint?: string;
};

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Google sign-in is not configured yet.");
  return createClient(url, anonKey);
}

export default function GoogleSignInButton({
  nextPath,
  label,
  pendingLabel,
  className,
  loginHint,
}: GoogleSignInButtonProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setError("");
    setIsLoading(true);

    try {
      const callbackUrl = new URL("/auth/google/callback/", window.location.origin);
      callbackUrl.searchParams.set("next", nextPath);

      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: loginHint ? { login_hint: loginHint } : undefined,
        },
      });

      if (signInError) throw signInError;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start Google sign-in.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={handleClick} disabled={isLoading} className={className}>
        {isLoading ? pendingLabel : label}
      </button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
