"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleSignInButtonProps = {
  nextPath: string;
  label: string;
  pendingLabel: string;
  className: string;
  clientId?: string;
  loginHint?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(options: {
            callback: (response: GoogleCredentialResponse) => void;
            client_id: string;
            context?: string;
            login_hint?: string;
            ux_mode?: string;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
              logo_alignment?: string;
            },
          ): void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({
  nextPath,
  label,
  pendingLabel,
  className,
  clientId = "",
  loginHint,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google?.accounts?.id) return;

    const googleId = window.google.accounts.id;
    buttonRef.current.innerHTML = "";

    googleId.initialize({
      client_id: clientId,
      login_hint: loginHint,
      context: "signin",
      ux_mode: "popup",
      callback: async ({ credential }) => {
        if (!credential) {
          setError("Google sign-in did not return an identity credential. Please try again.");
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/auth/google/session/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential,
              next: nextPath,
            }),
          });
          const payload = (await response.json().catch(() => null)) as
            | { error?: string; redirectTo?: string }
            | null;

          if (!response.ok || !payload?.redirectTo) {
            setError(payload?.error || "Google sign-in could not be completed. Please try again.");
            setIsLoading(false);
            return;
          }

          window.location.assign(payload.redirectTo);
        } catch {
          setError("Google sign-in could not be completed. Please try again.");
          setIsLoading(false);
        }
      },
    });

    googleId.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: 320,
      logo_alignment: "left",
    });
  }, [clientId, loginHint, nextPath, scriptReady]);

  if (!clientId) {
    return (
      <div className="space-y-3">
        <div className="rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-50/86">
          Google sign-in is not configured in this environment yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <div ref={buttonRef} className={isLoading ? "pointer-events-none opacity-70" : undefined} />
        <span className="text-sm text-[#e9dfcf]/72">{isLoading ? pendingLabel : label}</span>
      </div>
      {error ? (
        <p className="rounded-[20px] border border-rose-200/16 bg-rose-200/10 px-4 py-3 text-sm leading-6 text-rose-50/90">
          {error}
        </p>
      ) : null}
      <noscript>
        <p className={className}>JavaScript is required to continue with Google.</p>
      </noscript>
    </div>
  );
}
