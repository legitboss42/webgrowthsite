import {
  BOOKING_URL,
  CONTACT_EMAIL_HREF,
  CONTACT_EMAIL,
  buildWhatsAppUrl,
} from "@/lib/site";
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
      "Your one-page website includes the main sections most businesses need: a strong opening, services, trust elements, FAQs, and a contact section.",
  },
  {
    title: "Contact form + WhatsApp link",
    description:
      "People can reach you through a contact form or WhatsApp without having to hunt around the page.",
  },
  {
    title: "Basic SEO setup",
    description:
      "The important basics are handled before launch, including page titles, meta description, sitemap checks, and indexability checks.",
  },
] as const;

export const pricingTiers = [
  {
    name: "Launch",
    price: "$150",
    summary: "One-page business website",
    details: [
      "Main sections included: hero, services, trust section, FAQ, and contact section",
      "A layout that works well on mobile and makes it easy for people to contact you",
      "Hosting and domain guidance",
      "Basic SEO setup before the site goes live",
    ],
    startNowHref: "/contact?service=Launch%20($150)",
  },
  {
    name: "Launch + Blog",
    price: "$250",
    summary: "1 page + blog setup + 1 post migrated",
    details: [
      "Everything in Launch",
      "Blog structure set up so you can start publishing later",
      "One existing post migrated and formatted",
      "Set up for Nigeria-based or international clients",
    ],
    startNowHref: "/contact?service=Launch%20%2B%20Blog%20($250)",
  },
] as const;

export const socialProofCards = featuredPortfolioCases;

export const finalCtaLinks = {
  primaryHref: "/contact",
  bookingHref: BOOKING_URL,
  emailHref: CONTACT_EMAIL_HREF,
  emailLabel: CONTACT_EMAIL,
  whatsappHref: buildWhatsAppUrl(
    "Hello, I want to discuss my website project and next steps."
  ),
  whatsappLabel: "Chat on WhatsApp",
};
