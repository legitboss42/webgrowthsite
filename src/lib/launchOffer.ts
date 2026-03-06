import { buildWhatsAppUrl, CONTACT_EMAIL_HREF, CONTACT_EMAIL } from "@/lib/site";
import { featuredPortfolioCases } from "@/lib/portfolioCases";

export const launchFaqs = [
  {
    question: "How fast can the website go live?",
    answer:
      "If your content and access details are ready, the site can go live within 48 hours.",
  },
  {
    question: "What do you need from me to start?",
    answer:
      "Your business details, offer summary, brand assets, contact information, and approval on the page direction.",
  },
  {
    question: "How many revisions are included?",
    answer: "Two focused revision rounds are included so the page stays fast and decisive.",
  },
  {
    question: "Do I own the domain and hosting?",
    answer:
      "Yes. You own both. I guide setup and connection, but the accounts stay under your control.",
  },
  {
    question: "Is ongoing support available after launch?",
    answer:
      "Yes. You can add support, updates, and future expansion after the 48-hour launch is complete.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Refunds are not available once work starts, but scope, deliverables, and timing are confirmed before kickoff.",
  },
] as const;

export const whatYouGetItems = [
  {
    title: "Domain guidance + setup",
    description:
      "I guide you through choosing the right domain, buying it correctly, and connecting it without setup mistakes.",
  },
  {
    title: "Hosting + SSL",
    description:
      "Your hosting and SSL are configured so the website is secure, stable, and ready for live traffic.",
  },
  {
    title: "1-page site structure",
    description:
      "Your launch page includes a hero, services, social proof placeholder, FAQ, and contact section.",
  },
  {
    title: "Contact form + WhatsApp link",
    description:
      "Visitors can contact you through a direct form or WhatsApp, which keeps the path to enquiry simple.",
  },
  {
    title: "Basic SEO setup",
    description:
      "Titles, meta description, sitemap checks, and indexability checks are handled before launch.",
  },
] as const;

export const pricingTiers = [
  {
    name: "Launch",
    price: "$150",
    summary: "1 page",
    details: [
      "Hero, services, social proof placeholder, FAQ, and contact section",
      "Mobile-first layout and clean conversion flow",
      "Hosting and domain guidance",
      "Basic SEO setup before launch",
    ],
    startNowHref: buildWhatsAppUrl(
      "Hello, I want the Launch package for website design in 48 hours."
    ),
  },
  {
    name: "Launch + Blog",
    price: "$250",
    summary: "1 page + blog setup + 1 post migrated",
    details: [
      "Everything in Launch",
      "Blog structure configured for future SEO publishing",
      "One existing post migrated and formatted",
      "Launch-ready setup for Nigeria-based or international clients",
    ],
    startNowHref: buildWhatsAppUrl(
      "Hello, I want the Launch + Blog package for website design in 48 hours."
    ),
  },
] as const;

export const socialProofCards = featuredPortfolioCases;

export const finalCtaLinks = {
  primaryHref: buildWhatsAppUrl(
    "Hello, I want to get started with website design in 48 hours."
  ),
  emailHref: CONTACT_EMAIL_HREF,
  emailLabel: CONTACT_EMAIL,
  whatsappHref: "https://wa.me/2348066706336",
  whatsappLabel: "WhatsApp",
};
