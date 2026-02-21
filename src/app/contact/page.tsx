import type { Metadata } from "next";
import { Suspense } from "react";
import ContactClient from "@/components/ContactClient";

export const metadata: Metadata = {
  title: "Contact Web Growth | Request a Web Design Quote",
  description:
    "Request a web design quote from Web Growth. Tell us what you need and get clear next steps for your website project.",
  keywords: [
    "web design",
    "web design quote",
    "web design services",
    "contact web growth",
    "request a quote",
    "website design proposal",
    "landing page quote",
    "website redesign quote",
  ],
  alternates: {
    canonical: "https://webgrowth.info/contact",
  },
  openGraph: {
    title: "Contact Web Growth | Web Design Quote",
    description:
      "Request a quote for web design services and get a clear proposal with next steps.",
    url: "https://webgrowth.info/contact",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Web Growth",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Web Growth | Web Design Quote",
    description: "Request a web design quote and get next steps.",
    images: ["https://webgrowth.info/images/placeholder.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <span className="opacity-70">Loading…</span>
        </div>
      }
    >
      <ContactClient />
    </Suspense>
  );
}


