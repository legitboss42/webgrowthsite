"use client";

import { sendGAEvent } from "@next/third-parties/google";

type Primitive = string | number | boolean;
type AnalyticsValue = Primitive | Primitive[] | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

function normalizeValue(value: AnalyticsValue): Primitive | undefined {
  if (value === null || value === undefined) return undefined;

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(", ");

    return joined ? joined.slice(0, 180) : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 180) : undefined;
  }

  return value;
}

function sanitizeParams(params: AnalyticsParams = {}) {
  return Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => [key, normalizeValue(value)])
      .filter(([, value]) => value !== undefined)
  ) as Record<string, Primitive>;
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;

  const payload = sanitizeParams(params);
  sendGAEvent("event", eventName, payload);
}

export function setClarityTags(tags: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.clarity !== "function") return;

  const payload = sanitizeParams(tags);

  Object.entries(payload).forEach(([key, value]) => {
    window.clarity?.("set", key, String(value));
  });
}

export type { AnalyticsParams, AnalyticsValue };
