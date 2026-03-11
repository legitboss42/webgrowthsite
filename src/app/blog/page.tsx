import BlogClient from "./BlogClient";
import { getPosts } from "../../lib/posts";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Web Growth Blog | Website Launch, SEO, and Conversion Guides",
  description:
    "Practical articles on web design, SEO, launch strategy, and conversion for businesses in Nigeria and international markets, plus guidance that supports a fast 48-hour website launch.",
  path: "/blog",
  keywords: [
    "web design blog",
    "small business website tips",
    "website launch strategy",
    "seo for service businesses",
  ],
});

export default function BlogPage() {
  const posts = getPosts();
  return <BlogClient posts={posts} />;
}
