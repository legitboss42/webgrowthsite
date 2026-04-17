import { NextResponse } from "next/server";
export const runtime = "edge";
const AI_ENDPOINT_ENABLED = process.env.ENABLE_AI_WIDGET_API === "1";

export async function POST(req: Request) {
  if (!AI_ENDPOINT_ENABLED) {
    return NextResponse.json(
      { error: "Temporarily disabled." },
      {
        status: 410,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  }

  const {
    checkRateLimit,
    getClientIp,
    getUserAgent,
    hasJsonContentType,
    isAllowedOrigin,
    isLikelyAutomationRequest,
  } = await import("@/lib/security");

  if (!isAllowedOrigin(req, { allowMissingOrigin: false })) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }

  if (!hasJsonContentType(req)) {
    return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
  }

  if (isLikelyAutomationRequest(req)) {
    return NextResponse.json({ error: "Automated traffic is not allowed." }, { status: 403 });
  }

  const ip = getClientIp(req);
  const ua = getUserAgent(req).slice(0, 80).toLowerCase();
  const rate = checkRateLimit(`ai:${ip}:${ua}`, 20);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { answers } = body as { answers?: Record<string, string> };

  // Mock AI response for now (no money, no OpenAI yet)
  const businessName = answers?.businessName || "your business";
  const niche = answers?.niche || "your niche";

  return NextResponse.json({
    summary: `Got it. ${businessName} in ${niche}.`,
    mockup: {
      pages: [
        "Home (hero + CTA)",
        "Services (offer stack + pricing hint)",
        "Portfolio/Results",
        "About (trust + story)",
        "Contact (form + WhatsApp)",
      ],
      homepageCopy: {
        headline: `${businessName} - built to attract customers and convert.`,
        subheadline:
          "Clear messaging, trust signals, and a simple path to contact you.",
        cta: "Request a Quote",
      },
    },
    tips: [
      "Your homepage must answer: what you do, who it’s for, why trust you, what to do next.",
      "Add WhatsApp + a short form. Don’t make people think.",
      "Use 3-6 proof items (results, testimonials, before/after, logos).",
    ],
  });
}
