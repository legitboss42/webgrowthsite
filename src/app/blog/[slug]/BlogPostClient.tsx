"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import LeadMagnetCTA from "@/components/LeadMagnetCTA";

type Block =
  | { type: "h2"; text: string; id: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; tone: "tip" | "note" | "warn"; text: string }
  | { type: "hr" }
  | { type: "img"; src: string; alt: string }
  | { type: "card"; title: string; lines: string[] }
  | { type: "lead"; label: string; href: string }
  | { type: "button"; label: string; href: string };

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

/**
 * LEAD MAGNET SYNTAX (in post.content):
 * [LEAD|Button Text|/downloads/file.pdf]
 *
 * BUTTON SYNTAX (in post.content):
 * [BTN|Button Text|https://example.com]
 */
function parseLeadMagnet(line: string) {
  const trimmed = line.trim();
  const m = trimmed.match(/^\[LEAD\|([^|]+)\|([^\]]+)\]$/);
  if (!m) return null;
  return { label: m[1].trim(), href: m[2].trim() };
}

function parseButton(line: string) {
  const trimmed = line.trim();
  const m = trimmed.match(/^\[(?:BTN|BUTTON)\|([^|]+)\|([^\]]+)\]$/);
  if (!m) return null;
  return { label: m[1].trim(), href: m[2].trim() };
}

function renderBlocks(content: string) {
  const lines = content.split("\n");
  const blocks: Block[] = [];

  const imageRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;

  let i = 0;
  let hideUntilNextSection = false;

  const takeParagraph = () => {
    const para: string[] = [];
    while (i < lines.length) {
      const nxt = (lines[i] ?? "").trim();

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
       if (parseButton(nxt)) break;

      if (hideUntilNextSection) {
        i += 1;
        continue;
      }

      para.push(nxt);
      i += 1;
    }

    if (!hideUntilNextSection && para.length) {
      blocks.push({ type: "p", text: para.join(" ") });
    }
  };

  while (i < lines.length) {
    const line = (lines[i] ?? "").trim();
    if (!line) {
      i += 1;
      continue;
    }

    // headings (also control "lead magnet" hidden section)
    if (line.startsWith("## ") || line.startsWith("# ")) {
      const text = line.replace(/^#{1,2}\s+/, "").trim();

      if (isLeadMagnetHeading(text)) {
        hideUntilNextSection = true;
        i += 1;
        continue; // do not render "Lead magnet" heading
      }

      hideUntilNextSection = false;
      blocks.push({ type: "h2", text, id: slugifyHeading(text) });
      i += 1;
      continue;
    }

    // lead magnet line
    const lead = parseLeadMagnet(line);
    if (lead) {
      blocks.push({ type: "lead", label: lead.label, href: lead.href });
      i += 1;
      continue;
    }

    // button line
    const btn = parseButton(line);
    if (btn) {
      blocks.push({ type: "button", label: btn.label, href: btn.href });
      i += 1;
      continue;
    }

    // hide everything else inside Lead magnet section
    if (hideUntilNextSection) {
      i += 1;
      continue;
    }

    // image
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
      blocks.push({ type: "callout", tone: "tip", text: line.replace(/^👉\s*/, "") });
      i += 1;
      continue;
    }
    if (/^(note:|NOTE:)/.test(line)) {
      blocks.push({ type: "callout", tone: "note", text: line.replace(/^(note:|NOTE:)\s*/, "") });
      i += 1;
      continue;
    }
    if (/^(warning:|WARNING:)/.test(line)) {
      blocks.push({ type: "callout", tone: "warn", text: line.replace(/^(warning:|WARNING:)\s*/, "") });
      i += 1;
      continue;
    }

    // card sections
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
    if ((lines[i] ?? "").trim() === "") i += 1;
  }

  return blocks;
}

