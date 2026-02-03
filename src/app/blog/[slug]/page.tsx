import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getPosts, getPost } from "../../../lib/posts";
import BlogPostClient from "./BlogPostClient";

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

// TOC only from "##" (exclude "Lead magnet")
function extractHeadings(content: string) {
  const lines = content.split("\n").map((l) => l.trim());
  const headings: Array<{ text: string; id: string }> = [];

  for (const l of lines) {
    if (l.startsWith("## ")) {
      const text = l.replace(/^##\s+/, "").trim();
      if (isLeadMagnetHeading(text)) continue;
      headings.push({ text, id: slugifyHeading(text) });
    }
  }

  return headings;
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

            <h1 className="mt-4 text-4xl md:text-6xl font-semibold leading-tight">
              {post.title}
            </h1>

            <p className="mt-6 text-white/70 text-lg leading-relaxed">
              {post.excerpt}
            </p>

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
            {/* ✅ Client renderer (Lead buttons + modal + MailerLite) */}
            <BlogPostClient content={post.content} />

            <div className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-7">
              <h3 className="text-xl font-semibold text-white">
                Want this done for you?
              </h3>
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
                  No sections found. Add headings using{" "}
                  <span className="text-white">##</span>.
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
