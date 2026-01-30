import { groq } from "next-sanity";

export const SERVICES_QUERY = groq`
  *[_type == "service"] | order(order asc, _createdAt asc) {
    _id,
    title,
    short,
    "slug": slug.current,
    bullets,
    image
  }
`;