function renderInline(text: string) {
  const parts: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    const [full, label, href] = match;
    const start = match.index;
    const end = start + full.length;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const isExternal = /^https?:\/\//i.test(href);
    const rel = isExternal ? "noreferrer noopener sponsored" : undefined;
    const target = isExternal ? "_blank" : undefined;

    parts.push(
      <a
        key={`link-${key++}`}
        href={href}
        target={target}
        rel={rel}
        className="text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
      >
        {label}
      </a>
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
}

/* ======================================================
   MailerLite Embed (cleaned)
   - We keep the required structure + action URL.
   - We do NOT show your lead magnet text in the article.
   - On success, we trigger download using the lead href.
====================================================== */
function MailerLiteForm({ downloadHref }: { downloadHref: string }) {
  useEffect(() => {
    // MailerLite calls this on success if it exists
    (window as any).ml_webform_success_36572924 = function () {
      try {
        // Trigger download/redirect
        window.location.href = downloadHref;
      } catch {
        window.location.assign(downloadHref);
      }
    };
  }, [downloadHref]);

  return (
    <div className="w-full">
      {/* Load MailerLite JS once */}
      <Script
        src="https://groot.mailerlite.com/js/w/webforms.min.js?v176e10baa5e7ed80d35ae235be3d5024"
        strategy="afterInteractive"
      />

      {/* Minimal styling so it doesn't look like raw HTML */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
        <div className="text-lg font-semibold text-white">Download Guide</div>
        <p className="mt-1 text-sm text-white/65">Enter your email and we’ll start the download.</p>

        {/* IMPORTANT: keep the original action URL */}
        <form
          className="mt-4"
          action="https://assets.mailerlite.com/jsonp/2082508/forms/178299108230956075/subscribe"
          method="post"
          target="_blank"
        >
          <input type="hidden" name="ml-submit" value="1" />
          <input type="hidden" name="anticsrf" value="true" />

          <label className="sr-only" htmlFor="ml-email">
            Email
          </label>

          <input
            id="ml-email"
            aria-label="email"
            aria-required="true"
            type="email"
            name="fields[email]"
            placeholder="Email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-emerald-500/50"
          />

          <button
            type="submit"
            className="group relative mt-4 inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-white/25 blur-xl translate-x-[-70%] group-hover:translate-x-[340%] transition duration-[1100ms]" />
            <span className="relative">Download</span>
          </button>

          <p className="mt-3 text-xs text-white/50">
            No spam. Just the file.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function BlogPostClient({ content }: { content: string }) {
  const blocks = useMemo(() => renderBlocks(content), [content]);

  const [open, setOpen] = useState(false);
  const [downloadHref, setDownloadHref] = useState("/downloads/placeholder.pdf");
  const [modalTitle, setModalTitle] = useState("Download");

  const calloutStyles = (tone: "tip" | "note" | "warn") => {
    if (tone === "tip") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-50";
    if (tone === "warn") return "border-red-400/25 bg-red-500/10 text-red-50";
    return "border-white/15 bg-white/5 text-white";
  };

  useEffect(() => {
    // Escape closes modal
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
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

          if (b.type === "lead") {
            return <LeadMagnetCTA key={idx} label={b.label} href={b.href} />;
          }

          if (b.type === "button") {
            const isExternal = /^https?:\/\//i.test(b.href);
            const rel = isExternal ? "noreferrer noopener sponsored" : undefined;
            const target = isExternal ? "_blank" : undefined;

            return (
              <div key={idx} className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
                <a
                  href={b.href}
                  target={target}
                  rel={rel}
                  className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-white/25 blur-xl translate-x-[-70%] group-hover:translate-x-[340%] transition duration-[1100ms]" />
                  <span className="relative">{b.label}</span>
                </a>
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
                        {renderInline(ln)}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          if (b.type === "callout") {
            return (
              <div
                key={idx}
                className={["rounded-2xl border p-5", calloutStyles(b.tone)].join(" ")}
              >
                <div className="text-sm uppercase tracking-widest opacity-70">
                  {b.tone === "tip" ? "Tip" : b.tone === "warn" ? "Warning" : "Note"}
                </div>
                <div className="mt-2 text-white/80">{renderInline(b.text)}</div>
              </div>
            );
          }

          if (b.type === "img") {
            return (
              <figure
                key={idx}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
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
                    <span className="text-white/75">{renderInline(it)}</span>
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
                    <span className="text-white/75">{renderInline(it)}</span>
                  </li>
                ))}
              </ol>
            );
          }

          // paragraph
          return (
            <p key={idx} className="text-white/75 text-[17px] leading-[1.85]">
              {renderInline(b.text)}
            </p>
          );
        })}
      </div>

      {/* ===========================
          MODAL
      ============================ */}
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl border border-white/10 bg-black p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-white font-semibold">{modalTitle}</div>
                  <div className="text-white/60 text-sm">Enter email → download begins.</div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75 hover:bg-white/10 transition"
                >
                  Close
                </button>
              </div>

              <div className="mt-5">
                {/* ✅ MailerLite form + success download */}
                <MailerLiteForm downloadHref={downloadHref} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

