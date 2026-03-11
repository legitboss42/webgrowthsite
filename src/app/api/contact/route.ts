import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  isAllowedOrigin,
  isValidEmail,
  sanitizeText,
} from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!isAllowedOrigin(req)) {
      return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`contact:${ip}`, 8);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const name = sanitizeText(body?.name, 120);
    const email = sanitizeText(body?.email, 254).toLowerCase();
    const message = sanitizeText(body?.message, 2000);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500 }
    );
  }
}
