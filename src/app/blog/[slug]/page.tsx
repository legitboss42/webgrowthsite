import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getPosts, getPost, type Post } from "../../../lib/posts";
import BlogPostClient from "./BlogPostClient";
import SocialShareDock from "@/components/SocialShareDock";

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

  const postKeywords = Array.from(
    new Set([
      "web design",
      "web design services",
      "website design",
      "small business website",
      post.category.toLowerCase(),
      ...getSafeTags(post).map((tag) => tag.toLowerCase()),
    ])
  );

  const socialImage = post.cover
    ? `https://webgrowth.info${post.cover}`
    : "https://webgrowth.info/images/placeholder.webp";

  return {
    title: `${post.title} | Web Growth`,
    description: post.excerpt,
    keywords: postKeywords,
    alternates: { canonical: `https://webgrowth.info/blog/${post.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://webgrowth.info/blog/${post.slug}`,
      siteName: "Web Growth",
      type: "article",
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [socialImage],
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

function getSafeTags(post: Pick<Post, "tags">): string[] {
  return Array.isArray(post.tags)
    ? post.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
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

function getRelatedPosts(current: Post, limit = 3): Post[] {
  const all = getPosts().filter((p) => p.slug !== current.slug);
  const currentTags = new Set(getSafeTags(current));

  const overlap = (p: Post) =>
    getSafeTags(p).reduce((n, t) => n + (currentTags.has(t) ? 1 : 0), 0);
  const toTime = (value?: string) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const byCategory = all
    .filter((p) => p.category === current.category)
    .sort((a, b) => overlap(b) - overlap(a) || toTime(b.date) - toTime(a.date));

  const byTags = all
    .filter((p) => p.category !== current.category && overlap(p) > 0)
    .sort((a, b) => overlap(b) - overlap(a) || toTime(b.date) - toTime(a.date));

  const related: Post[] = [];
  const seen = new Set<string>();

  for (const p of [...byCategory, ...byTags]) {
    if (seen.has(p.slug)) continue;
    related.push(p);
    seen.add(p.slug);
    if (related.length >= limit) break;
  }

  return related;
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
  const relatedPosts = getRelatedPosts(post, 3);

  const SITE_URL = "https://webgrowth.info";
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Organization",
      name: "Web Growth",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Web Growth",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/brand/web-growth-logo.webp`,
      },
    },
    image: post.cover ? [`${SITE_URL}${post.cover}`] : undefined,
  };

  return (
    <article className="bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
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
              {getSafeTags(post).map((t) => (
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
        <div className="grid gap-10 lg:grid-cols-[72px_1fr_340px]">
          {/* Share rail */}
          <div className="hidden lg:block">
            <SocialShareDock title={post.title} excerpt={post.excerpt} slug={post.slug} />
          </div>

          {/* Main content */}
          <div className="max-w-3xl">
            {/* ✅ Client renderer (Lead buttons + modal + MailerLite) */}
            <BlogPostClient content={post.content} />

            {/* Mobile share dock shows here */}
            <div className="lg:hidden">
              <SocialShareDock title={post.title} excerpt={post.excerpt} slug={post.slug} />
            </div>

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
                  Want a fast website that generates enquiries? Tell us what you do and what you need  - 
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

      {relatedPosts.length ? (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-7">
            <h2 className="text-2xl font-semibold text-white">Related posts</h2>
            <p className="mt-2 text-white/65">
              More articles to help you get better rankings and more leads.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-500/25 transition"
                >
                  <div className="text-xs text-white/55">
                    {p.category} â€¢ {new Date(p.date).toLocaleDateString()}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white group-hover:text-emerald-200 transition">
                    {p.title}
                  </div>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed">
                    {p.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}

