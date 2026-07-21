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
    name: "Victorious",
    role: "Founder, Web Growth",
    bio: "Founder-led strategist and developer focused on high-performance websites, conversion systems, and practical growth execution for service and ecommerce businesses.",
    expertise: [
      "Next.js web architecture",
      "Conversion-focused website strategy",
      "Technical SEO foundations",
      "Website performance optimization",
      "Service-business growth systems",
    ],
    image: "/images/authors/victor-chinukwue-clean.webp",
    profileUrl: "https://webgrowth.info/victor-chinukwue/",
  },
};

export const DEFAULT_AUTHOR_ID = "victor-chinukwue";
export const DEFAULT_REVIEWER_ID = "victor-chinukwue";

export function getAuthorProfile(authorId?: string | null): AuthorProfile {
  if (authorId && AUTHORS[authorId]) return AUTHORS[authorId];
  return AUTHORS[DEFAULT_AUTHOR_ID];
}
