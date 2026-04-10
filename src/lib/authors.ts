export type AuthorProfile = {
  id: string;
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  image?: string;
  profileUrl?: string;
  sameAs?: string[];
};

const AUTHORS: Record<string, AuthorProfile> = {
  "victor-chinukwue": {
    id: "victor-chinukwue",
    name: "Victor Chinukwue",
    role: "Founder, Web Growth",
    bio: "Founder-led strategist and developer focused on high-performance websites, conversion systems, and practical growth execution for service and ecommerce businesses.",
    expertise: [
      "Next.js web architecture",
      "Conversion-focused website strategy",
      "Technical SEO foundations",
      "Website performance optimization",
      "Service-business growth systems",
    ],
    image: "/images/about/about-hero.webp",
    profileUrl: "https://webgrowth.info/about",
    sameAs: [
      "https://www.linkedin.com/company/webgrowthinfo",
      "https://www.instagram.com/webgrowthinfo",
      "https://x.com/webgrowthinfo",
    ],
  },
  "web-growth-editorial": {
    id: "web-growth-editorial",
    name: "Web Growth Editorial",
    role: "Editorial Review Team",
    bio: "Editorial quality and implementation standards team ensuring guides stay practical, current, and commercially useful.",
    expertise: [
      "Editorial quality control",
      "Implementation review",
      "Content update governance",
    ],
    profileUrl: "https://webgrowth.info/editorial-policy",
  },
};

export const DEFAULT_AUTHOR_ID = "victor-chinukwue";
export const DEFAULT_REVIEWER_ID = "web-growth-editorial";

export function getAuthorProfile(authorId?: string | null): AuthorProfile {
  if (authorId && AUTHORS[authorId]) return AUTHORS[authorId];
  return AUTHORS[DEFAULT_AUTHOR_ID];
}
