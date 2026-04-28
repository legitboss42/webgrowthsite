"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") return;

    const payload = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.label === "web-vital" ? "good" : "poor",
    });
    const url = "https://analytics-dashboard-fqnf.vercel.app/api/vitals";

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  });

  return null;
}
