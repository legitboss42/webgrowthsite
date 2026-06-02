export const SITE_NAME = "Web Growth";
export const SITE_URL = "https://webgrowth.info";
export const DEFAULT_OG_IMAGE = "/images/hero/Hero-Image-1.webp";
export const DEFAULT_DESCRIPTION =
  "Web Growth builds websites for Lagos service businesses that want to look more credible, work better on mobile, and get more enquiries.";
export const PRIMARY_KEYWORD = "website design lagos";
export const CONTACT_EMAIL = "Admin@webgrowth.info";
export const CONTACT_EMAIL_HREF = "mailto:admin@webgrowth.info";
export const WHATSAPP_NUMBER = "2348066706336";
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || "#";
export const GET_STARTED_PATH = "/get-started";
export const BUSINESS_PHONE_DISPLAY = "+234 806 670 6336";
export const SERVICE_AREA = ["Lagos", "Nigeria"] as const;

function shouldUseTrailingSlash(url: URL) {
  return (
    url.origin === SITE_URL &&
    url.pathname !== "/" &&
    !url.pathname.endsWith("/") &&
    !/\.[^/]+$/.test(url.pathname)
  );
}

export function absoluteUrl(path = "/") {
  const url = /^https?:\/\//i.test(path) ? new URL(path) : new URL(path, SITE_URL);
  if (shouldUseTrailingSlash(url)) {
    url.pathname = `${url.pathname}/`;
  }
  return url.toString();
}

export function buildWhatsAppUrl(message: string) {
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}
