export const SITE_NAME = "Web Growth";
export const SITE_URL = "https://webgrowth.info";
export const DEFAULT_OG_IMAGE = "/images/hero/Hero-Image-1.webp";
export const DEFAULT_DESCRIPTION =
  "Web Growth builds high-converting websites for Nigeria-based and international businesses that need a professional launch fast.";
export const PRIMARY_KEYWORD = "website design in 48 hours";
export const CONTACT_EMAIL = "Admin@webgrowth.info";
export const CONTACT_EMAIL_HREF = "mailto:admin@webgrowth.info";
export const WHATSAPP_NUMBER = "2348066706336";
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const BUSINESS_PHONE_DISPLAY = "+234 806 670 6336";
export const SERVICE_AREA = ["Nigeria", "Lagos", "Remote", "Worldwide"] as const;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE_URL).toString();
}

export function buildWhatsAppUrl(message: string) {
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}
