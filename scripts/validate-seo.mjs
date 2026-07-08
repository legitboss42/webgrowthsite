import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const APPROVED_PAGE_URLS = [
  "https://webgrowth.info/",
  "https://webgrowth.info/about/",
  "https://webgrowth.info/contact/",
  "https://webgrowth.info/portfolio/",
  "https://webgrowth.info/pricing/",
  "https://webgrowth.info/faq/",
  "https://webgrowth.info/services/",
  "https://webgrowth.info/local-business/",
  "https://webgrowth.info/ecommerce/",
  "https://webgrowth.info/website-design-lagos/",
  "https://webgrowth.info/services/business-website-design/",
  "https://webgrowth.info/services/landing-page-design/",
  "https://webgrowth.info/services/website-redesign/",
  "https://webgrowth.info/services/ecommerce-website-design/",
  "https://webgrowth.info/services/performance-optimisation/",
  "https://webgrowth.info/services/website-audit/",
];

const APPROVED_BLOG_URLS = [
  "https://webgrowth.info/blog/homepage-structure-that-converts-visitors-into-customers/",
  "https://webgrowth.info/blog/why-your-website-isnt-getting-leads/",
  "https://webgrowth.info/blog/high-converting-landing-pages-guide/",
  "https://webgrowth.info/blog/how-to-build-a-small-business-website-that-converts/",
  "https://webgrowth.info/blog/high-converting-service-page/",
  "https://webgrowth.info/blog/website-redesign-cost-breakdown-nigeria/",
  "https://webgrowth.info/blog/how-to-audit-slow-wordpress-site/",
  "https://webgrowth.info/blog/conversion-audit-checklist-service-homepage/",
  "https://webgrowth.info/blog/small-business-website-redesign-checklist/",
  "https://webgrowth.info/blog/04-writing-service-pages-that-convert/",
  "https://webgrowth.info/blog/05-premium-design-without-slow-pages/",
  "https://webgrowth.info/blog/03-seo-migration-without-losing-traffic/",
];

const FORBIDDEN_PAGE_URLS = [
  "https://webgrowth.info/editorial-policy/",
  "https://webgrowth.info/launch/",
  "https://webgrowth.info/website-build/",
  "https://webgrowth.info/hosting-offer/",
  "https://webgrowth.info/get-started/",
  "https://webgrowth.info/privacy/",
  "https://webgrowth.info/terms/",
  "https://webgrowth.info/website-design-united-kingdom/",
  "https://webgrowth.info/web-design-for-real-estate-lagos/",
  "https://webgrowth.info/services/email-marketing-setup-strategy/",
  "https://webgrowth.info/services/search-engine-optimisation/",
  "https://webgrowth.info/services/google-my-business-setup-optimisation/",
  "https://webgrowth.info/services/booking-platform-setup-integration/",
  "https://webgrowth.info/services/crm-system-setup-configuration/",
  "https://webgrowth.info/services/marketing-automation-build-implementation/",
  "https://webgrowth.info/services/analytics-tracking-setup/",
  "https://webgrowth.info/services/domain-registration-hosting-guidance/",
  "https://webgrowth.info/services/lead-magnet-strategy-build/",
  "https://webgrowth.info/services/website-maintenance/",
];

const REMOVED_BLOG_URLS = [
  "https://webgrowth.info/blog/",
  "https://webgrowth.info/blog/how-to-launch-a-website-in-7-days/",
  "https://webgrowth.info/blog/medical-website-booking-experience/",
  "https://webgrowth.info/thank-you/",
];

