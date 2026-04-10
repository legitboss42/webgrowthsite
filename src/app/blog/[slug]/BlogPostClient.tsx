"use client";

import Image from "next/image";
import { useMemo, type ReactNode } from "react";
import ClarityPageTags from "@/components/analytics/ClarityPageTags";
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

function parseLeadMagnet(line: string) {
  const trimmed = line.trim();
  const match = trimmed.match(/^\[LEAD\|([^|]+)\|([^\]]+)\]$/);
  if (!match) return null;
  return { label: match[1].trim(), href: match[2].trim() };
}

function parseButton(line: string) {
  const trimmed = line.trim();
  const match = trimmed.match(/^\[(?:BTN|BUTTON)\|([^|]+)\|([^\]]+)\]$/);
  if (!match) return null;
  return { label: match[1].trim(), href: match[2].trim() };
}

function renderBlocks(content: string) {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  const imageRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;

  let index = 0;
  let hideUntilNextSection = false;

  const takeParagraph = () => {
    const paragraph: string[] = [];

    while (index < lines.length) {
      const next = (lines[index] ?? "").trim();

      if (!next) break;
      if (next === "---") break;
      if (next.startsWith("#")) break;
      if (next.startsWith("- ")) break;
      if (/^\d+[\)\.]\s+/.test(next)) break;
      if (next.startsWith("TIP:")) break;
      if (/^(note:|NOTE:|warning:|WARNING:)/.test(next)) break;
      if (imageRegex.test(next)) break;
      if (parseLeadMagnet(next)) break;
      if (parseButton(next)) break;

      if (hideUntilNextSection) {
        index += 1;
        continue;
      }

      paragraph.push(next);
      index += 1;
    }

    if (!hideUntilNextSection && paragraph.length) {
      blocks.push({ type: "p", text: paragraph.join(" ") });
    }
  };

  while (index < lines.length) {
    const line = (lines[index] ?? "").trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("## ") || line.startsWith("# ")) {
      const text = line.replace(/^#{1,2}\s+/, "").trim();
      if (isLeadMagnetHeading(text)) {
        hideUntilNextSection = true;
        index += 1;
        continue;
      }

      hideUntilNextSection = false;
      blocks.push({ type: "h2", text, id: slugifyHeading(text) });
      index += 1;
      continue;
    }

    const leadMagnet = parseLeadMagnet(line);
    if (leadMagnet) {
      blocks.push({ type: "lead", label: leadMagnet.label, href: leadMagnet.href });
      index += 1;
      continue;
    }

    const button = parseButton(line);
    if (button) {
      blocks.push({ type: "button", label: button.label, href: button.href });
      index += 1;
      continue;
    }

    if (hideUntilNextSection) {
      index += 1;
      continue;
    }

    const imageMatch = line.match(imageRegex);
    if (imageMatch) {
      blocks.push({
        type: "img",
        alt: (imageMatch[1] || "Blog image").trim(),
        src: imageMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (line === "---") {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    if (line.startsWith("TIP:")) {
      blocks.push({ type: "callout", tone: "tip", text: line.replace(/^TIP:\s*/, "") });
      index += 1;
      continue;
    }

    if (/^(note:|NOTE:)/.test(line)) {
      blocks.push({ type: "callout", tone: "note", text: line.replace(/^(note:|NOTE:)\s*/, "") });
      index += 1;
      continue;
    }

    if (/^(warning:|WARNING:)/.test(line)) {
      blocks.push({
        type: "callout",
        tone: "warn",
        text: line.replace(/^(warning:|WARNING:)\s*/, ""),
      });
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      const title = line.replace(/^###\s+/, "").trim();
      index += 1;

      const cardLines: string[] = [];
      while (index < lines.length) {
        const next = (lines[index] ?? "").trim();
        if (!next || next.startsWith("#") || next === "---") break;
        if (imageRegex.test(next)) break;
        if (parseLeadMagnet(next) || parseButton(next)) break;
        if (/^(note:|NOTE:|warning:|WARNING:|TIP:)/.test(next)) break;
        cardLines.push(next);
        index += 1;
      }

      blocks.push({ type: "card", title, lines: cardLines });
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length) {
        const listLine = (lines[index] ?? "").trim();
        if (!listLine.startsWith("- ")) break;
        items.push(listLine.replace(/^-+\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+[\)\.]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length) {
        const listLine = (lines[index] ?? "").trim();
        if (!/^\d+[\)\.]\s+/.test(listLine)) break;
        items.push(listLine.replace(/^\d+[\)\.]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    takeParagraph();
    if ((lines[index] ?? "").trim() === "") index += 1;
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
    parts.push(
      <a
        key={`link-${key++}`}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer noopener sponsored" : undefined}
        className="text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
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

export default function BlogPostClient({
  content,
  blogSlug,
  blogTitle,
  blogCategory,
  blogTags,
}: {
  content: string;
  blogSlug: string;
  blogTitle: string;
  blogCategory: string;
  blogTags: string[];
}) {
  const blocks = useMemo(() => renderBlocks(content), [content]);

  const calloutStyles = (tone: "tip" | "note" | "warn") => {
    if (tone === "tip") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-50";
    if (tone === "warn") return "border-red-400/25 bg-red-500/10 text-red-50";
    return "border-white/15 bg-white/5 text-white";
  };

  return (
    <>
      <ClarityPageTags
        tags={{
          page_type: "blog_post",
          blog_slug: blogSlug,
          blog_title: blogTitle,
          blog_category: blogCategory,
          blog_tags: blogTags,
          content_group: "blog",
        }}
      />

      <div className="space-y-7 text-[17px] leading-[1.85] text-white/80">
        {blocks.map((block, index) => {
          if (block.type === "hr") return <div key={index} className="my-10 h-px bg-white/10" />;

          if (block.type === "h2") {
            return (
              <h2
                key={index}
                id={block.id}
                className="scroll-mt-32 mt-12 text-2xl font-semibold text-white md:text-3xl"
              >
                {block.text}
              </h2>
            );
          }

          if (block.type === "lead") {
            return <LeadMagnetCTA key={index} label={block.label} href={block.href} />;
          }

          if (block.type === "button") {
            const isExternal = /^https?:\/\//i.test(block.href);
            return (
              <div
                key={index}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6"
              >
                <a
                  href={block.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer noopener sponsored" : undefined}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  {block.label}
                </a>
              </div>
            );
          }

          if (block.type === "card") {
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-500/25"
              >
                <h3 className="text-lg font-semibold text-white">{block.title}</h3>
                {block.lines.length ? (
                  <div className="mt-3 space-y-2 text-white/75">
                    {block.lines.map((line, lineIndex) => (
                      <p key={lineIndex} className="leading-relaxed">
                        {renderInline(line)}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          if (block.type === "callout") {
            return (
              <div
                key={index}
                className={["rounded-2xl border p-5", calloutStyles(block.tone)].join(" ")}
              >
                <div className="text-sm uppercase tracking-widest opacity-70">
                  {block.tone === "tip" ? "Tip" : block.tone === "warn" ? "Warning" : "Note"}
                </div>
                <div className="mt-2 text-white/80">{renderInline(block.text)}</div>
              </div>
            );
          }

          if (block.type === "img") {
            return (
              <figure
                key={index}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              </figure>
            );
          }

          if (block.type === "ul") {
            return (
              <ul key={index} className="space-y-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[9px] h-2 w-2 rounded-full bg-emerald-400/80" />
                    <span className="text-white/75">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          }

          if (block.type === "ol") {
            return (
              <ol key={index} className="space-y-3">
                {block.items.map((item, itemIndex) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[1px] inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/70">
                      {itemIndex + 1}
                    </span>
                    <span className="text-white/75">{renderInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          }

          return (
            <p key={index} className="text-white/75">
              {renderInline(block.text)}
            </p>
          );
        })}
      </div>
    </>
  );
}
