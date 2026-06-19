import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Download Ready",
  description: "Thank-you and download confirmation page for Web Growth resources.",
  alternates: { canonical: absoluteUrl("/thank-you/") },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DownloadThankYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
