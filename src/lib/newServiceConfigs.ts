import type { Metadata } from "next";

export type ServiceListItem = {
  title: string;
  short: string;
  slug: string;
  serviceParam: string;
  bullets: string[];
  image: string;
};

export type ServicePageConfig = {
  title: string;
  slug: string;
  serviceParam: string;
  metaDescription: string;
  keywords: string[];
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  detailImage: string;
  highlights: string[];
  deliverables: string[];
  process: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
  ctaTitle: string;
  ctaDescription: string;
};

export const NEW_SERVICE_PAGES: Record<string, ServicePageConfig> = {
  "email-marketing-setup-strategy": {
    title: "Email Marketing Setup and Strategy",
    slug: "email-marketing-setup-strategy",
    serviceParam: "Email Marketing Setup and Strategy",
    metaDescription:
      "Email marketing setup and strategy for small businesses: list growth flow, segmentation, nurture sequences, campaigns, and measurable conversion tracking.",
    keywords: [
      "email marketing setup",
      "email marketing strategy",
      "email marketing services",
      "email campaign setup",
      "small business email marketing",
      "email automation strategy",
      "lead nurturing emails",
      "email conversion optimization",
    ],
    heroTitle:
      "Email marketing setup and strategy that turns subscribers into sales conversations",
    heroDescription:
      "We build your email marketing system end-to-end: strategy, list segmentation, automations, campaigns, and reporting so email becomes a predictable revenue channel.",
    heroImage: "/images/services/services-support.webp",
    detailImage: "/images/services/services-business-2.webp",
    highlights: [
      "High-intent email funnel architecture",
      "Conversion-focused copy sequence structure",
      "Segmentation and automation logic for better response rates",
    ],
    deliverables: [
      "Lead capture and list segmentation strategy",
      "Welcome, nurture, and re-engagement automations",
      "Campaign calendar and send cadence recommendation",
      "Email templates and performance baseline reporting",
    ],
    process: [
      {
        title: "Audit + strategy",
        text: "We map your offer, audience, and email objectives into a practical strategy plan.",
      },
      {
        title: "Setup + automation",
        text: "We configure list structure, triggers, and automated flows aligned to your customer journey.",
      },
      {
        title: "Launch + optimisation",
        text: "We monitor key metrics and optimize for better open rates, click rates, and conversion.",
      },
    ],
    faqs: [
      {
        question: "Do you set up automations as well as newsletters?",
        answer:
          "Yes. We set up both automated sequences and campaign workflows so your email marketing covers retention and new revenue opportunities.",
      },
      {
        question: "Can this work for a small list?",
        answer:
          "Yes. Good strategy matters more than list size at the beginning. We structure your system to scale as your list grows.",
      },
      {
        question: "Which tools do you support?",
        answer:
          "We support common email platforms and tailor setup to your current stack and growth stage.",
      },
    ],
    ctaTitle: "Need email marketing that drives real business outcomes?",
    ctaDescription:
      "Get a clean strategy and implementation plan that improves consistency, engagement, and conversion.",
  },

  "search-engine-optimisation": {
    title: "Search Engine Optimisation (SEO)",
    slug: "search-engine-optimisation",
    serviceParam: "Search Engine Optimisation (SEO)",
    metaDescription:
      "Search engine optimisation services for small businesses: technical SEO, on-page SEO, local SEO, and content optimisation to grow qualified organic traffic.",
    keywords: [
      "search engine optimisation",
      "seo services",
      "local seo services",
      "technical seo",
      "on page seo",
      "small business seo",
      "website seo optimization",
      "seo consultant",
    ],
    heroTitle:
      "Search engine optimisation services designed to increase qualified organic leads",
    heroDescription:
      "We improve search visibility using a structured SEO system: technical SEO fixes, intent-based content optimization, internal linking, and local SEO improvements.",
    heroImage: "/images/services/services-audit.webp",
    detailImage: "/images/services/services-speed-2.webp",
    highlights: [
      "Commercial-intent keyword targeting",
      "Technical SEO and crawl health optimisation",
      "Local SEO structure for service businesses",
    ],
    deliverables: [
      "SEO audit with prioritised action plan",
      "On-page SEO updates across key service pages",
      "Internal linking and metadata optimisation",
      "Performance tracking and reporting guidance",
    ],
    process: [
      {
        title: "SEO diagnosis",
        text: "We identify ranking blockers across technical SEO, on-page quality, and content intent.",
      },
      {
        title: "SEO implementation",
        text: "We execute high-impact fixes first: metadata, structure, internal links, and local relevance signals.",
      },
      {
        title: "Monitoring + iteration",
        text: "We monitor indexation, keyword movement, and landing page performance for continuous improvement.",
      },
    ],
    faqs: [
      {
        question: "How long does SEO take to show results?",
        answer:
          "SEO is cumulative. You often see early signals within weeks, with stronger compounding gains over months.",
      },
      {
        question: "Do you only handle local SEO?",
        answer:
          "We support both local SEO and broader search optimisation, depending on your market and service model.",
      },
      {
        question: "Can you optimise an existing website?",
        answer:
          "Yes. We work with existing sites and provide practical fixes without forcing a full rebuild unless necessary.",
      },
    ],
    ctaTitle: "Want stronger rankings and higher-intent traffic?",
    ctaDescription:
      "Get a structured SEO implementation plan built around measurable search and conversion outcomes.",
  },

  "google-my-business-setup-optimisation": {
    title: "Google My Business (GMB) Setup and Optimisation",
    slug: "google-my-business-setup-optimisation",
    serviceParam: "Google My Business Setup and Optimisation",
    metaDescription:
      "Google My Business setup and optimisation service to improve Google Maps visibility, local rankings, profile quality, and enquiry volume.",
    keywords: [
      "google my business setup",
      "google business profile optimization",
      "google maps seo",
      "local seo google my business",
      "google business profile setup",
      "gmb optimization service",
      "google maps ranking",
      "local business listing optimization",
    ],
    heroTitle:
      "Google My Business setup and optimisation to increase local visibility and enquiries",
    heroDescription:
      "We set up and optimize your Google Business Profile for stronger local ranking signals, profile trust, and better lead flow from Google Maps search.",
    heroImage: "/images/services/services-business.webp",
    detailImage: "/images/services/services-business-2.webp",
    highlights: [
      "Google Business Profile setup best practices",
      "Local ranking signal optimisation",
      "Profile trust and conversion improvement",
    ],
    deliverables: [
      "Profile setup or full optimisation audit",
      "Category, services, and description refinement",
      "Location, media, and Q&A optimisation",
      "Review strategy and ongoing profile guidance",
    ],
    process: [
      {
        title: "Profile audit",
        text: "We assess profile completeness, category targeting, and local visibility gaps.",
      },
      {
        title: "Optimisation implementation",
        text: "We optimize business details, services, media, and conversion elements inside the profile.",
      },
      {
        title: "Growth guidance",
        text: "We provide practical recommendations for reviews, updates, and sustained local ranking improvements.",
      },
    ],
    faqs: [
      {
        question: "Is this useful if I already have a profile?",
        answer:
          "Yes. Most existing profiles are under-optimized and leave local ranking opportunities untapped.",
      },
      {
        question: "Will this improve Google Maps ranking?",
        answer:
          "It improves the quality signals and relevance factors that support better Maps visibility over time.",
      },
      {
        question: "Do you help with review strategy?",
        answer:
          "Yes. We include practical review and profile activity guidance to support trust and ranking performance.",
      },
    ],
    ctaTitle: "Want more qualified local enquiries from Google Maps?",
    ctaDescription:
      "Get your Google Business Profile properly configured and optimized for local search performance.",
  },

  "booking-platform-setup-integration": {
    title: "Booking Platform Setup and Integration",
    slug: "booking-platform-setup-integration",
    serviceParam: "Booking Platform Setup and Integration",
    metaDescription:
      "Booking platform setup and website integration service for appointment-based businesses using clear flows, calendar sync, and conversion-focused booking journeys.",
    keywords: [
      "booking system setup",
      "online booking integration",
      "appointment booking setup",
      "booking platform integration",
      "website booking system",
      "calendar booking integration",
      "service business booking flow",
      "booking funnel optimization",
    ],
    heroTitle:
      "Booking platform setup and integration that reduces friction and increases completed appointments",
    heroDescription:
      "We set up and integrate your booking system with your website so visitors can move from interest to confirmed appointment with less drop-off.",
    heroImage: "/images/services/services-maintenance.webp",
    detailImage: "/images/services/services-maintenance-2.webp",
    highlights: [
      "Conversion-focused booking flow structure",
      "Calendar and confirmation logic setup",
      "Website-to-booking handoff optimisation",
    ],
    deliverables: [
      "Booking platform setup and configuration",
      "Website integration with clear CTA routing",
      "Availability, confirmation, and reminder setup",
      "Basic analytics tracking for booking actions",
    ],
    process: [
      {
        title: "Flow planning",
        text: "We map your booking journey from landing page click to confirmed appointment.",
      },
      {
        title: "Integration setup",
        text: "We connect booking tools, configure settings, and align the journey with your website UX.",
      },
      {
        title: "Testing + handoff",
        text: "We test all booking scenarios and hand over a stable system with usage guidance.",
      },
    ],
    faqs: [
      {
        question: "Can you work with my current booking platform?",
        answer:
          "Yes. We usually integrate with your current platform unless there is a technical reason to switch.",
      },
      {
        question: "Do you configure reminders and confirmations?",
        answer:
          "Yes. We configure key communication settings so users get clear confirmation and reminders.",
      },
      {
        question: "Will this help reduce no-shows?",
        answer:
          "A cleaner booking flow and reminder setup typically improve show rates and reduce appointment drop-off.",
      },
    ],
    ctaTitle: "Need a smoother booking journey on your website?",
    ctaDescription:
      "Get booking setup and integration that improves completion rates and user confidence.",
  },

  "crm-system-setup-configuration": {
    title: "CRM System Setup and Configuration",
    slug: "crm-system-setup-configuration",
    serviceParam: "CRM System Setup and Configuration",
    metaDescription:
      "CRM setup and configuration service for small businesses: pipeline setup, lead capture flows, tagging, automations, and reporting-ready structure.",
    keywords: [
      "crm setup service",
      "crm configuration",
      "small business crm setup",
      "sales pipeline setup",
      "lead management system setup",
      "crm automation setup",
      "crm integration service",
      "customer relationship management setup",
    ],
    heroTitle:
      "CRM setup and configuration that turns scattered leads into a trackable sales process",
    heroDescription:
      "We configure your CRM to match your real sales workflow: lead capture, pipeline stages, tagging, automations, and reporting visibility.",
    heroImage: "/images/services/services-business-2.webp",
    detailImage: "/images/services/services-support.webp",
    highlights: [
      "Pipeline and lead stage design",
      "Lead routing and tagging logic",
      "Automation-ready CRM structure",
    ],
    deliverables: [
      "CRM account architecture and field setup",
      "Pipeline stages and lead status logic",
      "Core automations and assignment rules",
      "Dashboard and reporting baseline setup",
    ],
    process: [
      {
        title: "Workflow mapping",
        text: "We map your current lead journey and define a cleaner CRM pipeline model.",
      },
      {
        title: "System configuration",
        text: "We configure records, stages, tagging, and automations aligned to your sales process.",
      },
      {
        title: "Team handoff",
        text: "We validate usability and provide implementation guidance for daily adoption.",
      },
    ],
    faqs: [
      {
        question: "Can you migrate leads from spreadsheets?",
        answer:
          "Yes. We can structure and import existing lead data into your CRM with clean field mapping.",
      },
      {
        question: "Do you support automation setup in CRM?",
        answer:
          "Yes. We configure practical automations for lead assignment, follow-ups, and status updates.",
      },
      {
        question: "What if I do not know which CRM to use?",
        answer:
          "We can recommend options based on your business model, workflow complexity, and budget.",
      },
    ],
    ctaTitle: "Need a CRM that your team can actually use?",
    ctaDescription:
      "Get a clean CRM setup built around your process, not a generic template.",
  },

  "marketing-automation-build-implementation": {
    title: "Marketing Automation Build and Implementation",
    slug: "marketing-automation-build-implementation",
    serviceParam: "Marketing Automation Build and Implementation",
    metaDescription:
      "Marketing automation build and implementation services: automated lead nurture workflows, follow-up sequences, segmentation logic, and conversion tracking.",
    keywords: [
      "marketing automation services",
      "marketing automation setup",
      "lead nurture automation",
      "automated marketing workflows",
      "small business marketing automation",
      "email and crm automation",
      "conversion automation setup",
      "automation implementation service",
    ],
    heroTitle:
      "Marketing automation build and implementation for consistent lead follow-up and faster conversion cycles",
    heroDescription:
      "We build automation workflows that reduce manual follow-up, improve response speed, and keep leads moving through your conversion funnel.",
    heroImage: "/images/services/services-support.webp",
    detailImage: "/images/services/services-speed.webp",
    highlights: [
      "Automation workflows tied to business goals",
      "Lead scoring and follow-up logic",
      "Cross-channel conversion sequence mapping",
    ],
    deliverables: [
      "Automation strategy and workflow map",
      "Trigger, action, and branching configuration",
      "Lead nurture and follow-up sequence build",
      "Monitoring framework and optimization notes",
    ],
    process: [
      {
        title: "Automation planning",
        text: "We define automation goals, decision points, and workflow dependencies.",
      },
      {
        title: "Build + integration",
        text: "We implement workflows and connect your CRM, forms, and communication channels.",
      },
      {
        title: "Testing + optimisation",
        text: "We test key scenarios and refine automation performance for better conversion outcomes.",
      },
    ],
    faqs: [
      {
        question: "Will automation make messages feel robotic?",
        answer:
          "Not when built properly. We structure automation to feel contextual and relevant, not generic.",
      },
      {
        question: "Can you automate lead follow-up from my website forms?",
        answer:
          "Yes. We set up website lead triggers and follow-up sequences tied to specific enquiry paths.",
      },
      {
        question: "Do you provide ongoing optimization?",
        answer:
          "Yes. We can monitor and refine automations after launch based on response and conversion data.",
      },
    ],
    ctaTitle: "Need automated follow-up that actually converts?",
    ctaDescription:
      "Get conversion-focused automation workflows that save time and improve lead progression.",
  },

  "analytics-tracking-setup": {
    title:
      "Analytics and Tracking Setup (Google Analytics, Meta Pixel, TikTok Pixel) with Ongoing Monitoring",
    slug: "analytics-tracking-setup",
    serviceParam:
      "Analytics and Tracking Setup (Google Analytics, Meta Pixel, TikTok Pixel)",
    metaDescription:
      "Analytics and tracking setup service: Google Analytics 4, Meta Pixel, TikTok Pixel, event tracking, conversion tracking, and ongoing monitoring for marketing performance.",
    keywords: [
      "google analytics setup",
      "meta pixel setup",
      "tiktok pixel setup",
      "conversion tracking setup",
      "analytics implementation service",
      "ga4 setup service",
      "marketing tracking setup",
      "event tracking setup",
    ],
    heroTitle:
      "Analytics and tracking setup that gives you clean conversion data across web and ad platforms",
    heroDescription:
      "We set up Google Analytics 4, Meta Pixel, and TikTok Pixel with event and conversion tracking so you can measure what drives leads and sales.",
    heroImage: "/images/services/services-speed.webp",
    detailImage: "/images/services/services-audit-2.webp",
    highlights: [
      "GA4, Meta Pixel, and TikTok Pixel implementation",
      "Conversion event architecture and QA",
      "Ongoing monitoring and tracking health checks",
    ],
    deliverables: [
      "Analytics platform setup and property configuration",
      "Event and conversion tracking implementation",
      "Tag validation and data quality checks",
      "Tracking dashboard baseline and monitoring guidance",
    ],
    process: [
      {
        title: "Tracking plan",
        text: "We define key conversion events and align tracking with your business goals.",
      },
      {
        title: "Implementation",
        text: "We deploy tags, configure events, and validate platform-specific tracking behavior.",
      },
      {
        title: "Monitoring",
        text: "We monitor data quality and flag tracking issues before they affect performance analysis.",
      },
    ],
    faqs: [
      {
        question: "Can you track form submissions and key button clicks?",
        answer:
          "Yes. We configure conversion events for meaningful actions such as form submits, calls, and key CTA clicks.",
      },
      {
        question: "Do you only set up tracking once?",
        answer:
          "No. We offer ongoing monitoring to ensure your tracking stays accurate after site changes.",
      },
      {
        question: "Can this improve ad performance?",
        answer:
          "Accurate tracking improves optimisation decisions by giving ad platforms and your team better conversion data.",
      },
    ],
    ctaTitle: "Need reliable tracking before scaling marketing spend?",
    ctaDescription:
      "Get clean analytics implementation and ongoing monitoring so your decisions are data-backed.",
  },

  "domain-registration-hosting-guidance": {
    title:
      "Guidance on Domain Registration and Hosting Platform Selection",
    slug: "domain-registration-hosting-guidance",
    serviceParam:
      "Guidance on Domain Registration and Hosting Platform Selection",
    metaDescription:
      "Domain registration and hosting guidance service for small businesses: choose the right domain strategy, hosting platform, SSL setup, and launch-ready technical foundation.",
    keywords: [
      "domain registration help",
      "hosting platform selection",
      "best web hosting for small business",
      "website hosting guidance",
      "domain and hosting setup",
      "ssl hosting setup",
      "website launch setup",
      "small business website hosting",
    ],
    heroTitle:
      "Domain registration and hosting guidance to avoid expensive setup mistakes",
    heroDescription:
      "We help you choose the right domain and hosting setup based on performance, reliability, and business growth needs before you commit.",
    heroImage: "/images/services/services-hero.webp",
    detailImage: "/images/services/services-business.webp",
    highlights: [
      "Domain selection and structure guidance",
      "Hosting platform comparison for your use case",
      "Launch-ready technical setup recommendations",
    ],
    deliverables: [
      "Domain strategy and purchase guidance",
      "Hosting platform recommendation matrix",
      "SSL, DNS, and core setup checklist",
      "Migration and launch risk considerations",
    ],
    process: [
      {
        title: "Needs assessment",
        text: "We assess traffic expectations, site type, and performance requirements.",
      },
      {
        title: "Platform recommendation",
        text: "We recommend domain and hosting options aligned to budget, speed, and reliability.",
      },
      {
        title: "Setup guidance",
        text: "We guide implementation decisions so your technical foundation supports long-term growth.",
      },
    ],
    faqs: [
      {
        question: "Can you help if I already bought a domain?",
        answer:
          "Yes. We can review your current setup and advise the best path for hosting and launch.",
      },
      {
        question: "Do I need expensive hosting to start?",
        answer:
          "Not always. We match hosting recommendations to your real traffic and business requirements.",
      },
      {
        question: "Can this reduce future migration problems?",
        answer:
          "Yes. Choosing the right setup early reduces platform lock-in and avoidable migration issues later.",
      },
    ],
    ctaTitle: "Need help choosing the right domain and hosting stack?",
    ctaDescription:
      "Get practical guidance before you spend budget on a setup that limits growth.",
  },

  "lead-magnet-strategy-build": {
    title: "Lead Magnet Strategy and Build (eBooks, Quizzes, Checklists, Offers)",
    slug: "lead-magnet-strategy-build",
    serviceParam: "Lead Magnet Strategy and Build",
    metaDescription:
      "Lead magnet strategy and build service: create high-converting lead magnets like eBooks, quizzes, checklists, and offers with landing page and capture flow setup.",
    keywords: [
      "lead magnet strategy",
      "lead magnet design service",
      "lead magnet funnel",
      "ebook lead magnet",
      "quiz funnel setup",
      "checklist lead magnet",
      "lead generation offer",
      "email lead capture strategy",
    ],
    heroTitle:
      "Lead magnet strategy and build to capture higher-quality leads before the sales conversation",
    heroDescription:
      "We design and build lead magnets that match your audience intent and connect to a practical conversion funnel: capture, nurture, and action.",
    heroImage: "/images/services/services-landing.webp",
    detailImage: "/images/services/services-landing-2.webp",
    highlights: [
      "Offer design for intent-matched lead capture",
      "Lead magnet and funnel flow architecture",
      "Conversion tracking and optimization baseline",
    ],
    deliverables: [
      "Lead magnet strategy and format recommendation",
      "Lead asset build (eBook, quiz, checklist, or offer)",
      "Landing page and form flow structure",
      "Email follow-up sequence outline",
    ],
    process: [
      {
        title: "Offer strategy",
        text: "We define your lead magnet angle based on audience pain points and sales objectives.",
      },
      {
        title: "Build + funnel setup",
        text: "We build the lead asset and connect it to your capture page and follow-up flow.",
      },
      {
        title: "Launch + refinement",
        text: "We monitor early performance and refine messaging and flow for better conversion.",
      },
    ],
    faqs: [
      {
        question: "Which lead magnet format converts best?",
        answer:
          "It depends on audience intent. We recommend the format most likely to generate qualified leads for your offer.",
      },
      {
        question: "Do you also build the landing page?",
        answer:
          "Yes. We can include landing page structure and conversion-focused CTA flow as part of implementation.",
      },
      {
        question: "Can this connect to my email marketing?",
        answer:
          "Yes. We align lead magnet capture with your email nurture sequence and CRM flow.",
      },
    ],
    ctaTitle: "Need a lead magnet that attracts qualified prospects?",
    ctaDescription:
      "Get strategy and build support for lead magnets that convert attention into pipeline.",
  },
};

