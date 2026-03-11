import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlogPostClient from "./BlogPostClient";
import RelatedServiceCTA from "@/components/RelatedServiceCTA";
import SocialShareDock from "@/components/SocialShareDock";
import { getPost, getPosts, type Post } from "@/lib/posts";
import { buildPageMetadata } from "@/lib/seo";
import {
  BOOKING_URL,
  buildWhatsAppUrl,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

export function generateStaticParams() {
  const posts = getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPost(params.slug);

  if (!post) {
    return {
      title: "Post not found",
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

  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: postKeywords,
    image: post.cover || DEFAULT_OG_IMAGE,
    type: "article",
  });
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

function extractHeadings(content: string) {
  const lines = content.split("\n").map((line) => line.trim());
  const headings: Array<{ text: string; id: string }> = [];

  for (const line of lines) {
    if (!line.startsWith("## ")) continue;

    const text = line.replace(/^##\s+/, "").trim();
    if (isLeadMagnetHeading(text)) continue;

    headings.push({ text, id: slugifyHeading(text) });
  }

  return headings;
}

function getRelatedPosts(current: Post, limit = 3): Post[] {
  const all = getPosts().filter((post) => post.slug !== current.slug);
  const currentTags = new Set(getSafeTags(current));

  const overlap = (post: Post) =>
    getSafeTags(post).reduce(
      (count, tag) => count + (currentTags.has(tag) ? 1 : 0),
      0
    );

  const toTime = (value?: string) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const byCategory = all
    .filter((post) => post.category === current.category)
    .sort((a, b) => overlap(b) - overlap(a) || toTime(b.date) - toTime(a.date));

  const byTags = all
    .filter((post) => post.category !== current.category && overlap(post) > 0)
    .sort((a, b) => overlap(b) - overlap(a) || toTime(b.date) - toTime(a.date));

  const related: Post[] = [];
  const seen = new Set<string>();

  for (const post of [...byCategory, ...byTags]) {
    if (seen.has(post.slug)) continue;

    related.push(post);
    seen.add(post.slug);

    if (related.length >= limit) break;
  }

  return related;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return notFound();

  const headings = extractHeadings(post.content);
  const relatedPosts = getRelatedPosts(post, 3);
  const whatsappUrl = buildWhatsAppUrl(
    "Hello, I would like to discuss my website project."
  );
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
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/brand/web-growth-logo.webp`,
      },
    },
    image: [`${SITE_URL}${post.cover || DEFAULT_OG_IMAGE}`],
  };

  return (
    <article className="bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_55%)]" />
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <div className="text-sm text-white/55">
              {new Date(post.date).toLocaleDateString()} | {post.readTime} |{" "}
              <span className="text-emerald-200">{post.category}</span>
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              {post.title}
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-white/70">
              {post.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {getSafeTags(post).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 flex gap-3">
              <Link
                href="/blog"
                className="rounded-md border border-white/10 bg-black/30 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-black/45"
              >
                Back to Blog
              </Link>
              <Link
                href="/launch"
                className="rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Launch in 48 Hours
              </Link>
            </div>
          </div>

          {post.cover ? (
            <div className="mt-12 max-w-3xl overflow-hidden rounded-2xl border border-white/10">
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

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[72px_1fr_340px]">
          <div className="hidden lg:block">
            <SocialShareDock
              title={post.title}
              excerpt={post.excerpt}
              slug={post.slug}
            />
          </div>

          <div className="max-w-3xl">
            <BlogPostClient content={post.content} />

            <div className="lg:hidden">
              <SocialShareDock
                title={post.title}
                excerpt={post.excerpt}
                slug={post.slug}
              />
            </div>

            <div className="mt-14">
              <RelatedServiceCTA />
            </div>
          </div>

          <aside className="h-fit lg:sticky lg:top-32">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <div className="text-sm font-semibold text-white">On this page</div>

              {headings.length ? (
                <div className="mt-4 space-y-2">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className="block text-sm text-white/65 transition hover:text-white"
                    >
                      {heading.text}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-white/60">
                  No sections found. Add headings using{" "}
                  <span className="text-white">##</span>.
                </div>
              )}

              <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                <div className="text-sm font-semibold text-white">Start your website</div>
                <p className="mt-2 text-sm text-white/70">
                  Use the short intake flow and we will send your next steps quickly.
                </p>

                <div className="mt-4 grid gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Contact Us
                  </Link>

                  <a
                    href={BOOKING_URL}
                    target={BOOKING_URL.startsWith("http") ? "_blank" : undefined}
                    rel={BOOKING_URL.startsWith("http") ? "noreferrer" : undefined}
                    className="inline-flex w-full items-center justify-center rounded-md border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-black/45"
                  >
                    Book a Call
                  </a>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-md border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-black/45"
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
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-500/25"
                >
                  <div className="text-xs text-white/55">
                    {relatedPost.category} |{" "}
                    {new Date(relatedPost.date).toLocaleDateString()}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white transition group-hover:text-emerald-200">
                    {relatedPost.title}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {relatedPost.excerpt}
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
