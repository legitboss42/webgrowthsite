import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LEGACY_REDIRECTS = new Map([
  [
    "/blog/07-launch-week-checklist-and-first-7-days-image-prompts",
    "/blog/03-seo-migration-without-losing-traffic/",
  ],
  [
    "/blog/01-why-we-rebuilt-not-redesigned",
    "/blog/03-seo-migration-without-losing-traffic/",
  ],
  ["/blog/02-the-audit-that-created-the-roadmap", "/services/website-audit/"],
  [
    "/blog/06-nextjs-architecture-and-build-decisions",
    "/blog/05-premium-design-without-slow-pages/",
  ],
  [
    "/blog/jluxe-website-redesign-series-announcement",
    "/blog/03-seo-migration-without-losing-traffic/",
  ],
]);

function toApexUrl(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (request.headers.get("host") === "www.webgrowth.info") {
    url.host = "webgrowth.info";
    url.protocol = "https";
  }

  return url;
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/sitemap.xml") {
    return NextResponse.redirect(toApexUrl(request, "/sitemap-index.xml"), 308);
  }

  const normalizedPath = request.nextUrl.pathname.replace(/\/+$/, "");
  const legacyDestination = LEGACY_REDIRECTS.get(normalizedPath);

  if (legacyDestination) {
    return NextResponse.redirect(toApexUrl(request, legacyDestination), 308);
  }

  const host = request.headers.get("host");

  if (host === "www.webgrowth.info") {
    const url = request.nextUrl.clone();
    url.host = "webgrowth.info";
    url.protocol = "https";

    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Keep middleware scoped to known redirect cleanup paths.
  matcher: [
    "/sitemap.xml",
    "/blog/07-launch-week-checklist-and-first-7-days-image-prompts",
    "/blog/07-launch-week-checklist-and-first-7-days-image-prompts/",
    "/blog/01-why-we-rebuilt-not-redesigned",
    "/blog/01-why-we-rebuilt-not-redesigned/",
    "/blog/02-the-audit-that-created-the-roadmap",
    "/blog/02-the-audit-that-created-the-roadmap/",
    "/blog/06-nextjs-architecture-and-build-decisions",
    "/blog/06-nextjs-architecture-and-build-decisions/",
    "/blog/jluxe-website-redesign-series-announcement",
    "/blog/jluxe-website-redesign-series-announcement/",
  ],
};
