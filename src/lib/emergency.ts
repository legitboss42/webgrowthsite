export const LOW_CPU_EMERGENCY_MODE =
  process.env.LOW_CPU_EMERGENCY_MODE !== "0";

export function buildLowCpuJsonResponse() {
  return {
    body: {
      error: "Temporarily unavailable while low-CPU emergency mode is active.",
    },
    init: {
      status: 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Retry-After": "3600",
      },
    },
  } as const;
}
