/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
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
