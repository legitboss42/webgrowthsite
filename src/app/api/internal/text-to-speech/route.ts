import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  hasJsonContentType,
  isAllowedOrigin,
  isLikelyAutomationRequest,
  sanitizeText,
} from "@/lib/security";
import {
  DEFAULT_INTERNAL_TTS_VOICE,
  INTERNAL_TTS_CHAR_LIMIT,
  isAllowedTtsVoice,
  synthesizeInternalTts,
} from "@/lib/tts";
import {
  readInternalUtilityCookie,
  verifyInternalUtilityPassphrase,
  getInternalUtilityCookieName,
} from "@/lib/internalUtilityAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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
    const rate = checkRateLimit(`internal-tts:${ip}:${ua}`, 12);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const text = sanitizeText(body?.text, INTERNAL_TTS_CHAR_LIMIT);
    const passphrase = sanitizeText(body?.passphrase, 120);
    const selectedVoice = sanitizeText(body?.voice, 80);
    const selectedRate = sanitizeText(body?.rate, 8);

    const cookieHeader = req.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${getInternalUtilityCookieName()}=`))
      ?.slice(getInternalUtilityCookieName().length + 1);
    const hasSession = Boolean(readInternalUtilityCookie(sessionCookie));

    if (!hasSession && !verifyInternalUtilityPassphrase(passphrase)) {
      return NextResponse.json(
        { error: "Unlock the utility first or provide a valid passphrase." },
        { status: 401 }
      );
    }

    if (!text || text.length < 3) {
      return NextResponse.json(
        { error: "Enter at least a short sentence to generate speech." },
        { status: 400 }
      );
    }

    const voice = isAllowedTtsVoice(selectedVoice)
      ? selectedVoice
      : DEFAULT_INTERNAL_TTS_VOICE;

    const result = await synthesizeInternalTts({
      text,
      voice,
      rate: selectedRate,
    });

    return NextResponse.json({
      success: true,
      voice: result.voice,
      rate: result.rate,
      mimeType: result.mimeType,
      audioBase64: result.audioBuffer.toString("base64"),
      srt: result.srt,
      vtt: result.vtt,
      characterCount: text.length,
      generatedAt: new Date().toISOString(),
      filenameStem: result.filenameStem,
    });
  } catch (error) {
    console.error("Internal TTS error:", error);
    return NextResponse.json(
      { error: "Text to speech generation failed." },
      { status: 500 }
    );
  }
}
