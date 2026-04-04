export type PortfolioCase = {
  title: string;
  client: string;
  type: "Business Sites" | "Landing Pages" | "Redesign" | "E-commerce";
  status?: "Live" | "Proposal";
  summary: string;
  results: string[];
  stack: string[];
  imageUrl: string;
  imageAlt: string;
  liveUrl: string;
};

export const portfolioCases: PortfolioCase[] = [
  {
    title: "Premium Interiors Website",
    client: "TLC Interiors Limited",
    type: "Business Sites",
    summary:
      "Built a premium carpentry and interior design website that makes the offer feel more considered, easier to trust, and easier to enquire about.",
    results: [
      "Clearer premium positioning",
      "Stronger service hierarchy",
      "Mobile-ready enquiry path",
    ],
    stack: ["Offer messaging", "Service-page structure", "Mobile-first layout"],
    imageUrl: "/images/portfolio/tlc-interiors-desktop.jpg",
    imageAlt: "Homepage for TLC Interiors Limited",
    liveUrl: "https://tlc-interiors-limited.vercel.app",
  },
  {
    title: "Clinic Website Rebuild",
    client: "J Luxe Medical Aesthetics",
    type: "Redesign",
    summary:
      "Repositioned the clinic site around trust, treatment clarity, and a more premium first impression for colder traffic.",
    results: [
      "Higher-trust presentation",
      "Clearer treatment journey",
      "Premium brand feel",
    ],
    stack: ["Redesign strategy", "Conversion-first layout", "Treatment page direction"],
    imageUrl: "/images/portfolio/jluxe-mockup.webp",
    imageAlt: "J Luxe Medical Aesthetics website mockup",
    liveUrl: "https://www.jluxemedicalaesthetics.com",
  },
  {
    title: "Gym Membership Landing Proposal",
    client: "iFitness Concept",
    type: "Landing Pages",
    status: "Proposal",
    summary:
      "Created a conversion-focused proposal for a gym landing experience with a cleaner joining path, stronger offer hierarchy, and sharper mobile scanning.",
    results: [
      "Sharper offer hierarchy",
      "Clearer joining path",
      "Stronger mobile scanning",
    ],
    stack: ["Landing page proposal", "CTA strategy", "Offer hierarchy"],
    imageUrl: "/images/portfolio/ifitness-desktop.jpg",
    imageAlt: "iFitness landing page proposal",
    liveUrl: "https://i-fitness-preview.vercel.app",
  },
  {
    title: "Product-Led Storefront",
    client: "Treats by Ann",
    type: "E-commerce",
    summary:
      "Built a bakery storefront that puts offers, categories, and visual trust in front of buyers quickly instead of burying them behind clutter.",
    results: [
      "Cleaner product presentation",
      "Stronger offer visibility",
      "Trust-first browsing",
    ],
    stack: ["Storefront layout", "Category structure", "Mobile commerce UI"],
    imageUrl: "/images/portfolio/treats-by-ann-desktop.jpg",
    imageAlt: "Treats by Ann storefront",
    liveUrl: "https://treats-by-ann.vercel.app",
  },
];

export const featuredPortfolioCases = portfolioCases
  .filter((item) => item.status !== "Proposal")
  .slice(0, 3);
