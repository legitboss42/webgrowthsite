import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const CATEGORY_ORDER = [
  "Series",
  "Case Study",
  "Strategy",
  "SEO",
  "Conversion",
  "Performance",
  "UX",
  "Automation",
] as const;

export type Category = (typeof CATEGORY_ORDER)[number] | string;

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: Category;
  tags: string[];
  readTime: string;
  content: string;
  cover?: string;
};

const postsDirectory = path.join(process.cwd(), "content/blog");
const SERIES_SLUGS = new Set([
  "01-why-we-rebuilt-not-redesigned",
  "02-the-audit-that-created-the-roadmap",
  "03-seo-migration-without-losing-traffic",
  "04-writing-service-pages-that-convert",
  "05-premium-design-without-slow-pages",
  "06-nextjs-architecture-and-build-decisions",
  "07-launch-week-checklist-and-first-7-days",
  "08-results-mistakes-and-reusable-playbook",
]);

function resolveCategory(slug: string, category: unknown): Category {
  if (SERIES_SLUGS.has(slug)) return "Series";
  if (typeof category === "string" && category.trim().length) return category.trim();
  return "Strategy";
}

function getMarkdownFiles() {
  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md")) // ✅ only real markdown files
    .map((entry) => entry.name);
}

export function getPosts(): Post[] {
  const filenames = getMarkdownFiles();

  const posts = filenames.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const filePath = path.join(postsDirectory, filename);

    const file = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(file);
    const normalizedCategory = resolveCategory(slug, data.category);

    return {
      slug,
      content,
      ...data,
      category: normalizedCategory,
    } as Post;
  });

  const toTime = (value?: string) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  return posts.sort((a, b) => {
    const diff = toTime(b.date) - toTime(a.date);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title);
  });
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}
