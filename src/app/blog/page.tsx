import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import { getPosts } from "../../lib/posts";

export const metadata: Metadata = {
  title: "Web Design Blog | Web Growth",
  description:
    "Practical web design, SEO, conversion, and performance guides for business owners who want more leads from their website.",
  keywords: [
    "web design",
    "web design blog",
    "web design services",
    "website SEO",
    "landing page optimization",
    "small business website tips",
  ],
  alternates: { canonical: "https://webgrowth.info/blog" },
  openGraph: {
    title: "Web Design Blog | Web Growth",
    description:
      "Actionable articles on web design, SEO, and conversion strategy to help businesses rank and generate leads.",
    url: "https://webgrowth.info/blog",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.png",
        width: 1200,
        height: 630,
        alt: "Web Growth web design blog",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Design Blog | Web Growth",
    description:
      "Web design, SEO, and conversion strategy articles for business growth.",
    images: ["https://webgrowth.info/images/placeholder.png"],
  },
  robots: { index: true, follow: true },
};

export default function BlogPage() {
  const posts = getPosts();
  return <BlogClient posts={posts} />;
}


