import type { Metadata } from "next";
import { warnOnServiceQuality } from "@/lib/contentQuality";
import { CORE_SERVICE_PAGES } from "@/lib/coreServiceConfigs";
import { absoluteUrl } from "@/lib/site";

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
  seoTitle?: string;
  seoDescription?: string;
  keywords: string[];
  searchIntent: string;
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
  targetAudience: string[];
  notFor: string[];
  commonMistakes: string[];
  examples: string[];
  useCases: string[];
  beforeAfter: { before: string; after: string }[];
  evidence: { src: string; alt: string; note?: string }[];
  relatedGuideSlugs: string[];
  exclusions?: string[];
  relatedLinks?: {
    href: string;
    label: string;
    title: string;
    description: string;
  }[];
};

export type ServicePageInput = Omit<
  ServicePageConfig,
  | "searchIntent"
  | "targetAudience"
  | "notFor"
  | "commonMistakes"
  | "examples"
  | "useCases"
  | "beforeAfter"
  | "evidence"
  | "relatedGuideSlugs"
> &
  Partial<
    Pick<
      ServicePageConfig,
      | "searchIntent"
      | "targetAudience"
      | "notFor"
      | "commonMistakes"
      | "examples"
      | "useCases"
      | "beforeAfter"
      | "evidence"
      | "relatedGuideSlugs"
    >
  >;

