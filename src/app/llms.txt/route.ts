import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

const lines = [
  "# Web Growth",
  "> Premium website growth platform for businesses that want to build stronger websites, grow qualified traffic, and monetize digital presence responsibly.",
  "",
  "## Core platform pages",
  `- Home -> ${absoluteUrl("/")}: Platform overview built around Build, Grow, and Monetize.`,
  `- Services -> ${absoluteUrl("/services")}: Website growth services covering design, SEO, analytics, maintenance, and infrastructure.`,
  `- Academy -> ${absoluteUrl("/blog")}: Structured educational hub for SEO, AdSense readiness, website speed, design, and conversion.`,
  `- Tools -> ${absoluteUrl("/tools")}: Public utilities including audit, checklist, and metadata tools.`,
  `- Case Studies -> ${absoluteUrl("/portfolio")}: Project context, implementation thinking, and evidence-led proof pages.`,
  `- About -> ${absoluteUrl("/about")}: Entity, positioning, and trust context for Web Growth.`,
  `- Contact -> ${absoluteUrl("/contact")}: Website review and project enquiry path.`,
  "",
  "## Priority services",
  `- Website Audit Service -> ${absoluteUrl("/services/website-audit")}: Diagnosis of trust, SEO, speed, and conversion blockers.`,
  `- SEO Service -> ${absoluteUrl("/services/search-engine-optimisation")}: Service-page SEO, local visibility, and technical cleanup.`,
  `- Google Business Profile Optimization Lagos -> ${absoluteUrl("/services/google-my-business-setup-optimisation")}: Maps visibility and local enquiry support.`,
  `- Analytics and Tracking Setup -> ${absoluteUrl("/services/analytics-tracking-setup")}: GA4, Meta Pixel, TikTok Pixel, and conversion measurement.`,
  "",
  "## Trust pages",
  `- Editorial Policy -> ${absoluteUrl("/editorial-policy")}: How Web Growth plans, reviews, and updates public content.`,
  `- Privacy Policy -> ${absoluteUrl("/privacy")}: Data handling and privacy information.`,
  `- Terms of Service -> ${absoluteUrl("/terms")}: Service and website usage terms.`,
  `- Disclaimer -> ${absoluteUrl("/disclaimer")}: Limits of claims, examples, and platform-specific guidance.`,
];

export function GET() {
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
