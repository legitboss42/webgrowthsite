export type PortfolioCase = {
  title: string;
  client: string;
  type: "Business Sites" | "Landing Pages" | "Redesign" | "E-commerce";
  summary: string;
  results: string[];
  stack: string[];
  imageUrl: string;
};

export const portfolioCases: PortfolioCase[] = [
  {
    title: "Clinic Website Refresh",
    client: "Aesthetic Clinic",
    type: "Redesign",
    summary:
      "Rebuilt the layout for trust, improved mobile experience, and refined the booking flow so visitors know exactly what to do next.",
    results: ["Improved clarity", "Better mobile UX", "Stronger conversion flow"],
    stack: ["Design System", "Performance Pass", "SEO-ready structure"],
    imageUrl: "/images/portfolio/portfolio-1.webp",
  },
  {
    title: "Campaign Landing Page",
    client: "Service Business",
    type: "Landing Pages",
    summary:
      "Created a focused landing page built around one goal: leads. Tight messaging, strong hierarchy, and fast load speed.",
    results: ["Higher intent clicks", "Cleaner messaging", "Fast load time"],
    stack: ["Landing Page UX", "CTA strategy", "Speed optimization"],
    imageUrl: "/images/portfolio/portfolio-2.webp",
  },
  {
    title: "Business Website Build",
    client: "Professional Brand",
    type: "Business Sites",
    summary:
      "Designed a modern business website that communicates value quickly and positions the brand as credible and premium.",
    results: ["Premium look", "Clear sections", "Better trust signals"],
    stack: ["Information architecture", "Copy structure", "Mobile-first"],
    imageUrl: "/images/portfolio/portfolio-5.webp",
  },
  {
    title: "Small Store Setup",
    client: "Retail Brand",
    type: "E-commerce",
    summary:
      "Planned a clean store structure, simplified product pages, and a checkout flow designed to reduce hesitation.",
    results: ["Cleaner product UX", "Better structure", "Trust-first checkout"],
    stack: ["Store structure", "Product page UX", "Checkout flow"],
    imageUrl: "/images/portfolio/portfolio-6.webp",
  },
  {
    title: "Service Website Upgrade",
    client: "Local Business",
    type: "Redesign",
    summary:
      "Updated an outdated site into a modern layout with stronger proof and clearer CTAs without bloating the experience.",
    results: ["Modern UI", "Stronger proof", "Clear CTA flow"],
    stack: ["UI refresh", "Trust signals", "CTA placement"],
    imageUrl: "/images/portfolio/portfolio-7.webp",
  },
  {
    title: "Offer Landing Page",
    client: "Consultant",
    type: "Landing Pages",
    summary:
      "Built a landing page for a specific offer with a direct conversion path and minimal distraction.",
    results: ["Focused message", "Simple flow", "Lead-ready"],
    stack: ["Offer positioning", "CTA flow", "Mobile-first"],
    imageUrl: "/images/portfolio/portfolio-8.webp",
  },
];

export const featuredPortfolioCases = portfolioCases.slice(0, 3);
