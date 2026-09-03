import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const routeGovernance = JSON.parse(
  fs.readFileSync(new URL("./src/lib/route-governance.json", import.meta.url), "utf8")
);

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const governanceRedirects = [
  ...routeGovernance.routes
    .filter((route) => route.status === "REDIRECT")
    .map((route) => ({ source: route.path === "/" ? "/" : route.path.replace(/\/$/, ""), destination: route.destination, permanent: true })),
  ...routeGovernance.articles
    .filter((article) => article.status === "REDIRECT")
    .map((article) => ({ source: `/blog/${article.slug}`, destination: article.destination, permanent: true })),
];

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.tiktok.com https://accounts.google.com",
      "connect-src 'self' https://analytics.tiktok.com https://www.google-analytics.com https://analytics-dashboard-fqnf.vercel.app https://api.mailersend.com https://ockqdqlmzilrnilclwwa.supabase.co",
      "frame-src https://www.googletagmanager.com https://accounts.google.com",
      "form-action 'self' https://assets.mailerlite.com",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  serverExternalPackages: ["edge-tts-universal", "ffmpeg-static", "ffprobe-static", "ws", "bufferutil", "utf-8-validate"],
  outputFileTracingIncludes: {
    "/api/scheduler/uploads": ["./node_modules/ffprobe-static/bin/linux/x64/ffprobe"],
    "/api/admin/whatsapp/reply/audio": [
      "./node_modules/ffmpeg-static/ffmpeg",
      "./node_modules/ffprobe-static/bin/linux/x64/ffprobe",
    ],
  },
  distDir: ".next",
  images: { qualities: [60, 65, 68, 75] },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@/lib/whatsapp/templates": path.join(projectRoot, "src/lib/whatsapp/templateClient.ts"),
      };
    }
    return config;
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      ...governanceRedirects,
      { source: "/:path*", has: [{ type: "host", value: "www.webgrowth.info" }], destination: "https://webgrowth.info/:path*", permanent: true },
      { source: "/images/:path*.png", destination: "/images/:path*.webp", permanent: true },
    ];
  },
};

export default nextConfig;
