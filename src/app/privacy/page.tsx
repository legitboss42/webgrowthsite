import PrivacyClient from "@/components/PrivacyClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Privacy Policy and Data Use | Web Growth",
  description:
    "Read how Web Growth collects, uses, protects, and stores information when you use our website, forms, tools, and services.",
  path: "/privacy",
  keywords: [
    "web growth privacy policy",
    "website privacy policy",
    "data privacy policy",
    "website growth platform privacy policy",
    "data privacy",
  ],
});

export default function PrivacyPage() {
  return <PrivacyClient />;
}
