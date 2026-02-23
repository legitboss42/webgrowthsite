"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    fetch("https://analytics-dashboard-fqnf.vercel.app/api/vitals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.label === "web-vital" ? "good" : "poor",
      }),
    }).catch(() => {});
  });

  return null;
}
