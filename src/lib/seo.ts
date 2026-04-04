import type { Metadata } from "next";
import {
  absoluteUrl,
  BUSINESS_PHONE_DISPLAY,
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
    name: "Web Growth",
    url: absoluteUrl(path),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description,
    email: CONTACT_EMAIL,
    telephone: "+2348066706336",
    priceRange: "$150-$250",
    areaServed: [
      {
        "@type": "Place",
        name: "Lagos",
      },
      {
        "@type": "Country",
        name: "Nigeria",
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
  category,
  tags = [],
  wordCount,
}: {
  url: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  image: string;
  category?: string;
  tags?: string[];
  wordCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
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
    articleSection: category,
    keywords: tags.join(", "),
    wordCount,
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE_NAME,
    alternateName: "WebGrowth",
    url: SITE_URL,
    logo: absoluteUrl("/images/brand/web-growth-logo.webp"),
    email: CONTACT_EMAIL,
    telephone: BUSINESS_PHONE_DISPLAY,
    sameAs: [WHATSAPP_BASE_URL],
    areaServed: [
      {
        "@type": "Place",
        name: "Lagos",
      },
      {
        "@type": "Country",
        name: "Nigeria",
      },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: CONTACT_EMAIL,
        telephone: BUSINESS_PHONE_DISPLAY,
        areaServed: ["Lagos", "NG"],
        availableLanguage: ["en"],
      },
    ],
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: {
      "@id": `${SITE_URL}#organization`,
    },
    potentialAction: {
      "@type": "ContactAction",
      target: `${SITE_URL}/contact`,
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildBlogCollectionSchema(
  posts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    cover?: string;
  }>
) {
  const blogUrl = absoluteUrl("/blog");

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${blogUrl}#blog`,
    url: blogUrl,
    name: `${SITE_NAME} Blog`,
    description:
      "Website launch, SEO, conversion, and growth guides for small businesses.",
    publisher: {
      "@id": `${SITE_URL}#organization`,
    },
    blogPost: posts.slice(0, 8).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.date,
      image: absoluteUrl(post.cover || DEFAULT_OG_IMAGE),
    })),
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

export function buildHostingOfferSchema() {
  const offerUrl = absoluteUrl("/hosting-offer");

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${offerUrl}#hosting-offer`,
    name: "Shared Web Hosting Offer",
    serviceType: "Web Hosting",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: [
      {
        "@type": "Place",
        name: "Lagos",
      },
      {
        "@type": "Country",
        name: "Nigeria",
      },
    ],
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Small businesses",
    },
    url: offerUrl,
    description:
      "Shared web hosting offer for small business websites that need reliable hosting, a stronger launch foundation, and a lower starting cost.",
    offers: {
      "@type": "Offer",
      url: offerUrl,
      category: "Shared web hosting",
      availability: "https://schema.org/InStock",
      description:
        "Save 68% on shared web hosting for a business website launch.",
    },
  };
}

export const launchKeywordSet = [
  PRIMARY_KEYWORD,
  "website design in lagos",
  "48 hour website launch",
  "fast website design",
  "website launch service",
  "small business website design nigeria",
  "lagos web designer",
  "website launch lagos",
];

export const defaultSiteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Web Growth | Web Design for Lagos Service Businesses",
    template: "%s",
  },
  description: DEFAULT_DESCRIPTION,
};