const priorityPages = [
  {
    name: "Homepage",
    file: "src/app/page.tsx",
    title: "Web Design Agency in Nigeria | Web Growth",
    description:
      "Web Growth is a web design agency in Nigeria building fast, conversion-focused websites for businesses that need more trust, enquiries, and online sales.",
    h1: "Web Design Agency in Nigeria for Fast, Conversion-Focused Websites",
    path: "/",
    requiresServiceSchema: false,
    requiredLinks: [
      "/services/business-website-design/",
      "/services/website-redesign/",
      "/services/landing-page-design/",
      "/services/ecommerce-website-design/",
      "/services/website-audit/",
      "/services/performance-optimisation/",
      "/local-business/",
      "/ecommerce/",
      "/website-design-lagos/",
      "/portfolio/",
      "/pricing/",
      "/contact/",
    ],
  },
  {
    name: "Business Website Design",
    file: "src/app/services/business-website-design/page.tsx",
    title: "Business Website Design Service | Web Growth",
    description:
      "Get a fast, professional business website built to explain your offer clearly, create trust, and turn visitors into enquiries, bookings, or sales.",
    h1: "Business Website Design Service for Companies That Need More Trust and Enquiries",
    path: "/services/business-website-design/",
    canonical: "https://webgrowth.info/services/business-website-design/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/pricing/",
      "/portfolio/",
      "/services/website-audit/",
      "/services/website-redesign/",
      "/services/landing-page-design/",
      "/services/ecommerce-website-design/",
      "/services/performance-optimisation/",
      "/local-business/",
      "/website-design-lagos/",
    ],
  },
  {
    name: "Website Redesign",
    file: "src/app/services/website-redesign/page.tsx",
    title: "Website Redesign Service in Nigeria | Web Growth",
    description:
      "Redesign your outdated business website into a faster, clearer, conversion-focused site built to improve trust, user experience, and enquiries.",
    h1: "Website Redesign Service in Nigeria for Businesses That Need Better Results",
    path: "/services/website-redesign/",
    canonical: "https://webgrowth.info/services/website-redesign/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/portfolio/",
      "/services/website-audit/",
      "/services/business-website-design/",
      "/services/landing-page-design/",
      "/services/performance-optimisation/",
      "/services/ecommerce-website-design/",
      "/local-business/",
    ],
  },
  {
    name: "Landing Page Design",
    file: "src/app/services/landing-page-design/page.tsx",
    title: "Landing Page Design Service | Web Growth",
    description:
      "Get a focused landing page built to explain your offer clearly, build trust fast, and guide visitors toward enquiries, bookings, signups, or sales.",
    h1: "Landing Page Design Service for Businesses That Need More Conversions",
    path: "/services/landing-page-design/",
    canonical: "https://webgrowth.info/services/landing-page-design/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/portfolio/",
      "/services/website-audit/",
      "/services/business-website-design/",
      "/services/website-redesign/",
      "/services/performance-optimisation/",
      "/services/ecommerce-website-design/",
      "/local-business/",
    ],
  },
  {
    name: "Online Store Website Design",
    file: "src/app/services/ecommerce-website-design/page.tsx",
    title: "Online Store Website Design Nigeria | Web Growth",
    description:
      "Launch a fast, trustworthy online store website built to showcase products clearly, improve mobile shopping, and support enquiries, checkout, or sales.",
    h1: "Online Store Website Design in Nigeria for Businesses Ready to Sell Online",
    path: "/services/ecommerce-website-design/",
    canonical: "https://webgrowth.info/services/ecommerce-website-design/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/pricing/",
      "/portfolio/",
      "/ecommerce/",
      "/services/website-audit/",
      "/services/business-website-design/",
      "/services/landing-page-design/",
      "/services/website-redesign/",
      "/services/performance-optimisation/",
    ],
  },
  {
    name: "Website Audit",
    file: "src/app/services/website-audit/page.tsx",
    title: "Website Audit Service for SEO, UX, and Conversion Diagnosis | Web Growth",
    description:
      "Website audit service for businesses that need a practical diagnosis of SEO, trust, speed, mobile UX, and conversion blockers before investing in redesign, SEO, or paid traffic.",
    h1: "Website Audit Service for Businesses Not Getting Enough Enquiries",
    path: "/services/website-audit/",
    canonical: "https://webgrowth.info/services/website-audit/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/services/website-redesign/",
      "/services/business-website-design/",
      "/services/landing-page-design/",
      "/services/ecommerce-website-design/",
      "/services/performance-optimisation/",
      "/local-business/",
    ],
  },
  {
    name: "Performance Optimisation",
    file: "src/app/services/performance-optimisation/page.tsx",
    title: "Website Speed Optimization Service | Web Growth",
    description:
      "Fix slow website pages with a practical speed optimization service focused on loading speed, mobile experience, Core Web Vitals, and user trust.",
    h1: "Website Speed Optimization Service for Faster Business Websites",
    path: "/services/performance-optimisation/",
    canonical: "https://webgrowth.info/services/performance-optimisation/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/services/website-audit/",
      "/services/website-redesign/",
      "/services/business-website-design/",
      "/services/landing-page-design/",
      "/services/ecommerce-website-design/",
    ],
  },
  {
    name: "Local Business",
    file: "src/app/local-business/page.tsx",
    title: "Website Design for Small Business | Web Growth",
    description:
      "Get a fast, trustworthy small business website built to explain your services clearly, build local trust, and support calls, bookings, WhatsApp enquiries, or leads.",
    h1: "Website Design for Small Businesses That Need More Calls, Bookings, and Enquiries",
    path: "/local-business/",
    canonical: "https://webgrowth.info/local-business/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/portfolio/",
      "/website-design-lagos/",
      "/services/business-website-design/",
      "/services/website-redesign/",
      "/services/landing-page-design/",
      "/services/website-audit/",
      "/services/performance-optimisation/",
    ],
  },
  {
    name: "Ecommerce",
    file: "src/app/ecommerce/page.tsx",
    title: "Ecommerce Website for Small Business | Web Growth",
    description:
      "Build a clear ecommerce website for your small business with product pages, trust sections, mobile shopping flow, and enquiry or checkout paths.",
    h1: "Ecommerce Website for Small Businesses Ready to Sell Beyond Social Media",
    path: "/ecommerce/",
    canonical: "https://webgrowth.info/ecommerce/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/services/ecommerce-website-design/",
      "/services/landing-page-design/",
      "/services/business-website-design/",
      "/services/website-audit/",
      "/services/performance-optimisation/",
    ],
  },
  {
    name: "Website Design Lagos",
    file: "src/app/website-design-lagos/page.tsx",
    title: "Website Design Lagos | Web Growth",
    description:
      "Get a fast, trustworthy website for your Lagos business, built to explain your services clearly, build local trust, and support calls, bookings, or enquiries.",
    h1: "Website Design in Lagos for Businesses That Need More Enquiries",
    path: "/website-design-lagos/",
    canonical: "https://webgrowth.info/website-design-lagos/",
    requiresServiceSchema: true,
    requiredLinks: [
      "/contact/",
      "/local-business/",
      "/services/business-website-design/",
      "/services/website-redesign/",
      "/services/landing-page-design/",
      "/services/website-audit/",
      "/services/performance-optimisation/",
    ],
  },
];