export const NEW_SERVICES_LIST: ServiceListItem[] = Object.values(
  NEW_SERVICE_PAGES
).map((service) => {
  const imageBySlug: Record<string, string> = {
    "email-marketing-setup-strategy": "/images/services/services-support.webp",
    "search-engine-optimisation": "/images/services/services-audit.webp",
    "google-my-business-setup-optimisation": "/images/services/services-business.webp",
    "booking-platform-setup-integration": "/images/services/services-maintenance.webp",
    "crm-system-setup-configuration": "/images/services/services-business-2.webp",
    "marketing-automation-build-implementation": "/images/services/services-speed.webp",
    "analytics-tracking-setup": "/images/services/services-speed-2.webp",
    "domain-registration-hosting-guidance": "/images/services/services-hero.webp",
    "lead-magnet-strategy-build": "/images/services/services-landing.webp",
  };

  const bulletsBySlug: Record<string, string[]> = {
    "email-marketing-setup-strategy": [
      "Email strategy",
      "Automations",
      "Lead nurture flows",
    ],
    "search-engine-optimisation": [
      "Technical SEO",
      "On-page optimisation",
      "Local SEO growth",
    ],
    "google-my-business-setup-optimisation": [
      "Profile setup",
      "Maps visibility",
      "Local conversion signals",
    ],
    "booking-platform-setup-integration": [
      "Booking flow design",
      "Platform integration",
      "Appointment conversion",
    ],
    "crm-system-setup-configuration": [
      "CRM pipeline setup",
      "Lead routing",
      "Automation-ready structure",
    ],
    "marketing-automation-build-implementation": [
      "Workflow automation",
      "Follow-up sequences",
      "Conversion logic",
    ],
    "analytics-tracking-setup": [
      "GA4 + pixel setup",
      "Event tracking",
      "Ongoing monitoring",
    ],
    "domain-registration-hosting-guidance": [
      "Domain strategy",
      "Hosting selection",
      "Launch setup guidance",
    ],
    "lead-magnet-strategy-build": [
      "Lead magnet strategy",
      "Funnel build",
      "Capture optimisation",
    ],
  };

  return {
    title: service.title,
    short: service.metaDescription,
    slug: `/services/${service.slug}`,
    serviceParam: service.serviceParam,
    bullets: bulletsBySlug[service.slug] ?? ["Strategy", "Implementation", "Optimization"],
    image: imageBySlug[service.slug] ?? "/images/services/services-cta.webp",
  };
});

export function buildServiceMetadata(
  service: ServicePageConfig,
  canonicalUrl: string
): Metadata {
  return {
    title: `${service.title}`,
    description: service.metaDescription,
    keywords: [
      "web design",
      "web design services",
      ...service.keywords,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${service.title}`,
      description: service.metaDescription,
      url: canonicalUrl,
      siteName: "Web Growth",
      images: [
        {
          url: "https://webgrowth.info/images/hero/Hero-Image-1.webp",
          width: 1200,
          height: 630,
          alt: service.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title}`,
      description: service.metaDescription,
      images: ["https://webgrowth.info/images/hero/Hero-Image-1.webp"],
    },
    robots: { index: true, follow: true },
  };
}
