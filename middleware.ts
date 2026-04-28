import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/sitemap.xml") {
    const url = request.nextUrl.clone();
    url.pathname = "/sitemap-index.xml";
    return NextResponse.redirect(url, 308);
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
  // Emergency low-CPU mode: keep only the legacy sitemap redirect in middleware.
  // Move www/apex redirects to Vercel's Domains settings to avoid middleware
  // running on normal page traffic.
  matcher: ["/sitemap.xml"],
};
