import type { Metadata } from "next";
import {
  absoluteUrl,
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  PRIMARY_KEYWORD,
  SITE_NAME,
  SITE_URL,
  WHATSAPP_BASE_URL,
} from "@/lib/site";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function buildProfessionalServiceSchema(path: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${absoluteUrl(path)}#professional-service`,
    name: "WebGrowth",
    url: absoluteUrl(path),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description,
    email: CONTACT_EMAIL,
    telephone: "+2348066706336",
    priceRange: "$150-$250",
    areaServed: [
      {
        "@type": "Country",
        name: "Nigeria",
      },
      {
        "@type": "Place",
        name: "Worldwide",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
      addressLocality: "Lagos",
    },
    availableLanguage: ["en"],
    sameAs: [WHATSAPP_BASE_URL, SITE_URL],
    offers: [
      {
        "@type": "Offer",
        priceCurrency: "USD",
        price: "150",
        availability: "https://schema.org/InStock",
        url: absoluteUrl("/launch"),
        description:
          "Done-for-you website design in 48 hours for a mobile-first one-page business website launch.",
      },
    ],
  };
}

export function buildArticleSchema({
  url,
  title,
  description,
  datePublished,
  dateModified,
  image,
}: {
  url: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/brand/web-growth-logo.webp"),
      },
    },
    image: [absoluteUrl(image)],
  };
}

export function buildFaqSchema(
  questions: ReadonlyArray<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export const launchKeywordSet = [
  PRIMARY_KEYWORD,
  "48 hour website launch",
  "fast website design",
  "website launch service",
  "small business website design nigeria",
  "lagos web designer",
  "remote website designer",
];

export const defaultSiteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Web Growth | Website Design in 48 Hours",
    template: "%s",
  },
  description: DEFAULT_DESCRIPTION,
};
