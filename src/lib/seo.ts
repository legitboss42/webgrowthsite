import type { Metadata } from "next";
import type { AuthorProfile } from "@/lib/authors";
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
  type?: "website" | "article" | "profile";
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
  const pageUrl = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    name: SITE_NAME,
    url: pageUrl,
    description,
    isPartOf: {
      "@id": `${SITE_URL}#website`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: absoluteUrl(DEFAULT_OG_IMAGE),
    },
  };
}

export function buildLocalBusinessServiceSchema() {
  const serviceUrl = absoluteUrl("/local-business");

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${serviceUrl}#service`,
    name: "Local SEO Web Design & Lead Generation",
    description:
      "Custom, high-speed website development engineered to generate local leads and phone calls for service businesses and high-ticket clinics.",
    url: serviceUrl,
    serviceType: "Local SEO web design and lead generation",
    category: "Web Design Service",
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
    provider: {
      "@id": `${SITE_URL}#professional-service`,
    },
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
  authorName = "Web Growth",
  authorUrl = SITE_URL,
  reviewedByName,
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
  authorName?: string;
  authorUrl?: string;
  reviewedByName?: string;
}) {
  const canonicalUrl = absoluteUrl(url);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    headline: title,
    url: canonicalUrl,
    description,
    datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Person",
      name: authorName,
      url: authorUrl,
    },
    ...(reviewedByName
      ? {
          reviewedBy: {
            "@type": "Person",
            name: reviewedByName,
            url: `${SITE_URL}/editorial-policy`,
          },
        }
      : {}),
    publisher: {
      "@id": `${SITE_URL}#professional-service`,
    },
    image: absoluteUrl(image),
    ...(dateModified ? { dateModified } : {}),
    ...(category ? { articleSection: category } : {}),
    ...(tags.length ? { keywords: tags.join(", ") } : {}),
    ...(wordCount ? { wordCount } : {}),
  };
}

export function buildPersonSchema(author: AuthorProfile) {
  const profileUrl = absoluteUrl(author.profileUrl || "/about");

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}#${author.id}`,
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    url: profileUrl,
    knowsAbout: author.expertise,
    image: author.image ? absoluteUrl(author.image) : absoluteUrl(DEFAULT_OG_IMAGE),
    worksFor: {
      "@id": `${SITE_URL}#professional-service`,
    },
    ...(author.sameAs?.length ? { sameAs: author.sameAs } : {}),
  };
}

export function buildProfilePageSchema(author: AuthorProfile, description: string) {
  const profileUrl = absoluteUrl(author.profileUrl || "/victorious");

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${profileUrl}#profile-page`,
    name: `${author.name} | Founder of Web Growth`,
    description,
    url: profileUrl,
    isPartOf: {
      "@id": `${SITE_URL}#website`,
    },
    mainEntity: {
      "@id": `${SITE_URL}#${author.id}`,
    },
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}#professional-service`,
    name: "Web Growth",
    alternateName: "WebGrowth",
    url: SITE_URL,
    description:
      "Web Growth is a premium website growth platform that helps businesses build stronger websites, grow qualified traffic, and monetize digital presence responsibly.",
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/images/brand/web-growth-logo.webp"),
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    email: CONTACT_EMAIL,
    telephone: BUSINESS_PHONE_DISPLAY,
    serviceType: [
      "Business website design",
      "Website redesign and conversion improvement",
      "SEO, analytics, and website growth strategy",
    ],
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
        url: absoluteUrl("/contact"),
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
    description: DEFAULT_DESCRIPTION,
    publisher: {
      "@id": `${SITE_URL}#professional-service`,
    },
    potentialAction: {
      "@type": "ContactAction",
      target: absoluteUrl("/contact"),
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
    name: `${SITE_NAME} Academy`,
    description:
      "Academy resources covering SEO, AdSense readiness, website strategy, conversion improvement, and website growth systems.",
    publisher: {
      "@id": `${SITE_URL}#professional-service`,
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
