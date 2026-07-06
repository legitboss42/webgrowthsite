export type SolutionPageConfig = {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  detailImage: string;
  chips: string[];
  problemItems: {
    title: string;
    answer: string;
    href?: string;
    hrefLabel?: string;
  }[];
  capabilityItems: {
    title: string;
    description: string;
  }[];
  outcomeItems: {
    title: string;
    description: string;
  }[];
  audienceItems: {
    title: string;
    description: string;
  }[];
  processItems: {
    title: string;
    description: string;
  }[];
  relatedServices: {
    href: string;
    label: string;
    title: string;
    description: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  ctaTitle: string;
  ctaDescription: string;
};

export const SOLUTION_PAGE_CONFIGS: Record<string, SolutionPageConfig> = {
  "local-business": {
    slug: "local-business",
    path: "/local-business/",
    title: "Local Business Website Design",
    seoTitle: "Local Business Website Design | Web Growth",
    metaDescription:
      "Website strategy and design direction for local businesses that need clearer services, stronger trust, and easier calls, WhatsApp enquiries, and bookings.",
    keywords: [
      "local business website design",
      "small business website design",
      "website for local service business",
      "local business website Nigeria",
      "website design for small business",
    ],
    eyebrow: "Local business",
    heroTitle:
      "Local business websites built to create trust quickly and make contact easier.",
    heroDescription:
      "Web Growth helps local businesses turn confusing, low-trust websites into clear service platforms that support calls, bookings, WhatsApp enquiries, and stronger first impressions.",
    heroImage: "/images/services/services-business.webp",
    detailImage: "/images/services/services-business-2.webp",
    chips: ["Local trust", "Mobile-first", "Lead-ready"],
    problemItems: [
      {
        title: "Customers do not understand the service fast enough",
        answer:
          "Many local business websites bury the offer, service area, and next step under generic copy that makes buyers hesitate.",
      },
      {
        title: "Trust signals are too weak",
        answer:
          "If the website feels outdated, thin, or hard to use on mobile, local customers are less likely to call, message, or book.",
      },
      {
        title: "Contact paths create friction",
        answer:
          "WhatsApp, calls, quotes, and booking options need to be visible and easy to use from the first visit.",
      },
      {
        title: "The website exists but does not help sales enough",
        answer:
          "A local business site should reduce doubt, answer key questions, and move the buyer toward action.",
        href: "/services/website-audit/",
        hrefLabel: "Start with a website audit",
      },
    ],
    capabilityItems: [
      {
        title: "Clear service messaging",
        description:
          "Visitors should know what you do, who you help, and how to contact you within seconds.",
      },
      {
        title: "Trust architecture",
        description:
          "Proof, FAQs, process clarity, and location cues help buyers feel safer taking the next step.",
      },
      {
        title: "Simple lead paths",
        description:
          "Calls, contact forms, WhatsApp, and booking buttons should be obvious and friction-light.",
      },
      {
        title: "SEO-ready structure",
        description:
          "The page hierarchy should support future local search growth without doorway-page shortcuts.",
      },
    ],
    outcomeItems: [
      {
        title: "Stronger first impression",
        description:
          "The business looks more credible, more current, and easier to trust.",
      },
      {
        title: "Better lead quality",
        description:
          "The site helps filter and educate buyers before they enquire.",
      },
      {
        title: "Cleaner mobile UX",
        description:
          "People can read, navigate, and act confidently on the screens they actually use.",
      },
    ],
    audienceItems: [
      {
        title: "Service businesses",
        description:
          "Great fit for local brands that rely on calls, enquiries, WhatsApp, or appointment requests.",
      },
      {
        title: "Founder-led businesses",
        description:
          "Useful when the business has a real offer but the current website underrepresents its quality.",
      },
      {
        title: "Businesses preparing to grow",
        description:
          "A stronger local-business website becomes a better base for SEO, referrals, and paid traffic later.",
      },
    ],
    processItems: [
      {
        title: "Review the current buyer journey",
        description:
          "We identify where clarity, trust, and contact flow are breaking down.",
      },
      {
        title: "Restructure the page experience",
        description:
          "We align messaging, layout, proof, and CTA paths around local buyer intent.",
      },
      {
        title: "Launch with cleaner technical foundations",
        description:
          "The final surface supports speed, mobile usability, and future search visibility.",
      },
    ],
    relatedServices: [
      {
        href: "/services/business-website-design/",
        label: "Business websites",
        title: "Build a stronger service website",
        description:
          "Use the core business website service when you need a full commercial website build.",
      },
      {
        href: "/services/google-my-business-setup-optimisation/",
        label: "Local visibility",
        title: "Support Google Maps and local discovery",
        description:
          "Pair the website with profile optimisation to improve local search trust and reach.",
      },
      {
        href: "/pricing/",
        label: "Pricing",
        title: "See scope and pricing guidance",
        description:
          "Use pricing if you already know you want implementation and need a scope range.",
      },
    ],
    faqs: [
      {
        question: "Is this only for physical-location businesses?",
        answer:
          "No. It also fits service-area businesses that need a clearer local trust and enquiry flow online.",
      },
      {
        question: "Can this support WhatsApp and booking actions?",
        answer:
          "Yes. Contact and booking paths can be designed around the way your business actually sells.",
      },
      {
        question: "Will this help SEO later?",
        answer:
          "Yes. The goal is to create a stronger local-business foundation for trust, crawlability, and future content or SEO work.",
      },
    ],
    ctaTitle: "Need a local-business website that actually helps enquiries happen?",
    ctaDescription:
      "Start with a website review and get a clearer recommendation on structure, service pages, trust blocks, and the right next step.",
  },
  ecommerce: {
    slug: "ecommerce",
    path: "/ecommerce/",
    title: "Ecommerce Website Direction",
    seoTitle: "Ecommerce Website Design for Growing Brands | Web Growth",
    metaDescription:
      "Website direction for product businesses that need clearer product presentation, stronger trust, and better mobile shopping or enquiry flow.",
    keywords: [
      "ecommerce website design",
      "small business ecommerce website",
      "online store website design",
      "ecommerce website for small business",
      "product website design",
    ],
    eyebrow: "Ecommerce",
    heroTitle:
      "Ecommerce websites built to turn product interest into clearer buying decisions.",
    heroDescription:
      "Web Growth helps product brands move beyond scattered social posts and chat-based selling with a clearer ecommerce structure that supports product trust, browsing, and conversion.",
    heroImage: "/images/services/services-ecommerce-2.webp",
    detailImage: "/images/services/services-speed-2.webp",
    chips: ["Product clarity", "Mobile shopping", "Conversion flow"],
    problemItems: [
      {
        title: "Product information is spread everywhere",
        answer:
          "When products live across DMs, posts, and highlights, customers have to work too hard to understand what to buy.",
      },
      {
        title: "The same questions keep getting repeated",
        answer:
          "A structured store should answer delivery, price, payment, and product questions before the customer has to ask.",
      },
      {
        title: "Trust is harder to build through chat alone",
        answer:
          "A proper product website gives the brand a more credible space to explain, reassure, and convert.",
      },
      {
        title: "Campaign traffic has nowhere focused to land",
        answer:
          "Social, email, and paid traffic need a stronger website destination than a generic profile or inbox.",
        href: "/services/ecommerce-website-design/",
        hrefLabel: "See ecommerce website design service",
      },
    ],
    capabilityItems: [
      {
        title: "Clear product presentation",
        description:
          "Products, categories, and offers need structure that helps buyers compare and decide faster.",
      },
      {
        title: "Trust and reassurance",
        description:
          "Delivery, returns, proof, and policy clarity reduce hesitation before checkout or enquiry.",
      },
      {
        title: "Mobile-first browsing",
        description:
          "The store needs to feel clean and easy to use on mobile where many product visits begin.",
      },
      {
        title: "Campaign-ready landing flow",
        description:
          "Traffic from ads, creators, TikTok, Instagram, and email needs focused pages and clear action paths.",
      },
    ],
    outcomeItems: [
      {
        title: "Cleaner buying journey",
        description:
          "Visitors can move from product discovery to action with less confusion.",
      },
      {
        title: "Better perceived quality",
        description:
          "A premium storefront increases confidence before the shopper commits.",
      },
      {
        title: "Stronger conversion foundation",
        description:
          "The site becomes easier to improve with CRO, SEO, and product launches later.",
      },
    ],
    audienceItems: [
      {
        title: "Instagram-first product brands",
        description:
          "Useful when product discovery starts socially but the brand needs a stronger owned sales surface.",
      },
      {
        title: "Growing product businesses",
        description:
          "A fit for brands ready to move beyond informal ordering and improve consistency.",
      },
      {
        title: "Merch, beauty, fashion, and specialty sellers",
        description:
          "Especially valuable where trust and product presentation heavily influence buying decisions.",
      },
    ],
    processItems: [
      {
        title: "Clarify the shopping journey",
        description:
          "We map where customers discover, compare, trust, and buy.",
      },
      {
        title: "Design product and trust surfaces",
        description:
          "We shape storefront, product, and CTA sections around conversion rather than generic polish.",
      },
      {
        title: "Launch a better ecommerce foundation",
        description:
          "The final site supports scale across content, campaigns, and product operations.",
      },
    ],
    relatedServices: [
      {
        href: "/services/ecommerce-website-design/",
        label: "Store build",
        title: "Build the ecommerce site properly",
        description:
          "Use the core ecommerce service when you are ready to implement the storefront itself.",
      },
      {
        href: "/services/landing-page-design/",
        label: "Campaign pages",
        title: "Support launches with landing pages",
        description:
          "Use focused landing pages for promos, campaigns, and product drops.",
      },
      {
        href: "/services/performance-optimisation/",
        label: "Speed",
        title: "Reduce mobile shopping friction",
        description:
          "Improve storefront speed and responsiveness on conversion-critical pages.",
      },
    ],
    faqs: [
      {
        question: "Do I need a full online store from day one?",
        answer:
          "Not always. Sometimes a focused product site or landing flow is enough at the current stage.",
      },
      {
        question: "Can this work if I still sell through WhatsApp?",
        answer:
          "Yes. A cleaner website can still route buyers into WhatsApp while giving them better context first.",
      },
      {
        question: "Is this only for big ecommerce brands?",
        answer:
          "No. It is especially useful for smaller brands that need more structure, trust, and clarity as they grow.",
      },
    ],
    ctaTitle: "Need an ecommerce website that feels more premium and easier to buy from?",
    ctaDescription:
      "Start with a website review and get a practical recommendation on storefront structure, product pages, and conversion flow.",
  },
  "website-design-lagos": {
    slug: "website-design-lagos",
    path: "/website-design-lagos/",
    title: "Website Design Lagos",
    seoTitle: "Website Design Lagos | Web Growth",
    metaDescription:
      "Premium website design in Lagos for businesses that need stronger first impressions, better conversion flow, and a cleaner foundation for growth.",
    keywords: [
      "website design lagos",
      "web design lagos",
      "website designer lagos",
      "business website design lagos",
      "premium web design lagos",
    ],
    eyebrow: "Lagos websites",
    heroTitle:
      "Website design in Lagos for businesses that need stronger trust, clarity, and growth support.",
    heroDescription:
      "Web Growth builds premium websites for Lagos businesses that want more than a nice layout. The focus is clearer offers, better user flow, stronger trust, and a cleaner path to enquiries or sales.",
    heroImage: "/images/services/services-redesign.webp",
    detailImage: "/images/services/services-landing-2.webp",
    chips: ["Lagos market context", "Premium positioning", "Lead-ready"],
    problemItems: [
      {
        title: "The website does not reflect the real quality of the business",
        answer:
          "Many Lagos businesses rely on websites that feel generic, cluttered, or too weak for the level of trust they actually need to command.",
      },
      {
        title: "Visitors are not guided clearly enough",
        answer:
          "If the page structure is messy or the offer is vague, people hesitate before they enquire.",
      },
      {
        title: "Mobile experience weakens first impressions",
        answer:
          "A premium audience often meets the business first on mobile, so speed, spacing, and clarity matter immediately.",
      },
      {
        title: "The site is online, but not helping enough with growth",
        answer:
          "A stronger Lagos website should support trust, search visibility, campaigns, and better conversion paths together.",
        href: "/services/website-redesign/",
        hrefLabel: "See website redesign service",
      },
    ],
    capabilityItems: [
      {
        title: "Premium brand presentation",
        description:
          "The website should feel aligned with the quality of the business, not below it.",
      },
      {
        title: "Stronger buyer understanding",
        description:
          "Clear messaging and page structure help people understand what you do and why it matters faster.",
      },
      {
        title: "Local trust and service fit",
        description:
          "The site can support local credibility while still feeling modern and scalable.",
      },
      {
        title: "Growth-ready technical structure",
        description:
          "Speed, metadata, and page organization should support future SEO and campaigns.",
      },
    ],
    outcomeItems: [
      {
        title: "More credible digital presence",
        description:
          "The site helps the business feel more serious, polished, and trustworthy.",
      },
      {
        title: "Better conversion flow",
        description:
          "Visitors have clearer routes toward contacting, booking, or requesting a quote.",
      },
      {
        title: "Stronger platform foundation",
        description:
          "The website becomes a better asset for growth, not just a visual placeholder.",
      },
    ],
    audienceItems: [
      {
        title: "Lagos service businesses",
        description:
          "Ideal for brands that need stronger trust and more qualified website enquiries.",
      },
      {
        title: "Professional brands",
        description:
          "A fit for clinics, consultants, real estate firms, and premium local businesses.",
      },
      {
        title: "Growing companies",
        description:
          "Useful when the current site no longer matches the scale or ambition of the business.",
      },
    ],
    processItems: [
      {
        title: "Review the current website and buyer flow",
        description:
          "We identify whether the main issues are trust, clarity, UX, messaging, or speed.",
      },
      {
        title: "Rebuild structure around growth",
        description:
          "We redesign the page system around business goals, not just surface styling.",
      },
      {
        title: "Launch with premium polish and technical discipline",
        description:
          "The final site supports stronger marketing, better usability, and long-term improvement.",
      },
    ],
    relatedServices: [
      {
        href: "/services/business-website-design/",
        label: "Business websites",
        title: "Build a stronger business website",
        description:
          "Use the core website service when you want direct implementation for a business brand.",
      },
      {
        href: "/services/website-audit/",
        label: "Audit",
        title: "Diagnose what is currently holding the site back",
        description:
          "Start with an audit when the problem is still unclear and you need the right implementation order.",
      },
      {
        href: "/contact/",
        label: "Contact",
        title: "Talk through your website goals",
        description:
          "Use contact if you want a direct recommendation based on your current site and business model.",
      },
    ],
    faqs: [
      {
        question: "Do you only work with Lagos businesses?",
        answer:
          "No. Lagos is one of the local markets served, but the work also supports businesses in other locations.",
      },
      {
        question: "Can this include SEO and performance improvements?",
        answer:
          "Yes. Website design decisions can be aligned with SEO, speed, and conversion goals from the start.",
      },
      {
        question: "Is this only for redesigns?",
        answer:
          "No. It works for both new websites and businesses replacing weak or outdated existing sites.",
      },
    ],
    ctaTitle: "Need a Lagos website that feels more premium and commercially useful?",
    ctaDescription:
      "Start with a website review and get a clear recommendation on redesign, new build, speed, or SEO priorities.",
  },
  "website-design-united-kingdom": {
    slug: "website-design-united-kingdom",
    path: "/website-design-united-kingdom/",
    title: "Website Design United Kingdom",
    seoTitle: "Website Design United Kingdom | Web Growth",
    metaDescription:
      "Premium website design support for UK-based businesses that need stronger trust, clearer positioning, and better conversion structure.",
    keywords: [
      "website design united kingdom",
      "website design uk",
      "web design united kingdom",
      "business website design uk",
      "premium website design uk",
    ],
    eyebrow: "United Kingdom",
    heroTitle:
      "Website design for UK businesses that need clearer positioning and stronger conversion support.",
    heroDescription:
      "Web Growth supports UK-based businesses that need premium website structure, clearer service communication, and a more persuasive user experience across desktop and mobile.",
    heroImage: "/images/services/services-support.webp",
    detailImage: "/images/services/services-cta.webp",
    chips: ["Remote-friendly", "Premium structure", "Conversion-focused"],
    problemItems: [
      {
        title: "The website looks acceptable but underperforms commercially",
        answer:
          "Many businesses have sites that look fine at a glance but fail to explain the offer or push users toward action clearly enough.",
      },
      {
        title: "Trust and proof are not working hard enough",
        answer:
          "Weak structure, generic copy, or outdated presentation can reduce confidence before the visitor decides to enquire.",
      },
      {
        title: "The site is not built around growth decisions",
        answer:
          "A better website should support SEO, lead generation, campaigns, and future expansion rather than only acting as a brochure.",
      },
      {
        title: "The business needs a more strategic digital surface",
        answer:
          "A premium website should combine clarity, authority, and conversion rather than treating those as separate projects.",
        href: "/services/business-website-design/",
        hrefLabel: "See business website design service",
      },
    ],
    capabilityItems: [
      {
        title: "Stronger offer clarity",
        description:
          "The website should make the business easier to understand and easier to trust.",
      },
      {
        title: "Premium conversion architecture",
        description:
          "Visitors should be guided through proof, value, and next steps with less friction.",
      },
      {
        title: "Remote implementation discipline",
        description:
          "The work is structured to support collaboration without needing in-person delivery.",
      },
      {
        title: "Scalable growth foundations",
        description:
          "The result should support content, SEO, campaigns, and service expansion over time.",
      },
    ],
    outcomeItems: [
      {
        title: "Cleaner premium presentation",
        description:
          "The business feels more established and strategically positioned online.",
      },
      {
        title: "Better user progression",
        description:
          "People move from first impression to action with more confidence.",
      },
      {
        title: "More useful website asset",
        description:
          "The site becomes easier to use as a sales, SEO, and brand-growth platform.",
      },
    ],
    audienceItems: [
      {
        title: "Service businesses",
        description:
          "Ideal for businesses whose websites need to support trust and enquiries more effectively.",
      },
      {
        title: "Consultancies and professional firms",
        description:
          "A fit for brands that need clearer authority and stronger conversion flow online.",
      },
      {
        title: "Companies outgrowing weak websites",
        description:
          "Useful when the current digital presence no longer matches the quality of the business.",
      },
    ],
    processItems: [
      {
        title: "Audit the current website reality",
        description:
          "We identify where clarity, UX, trust, and conversion are underperforming.",
      },
      {
        title: "Rebuild the structure around real business outcomes",
        description:
          "The redesign is shaped around lead quality, decision flow, and usability rather than trends.",
      },
      {
        title: "Launch a stronger website platform",
        description:
          "The final result supports future marketing and makes the business easier to grow online.",
      },
    ],
    relatedServices: [
      {
        href: "/services/website-redesign/",
        label: "Redesign",
        title: "Upgrade an underperforming website",
        description:
          "Use redesign when the core issue is a site that no longer supports trust or conversion.",
      },
      {
        href: "/services/search-engine-optimisation/",
        label: "SEO",
        title: "Support visibility after the website foundation improves",
        description:
          "Pair stronger website structure with search optimisation to improve qualified traffic.",
      },
      {
        href: "/pricing/",
        label: "Pricing",
        title: "Review scope guidance",
        description:
          "Use pricing if you are already evaluating likely build or redesign ranges.",
      },
    ],
    faqs: [
      {
        question: "Can Web Growth support UK-based businesses remotely?",
        answer:
          "Yes. The work can be delivered remotely with clear review, feedback, and implementation flow.",
      },
      {
        question: "Is this only for new websites?",
        answer:
          "No. It is also useful for redesigning sites that already exist but are no longer helping the business enough.",
      },
      {
        question: "Will the website support future SEO and campaigns?",
        answer:
          "Yes. The direction is structured so the website can function as a better growth asset later.",
      },
    ],
    ctaTitle: "Need a UK-facing website that feels more strategic and premium?",
    ctaDescription:
      "Start with a website review and get a direct recommendation on structure, redesign, and the best path forward.",
  },
  "web-design-for-real-estate-lagos": {
    slug: "web-design-for-real-estate-lagos",
    path: "/web-design-for-real-estate-lagos/",
    title: "Web Design for Real Estate Lagos",
    seoTitle: "Web Design for Real Estate Lagos | Web Growth",
    metaDescription:
      "Premium web design for real estate brands in Lagos that need stronger trust, cleaner property presentation, and better enquiry flow.",
    keywords: [
      "real estate web design lagos",
      "web design for real estate lagos",
      "real estate website design nigeria",
      "property website design lagos",
      "real estate website development lagos",
    ],
    eyebrow: "Real estate",
    heroTitle:
      "Real estate web design in Lagos that makes listings, trust, and enquiries easier to manage.",
    heroDescription:
      "Web Growth helps real estate brands present properties more clearly, build buyer confidence faster, and guide visitors toward enquiry or consultation with less friction.",
    heroImage: "/images/services/services-business-2.webp",
    detailImage: "/images/services/services-business.webp",
    chips: ["Property trust", "Lead quality", "Premium presentation"],
    problemItems: [
      {
        title: "Property presentation feels weak or scattered",
        answer:
          "When listings, areas, and service information are poorly organised, buyers struggle to understand the opportunity.",
      },
      {
        title: "Trust is not established fast enough",
        answer:
          "Real estate buyers need stronger reassurance around professionalism, location context, and credibility before they enquire.",
      },
      {
        title: "Enquiry flow is too vague",
        answer:
          "Property websites should make it obvious how to ask questions, book viewings, or request details.",
      },
      {
        title: "The site does not support premium positioning",
        answer:
          "A stronger real estate website should help the brand feel more serious, more modern, and more commercially prepared.",
        href: "/services/business-website-design/",
        hrefLabel: "See business website design service",
      },
    ],
    capabilityItems: [
      {
        title: "Cleaner property hierarchy",
        description:
          "Listings, services, and key location details should be easier to scan and understand.",
      },
      {
        title: "Trust-led presentation",
        description:
          "Brand polish, clarity, and conversion cues matter heavily in higher-consideration property decisions.",
      },
      {
        title: "Stronger enquiry surfaces",
        description:
          "Calls, forms, and viewing requests need to feel easy and intentional.",
      },
      {
        title: "Growth-ready structure",
        description:
          "The site should support future expansion into content, SEO, and case-study style proof.",
      },
    ],
    outcomeItems: [
      {
        title: "More premium buyer experience",
        description:
          "The website helps the brand feel more credible and better organised.",
      },
      {
        title: "Better listing usability",
        description:
          "Visitors can browse and compare opportunities more easily.",
      },
      {
        title: "Clearer path to action",
        description:
          "Interested buyers can move toward enquiry with less friction.",
      },
    ],
    audienceItems: [
      {
        title: "Real estate agencies",
        description:
          "Ideal for firms that need a stronger premium digital presence and enquiry flow.",
      },
      {
        title: "Property consultants and brokers",
        description:
          "Useful when trust, market clarity, and responsive lead handling matter heavily.",
      },
      {
        title: "Developers and project marketers",
        description:
          "A fit for brands promoting premium properties or investment opportunities online.",
      },
    ],
    processItems: [
      {
        title: "Clarify listings, services, and market message",
        description:
          "We identify what the website needs to communicate faster and more credibly.",
      },
      {
        title: "Restructure around trust and property discovery",
        description:
          "The page flow is rebuilt around buyer questions, offer clarity, and lead capture.",
      },
      {
        title: "Launch a stronger premium-facing surface",
        description:
          "The finished site is easier to use, easier to trust, and better aligned with growth goals.",
      },
    ],
    relatedServices: [
      {
        href: "/services/website-redesign/",
        label: "Redesign",
        title: "Upgrade an outdated property website",
        description:
          "Use redesign if the current real estate site is the main problem.",
      },
      {
        href: "/services/landing-page-design/",
        label: "Landing pages",
        title: "Support campaigns and property launches",
        description:
          "Use focused landing pages for promotions, listings, or new property campaigns.",
      },
      {
        href: "/contact/",
        label: "Contact",
        title: "Discuss your real estate website direction",
        description:
          "Use contact if you want a direct recommendation based on your listings, audience, and goals.",
      },
    ],
    faqs: [
      {
        question: "Can this support listing-driven websites?",
        answer:
          "Yes. The direction can support listing presentation, enquiry paths, and property detail clarity.",
      },
      {
        question: "Is this only for high-end property firms?",
        answer:
          "No. It fits any real estate brand that needs a stronger trust and enquiry experience online.",
      },
      {
        question: "Can the site support future SEO and content?",
        answer:
          "Yes. A cleaner structure makes it easier to publish supporting content and improve local visibility later.",
      },
    ],
    ctaTitle: "Need a real estate website in Lagos that feels more premium and easier to trust?",
    ctaDescription:
      "Start with a website review and get a clear recommendation on listings, trust, and the best implementation path.",
  },
};
