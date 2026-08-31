import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Web Growth WhatsApp",
    short_name: "Web Growth",
    description: "Web Growth WhatsApp Business inbox and operations console.",
    start_url: "/admin/whatsapp/conversations/",
    scope: "/",
    display: "standalone",
    background_color: "#050806",
    theme_color: "#0f7b55",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/images/logo.webp", sizes: "512x512", type: "image/webp", purpose: "any" },
    ],
  };
}
