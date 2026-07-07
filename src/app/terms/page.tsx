import TermsClient from "@/components/TermsClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Terms of Service for Web Growth Clients | Web Growth",
  description:
    "Review the terms for using the Web Growth website and working with us on website strategy, design, development, and support projects.",
  path: "/terms",
  keywords: [
    "web growth terms of service",
    "website terms of service",
    "website growth platform terms",
    "website development terms",
    "service terms and conditions",
  ],
});

export default function TermsPage() {
  return <TermsClient />;
}
