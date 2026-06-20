import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getPost } from "@/lib/posts";
import { buildTikTokPhotoDraftContent } from "@/lib/tiktokPublishing";

export const runtime = "nodejs";

const tikTokVerificationPattern = /^tiktok([A-Za-z0-9]+)\.txt$/;

const slideColors = [
  {
    accent: "#10b981",
    background: "#06120d",
    border: "#164e3b",
  },
  {
    accent: "#f59e0b",
    background: "#130c03",
    border: "#78350f",
  },
  {
    accent: "#60a5fa",
    background: "#07101d",
    border: "#1d4ed8",
  },
  {
    accent: "#f472b6",
    background: "#160816",
    border: "#9d174d",
  },
] as const;

function noIndexHeaders() {
  return {
    "Cache-Control": "public, max-age=3600",
    "X-Robots-Tag": "noindex, noimageindex, noarchive",
  };
}

function normalizeSlideSlug(slug: string) {
  return decodeURIComponent(slug)
    .trim()
    .replace(/\.jpe?g$/i, "")
    .replace(/\.png$/i, "");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeSlideSlug(rawSlug);

  const url = new URL(request.url);
  const slideIndex = Number(url.searchParams.get("index") || "0");

  const verificationMatch = rawSlug.match(tikTokVerificationPattern);

  if (verificationMatch) {
    const token = verificationMatch[1];

    return new NextResponse(`tiktok-developers-site-verification=${token}`, {
      headers: {
        ...noIndexHeaders(),
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const post = getPost(slug);

  if (!post) {
    return NextResponse.json(
      {
        error: "Not found",
        slug,
      },
      {
        status: 404,
        headers: noIndexHeaders(),
      }
    );
  }

  const slides = buildTikTokPhotoDraftContent(post).slides;
  const slide = slides[slideIndex];

  if (!slide) {
    return NextResponse.json(
      {
        error: "Slide not found",
        slug,
        slideIndex,
        availableSlides: slides.length,
      },
      {
        status: 404,
        headers: noIndexHeaders(),
      }
    );
  }

  const palette = slideColors[slideIndex % slideColors.length];

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(180deg, ${palette.background} 0%, #020403 100%)`,
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "88px 72px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: `2px solid ${palette.border}`,
            borderRadius: 999,
            color: palette.accent,
            display: "flex",
            fontSize: 34,
            letterSpacing: 6,
            padding: "12px 24px",
            textTransform: "uppercase",
            alignSelf: "flex-start",
          }}
        >
          {slide.eyebrow}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
            marginTop: 54,
          }}
        >
          <div
            style={{
              color: "#ffffff",
              display: "flex",
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.04,
            }}
          >
            {slide.headline}
          </div>

          {slide.bodyLines.map((line) => (
            <div
              key={line}
              style={{
                borderLeft: `8px solid ${palette.accent}`,
                color: "#d4d4d8",
                display: "flex",
                fontSize: 42,
                lineHeight: 1.32,
                paddingLeft: 24,
              }}
            >
              {line}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            alignItems: "center",
            borderTop: `2px solid ${palette.border}`,
            color: "#e5e7eb",
            display: "flex",
            fontSize: 30,
            justifyContent: "space-between",
            paddingTop: 28,
          }}
        >
          <span>{slide.footer}</span>
          <span style={{ color: palette.accent }}>WEB GROWTH</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  );

  const pngBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const jpegBuffer = await sharp(pngBuffer).jpeg({ quality: 90 }).toBuffer();

  return new NextResponse(new Uint8Array(jpegBuffer), {
    headers: {
      ...noIndexHeaders(),
      "Content-Type": "image/jpeg",
      "Content-Length": String(jpegBuffer.length),
    },
  });
}