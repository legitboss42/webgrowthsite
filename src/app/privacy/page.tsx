import PrivacyClient from "@/components/PrivacyClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Privacy Policy | Web Growth",
  description:
    "Web Growth Privacy Policy. Learn how we collect, use, and protect your information when you use our website and services.",
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
