export const SERVICES_QUERY = `*[_type == "service"] | order(_createdAt desc){
  _id,
  title,
  description,
  slug,
  bullets,
  "image": image.asset->url
}`;