import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";
import AuthorBio from "@/components/content/AuthorBio";
import CommonMistakes from "@/components/content/CommonMistakes";
import ContentLastUpdated from "@/components/content/ContentLastUpdated";
import DownloadableChecklistCard from "@/components/content/DownloadableChecklistCard";
import EditorialNote from "@/components/content/EditorialNote";
import FAQBlock from "@/components/content/FAQBlock";
import InternalResourceCallout from "@/components/content/InternalResourceCallout";
import KeyTakeaways from "@/components/content/KeyTakeaways";
import ProcessSteps from "@/components/content/ProcessSteps";
import RelatedGuides from "@/components/content/RelatedGuides";
import ReviewedByBlock from "@/components/content/ReviewedByBlock";
import TableOfContents from "@/components/content/TableOfContents";
import WhatYouNeed from "@/components/content/WhatYouNeed";
import { getAuthorProfile } from "@/lib/authors";
import { LOW_CPU_EMERGENCY_MODE } from "@/lib/emergency";
import { getPost, getPosts, getRelatedGuidesForPost, isPublicBlogSlug, type Post } from "@/lib/posts";
import sitemapConfig from "@/lib/sitemap-config.json";
import { buildArticleSchema, buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

const ENHANCED_POST_SLUGS = new Set([
  "ga4-meta-tiktok-clarity-setup-guide",
  "landing-page-wireframe-local-service-business",
  "website-redesign-cost-breakdown-nigeria",
  "how-to-audit-slow-wordpress-site",
  "google-business-profile-optimization-checklist",
  "conversion-audit-checklist-service-homepage",
  "small-business-website-launch-qa-checklist",
  "how-to-plan-website-copy-before-hiring-developer",
  "local-seo-basics-service-business-lagos",
  "website-platform-comparison-small-business",
]);

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractHeadings(content: string) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^##\s+/, "").trim())
    .filter((text) => text.toLowerCase() !== "lead magnet")
    .map((text) => ({ text, id: slugifyHeading(text) }));
}

