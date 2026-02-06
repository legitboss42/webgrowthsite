import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type Category = "Conversion" | "Performance" | "Strategy" | "SEO" | "UX";

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

    return {
      slug,
      content,
      ...data,
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