export const NEW_SERVICE_PAGES: Record<string, ServicePageInput> = {
  "email-marketing-setup-strategy": {
    title: "Email Marketing Setup and Strategy",
    slug: "email-marketing-setup-strategy",
    serviceParam: "Email Marketing Setup and Strategy",
    seoTitle: "Email Marketing Setup and Strategy | Web Growth",
    seoDescription:
      "Email marketing setup and strategy for small businesses that need smarter segmentation, nurture flows, and conversion-focused campaigns tied to revenue goals.",
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
    targetAudience: [
      "Service businesses with an active lead flow that needs better nurture.",
      "Founders who want repeatable email conversion, not one-off broadcasts.",
      "Teams ready to align email messaging with sales and offer positioning.",
    ],
    notFor: [
      "Businesses with no clear offer or no lead source yet.",
      "Teams expecting results without content inputs or approvals.",
      "Buyers looking for bulk email blasts with no strategy.",
    ],
    commonMistakes: [
      "Sending campaigns without segmentation or intent mapping.",
      "Running automations with unclear trigger logic.",
      "Treating open rate as the only performance metric.",
      "Ignoring lifecycle follow-up after first enquiry.",
    ],
    examples: [
      "A clinic replaced generic newsletters with segmented nurture flows by treatment interest.",
      "A service brand mapped enquiry forms to tailored onboarding email sequences.",
      "A founder team improved reply quality by rewriting automation copy around buyer objections.",
    ],
  },

  "search-engine-optimisation": {
    title: "Search Engine Optimisation (SEO)",
    slug: "search-engine-optimisation",
    serviceParam: "Search Engine Optimisation (SEO)",
    seoTitle: "SEO Service for Service Businesses | Web Growth",
    seoDescription:
      "SEO service for service businesses that need stronger local visibility, clearer service-page targeting, and more qualified search enquiries.",
    metaDescription:
      "SEO for service businesses that already have a real offer and need stronger local visibility, cleaner service pages, and better-qualified enquiries.",
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
      "SEO for service businesses that need better local visibility and better leads",
    heroDescription:
      "This is not generic SEO busywork. We fix the pages, structure, metadata, and local signals that stop service businesses from turning search traffic into enquiries.",
    heroImage: "/images/services/services-audit.webp",
    detailImage: "/images/services/services-speed-2.webp",
    highlights: [
      "Local SEO for real service-area searches",
      "Service-page SEO tied to enquiry intent",
      "Technical cleanup that supports crawlability and trust",
    ],
    deliverables: [
      "SEO audit focused on pages that should generate enquiries",
      "Title, meta, heading, and internal-link updates on key service pages",
      "Local SEO cleanup for location relevance and trust signals",
      "Priority action plan for rankings, conversions, and content gaps",
    ],
    process: [
      {
        title: "Audit",
        text: "We find the pages, keywords, and trust gaps blocking qualified search traffic.",
      },
      {
        title: "Fix",
        text: "We tighten page targeting, internal links, metadata, and local relevance signals.",
      },
      {
        title: "Measure",
        text: "We track whether search visibility is improving on pages that should produce leads, not vanity traffic.",
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
    ctaTitle: "Need SEO that supports real enquiries, not just traffic charts?",
    ctaDescription:
      "Get a focused SEO plan built around service pages, local visibility, and lead quality.",
    targetAudience: [
      "Service businesses with existing websites that underperform in search.",
      "Teams that need local visibility tied to real enquiries.",
      "Brands preparing to scale traffic and needing technical cleanup first.",
    ],
    notFor: [
      "Projects expecting overnight ranking jumps.",
      "Businesses without service clarity or conversion-ready pages.",
      "Teams unwilling to improve content quality beyond metadata edits.",
    ],
    commonMistakes: [
      "Publishing location-heavy pages without useful differentiation.",
      "Targeting high-volume terms with weak service-page intent.",
      "Ignoring internal linking between guides and money pages.",
      "Scaling content before fixing crawl and structure basics.",
    ],
    examples: [
      "A local service brand improved rankings by tightening page intent and internal links.",
      "A founder-led business removed duplicated targeting and improved enquiry quality.",
      "A team restructured service clusters to support local search and conversion together.",
    ],
  },

  "google-my-business-setup-optimisation": {
    title: "Google Business Profile Optimization Lagos",
    slug: "google-my-business-setup-optimisation",
    serviceParam: "Google Business Profile Optimization Lagos",
    seoTitle: "Google Business Profile Optimization Lagos | Web Growth",
    seoDescription:
      "Google Business Profile optimization in Lagos for service businesses that need better Maps visibility, stronger profile trust signals, and more qualified enquiries.",
    metaDescription:
      "Google Business Profile optimization in Lagos to improve Google Maps visibility, local rankings, profile quality, and enquiry volume for service businesses.",
    keywords: [
      "google my business setup",
      "google business profile optimization",
      "google business profile optimization lagos",
      "google business profile optimisation lagos",
      "google maps seo",
      "local seo google my business",
      "google business profile setup",
      "gmb optimization service",
      "google maps ranking",
      "local business listing optimization",
    ],
    heroTitle:
      "Google Business Profile optimization in Lagos for more local visibility and enquiries",
    heroDescription:
      "If you need Google Business Profile optimization in Lagos, we improve your profile structure, service targeting, trust signals, and conversion setup so more local searches can turn into enquiries.",
    heroImage: "/images/services/services-business.webp",
    detailImage: "/images/services/services-business-2.webp",
    highlights: [
      "Google Business Profile setup and optimization for Lagos service searches",
      "Local ranking signal improvement for Maps visibility",
      "Profile trust, service clarity, and conversion improvement",
    ],
    deliverables: [
      "Profile setup or full optimization audit for your current listing",
      "Category, services, and description refinement around local buyer intent",
      "Location, media, service area, and Q&A optimization",
      "Review strategy and ongoing profile guidance for stronger enquiry quality",
    ],
    process: [
      {
        title: "Profile audit",
        text: "We assess profile completeness, category targeting, and the visibility gaps hurting local search performance in Lagos.",
      },
      {
        title: "Optimization implementation",
        text: "We optimize business details, services, media, and conversion elements inside the profile so buyers understand what you offer faster.",
      },
      {
        title: "Growth guidance",
        text: "We provide practical recommendations for reviews, updates, and sustained local ranking improvements after the setup work is complete.",
      },
    ],
    faqs: [
      {
        question: "Is this useful if I already have a profile?",
        answer:
          "Yes. Most existing profiles are under-optimized and leave local ranking opportunities untapped, especially when categories, services, and Q&A are too weak or too generic.",
      },
      {
        question: "Will this help my Google Maps visibility in Lagos?",
        answer:
          "It improves the quality signals and relevance factors that support better Maps visibility over time, especially for the services and areas you want to be found for.",
      },
      {
        question: "Do you help with review strategy?",
        answer:
          "Yes. We include practical review and profile activity guidance to support trust and ranking performance.",
      },
      {
        question: "Who is this best for?",
        answer:
          "This is best for Lagos-based service businesses that rely on local search, Maps visibility, calls, or direction requests to generate enquiries.",
      },
    ],
    ctaTitle: "Want more qualified local enquiries from Google Maps?",
    ctaDescription:
      "Get your Google Business Profile properly configured and optimized for local search visibility, trust, and conversion quality.",
    targetAudience: [
      "Lagos service businesses relying on Maps calls and direction requests.",
      "Teams with existing profiles that still have weak local visibility.",
      "Businesses launching new service areas and needing cleaner local relevance.",
    ],
    notFor: [
      "Businesses without a verified profile or real local service footprint.",
      "Teams expecting profile optimisation to replace website quality.",
      "Businesses targeting unrelated locations with no service coverage.",
    ],
    commonMistakes: [
      "Using broad categories that do not match actual services.",
      "Leaving profile media, Q&A, and service details outdated.",
      "Ignoring review velocity and response quality.",
      "Sending Maps traffic to weak pages with no conversion path.",
    ],
    examples: [
      "A home-service business improved Maps lead quality by refining categories and services.",
      "A clinic increased call actions after profile trust signals were tightened.",
      "A local brand aligned GBP and website intent to improve local enquiry consistency.",
    ],
    relatedLinks: [
      {
        href: "/services/search-engine-optimisation",
        label: "SEO",
        title: "Need broader local SEO support too?",
        description:
          "Use the SEO service if you want your website and Google Business Profile working together for stronger local rankings.",
      },
      {
        href: "/services/website-audit",
        label: "Audit",
        title: "Need to fix the website before driving more local traffic?",
        description:
          "Start with an audit if your website is weak enough to waste the enquiries your profile should be sending.",
      },
      {
        href: "/services/landing-page-design",
        label: "Landing page",
        title: "Need a better page for ad or Maps traffic?",
        description:
          "Use the landing page service if local search visibility is rising but your current page is not turning visitors into leads.",
      },
      {
        href: "/contact?service=Google Business Profile Optimization Lagos",
        label: "Contact",
        title: "Ready to optimize your Google Business Profile in Lagos?",
        description:
          "Go to contact if you want to discuss the profile, service area, and the local enquiries you are trying to increase.",
      },
    ],
  },

  "booking-platform-setup-integration": {
    title: "Booking Platform Setup and Integration",
    slug: "booking-platform-setup-integration",
    serviceParam: "Booking Platform Setup and Integration",
    seoTitle: "Booking Platform Setup and Integration | Web Growth",
    seoDescription:
      "Booking platform setup and website integration for appointment-based businesses with clear flows, calendar sync, and conversion-focused booking journeys.",
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
    targetAudience: [
      "Appointment-based businesses with high drop-off before booking completion.",
      "Teams moving from manual booking to structured online flow.",
      "Businesses needing cleaner booking UX on mobile.",
    ],
    notFor: [
      "Businesses with no scheduling process or unclear availability rules.",
      "Teams that cannot provide booking tool access.",
      "Projects expecting custom software in a lightweight integration scope.",
    ],
    commonMistakes: [
      "Routing traffic to booking forms before explaining service value.",
      "Using too many required fields in first-step booking screens.",
      "Failing to test reminder and confirmation delivery across scenarios.",
      "Ignoring timezone and availability edge cases.",
    ],
    examples: [
      "A salon improved completed bookings by simplifying first-step form fields.",
      "A clinic reduced no-shows with confirmation and reminder automation.",
      "A consultancy connected website CTAs to a cleaner calendar handoff flow.",
    ],
  },

  "crm-system-setup-configuration": {
    title: "CRM System Setup and Configuration",
    slug: "crm-system-setup-configuration",
    serviceParam: "CRM System Setup and Configuration",
    seoTitle: "CRM System Setup and Configuration | Web Growth",
    seoDescription:
      "CRM system setup for businesses that need cleaner lead routing, better pipeline visibility, and a stronger handoff from marketing to sales.",
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
    targetAudience: [
      "Service teams managing leads across multiple channels with no central pipeline.",
      "Founders moving from spreadsheets to structured sales tracking.",
      "Businesses needing clearer ownership and follow-up accountability.",
    ],
    notFor: [
      "Teams unwilling to adopt process changes after setup.",
      "Businesses without a defined sales workflow.",
      "Projects expecting full enterprise CRM customisation in starter scope.",
    ],
    commonMistakes: [
      "Importing data without field standards or naming rules.",
      "Adding too many pipeline stages that teams never use.",
      "Skipping automation safety checks before go-live.",
      "Measuring activity volume instead of stage progression quality.",
    ],
    examples: [
      "A service firm moved from scattered lead notes to a usable stage-based pipeline.",
      "A founder team reduced missed follow-ups with assignment automations.",
      "A growing agency improved reporting clarity by standardising CRM properties.",
    ],
  },

  "marketing-automation-build-implementation": {
    title: "Marketing Automation Build and Implementation",
    slug: "marketing-automation-build-implementation",
    serviceParam: "Marketing Automation Build and Implementation",
    seoTitle: "Marketing Automation Build and Implementation | Web Growth",
    seoDescription:
      "Marketing automation build for businesses that need lead follow-up, lifecycle flows, and conversion logic that works across the website and CRM stack.",
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
    targetAudience: [
      "Teams with recurring enquiries and delayed manual follow-up.",
      "Businesses combining website forms, CRM, and email channels.",
      "Founders needing consistent nurture across longer sales cycles.",
    ],
    notFor: [
      "Businesses with no baseline conversion process to automate.",
      "Teams unwilling to maintain message quality after launch.",
      "Projects expecting automation to fix unclear offers.",
    ],
    commonMistakes: [
      "Automating before mapping lifecycle stages and intent.",
      "Using one generic sequence for all lead types.",
      "Failing to include exit logic for converted leads.",
      "Launching workflows without event-level measurement.",
    ],
    examples: [
      "A local brand automated missed-call follow-up into booked consultations.",
      "A service business split nurture logic by enquiry type and improved response quality.",
      "A founder team reduced lead decay with timed follow-up triggers.",
    ],
  },

  "analytics-tracking-setup": {
    title:
      "Analytics and Tracking Setup (Google Analytics, Meta Pixel, TikTok Pixel) with Ongoing Monitoring",
    slug: "analytics-tracking-setup",
    serviceParam:
      "Analytics and Tracking Setup (Google Analytics, Meta Pixel, TikTok Pixel)",
    seoTitle: "Analytics and Tracking Setup | Web Growth",
    seoDescription:
      "Analytics setup for GA4, Meta Pixel, and TikTok Pixel with event tracking, conversion tracking, and ongoing monitoring for cleaner performance data.",
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
    targetAudience: [
      "Businesses spending on ads without reliable conversion attribution.",
      "Teams launching new pages and needing event-level measurement from day one.",
      "Founders who need cleaner reporting across web and paid channels.",
    ],
    notFor: [
      "Projects with no meaningful conversion events defined.",
      "Teams expecting perfect tracking with no access to required accounts.",
      "Businesses unwilling to maintain tags after major site changes.",
    ],
    commonMistakes: [
      "Counting only page views while ignoring key conversion actions.",
      "Duplicating event firing across multiple tag paths.",
      "Failing to validate tracking after releases.",
      "Optimising campaigns on incomplete attribution data.",
    ],
    examples: [
      "A campaign team fixed duplicate event firing and restored reporting accuracy.",
      "A service brand implemented CTA and form event tracking for cleaner optimisation.",
      "An ecommerce funnel aligned pixel events with checkout milestones.",
    ],
  },

  "domain-registration-hosting-guidance": {
    title: "Website Hosting and Launch Setup Guidance",
    slug: "domain-registration-hosting-guidance",
    serviceParam: "Website Hosting and Launch Setup Guidance",
    seoTitle: "Hosting and Launch Setup Guidance | Web Growth",
    seoDescription:
      "Hosting and launch setup guidance for businesses that need the right domain, DNS, SSL, hosting, and migration decisions before building or moving a website.",
    metaDescription:
      "Launch setup guidance for small businesses that need the right domain, hosting, SSL, and DNS decisions before building or moving a website.",
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
      "Website hosting and launch setup guidance before you waste money on the wrong stack",
    heroDescription:
      "If you are about to buy hosting, move a website, or launch a new one, this service helps you choose the right setup before technical mistakes slow you down.",
    heroImage: "/images/services/services-hero.webp",
    detailImage: "/images/services/services-business.webp",
    highlights: [
      "Hosting choice based on your real site type",
      "Domain, DNS, and SSL guidance before launch",
      "Cleaner setup decisions before redesign or migration",
    ],
    deliverables: [
      "Recommended hosting stack based on site type and budget",
      "Domain, DNS, SSL, and email setup checklist",
      "Risk notes before migration or rebuild",
      "Clear next-step guidance for launch",
    ],
    process: [
      {
        title: "Assess",
        text: "We look at the kind of site you are running, the support you need, and where setup mistakes would hurt you most.",
      },
      {
        title: "Recommend",
        text: "We recommend domain, hosting, DNS, and SSL decisions that match your actual budget and build path.",
      },
      {
        title: "Prepare",
        text: "You leave with a clean setup checklist and the next technical steps before launch work starts.",
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
    ctaTitle: "Need a clean launch setup before the website build starts?",
    ctaDescription:
      "Get practical guidance on hosting, DNS, and launch setup so you do not build on a weak foundation.",
    targetAudience: [
      "Founders preparing a first serious website launch.",
      "Businesses planning migrations and wanting lower technical risk.",
      "Teams unsure which hosting stack matches their growth stage.",
    ],
    notFor: [
      "Projects needing fully managed infrastructure operations only.",
      "Teams unwilling to follow launch checklist recommendations.",
      "Businesses expecting one-click fixes for legacy architecture debt.",
    ],
    commonMistakes: [
      "Choosing hosting from discounts without workload fit.",
      "Skipping DNS and SSL planning until launch week.",
      "Migrating without rollback and backup strategy.",
      "Ignoring email deliverability dependencies during DNS changes.",
    ],
    examples: [
      "A local business avoided downtime by planning DNS cutover with rollback steps.",
      "A founder team moved from shared hosting to a setup matched to real usage.",
      "A service brand reduced launch delays by pre-validating SSL and mailbox records.",
    ],
  },

  "lead-magnet-strategy-build": {
    title: "Lead Magnet Strategy and Build (eBooks, Quizzes, Checklists, Offers)",
    slug: "lead-magnet-strategy-build",
    serviceParam: "Lead Magnet Strategy and Build",
    seoTitle: "Lead Magnet Strategy and Build | Web Growth",
    seoDescription:
      "Lead magnet strategy and build service for eBooks, quizzes, checklists, and offers with landing pages and lead capture flow setup.",
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
    targetAudience: [
      "Service businesses needing higher-quality lead capture before sales calls.",
      "Brands running traffic to offers with weak opt-in conversion.",
      "Teams building nurture funnels around specific buyer pain points.",
    ],
    notFor: [
      "Businesses without a clear follow-up or fulfilment process.",
      "Teams seeking vanity downloads instead of qualified leads.",
      "Projects with no channel to promote the lead asset.",
    ],
    commonMistakes: [
      "Creating lead magnets with broad topics and weak intent match.",
      "Sending opt-ins to generic thank-you pages with no next step.",
      "Ignoring qualification prompts in capture forms.",
      "Treating checklist downloads as final conversion goals.",
    ],
    examples: [
      "A clinic used a treatment readiness checklist to improve lead quality.",
      "A service brand replaced a generic PDF with a segmented quiz funnel.",
      "A founder team tied opt-in assets to nurture sequences and consultation CTAs.",
    ],
  },
};

const RELATED_GUIDES_BY_SERVICE: Record<string, string[]> = {
  "email-marketing-setup-strategy": [
    "email-marketing-for-small-business",
    "email-automation-architecture",
    "website-tracking-setup-for-small-businesses",
  ],
  "search-engine-optimisation": [
    "small-business-website-seo-checklist",
    "local-seo-for-small-business-google-maps-ranking-guide",
    "03-seo-migration-without-losing-traffic",
  ],
  "google-my-business-setup-optimisation": [
    "google-business-profile-optimization-checklist",
    "local-seo-for-small-business-google-maps-ranking-guide",
    "small-business-website-seo-checklist",
  ],
  "booking-platform-setup-integration": [
    "high-converting-service-page",
    "website-tracking-setup-for-small-businesses",
    "why-your-website-isnt-getting-leads",
  ],
  "crm-system-setup-configuration": [
    "website-tracking-setup-for-small-businesses",
    "email-automation-architecture",
    "why-your-website-isnt-getting-leads",
  ],
  "marketing-automation-build-implementation": [
    "email-automation-architecture",
    "email-marketing-for-small-business",
    "website-tracking-setup-for-small-businesses",
  ],
  "analytics-tracking-setup": [
    "website-tracking-setup-for-small-businesses",
    "conversion-audit-checklist-service-homepage",
    "why-your-website-isnt-getting-leads",
  ],
  "domain-registration-hosting-guidance": [
    "best-web-hosting-for-small-business-websites",
    "namecheap-domain-and-hosting-guide",
    "stop-using-cheap-hosting",
  ],
  "lead-magnet-strategy-build": [
    "high-converting-landing-pages-guide",
    "email-marketing-for-small-business",
    "why-your-website-isnt-getting-leads",
  ],
};

function normalizeService(service: ServicePageInput): ServicePageConfig {
  const examples = service.examples ?? [];
  const mistakes = service.commonMistakes ?? [];
  const useCases = service.useCases ?? examples.map((item) => `Example scenario: ${item}`);
  const beforeAfter =
    service.beforeAfter ??
    service.highlights.slice(0, 2).map((highlight, index) => ({
      before: mistakes[index] ?? `The ${service.title.toLowerCase()} workflow lacks a clear operating standard.`,
      after: highlight,
    }));
  const evidence =
    service.evidence ??
    [
      {
        src: service.heroImage,
        alt: `${service.title} service overview visual`,
        note: "Representative Web Growth service visual; not a client-results claim.",
      },
      {
        src: service.detailImage,
        alt: `${service.title} implementation detail visual`,
        note: "Representative implementation visual; outcomes depend on project scope.",
      },
    ];

  return {
    ...service,
    searchIntent:
      service.searchIntent ||
      `Transactional - evaluate and request ${service.title.toLowerCase()} support`,
    targetAudience: service.targetAudience ?? [],
    notFor: service.notFor ?? service.exclusions ?? [],
    commonMistakes: mistakes,
    examples,
    useCases,
    beforeAfter,
    evidence,
    relatedGuideSlugs:
      service.relatedGuideSlugs ?? RELATED_GUIDES_BY_SERVICE[service.slug] ?? [],
  };
}

export const ALL_SERVICE_PAGES: Record<string, ServicePageConfig> = Object.fromEntries(
  Object.entries({ ...CORE_SERVICE_PAGES, ...NEW_SERVICE_PAGES }).map(([slug, service]) => [
    slug,
    normalizeService(service),
  ])
);

warnOnServiceQuality(Object.values(ALL_SERVICE_PAGES));

export const NEW_SERVICES_LIST: ServiceListItem[] = Object.values(
  ALL_SERVICE_PAGES
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
  const title = service.seoTitle ?? service.title;
  const description = service.seoDescription ?? service.metaDescription;
  const canonical = absoluteUrl(canonicalUrl);
  const imageUrl = absoluteUrl("/images/hero/Hero-Image-1.webp");

  return {
    title,
    description,
    keywords: [
      "web design",
      "web design services",
      ...service.keywords,
    ],
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Web Growth",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: { index: true, follow: true },
  };
}