function estimateWordCount(content: string) {
  return content
    .replace(/[#_*>\-\[\]\(\)`]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function getSafeTags(post: Pick<Post, "tags">): string[] {
  return Array.isArray(post.tags)
    ? post.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
}

export function generateStaticParams() {
  if (LOW_CPU_EMERGENCY_MODE) {
    return sitemapConfig.blogSlugs.map((slug) => ({ slug }));
  }

  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isPublicBlogSlug(slug)) {
    return {
      title: "Post not found",
      robots: { index: false, follow: false },
    };
  }

  const post = getPost(slug);

  if (!post) {
    return {
      title: "Post not found",
      robots: { index: false, follow: false },
    };
  }

  const keywords = Array.from(
    new Set([
      "web design blog",
      "website growth guide",
      post.category.toLowerCase(),
      ...(post.topic ? [post.topic.toLowerCase()] : []),
      ...getSafeTags(post).map((tag) => tag.toLowerCase()),
    ])
  );

  return buildPageMetadata({
    title: `${post.title} | Web Growth Blog`,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords,
    image: post.cover || DEFAULT_OG_IMAGE,
    type: "article",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (process.env.NODE_ENV === "production" && !LOW_CPU_EMERGENCY_MODE) {
    console.log(`[build][blog] rendering ${slug}`);
  }
  if (!isPublicBlogSlug(slug)) return notFound();
  const post = getPost(slug);
  if (!post) return notFound();

  const author = getAuthorProfile(post.author);
  const reviewer = post.reviewedBy ? getAuthorProfile(post.reviewedBy) : undefined;
  const headings = extractHeadings(post.content);
  const tags = getSafeTags(post);
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const relatedGuides = getRelatedGuidesForPost(post).map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    excerpt: guide.excerpt,
    topic: guide.topic,
    readTime: guide.readTime,
  }));

  const articleSchema = buildArticleSchema({
    url: canonicalUrl,
    title: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.updatedAt || post.lastReviewedAt || post.date,
    image: post.cover || DEFAULT_OG_IMAGE,
    category: post.category,
    tags,
    wordCount: estimateWordCount(post.content),
    authorName: author.name,
    authorUrl: author.profileUrl || `${SITE_URL}/about`,
    reviewedByName:
      reviewer && reviewer.name !== author.name ? reviewer.name : undefined,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  const hasEnhancedBlocks =
    ENHANCED_POST_SLUGS.has(post.slug) ||
    Boolean(post.topic) ||
    Boolean(post.difficulty) ||
    Boolean(post.updatedAt) ||
    Boolean(post.lastReviewedAt) ||
    Boolean(post.evidenceNote) ||
    Boolean(post.methodologyNote) ||
    Boolean(post.checklistAvailable) ||
    post.keyTakeaways.length > 0 ||
    post.whatYouNeed.length > 0 ||
    post.commonMistakes.length > 0 ||
    post.steps.length > 0 ||
    post.faq.length > 0;

  return (
    <article className="bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleSchema, breadcrumbSchema]),
        }}
      />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_55%)]" />
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white/55">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className="transition hover:text-white">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white/82">{post.title}</li>
            </ol>
          </nav>

          <div className="flex flex-wrap gap-2 text-xs text-white/65">
            <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-white">
              {post.category}
            </span>
            {post.topic ? (
              <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1">
                {post.topic}
              </span>
            ) : null}
            {post.difficulty ? (
              <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1">
                {post.difficulty}
              </span>
            ) : null}
            <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1">
              {post.readTime}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold leading-tight md:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">{post.excerpt}</p>

          {tags.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {post.cover ? (
            <div className="mt-10 max-w-4xl overflow-hidden rounded-2xl border border-white/10">
              <div className="relative aspect-[16/9]">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 960px"
                  priority
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {hasEnhancedBlocks ? (
              <>
                <ContentLastUpdated
                  publishedAt={post.date}
                  updatedAt={post.updatedAt}
                  lastReviewedAt={post.lastReviewedAt}
                />
                <AuthorBio author={author} />
                {reviewer && reviewer.name !== author.name ? (
                  <ReviewedByBlock reviewerName={reviewer.name} reviewerRole={reviewer.role} />
                ) : null}
                <EditorialNote
                  note={
                    post.evidenceNote ||
                    "This guide is written to be useful even if you never hire Web Growth. It focuses on practical decisions, implementation risks, and measurable outcomes."
                  }
                  methodology={post.methodologyNote}
                />
                <KeyTakeaways items={post.keyTakeaways} />
                <WhatYouNeed items={post.whatYouNeed} />
                <CommonMistakes items={post.commonMistakes} />
                <ProcessSteps items={post.steps} />
              </>
            ) : null}

            <BlogPostClient
              content={post.content}
              blogSlug={post.slug}
              blogTitle={post.title}
              blogCategory={post.category}
              blogTags={tags}
            />

            {hasEnhancedBlocks ? (
              <FAQBlock
                items={post.faq}
                title={`${post.title} FAQ`}
                description="Short answers to common planning and implementation questions."
              />
            ) : null}

            {hasEnhancedBlocks && post.checklistAvailable ? (
              <DownloadableChecklistCard
                title={`${post.title} checklist`}
                description="Use this checklist while implementing the guide to avoid missed steps."
                href={`/resources/checklists/${post.slug}.txt`}
              />
            ) : null}

            {hasEnhancedBlocks ? <RelatedGuides guides={relatedGuides} /> : null}

            {hasEnhancedBlocks ? (
              <InternalResourceCallout
                title="Need implementation support for this guide?"
                description="If you want this executed with senior-level speed and quality control, request a scoped recommendation."
                href="/contact"
                label="Request Implementation Scope"
              />
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-32 lg:h-fit">
            <TableOfContents items={headings} />
            {hasEnhancedBlocks ? (
              <InternalResourceCallout
                title="Start Here"
                description="Browse resource-first guides by topic before choosing a service."
                href="/blog"
                label="Open Resource Hub"
              />
            ) : null}
          </aside>
        </div>
      </section>
    </article>
  );
}
