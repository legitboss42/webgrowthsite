import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import { getPosts } from "../../lib/posts";

export const metadata: Metadata = {
  title: "Blog | Web Growth",
  description:
    "Practical web design, SEO, performance and conversion strategy — written for business owners and builders.",
  alternates: { canonical: "https://webgrowth.info/blog" },
  robots: { index: true, follow: true },
};

export default function BlogPage() {
  const posts = getPosts();
  return <BlogClient posts={posts} />;
}
