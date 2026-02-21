import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quote Request Received | Web Growth",
  description:
    "Confirmation page for submitted web design quote requests on Web Growth.",
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
