import type { Metadata } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next"
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Growth — High-Performance Websites",
  description:
    "We design conversion-focused, high-performance websites that drive real business growth.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q8RFZ4LTLB"
          strategy="afterInteractive"
        />

        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q8RFZ4LTLB', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>

      <body>
        <Header />
        <main className="pt-28">{children}</main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}