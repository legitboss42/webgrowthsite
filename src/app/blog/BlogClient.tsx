"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Post, Category } from "../../lib/posts";
import { gsap } from "gsap";

type Props = {
  posts: Post[];
};

type FilterMode = "All" | "Category" | "Tag";

export default function BlogClient({ posts }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("All");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [activeTag, setActiveTag] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<Category>();
    posts.forEach((p: Post) => set.add(p.category));

    const ordered: Category[] = ["Conversion", "Performance", "Strategy", "SEO", "UX"];
    const present = ordered.filter((c) => set.has(c));

    return ["All", ...present] as const;
  }, [posts]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p: Post) => p.tags.forEach((t: string) => set.add(t)));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return posts.filter((p: Post) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.join(" ").toLowerCase().includes(q);

      const matchesCategory =
        filterMode !== "Category" || activeCategory === "All"
          ? true
          : p.category === activeCategory;

      const matchesTag =
        filterMode !== "Tag" || activeTag === "All" ? true : p.tags.includes(activeTag);

      const matchesMode = filterMode === "All" ? true : matchesCategory && matchesTag;

      return matchesQuery && matchesMode;
    });
  }, [posts, query, filterMode, activeCategory, activeTag]);

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
        { opacity: 0, y: 24, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.08, ease: "power3.out" }
      );

      gsap.fromTo(
        "[data-card]",
        { opacity: 0, y: 18, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.65, stagger: 0.06, ease: "power3.out", delay: 0.15 }
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
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, stagger: 0.04, ease: "power3.out" }
    );
  }, [query, filterMode, activeCategory, activeTag, filtered.length]);

  function onHeroMouseMove(e: React.MouseEvent<HTMLElement>) {
    const glow = glowRef.current;
    const hero = heroRef.current;
    if (!glow || !hero) return;

    const r = hero.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(16,185,129,0.18), transparent 55%)`;
  }

  return (
    <div ref={rootRef} className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section
        ref={heroRef}
        onMouseMove={onHeroMouseMove}
        className="relative overflow-hidden border-b border-white/10"
      >
        <div className="absolute inset-0">
          <div ref={glowRef} className="absolute inset-0" />
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />

          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <div data-hero-item className="text-sm tracking-[0.25em] text-white/55">
              BLOG
            </div>

            <h1 data-hero-item className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
              Growth notes for people who want results, not vibes.
            </h1>

            <p data-hero-item className="mt-6 text-lg text-white/70 leading-relaxed">
              Practical web design, SEO, performance and conversion strategy — written for business owners and builders.
            </p>

            <div data-hero-item className="mt-10 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search posts (e.g. SEO, speed, leads)…"
                  className="w-full bg-transparent text-white placeholder:text-white/40 outline-none"
                />
              </div>

              <Link
                href="/contact"
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
              >
                Work with Web Growth
              </Link>
            </div>

            {/* Filter mode toggle */}
            <div data-hero-item className="mt-6 flex flex-wrap gap-2">
              {(["All", "Category", "Tag"] as const).map((m) => {
                const active = m === filterMode;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setFilterMode(m);
                      if (m !== "Category") setActiveCategory("All");
                      if (m !== "Tag") setActiveTag("All");
                    }}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs border transition",
                      active
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                        : "border-white/10 bg-black/30 text-white/65 hover:bg-black/45 hover:text-white/80",
                    ].join(" ")}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {filterMode === "Category" && (
              <div data-hero-item className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => {
                  const active = c === activeCategory;
                  return (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs border transition",
                        active
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                          : "border-white/10 bg-black/30 text-white/65 hover:bg-black/45 hover:text-white/80",
                      ].join(" ")}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {filterMode === "Tag" && (
              <div data-hero-item className="mt-4 flex flex-wrap gap-2">
                {tags.map((t: string) => {
                  const active = t === activeTag;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTag(t)}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs border transition",
                        active
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                          : "border-white/10 bg-black/30 text-white/65 hover:bg-black/45 hover:text-white/80",
                      ].join(" ")}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LIST */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm text-white/50">Latest</div>
            <h2 className="mt-2 text-2xl font-semibold">Articles</h2>
          </div>
          <div className="text-sm text-white/55">
            Showing <span className="text-white">{filtered.length}</span> of{" "}
            <span className="text-white">{posts.length}</span>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {filtered.map((p: Post) => (
            <article
              key={p.slug}
              data-card
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40
                         transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/25 hover:bg-black/55"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_60%)]" />
              </div>

              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                <div className="absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-white/8 blur-2xl translate-x-[-70%] group-hover:translate-x-[340%] transition duration-[1100ms]" />
              </div>

              <div className="relative p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                    {p.category}
                  </span>
                  {p.tags.map((t: string) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white/65"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <h3 className="mt-5 text-xl font-semibold leading-snug">{p.title}</h3>
                <p className="mt-3 text-white/70 leading-relaxed">{p.excerpt}</p>

                <div className="mt-6 flex items-center justify-between text-sm text-white/55">
                  <div className="flex items-center gap-3">
                    <span>{new Date(p.date).toLocaleDateString()}</span>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span>{p.readTime}</span>
                  </div>

                  <Link
                    href={`/blog/${p.slug}`}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white/80 hover:bg-black/45 hover:text-white transition"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 rounded-2xl border border-white/10 bg-black/40 p-8 text-white/70">
            No posts match that search. Try a different keyword or clear filters.
          </div>
        )}
      </section>
    </div>
  );
}