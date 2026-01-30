export const SERVICES_QUERY = `
  *[_type == "service"] | order(order asc) {
    _id,
    title,
    slug,
    shortDescription,
    heroImage
  }
`;

export const PROJECTS_QUERY = `
  *[_type == "project"] | order(order asc) {
    _id,
    title,
    slug,
    summary,
    heroImage
  }
`;