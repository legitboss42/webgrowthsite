export type PortfolioCase = {
  slug: string;
  title: string;
  client: string;
  type: "Business Sites" | "Landing Pages" | "Redesign" | "E-commerce" | "Product Sites";
  status?: "Live";
  industry: string;
  projectType: string;
  purpose: string;
  summary: string;
  whatToNotice: string;
  results: string[];
  stack: string[];
  tags: string[];
  featured?: boolean;
  imageUrl: string;
  imageAlt: string;
  liveUrl: string;
};

export const portfolioCases: PortfolioCase[] = [
  {
    slug: "jluxe",
    title: "J Luxe Medical Aesthetics",
    client: "J Luxe Medical Aesthetics",
    type: "Redesign",
    status: "Live",
    industry: "Medical aesthetics clinic website",
    projectType: "Clinic website redesign",
    purpose:
      "A clinic website designed to present treatments clearly, build trust quickly, and support consultation enquiries in London.",
    summary:
      "A polished medical aesthetics website built to explain treatments, create a calmer first impression, and make it easier for visitors to book, call, or ask questions.",
    whatToNotice:
      "Notice the treatment-led structure, premium trust presentation, and the clearer booking path across devices.",
    results: ["Treatment clarity", "Trust-focused layout", "Consultation path"],
    stack: [
      "Service and treatment presentation",
      "Trust-building layout and copy flow",
      "Responsive booking and contact path",
    ],
    tags: ["Redesign", "Clinic Website", "Responsive Build"],
    featured: true,
    imageUrl: "/images/portfolio/jluxe-cover.webp",
    imageAlt: "Composite portfolio cover for J Luxe Medical Aesthetics across desktop, tablet, and mobile",
    liveUrl: "https://www.jluxemedicalaesthetics.com/",
  },
  {
    slug: "tlc-interiors",
    title: "TLC Interiors Limited",
    client: "TLC Interiors Limited",
    type: "Business Sites",
    status: "Live",
    industry: "Interior design and carpentry website",
    projectType: "Service business website",
    purpose:
      "A premium service website built to showcase custom furniture, interior services, and project presentation for a design-led business.",
    summary:
      "A modern interior design website created to present services, finished spaces, and craftsmanship in a more premium and easier-to-trust way.",
    whatToNotice:
      "Notice the calmer visual hierarchy, service breakdown, and how the work presentation helps the brand feel more established.",
    results: ["Premium presentation", "Service clarity", "Mobile-ready contact flow"],
    stack: [
      "Homepage built around service positioning",
      "Interior and furniture service structure",
      "Portfolio-style visual presentation",
    ],
    tags: ["Business Website", "Interior Design", "Service Website"],
    featured: true,
    imageUrl: "/images/portfolio/tlc-interiors-cover.webp",
    imageAlt: "Composite portfolio cover for TLC Interiors Limited across desktop, tablet, and mobile",
    liveUrl: "https://tlc-interiors-limited.vercel.app/",
  },
  {
    slug: "treats-by-ann",
    title: "Treats by Ann",
    client: "Treats by Ann",
    type: "E-commerce",
    status: "Live",
    industry: "Dessert and treats business website",
    projectType: "Product-focused storefront website",
    purpose:
      "A product-focused bakery website built to present cakes, desserts, snack platters, and WhatsApp ordering more clearly.",
    summary:
      "A polished treats website designed to make categories easier to browse, featured products easier to notice, and WhatsApp ordering easier to start.",
    whatToNotice:
      "Notice the category-led layout, product presentation, and the direct order path built into the browsing experience.",
    results: ["Product visibility", "WhatsApp ordering path", "Cleaner browsing flow"],
    stack: [
      "Menu and category structure",
      "Featured product presentation",
      "Direct WhatsApp order flow",
    ],
    tags: ["E-commerce", "Food Brand", "WhatsApp Orders"],
    featured: true,
    imageUrl: "/images/portfolio/treats-by-ann-cover.webp",
    imageAlt: "Composite portfolio cover for Treats by Ann across desktop, tablet, and mobile",
    liveUrl: "https://treats-by-ann.vercel.app/",
  },
  {
    slug: "i-fitness",
    title: "i-Fitness",
    client: "i-Fitness",
    type: "Landing Pages",
    status: "Live",
    industry: "Fitness and gym membership website",
    projectType: "Membership landing and conversion site",
    purpose:
      "A gym website built to help visitors compare branches, understand membership, and move toward registration with less friction.",
    summary:
      "A conversion-focused fitness website built to present locations, membership information, classes, and sign-up intent in a cleaner way.",
    whatToNotice:
      "Notice how the page answers branch, pricing, and joining questions early to reduce hesitation before registration.",
    results: ["Membership clarity", "Branch-first journey", "Mobile-friendly sign-up flow"],
    stack: [
      "Offer and membership structure",
      "Branch and location presentation",
      "Conversion-focused page flow",
    ],
    tags: ["Landing Page", "Fitness Website", "Membership Flow"],
    imageUrl: "/images/portfolio/i-fitness-cover.webp",
    imageAlt: "Composite portfolio cover for i-Fitness across desktop, tablet, and mobile",
    liveUrl: "https://i-fitness-preview.vercel.app/",
  },
  {
    slug: "base-yield",
    title: "BaseYield",
    client: "BaseYield",
    type: "Product Sites",
    status: "Live",
    industry: "Crypto and digital finance website",
    projectType: "Product presentation website",
    purpose:
      "A product website designed to explain a Base-based USDC yield vault clearly and support dashboard exploration for a digital-finance audience.",
    summary:
      "A sleek digital-finance style website focused on product clarity, low-risk framing, and a cleaner path into the vault dashboard.",
    whatToNotice:
      "Notice the simplified product explanation, restrained feature framing, and the strong desktop-to-mobile consistency.",
    results: ["Product clarity", "Clean MVP framing", "Cross-device consistency"],
    stack: [
      "Hero section built around one offer",
      "Product explanation and usage signals",
      "Responsive product presentation",
    ],
    tags: ["Product Website", "Crypto", "Responsive Build"],
    imageUrl: "/images/portfolio/base-yield-cover.webp",
    imageAlt: "Composite portfolio cover for BaseYield across desktop, tablet, and mobile",
    liveUrl: "https://base-yield-eight.vercel.app/",
  },
];

export const featuredPortfolioCases = portfolioCases.filter((item) => item.featured);
