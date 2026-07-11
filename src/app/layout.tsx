﻿import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import {
  buildPersonSchema,
  buildOrganizationSchema,
  buildWebsiteSchema,
  defaultSiteMetadata,
} from "@/lib/seo";
import { getAuthorProfile } from "@/lib/authors";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { WebVitals } from "./components/WebVitals";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  ...defaultSiteMetadata,
  alternates: {
    canonical: SITE_URL,
  },
  keywords: [
    "website growth platform",
    "website growth services",
    "website redesign and seo",
    "website monetization",
    "website strategy nigeria",
    "premium website growth",
  ],
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/images/hero/Hero-Image-1.webp`,
        width: 1200,
        height: 630,
        alt: "Web Growth premium website growth platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/images/hero/Hero-Image-1.webp`],
  },
  robots: { index: true, follow: true },
};

const GTM_ID = "GTM-TKSB7S75";
const TIKTOK_PIXEL_ID = "D6NCMIRC77UDVRSELGE0";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const founder = getAuthorProfile("victor-chinukwue");
  const siteSchemas = [
    buildWebsiteSchema(),
    buildOrganizationSchema(),
    buildPersonSchema(founder),
  ];

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <meta
          name="impact-site-verification"
          content="f14352c8-ac00-4455-ad6a-4c0615d5653b"
        />

        {IS_PRODUCTION ? (
          <Script id="tiktok-pixel" strategy="lazyOnload">
            {`
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                ttq.load('${TIKTOK_PIXEL_ID}');
                ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        ) : null}

        {IS_PRODUCTION ? (
          <Script
            id="gtm"
            strategy="lazyOnload"
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
        ) : null}

        {CLARITY_ID ? (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
          </Script>
        ) : null}

      </head>

      <body className="font-sans">
        <Script id="scroll-top-on-refresh" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var navEntries = performance.getEntriesByType && performance.getEntriesByType("navigation");
                var navType = navEntries && navEntries[0] && navEntries[0].type;

                if (!navType && performance.navigation) {
                  navType = performance.navigation.type === 1 ? "reload" : "navigate";
                }

                if (navType === "reload") {
                  var reset = function () {
                    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                  };

                  reset();
                  requestAnimationFrame(reset);
                  setTimeout(reset, 0);
                }
              } catch (e) {}
            })();
          `}
        </Script>

        <StructuredData data={siteSchemas} />
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
        <Analytics />
        <SpeedInsights />
        {IS_PRODUCTION ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}

        <Header />
        <main className="pt-28">{children}</main>
        <Footer />
        <WebVitals />
      </body>
    </html>
  );
}
