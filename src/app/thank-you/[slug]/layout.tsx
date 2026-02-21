import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Ready | Web Growth",
  description: "Thank-you and download confirmation page for Web Growth resources.",
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
