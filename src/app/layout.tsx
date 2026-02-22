﻿import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Growth - High-Performance Websites",
  description:
    "We design conversion-focused, high-performance websites that drive real business growth.",
  metadataBase: new URL("https://webgrowth.info"),
  alternates: {
    canonical: "https://webgrowth.info/",
  },
  keywords: [
    "web design",
    "web design services",
    "website design",
    "web design agency",
    "business website design",
    "website redesign",
  ],
  openGraph: {
    title: "Web Growth | Web Design Services for Real Business Growth",
    description:
      "Conversion-focused web design services that help businesses attract customers, build trust, and grow.",
    url: "https://webgrowth.info/",
    siteName: "Web Growth",
    images: [
      {
        url: "https://webgrowth.info/images/placeholder.webp",
        width: 1200,
        height: 630,
        alt: "Web Growth web design services",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Growth | Web Design Services",
    description:
      "High-performance, conversion-focused websites for businesses that want real growth.",
    images: ["https://webgrowth.info/images/placeholder.webp"],
  },
  robots: { index: true, follow: true },
};

const GTM_ID = "GTM-TKSB7S75";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Impact.com verification */}
        <meta
          name="impact-site-verification"
          content="f14352c8-ac00-4455-ad6a-4c0615d5653b"
        />

        {/* Google AdSense */}
        <Script
          id="adsense"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4073948936216175"
          crossOrigin="anonymous"
        />

        {/* Google Tag Manager */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />
      </head>

      <body>
        <Analytics />
        <SpeedInsights />
        {/* GTM noscript */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Header />
        <main className="pt-28">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
