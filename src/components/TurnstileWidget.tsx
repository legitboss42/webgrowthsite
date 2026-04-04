"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

type TurnstileWidgetProps = {
  action: string;
  onTokenChange: (token: string) => void;
  resetKey?: number;
  theme?: "auto" | "light" | "dark";
};

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileApi = {
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-api";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default function TurnstileWidget({
  action,
  onTokenChange,
  resetKey = 0,
  theme = "dark",
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.turnstile) {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!siteKey || !scriptReady || widgetIdRef.current || !window.turnstile) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      action,
      theme,
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => onTokenChange(""),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, containerId, onTokenChange, scriptReady, siteKey, theme]);

  useEffect(() => {
    if (!resetKey || !widgetIdRef.current || !window.turnstile) {
      return;
    }

    onTokenChange("");
    window.turnstile.reset(widgetIdRef.current);
  }, [onTokenChange, resetKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        id={TURNSTILE_SCRIPT_ID}
        src={TURNSTILE_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/25 p-3">
        <div id={containerId} />
      </div>
    </>
  );
}
