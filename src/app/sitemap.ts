import { getPosts } from "@/lib/posts";

export default function sitemap() {
  const base = "https://webgrowth.info";
  const posts = getPosts();

  const postUrls = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
  }));

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    ...postUrls,
  ];
}