const footerRequiredLinks = [
  "/services/business-website-design/",
  "/services/website-redesign/",
  "/services/landing-page-design/",
  "/services/ecommerce-website-design/",
  "/services/website-audit/",
  "/contact/",
];

function fail(message) {
  throw new Error(message);
}

function ensureIncludes(haystack, needle, context) {
  if (!haystack.includes(needle)) {
    fail(`${context}: missing ${needle}`);
  }
}

function ensureExcludes(haystack, needle, context) {
  if (haystack.includes(needle)) {
    fail(`${context}: forbidden value found ${needle}`);
  }
}

async function read(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), "utf8");
}

async function main() {
  const routeGovernance = JSON.parse(await read("src/lib/route-governance.json"));
  const robotsSource = await read("src/app/robots.ts");
  const sitemapIndexSource = await read("src/app/sitemap-index.xml/route.ts");
  const footerSource = await read("src/components/Footer.tsx");
  const contactPageSource = await read("src/app/contact/page.tsx");
  const contactClientSource = await read("src/components/ContactClient.tsx");
  const thankYouPageSource = await read("src/app/thank-you/page.tsx");

  const indexedRoutes = routeGovernance.routes.filter(
    (route) => route.status === "INDEX" && route.sitemap
  );
  const indexedArticles = routeGovernance.articles.filter(
    (article) => article.status === "INDEX" && article.sitemap
  );
  const pageUrls = indexedRoutes.map((route) =>
    new URL(route.path, "https://webgrowth.info").toString()
  );
  const blogUrls = indexedArticles.map(
    (article) => `https://webgrowth.info/blog/${article.slug}/`
  );
  const allUrls = [...pageUrls, ...blogUrls];

  if (new Set(allUrls).size !== allUrls.length) {
    fail("duplicate sitemap URLs found across page and blog sitemap config");
  }

  for (const url of allUrls) {
    if (url.includes("/home/") || url.endsWith("/home")) {
      fail(`forbidden /home URL found in sitemap config: ${url}`);
    }
    const pathname = new URL(url).pathname;
    if (pathname.startsWith("/sitemap-") || pathname === "/sitemap.xml") {
      fail(`sitemap XML URL found as normal page URL: ${url}`);
    }
  }

  const sitemapChildUrls = [
    "https://webgrowth.info/sitemap-pages.xml",
    "https://webgrowth.info/sitemap-blog.xml",
  ];

  ensureIncludes(sitemapIndexSource, "${BASE_URL}/sitemap-pages.xml", "sitemap-index route");
  ensureIncludes(sitemapIndexSource, "${BASE_URL}/sitemap-blog.xml", "sitemap-index route");

  const sitemapNodeCount = (sitemapIndexSource.match(/<sitemap>/g) || []).length;
  if (sitemapNodeCount !== 2) {
    fail(`sitemap-index route should reference exactly 2 child sitemaps, found ${sitemapNodeCount}`);
  }

  ensureIncludes(robotsSource, "sitemap-index.xml", "robots.ts");
  ensureExcludes(robotsSource, "sitemap.xml`, `${BASE_URL}/sitemap-index.xml", "robots.ts");

  const disallowMatch = robotsSource.match(/disallow:\s*\[([\s\S]*?)\]/);
  const disallowEntries = disallowMatch
    ? [...disallowMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
    : [];

  for (const route of ["/services/", "/blog/", ...priorityPages.map((page) => page.path)]) {
    if (disallowEntries.includes(route)) {
      fail(`robots.ts blocks route ${route}`);
    }
  }

  for (const href of footerRequiredLinks) {
    ensureIncludes(footerSource, href, "footer links");
  }

  ensureIncludes(
    contactPageSource,
    "Contact Web Growth | Website Review, SEO, and Redesign Enquiries",
    "contact page title"
  );
  ensureIncludes(contactPageSource, "Request a website review from Web Growth. Send your website link or business details and get guidance on clarity, trust, speed, mobile experience, and enquiry flow.", "contact page meta description");
  ensureIncludes(contactPageSource, "Request a Website Review", "contact page H1");
  ensureIncludes(contactPageSource, 'path: "/contact/"', "contact page canonical path");
  ensureExcludes(contactPageSource, "noIndex: true", "contact page noindex");
  ensureIncludes(contactClientSource, "Name", "contact form field");
  ensureIncludes(contactClientSource, "Email", "contact form field");
  ensureIncludes(contactClientSource, "WhatsApp number", "contact form field");
  ensureIncludes(contactClientSource, "Business name", "contact form field");
  ensureIncludes(contactClientSource, "Website URL", "contact form field");
  ensureIncludes(contactClientSource, "What do you need help with?", "contact form field");
  ensureIncludes(contactClientSource, "Main issue", "contact form field");
  ensureIncludes(contactClientSource, "Budget range", "contact form field");
  ensureIncludes(contactClientSource, "Timeline", "contact form field");
  ensureIncludes(contactClientSource, "Message", "contact form field");
  ensureIncludes(contactPageSource, 'buildWhatsAppUrl(', "contact WhatsApp link");
  ensureIncludes(thankYouPageSource, "Thank You | Web Growth", "thank-you title");
  ensureIncludes(thankYouPageSource, "Your request has been received by Web Growth.", "thank-you meta description");
  ensureIncludes(thankYouPageSource, "index: false", "thank-you noindex");
  ensureIncludes(thankYouPageSource, "follow: true", "thank-you robots follow");
  ensureIncludes(thankYouPageSource, 'absoluteUrl("/thank-you/")', "thank-you canonical");

  for (const page of priorityPages) {
    const source = await read(page.file);
    ensureExcludes(source, "noIndex: true", `${page.name} noindex`);
    ensureExcludes(source, "aggregateRating", `${page.name} fake schema`);
    ensureExcludes(source, "AggregateRating", `${page.name} fake schema`);
    ensureExcludes(source, '"@type": "Review"', `${page.name} fake schema`);
    ensureExcludes(source, '"@type":"Review"', `${page.name} fake schema`);
    ensureExcludes(source, "streetAddress", `${page.name} fake address schema`);

    if (source.includes("buildFaqSchema(")) {
      fail(`${page.name}: FAQPage JSON-LD must not be emitted`);
    }
  }

  console.log("SEO validation passed.");
  console.log(`Validated ${priorityPages.length} priority pages.`);
  console.log(`Sitemap pages: ${pageUrls.length}`);
  console.log(`Sitemap blog URLs: ${blogUrls.length}`);
}

main().catch((error) => {
  console.error(`SEO validation failed: ${error.message}`);
  process.exit(1);
});
