import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPosts, getPost } from "../../../lib/posts";

export function generateStaticParams() {
  const posts = getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
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
    },
  };
}

function renderContent(content: string) {
  const lines = content.split("\n");

  const blocks: Array<
    | { type: "h2"; text: string }
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
  > = [];

  let i = 0;

  while (i < lines.length) {
    const line = (lines[i] ?? "").trim();

    if (!line) {
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "") });
      i += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "h2", text: line.replace(/^#\s+/, "") });
      i += 1;
      continue;
    }

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

    const para: string[] = [line];
    i += 1;

    while (i < lines.length) {
      const nxt = (lines[i] ?? "").trim();
      if (!nxt) break;
      if (nxt.startsWith("- ")) break;
      if (/^\d+[\)\.]\s+/.test(nxt)) break;
      if (nxt.startsWith("# ")) break;
      if (nxt.startsWith("## ")) break;

      para.push(nxt);
      i += 1;
    }

    blocks.push({ type: "p", text: para.join(" ") });
  }

  return (
    <div className="mt-10 space-y-6 text-white/80 leading-relaxed">
      {blocks.map((b, idx) => {
        if (b.type === "h2") {
          return (
            <h2 key={idx} className="text-xl md:text-2xl font-semibold text-white mt-10">
              {b.text}
            </h2>
          );
        }

        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc pl-6 space-y-2">
              {b.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-2">
              {b.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="text-white/75">
            {b.text}
          </p>
        );
      })}
    </div>
  );
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return notFound();

  return (
    <article className="bg-black text-white py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-sm text-white/50">
          {new Date(post.date).toLocaleDateString()} • {post.readTime} •{" "}
          <span className="text-emerald-200">{post.category}</span>
        </div>

        <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">{post.title}</h1>

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

        {renderContent(post.content)}

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-7">
          <h3 className="text-lg font-semibold text-white">Want this done for you?</h3>
          <p className="mt-2 text-white/70">
            If you want a website that actually converts visitors into enquiries, we can build it.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="/contact"
              className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white text-center hover:bg-emerald-500 transition"
            >
              Request a Quote
            </a>
            <a
              href="/blog"
              className="rounded-md border border-white/10 bg-black/30 px-6 py-3 text-sm font-semibold text-white/85 text-center hover:bg-black/45 transition"
            >
              Back to Blog
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}