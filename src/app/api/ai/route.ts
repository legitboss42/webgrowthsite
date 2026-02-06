import { NextResponse } from "next/server";

export async function POST(req: Request) {
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
      "Use 3–6 proof items (results, testimonials, before/after, logos).",
    ],
  });
}


