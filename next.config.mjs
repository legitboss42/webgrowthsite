/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Start in report-only mode to avoid breaking scripts while we harden progressively.
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.tiktok.com",
      "connect-src 'self' https://analytics.tiktok.com https://www.google-analytics.com https://analytics-dashboard-fqnf.vercel.app https://api.mailersend.com",
      "frame-src https://www.googletagmanager.com",
      "form-action 'self' https://assets.mailerlite.com",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [60, 65, 68, 75],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/07-launch-week-checklist-and-first-7-days-image-prompts",
        destination: "/blog/07-launch-week-checklist-and-first-7-days",
        permanent: true,
      },
      {
        source: "/services/website-maintenance-and-support",
        destination: "https://webgrowth.info/services/website-maintenance",
        permanent: true,
      },
      {
        source: "/services/speed-and-performance-optimization",
        destination: "https://webgrowth.info/services/performance-optimisation",
        permanent: true,
      },
      {
        source: "/services/website-audit-and-consultation",
        destination: "https://webgrowth.info/services/website-audit",
        permanent: true,
      },
      {
        source: "/images/:path*.png",
        destination: "/images/:path*.webp",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
