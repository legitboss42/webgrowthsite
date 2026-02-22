"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "../../lib/posts";
import { gsap } from "gsap";

type Props = {
  posts: Post[];
};

type FilterMode = "All" | "Category" | "Tag";

const CATEGORY_ORDER = [
  "Series",
  "Case Study",
  "Strategy",
  "SEO",
  "Conversion",
  "Performance",
  "UX",
  "Automation",
] as const;

function formatPostDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogClient({ posts }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("All");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p: Post) => {
      if (p.category) set.add(p.category);
    });

    const orderedPresent = CATEGORY_ORDER.filter((c) => set.has(c));
    const extraCategories = Array.from(set)
      .filter((c) => !CATEGORY_ORDER.includes(c as (typeof CATEGORY_ORDER)[number]))
      .sort((a, b) => a.localeCompare(b));

    return ["All", ...orderedPresent, ...extraCategories];
  }, [posts]);

  const tags = useMemo(() => {
    const set = new Set<string>();

    posts.forEach((p: Post) => (p.tags ?? []).forEach((t: string) => set.add(t)));

    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return posts.filter((p: Post) => {
      const safeTags = p.tags ?? [];

      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        safeTags.join(" ").toLowerCase().includes(q);

      const matchesCategory =
        filterMode !== "Category" || activeCategory === "All"
          ? true
          : p.category === activeCategory;

      const matchesTag =
        filterMode !== "Tag" || activeTag === "All" ? true : safeTags.includes(activeTag);

      const matchesMode = filterMode === "All" ? true : matchesCategory && matchesTag;

      return matchesQuery && matchesMode;
    });
  }, [posts, query, filterMode, activeCategory, activeTag]);

  const featuredPost = filtered[0];
  const listPosts = filtered.slice(1);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-hero-item]",
        { opacity: 0, y: 20, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.07, ease: "power3.out" }
      );

      gsap.fromTo(
        "[data-card]",
        { opacity: 0, y: 18, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.62,
          stagger: 0.05,
          ease: "power3.out",
          delay: 0.12,
        }
      );
    }, root);

    return () => ctx.revert();
  }, [posts]);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    gsap.killTweensOf("[data-card]");
    gsap.fromTo(
      "[data-card]",
      { opacity: 0, y: 14, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, stagger: 0.035, ease: "power3.out" }
    );
  }, [query, filterMode, activeCategory, activeTag, filtered.length]);

  function onHeroMouseMove(e: MouseEvent<HTMLElement>) {
    const glow = glowRef.current;
    const hero = heroRef.current;
    if (!glow || !hero) return;

    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.12), transparent 58%)`;
  }

  return (
    <div ref={rootRef} className="min-h-screen bg-black text-white">
      <section
        ref={heroRef}
        onMouseMove={onHeroMouseMove}
        className="relative overflow-hidden border-b border-white/10"
      >
        <div className="absolute inset-0">
          <div ref={glowRef} className="absolute inset-0" />
          <div className="absolute -top-24 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div data-hero-item className="text-xs tracking-[0.22em] text-white/55">
                BLOG
              </div>
              <h1 data-hero-item className="mt-3 text-3xl md:text-5xl font-semibold leading-tight">
                Structured insights for redesign, SEO, and conversion growth.
              </h1>
              <p data-hero-item className="mt-4 text-white/70">
                Same strategy content, now arranged like an editorial board: one lead story plus a
                clean card grid.
              </p>
            </div>

            <div data-hero-item className="w-full max-w-sm lg:w-[340px]">
              <div className="rounded-xl border border-white/15 bg-black/40 px-4 py-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search posts"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/45 outline-none"
                />
              </div>
            </div>
          </div>

          <div data-hero-item className="mt-6 flex flex-wrap gap-2">
            {(["All", "Category", "Tag"] as const).map((mode) => {
              const active = mode === filterMode;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setFilterMode(mode);
                    if (mode !== "Category") setActiveCategory("All");
                    if (mode !== "Tag") setActiveTag("All");
                  }}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs border transition",
                    active
                      ? "border-white/45 bg-white/10 text-white"
                      : "border-white/15 bg-black/35 text-white/70 hover:text-white hover:bg-white/5",
                  ].join(" ")}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {filterMode === "Category" && (
            <div data-hero-item className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = category === activeCategory;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs border transition",
                      active
                        ? "border-white/45 bg-white/10 text-white"
                        : "border-white/15 bg-black/35 text-white/70 hover:text-white hover:bg-white/5",
                    ].join(" ")}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          )}

          {filterMode === "Tag" && (
            <div data-hero-item className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = tag === activeTag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs border transition",
                      active
                        ? "border-white/45 bg-white/10 text-white"
                        : "border-white/15 bg-black/35 text-white/70 hover:text-white hover:bg-white/5",
                    ].join(" ")}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.2em] text-white/45">LATEST</div>
            <h2 className="mt-2 text-2xl font-semibold">Articles</h2>
          </div>
          <div className="text-sm text-white/55">
            Showing <span className="text-white">{filtered.length}</span> of{" "}
            <span className="text-white">{posts.length}</span>
          </div>
        </div>

        {featuredPost ? (
          <article
            data-card
            className="group overflow-hidden rounded-3xl border border-white/15 bg-black/45"
          >
            <div className="grid lg:grid-cols-[1.25fr_1fr]">
              <Link href={`/blog/${featuredPost.slug}`} className="relative block min-h-[250px] lg:min-h-[370px]">
                {featuredPost.cover ? (
                  <Image
                    src={featuredPost.cover}
                    alt={featuredPost.title}
                    fill
                    className="object-cover opacity-95 group-hover:opacity-100 transition"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              </Link>

              <div className="p-6 lg:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/65">
                  <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-white">
                    {featuredPost.category}
                  </span>
                  <span>{formatPostDate(featuredPost.date)}</span>
                  <span className="h-1 w-1 rounded-full bg-white/35" />
                  <span>{featuredPost.readTime}</span>
                </div>

                <h3 className="mt-4 text-2xl md:text-3xl font-semibold leading-tight">
                  {featuredPost.title}
                </h3>
                <p className="mt-4 text-white/75 leading-relaxed">{featuredPost.excerpt}</p>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(featuredPost.tags ?? []).slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-white/65"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="rounded-lg border border-white/20 bg-black/35 px-3.5 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                  >
                    Read article →
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ) : null}

        {listPosts.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {listPosts.map((post) => (
              <article
                key={post.slug}
                data-card
                className="group overflow-hidden rounded-2xl border border-white/12 bg-black/40 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-white/5">
                    {post.cover ? (
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        className="object-cover opacity-95 group-hover:opacity-100 transition"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        priority={false}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  </div>
                </Link>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 text-[11px] text-white/60">
                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                      {post.category}
                    </span>
                    <span>{formatPostDate(post.date)}</span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/72">{post.excerpt}</p>

                  <div className="mt-5 flex items-center justify-between text-xs text-white/60">
                    <span>{post.readTime}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-semibold text-white/85 hover:text-white transition"
                    >
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {filtered.length === 0 && (
          <div className="mt-8 rounded-2xl border border-white/12 bg-black/45 p-8 text-white/70">
            No posts match that search. Try a different keyword or clear filters.
          </div>
        )}
      </section>
    </div>
  );
}

