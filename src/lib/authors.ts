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
  victorious: {
    id: "victorious",
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
    image: "/images/authors/victorious-clean.webp",
    profileUrl: "/victorious/",
  },
};

export const DEFAULT_AUTHOR_ID = "victorious";
export const DEFAULT_REVIEWER_ID = "victorious";

export function getAuthorProfile(authorId?: string | null): AuthorProfile {
  if (authorId && AUTHORS[authorId]) return AUTHORS[authorId];
  return AUTHORS[DEFAULT_AUTHOR_ID];
}
