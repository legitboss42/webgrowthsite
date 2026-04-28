import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET(request: Request) {
  return NextResponse.redirect(new URL(absoluteUrl("/sitemap-index.xml"), request.url), 308);
}
