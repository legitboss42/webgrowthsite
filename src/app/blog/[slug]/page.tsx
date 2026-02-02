import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getPosts, getPost } from "../../../lib/posts";

export function generateStaticParams() {
  const posts = getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPost(params.slug);

  if (!post) {
    return {
      title: "Post not found | Web Growth",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${post.title} | Web Growth`,
    description: post.excerpt,
    alternates: { canonical: `https://webgrowth.info/blog/${post.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://webgrowth.info/blog/${post.slug}`,
      siteName: "Web Growth",
      type: "article",
      images: post.cover
        ? [
            {
              url: `https://webgrowth.info${post.cover}`,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
  };
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isLeadMagnetHeading(text: string) {
  return text.trim().toLowerCase() === "lead magnet";
}

// TOC only from "##" (and we EXCLUDE Lead magnet)
function extractHeadings(content: string) {
  const lines = content.split("\n").map((l) => l.trim());
  const headings: Array<{ text: string; id: string }> = [];

  for (const l of lines) {
    if (l.startsWith("## ")) {
      const text = l.replace(/^##\s+/, "").trim();
      if (isLeadMagnetHeading(text)) continue; // ✅ hide Lead magnet from sidebar/TOC
      headings.push({ text, id: slugifyHeading(text) });
    }
  }

  return headings;
}

/**
 * LEAD MAGNET SYNTAX (in your post.content):
 *
 * [LEAD|Button Text|/downloads/file.pdf]
 *
 * Example:
 * [LEAD|Download the Free Hosting Checklist (PDF)|/downloads/hosting-checklist.pdf]
 *
 * This line will NOT display as text in the article.
 * It will render as an animated CTA button block.
 */
function parseLeadMagnet(line: string) {
  const m = line.match(/^\[LEAD\|([^|]+)\|([^\]]+)\]$/);
  if (!m) return null;
  return { label: m[1].trim(), href: m[2].trim() };
}

type Block =
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; tone: "tip" | "note" | "warn"; text: string }
  | { type: "hr" }
  | { type: "img"; src: string; alt: string }
  | { type: "card"; title: string; lines: string[] }
  | { type: "lead"; label: string; href: string };

function renderContent(content: string) {
  const lines = content.split("\n");

  // inline image syntax: ![alt](src)
  const imageRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;

  const blocks: Block[] = [];
  let i = 0;

  // ✅ when true, we hide EVERYTHING in this section except the [LEAD|..|..] button
  let hideUntilNextSection = false;

  const takeParagraph = () => {
    const para: string[] = [];

    while (i < lines.length) {
      const nxtRaw = lines[i] ?? "";
      const nxt = nxtRaw.trim();

      if (!nxt) break;
      if (nxt === "---") break;
      if (nxt.startsWith("## ")) break;
      if (nxt.startsWith("# ")) break;
      if (nxt.startsWith("### ")) break;
      if (nxt.startsWith("- ")) break;
      if (/^\d+[\)\.]\s+/.test(nxt)) break;
      if (nxt.startsWith("👉")) break;
      if (/^(note:|NOTE:|warning:|WARNING:)/.test(nxt)) break;
      if (imageRegex.test(nxt)) break;
      if (parseLeadMagnet(nxt)) break;

      // ✅ if we're inside "Lead magnet" section, ignore paragraphs
      if (hideUntilNextSection) {
        i += 1;
        continue;
      }

      para.push(nxt);
      i += 1;
    }

    if (!hideUntilNextSection && para.length) blocks.push({ type: "p", text: para.join(" ") });
  };

  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const line = raw.trim();

    if (!line) {
      i += 1;
      continue;
    }

    // ✅ New section headings toggle the "Lead magnet hidden section" mode
    if (line.startsWith("## ") || line.startsWith("# ")) {
      const text = line.replace(/^#{1,2}\s+/, "").trim();

      // Turn on hide mode ONLY for "Lead magnet"
      if (isLeadMagnetHeading(text)) {
        hideUntilNextSection = true;
        i += 1;
        continue; // ✅ do NOT render the "Lead magnet" heading
      }

      // Any other heading ends the hidden section
      hideUntilNextSection = false;

      // render heading
      blocks.push({ type: "h2", text, id: slugifyHeading(text) });
      i += 1;
      continue;
    }

    // ✅ Lead magnet line -> render as button block (even if hidden section is on)
    const lead = parseLeadMagnet(line);
    if (lead) {
      blocks.push({ type: "lead", label: lead.label, href: lead.href });
      i += 1;
      continue;
    }

    // ✅ If we're inside Lead magnet section, hide everything else
    if (hideUntilNextSection) {
      i += 1;
      continue;
    }

    // inline image
    const imgMatch = line.match(imageRegex);
    if (imgMatch) {
      blocks.push({
        type: "img",
        alt: (imgMatch[1] || "Blog image").trim(),
        src: imgMatch[2].trim(),
      });
      i += 1;
      continue;
    }

    // divider
    if (line === "---") {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // callouts
    if (line.startsWith("👉")) {
      blocks.push({
        type: "callout",
        tone: "tip",
        text: line.replace(/^👉\s*/, ""),
      });
      i += 1;
      continue;
    }

    if (/^(note:|NOTE:)/.test(line)) {
      blocks.push({
        type: "callout",
        tone: "note",
        text: line.replace(/^(note:|NOTE:)\s*/, ""),
      });
      i += 1;
      continue;
    }

    if (/^(warning:|WARNING:)/.test(line)) {
      blocks.push({
        type: "callout",
        tone: "warn",
        text: line.replace(/^(warning:|WARNING:)\s*/, ""),
      });
      i += 1;
      continue;
    }

    // ✅ support ### (subheadings -> card)
    if (line.startsWith("### ")) {
      const title = line.replace(/^###\s+/, "").trim();
      i += 1;

      const cardLines: string[] = [];
      while (i < lines.length) {
        const nxt = (lines[i] ?? "").trim();
        if (!nxt) {
          i += 1;
          break;
        }
        if (nxt.startsWith("### ")) break;
        if (nxt.startsWith("## ")) break;
        if (nxt.startsWith("# ")) break;
        if (nxt === "---") break;
        if (imageRegex.test(nxt)) break;
        if (parseLeadMagnet(nxt)) break;

        if (nxt.startsWith("👉") || /^(note:|NOTE:|warning:|WARNING:)/.test(nxt)) break;

        cardLines.push(nxt);
        i += 1;
      }

      blocks.push({ type: "card", title, lines: cardLines });
      continue;
    }

    // bullets
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = (lines[i] ?? "").trim();
        if (!l.startsWith("- ")) break;
        items.push(l.replace(/^-+\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // numbered list
    if (/^\d+[\)\.]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = (lines[i] ?? "").trim();
        if (!/^\d+[\)\.]\s+/.test(l)) break;
        items.push(l.replace(/^\d+[\)\.]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // paragraph
    takeParagraph();
    if (i < lines.length && (lines[i] ?? "").trim() === "") i += 1;
  }

  const calloutStyles = (tone: "tip" | "note" | "warn") => {
    if (tone === "tip") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-50";
    if (tone === "warn") return "border-red-400/25 bg-red-500/10 text-red-50";
    return "border-white/15 bg-white/5 text-white";
  };

  return (
    <div className="mt-10 space-y-7 text-white/80 leading-relaxed">
      {blocks.map((b, idx) => {
        if (b.type === "hr") return <div key={idx} className="my-10 h-px bg-white/10" />;

        if (b.type === "h2") {
          return (
            <h2
              key={idx}
              id={b.id}
              className="scroll-mt-32 text-2xl md:text-3xl font-semibold text-white mt-12"
            >
              {b.text}
            </h2>
          );
        }

        if (b.type === "h3") {
          return (
            <h3 key={idx} className="text-lg md:text-xl font-semibold text-white mt-8">
              {b.text}
            </h3>
          );
        }

        if (b.type === "lead") {
          return (
            <div key={idx} className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
              <Link
                href={b.href}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                {/* animated sheen */}
                <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-white/25 blur-xl translate-x-[-70%] group-hover:translate-x-[340%] transition duration-[1100ms]" />
                <span className="relative">{b.label}</span>
              </Link>
              <div className="mt-3 text-xs text-white/55">Instant download. No spam. Just the file.</div>
            </div>
          );
        }

        if (b.type === "card") {
          return (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-500/25 transition"
            >
              <div className="text-lg font-semibold text-white">{b.title}</div>
              {b.lines.length ? (
                <div className="mt-3 space-y-2 text-white/75">
                  {b.lines.map((ln, i2) => (
                    <p key={i2} className="leading-relaxed">
                      {ln}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        }

        if (b.type === "callout") {
          return (
            <div key={idx} className={["rounded-2xl border p-5", calloutStyles(b.tone)].join(" ")}>
              <div className="text-sm uppercase tracking-widest opacity-70">
                {b.tone === "tip" ? "Tip" : b.tone === "warn" ? "Warning" : "Note"}
              </div>
              <div className="mt-2 text-white/80">{b.text}</div>
            </div>
          );
        }

        if (b.type === "img") {
          return (
            <figure key={idx} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={b.src}
                  alt={b.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              {/* captions OFF by default */}
            </figure>
          );
        }

        if (b.type === "ul") {
          return (
            <ul key={idx} className="space-y-3">
              {b.items.map((it) => (
                <li key={it} className="flex gap-3">
                  <span className="mt-[9px] h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="text-white/75">{it}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          return (
            <ol key={idx} className="space-y-3">
              {b.items.map((it, n) => (
                <li key={it} className="flex gap-3">
                  <span className="mt-[1px] inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/70">
                    {n + 1}
                  </span>
                  <span className="text-white/75">{it}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="text-white/75 text-[17px] leading-[1.85]">
            {b.text}
          </p>
        );
      })}
    </div>
  );
}

/* ======================================================
   WhatsApp
====================================================== */
const WHATSAPP_NUMBER = "2348066706336";
const WHATSAPP_MESSAGE = "Hello, I’d like to request a quote for a website.";

function buildWhatsAppUrl() {
  const text = encodeURIComponent(WHATSAPP_MESSAGE);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return notFound();

  const headings = extractHeadings(post.content);
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <article className="bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_55%)]" />
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <div className="text-sm text-white/55">
              {new Date(post.date).toLocaleDateString()} • {post.readTime} •{" "}
              <span className="text-emerald-200">{post.category}</span>
            </div>

            <h1 className="mt-4 text-4xl md:text-6xl font-semibold leading-tight">{post.title}</h1>

            <p className="mt-6 text-white/70 text-lg leading-relaxed">{post.excerpt}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-10 flex gap-3">
              <Link
                href="/blog"
                className="rounded-md border border-white/10 bg-black/30 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-black/45 transition"
              >
                ← Back to Blog
              </Link>
              <Link
                href="/contact"
                className="rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
              >
                Request a Quote
              </Link>
            </div>
          </div>

          {post.cover ? (
            <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 max-w-3xl">
              <div className="relative aspect-[16/9]">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* BODY */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Main content */}
          <div className="max-w-3xl">
            {renderContent(post.content)}

            <div className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-7">
              <h3 className="text-xl font-semibold text-white">Want this done for you?</h3>
              <p className="mt-2 text-white/70">
                If you want a website that actually converts visitors into enquiries, we can build it.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
                >
                  Request a Quote
                </Link>
                <Link
                  href="/services"
                  className="rounded-md border border-white/10 bg-black/30 px-6 py-3 text-sm font-semibold text-white/85 text-center hover:bg-black/45 transition"
                >
                  View Services
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-32 h-fit">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <div className="text-sm font-semibold text-white">On this page</div>

              {headings.length ? (
                <div className="mt-4 space-y-2">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="block text-sm text-white/65 hover:text-white transition"
                    >
                      {h.text}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-white/60">
                  No sections found. Add headings using <span className="text-white">##</span>.
                </div>
              )}

              {/* Request a Quote card */}
              <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                <div className="text-sm font-semibold text-white">Request a Quote</div>
                <p className="mt-2 text-sm text-white/70">
                  Want a fast website that generates enquiries? Tell us what you do and what you need —
                  we’ll reply with the best plan.
                </p>

                <div className="mt-4 grid gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
                  >
                    Request a Quote
                  </Link>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-md border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white/85 hover:bg-black/45 transition"
                  >
                    Chat on WhatsApp
                  </a>
                </div>

                <div className="mt-4 text-xs text-white/55">
                  Typical reply time: <span className="text-white/80">same day</span>.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}