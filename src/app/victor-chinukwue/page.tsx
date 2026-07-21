import FounderProfile from "@/components/FounderProfile";
import StructuredData from "@/components/StructuredData";
import { getAuthorProfile } from "@/lib/authors";
import {
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildProfilePageSchema,
} from "@/lib/seo";

const pageDescription =
  "Meet Victorious, founder of Web Growth and a frontend-focused full-stack developer building premium websites, SEO systems, and practical growth infrastructure.";

export const metadata = buildPageMetadata({
  title: "Victorious | Founder of Web Growth",
  description: pageDescription,
  path: "/victor-chinukwue",
  type: "profile",
  keywords: [
    "Victorious",
    "founder of Web Growth",
    "frontend-focused full-stack developer",
    "website strategist Lagos",
    "Next.js developer Nigeria",
    "technical SEO consultant",
  ],
  image: "/images/founder/victor-chinukwue-og.webp",
});

export default function VictorChinukwuePage() {
  const founder = getAuthorProfile("victor-chinukwue");

  return (
    <>
      <StructuredData
        data={[
          buildProfilePageSchema(founder, pageDescription),
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Victorious", path: "/victor-chinukwue" },
          ]),
        ]}
      />
      <FounderProfile />
    </>
  );
}
