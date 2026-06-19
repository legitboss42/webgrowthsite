import fs from "node:fs";

const routeGovernance = JSON.parse(
  fs.readFileSync(new URL("./src/lib/route-governance.json", import.meta.url), "utf8")
);

const governanceRedirects = [
  ...routeGovernance.routes
    .filter((route) => route.status === "REDIRECT")
    .map((route) => ({
      source: route.path === "/" ? "/" : route.path.replace(/\/$/, ""),
      destination: route.destination,
      permanent: true,
    })),
  ...routeGovernance.articles
    .filter((article) => article.status === "REDIRECT")
    .map((article) => ({
      source: `/blog/${article.slug}`,
      destination: article.destination,
      permanent: true,
    })),
];

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
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  experimental: {
    cpus: 1,
  },
  // Keep Vercel builds on the default `.next` output so deployment manifests resolve.
  // Optional local override: WEBGROWTH_ALT_DISTDIR=1
  distDir:
    process.env.VERCEL === "1"
      ? ".next"
      : process.env.WEBGROWTH_ALT_DISTDIR === "1"
        ? ".next-webgrowth"
        : ".next",
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
      ...governanceRedirects,
      {
        source: "/images/:path*.png",
        destination: "/images/:path*.webp",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
