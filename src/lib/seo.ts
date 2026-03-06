import type { Metadata } from "next";
import {
  absoluteUrl,
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  PRIMARY_KEYWORD,
  SERVICE_AREA,
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
    name: SITE_NAME,
    url: absoluteUrl(path),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description,
    email: CONTACT_EMAIL.toLowerCase(),
    telephone: "+2348066706336",
    priceRange: "$150-$250",
    areaServed: SERVICE_AREA.map((area) => ({
      "@type": "Place",
      name: area,
    })),
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
        description: PRIMARY_KEYWORD,
      },
    ],
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
    default: "Web Growth",
    template: "%s",
  },
  description: DEFAULT_DESCRIPTION,
};
