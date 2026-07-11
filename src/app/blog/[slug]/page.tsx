import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
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
import EditorialTrustNote from "@/components/EditorialTrustNote";
import { getAuthorProfile } from "@/lib/authors";
import { getPost, getPosts, getRelatedGuidesForPost, isPublicBlogSlug, type Post } from "@/lib/posts";
import routeGovernance from "@/lib/route-governance.json";
import { buildArticleSchema, buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

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

function getArticleCta(post: Pick<Post, "category" | "topic" | "tags">) {
  const haystack = [post.category, post.topic, ...post.tags].join(" ").toLowerCase();

  if (haystack.includes("speed") || haystack.includes("performance")) {
    return {
      title: "Need this fixed on a live site?",
      description:
        "Get a senior review of your slow templates, scripts, asset loading, and conversion bottlenecks.",
      href: "/services/performance-optimisation",
      label: "Explore Speed Optimisation",
    };
  }

  if (haystack.includes("seo") || haystack.includes("migration")) {
    return {
      title: "Planning a higher-stakes SEO move?",
      description:
        "Use this guide as the strategy layer, then bring in implementation support for redirects, metadata, content structure, and launch QA.",
      href: "/services/search-engine-optimisation",
      label: "View SEO Service",
    };
  }

  if (haystack.includes("landing") || haystack.includes("conversion")) {
    return {
      title: "Want the page built, not just planned?",
      description:
        "Translate the strategy into page structure, offer hierarchy, proof placement, and clean conversion flow.",
      href: "/services/landing-page-design",
      label: "See Landing Page Service",
    };
  }

  return {
    title: "Need senior implementation support?",
    description:
      "Use the Academy for clarity, then bring in Web Growth when you need a scoped execution partner.",
    href: "/contact",
    label: "Request a Website Review",
  };
}

export function generateStaticParams() {
  const approvedSlugs = new Set(
    routeGovernance.articles
      .filter((article) => article.status === "INDEX")
      .map((article) => article.slug)
  );
  return getPosts()
    .filter((post) => approvedSlugs.has(post.slug))
    .map((post) => ({ slug: post.slug }));
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
    title: post.seoTitle || `${post.title} | Web Growth Academy`,
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
  if (!isPublicBlogSlug(slug)) return notFound();
  const post = getPost(slug);
  if (!post) return notFound();

  const author = getAuthorProfile(post.author);
  const reviewer = post.reviewedBy ? getAuthorProfile(post.reviewedBy) : undefined;
  const headings = extractHeadings(post.content);
  const tags = getSafeTags(post);
  const canonicalUrl = absoluteUrl(`/blog/${post.slug}`);
  const articleCta = getArticleCta(post);
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
    authorUrl: author.profileUrl || absoluteUrl("/about"),
    reviewedByName:
      reviewer && reviewer.name !== author.name ? reviewer.name : undefined,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Academy", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  const hasEnhancedBlocks =
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
    <article className="bg-[#f4f1eb] text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleSchema, breadcrumbSchema]),
        }}
      />

      <section className="relative overflow-hidden border-b border-border-hairline bg-bg-ink text-text-primary">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(27,110,99,0.22),transparent_70%)]" />
          <div className="absolute right-[-12%] top-[4%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(232,163,61,0.12),transparent_72%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-10 text-sm text-text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="transition hover:text-slate-900">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className="transition hover:text-slate-900">
                  Academy
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="max-w-72 truncate text-text-primary">{post.title}</li>
            </ol>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                <span className="rounded-full border border-border-hairline bg-white/[0.04] px-3 py-1 font-medium text-accent-gold">
                  {post.category}
                </span>
                {post.topic ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                    {post.topic}
                  </span>
                ) : null}
                {post.difficulty ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                    {post.difficulty}
                  </span>
                ) : null}
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  {post.readTime}
                </span>
              </div>

              <h1 className="mt-6 max-w-5xl text-balance font-display text-5xl font-normal leading-[0.96] tracking-[-0.045em] text-text-primary md:text-7xl">
                {post.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-text-muted">{post.excerpt}</p>

              <div className="mt-10 grid gap-px overflow-hidden border-y border-border-hairline bg-border-hairline sm:grid-cols-3">
                <div className="bg-bg-ink py-4 pr-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Search intent
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {post.searchIntent || "Informational planning and implementation support."}
                  </p>
                </div>
                <div className="bg-bg-ink px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Primary focus
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {post.primaryKeyword || post.topic || post.category}
                  </p>
                </div>
                <div className="bg-bg-ink px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Built for
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    Teams that need clearer website decisions before they spend.
                  </p>
                </div>
              </div>

              {tags.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50/90 px-3 py-1 text-xs text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="border-l border-border-hairline pl-6">
                <div className="flex items-center gap-3">
                  {author.image ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-slate-200">
                      <Image src={author.image} alt={author.name} fill className="object-cover" sizes="56px" />
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                      Academy article
                    </p>
                    <p className="mt-1 text-base font-semibold text-text-primary">{author.name}</p>
                    <p className="text-sm text-text-muted">{author.role}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Published
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{post.date}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Reviewed
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {post.lastReviewedAt || post.updatedAt || "In editorial rotation"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,rgba(239,244,255,0.95),rgba(247,244,255,0.95))] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Best next move
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{articleCta.description}</p>
                  <TrackedLink
                    href={articleCta.href}
                    ctaName="article_best_next_move"
                    ctaLocation="article_masthead"
                    destination={articleCta.href}
                    pageType="blog_post"
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3b82f6,#7c5cff)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.24)] transition hover:-translate-y-0.5"
                  >
                    {articleCta.label}
                  </TrackedLink>
                </div>
              </div>
            </div>
          </div>

          {post.cover ? (
            <div className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
              <div className="relative aspect-[16/9]">
                <Image
                  src={post.cover}
                  alt={post.coverAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            {hasEnhancedBlocks ? (
              <>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                  <div className="space-y-6">
                    <ContentLastUpdated
                      publishedAt={post.date}
                      updatedAt={post.updatedAt}
                      lastReviewedAt={post.lastReviewedAt}
                    />
                    <EditorialNote
                      note={
                        post.evidenceNote ||
                        "This guide is written to be useful even if you never hire Web Growth. It focuses on practical decisions, implementation risks, and measurable outcomes."
                      }
                      methodology={post.methodologyNote}
                    />
                  </div>
                  <div className="space-y-6">
                    <AuthorBio author={author} />
                    {reviewer && reviewer.name !== author.name ? (
                      <ReviewedByBlock reviewerName={reviewer.name} reviewerRole={reviewer.role} />
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <KeyTakeaways items={post.keyTakeaways} />
                  <WhatYouNeed items={post.whatYouNeed} />
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <CommonMistakes items={post.commonMistakes} />
                  <ProcessSteps items={post.steps} />
                </div>
              </>
            ) : null}

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Academy lesson
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    Strategy, implementation notes, and decision support
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Back to Academy
                </Link>
              </div>

              <BlogPostClient
                content={post.content}
                blogSlug={post.slug}
                blogTitle={post.title}
                blogCategory={post.category}
                blogTags={tags}
              />
            </div>

            {hasEnhancedBlocks ? (
              <FAQBlock
                items={post.faq}
                title={`${post.title} FAQ`}
                description="Short answers to the planning, implementation, and decision questions readers usually ask next."
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

            <EditorialTrustNote />

            {hasEnhancedBlocks ? (
              <InternalResourceCallout
                title={articleCta.title}
                description={articleCta.description}
                href={articleCta.href}
                label={articleCta.label}
              />
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-32 lg:h-fit">
            <TableOfContents items={headings} />
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                Reading path
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  Start with the takeaways, then move through the full guide section by section.
                </p>
                <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  Use the related guides below the article to deepen one problem area at a time.
                </p>
              </div>
            </div>
            <InternalResourceCallout
              title="Browse the Academy"
              description="Explore structured articles on SEO, website design, speed, lead generation, and monetization."
              href="/blog"
              label="Open Academy Hub"
            />
          </aside>
        </div>
      </section>
    </article>
  );
}
