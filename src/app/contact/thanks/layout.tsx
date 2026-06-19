import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quote Request Received",
  description:
    "Confirmation page for submitted web design quote requests on Web Growth.",
  alternates: { canonical: absoluteUrl("/contact/thanks/") },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContactThanksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
