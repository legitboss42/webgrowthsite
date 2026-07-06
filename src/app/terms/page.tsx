import TermsClient from "@/components/TermsClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Terms of Service | Web Growth",
  description:
    "Web Growth Terms of Service. Clear terms for using our website and working with us on web design and development projects.",
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
