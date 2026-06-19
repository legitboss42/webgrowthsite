import type { ServicePageInput } from "@/lib/newServiceConfigs";

export const CORE_SERVICE_PAGES: Record<string, ServicePageInput> = {
  "business-website-design": {
    title: "Business Website Design",
    slug: "business-website-design",
    serviceParam: "Business Website Design",
    metaDescription:
      "Business website design service for growth-focused companies that need clearer positioning, stronger trust, and higher-quality enquiries.",
    keywords: [
      "business website design",
      "business website design agency",
      "small business website design",
      "professional website design",
      "custom business website development",
      "conversion-focused business website",
    ],
    heroTitle:
      "Business website design engineered for trust, clarity, and qualified enquiries",
    heroDescription:
      "We build custom business websites for service brands that need stronger first impressions, cleaner conversion paths, and technical foundations that can scale.",
    heroImage: "/images/services/services-business.webp",
    detailImage: "/images/services/services-business-2.webp",
    highlights: [
      "Clear offer positioning for faster buyer understanding",
      "Mobile-first UX and trust architecture",
      "Conversion-ready layout and information hierarchy",
    ],
    deliverables: [
      "Homepage and core service-page structure mapped to buyer intent",
      "Messaging hierarchy and CTA system designed for lead quality",
      "Trust blocks, proof sections, and contact flow optimization",
      "Technical SEO-ready structure for scalable growth",
    ],
    process: [
      {
        title: "Strategic discovery",
        text: "We map your offer, audience, and buying journey so the website solves business problems, not just design preferences.",
      },
      {
        title: "Build and optimisation",
        text: "We implement structure, copy hierarchy, and interactions around clarity, trust, and conversion priorities.",
      },
      {
        title: "Launch readiness",
        text: "We test usability, performance basics, and lead paths before launch so the site is commercially usable on day one.",
      },
    ],
    faqs: [
      {
        question: "Is this service only for new businesses?",
        answer:
          "No. It works for both new businesses and established brands that have outgrown a weak or outdated website.",
      },
      {
        question: "Can this include copy refinement?",
        answer:
          "Yes. We refine message structure so visitors understand the offer quickly and move toward action with less friction.",
      },
      {
        question: "Will the site be ready for SEO work later?",
        answer:
          "Yes. The structure is built to support technical SEO and content expansion without rebuild-level rework.",
      },
    ],
    ctaTitle: "Need a business website that actually supports growth?",
    ctaDescription:
      "Request a quote and get a direct recommendation on scope, timeline, and the highest-impact build path.",
    targetAudience: [
      "Service businesses with a real offer and unclear website positioning",
      "Teams that need stronger trust and enquiry quality from existing traffic",
      "Founders replacing generic templates with a premium build foundation",
      "Brands preparing for SEO or paid traffic scale",
    ],
    notFor: [
      "Businesses shopping only on lowest upfront cost",
      "Projects with no clear offer or no decision-maker available",
      "Teams expecting high-quality output without feedback or approvals",
    ],
    commonMistakes: [
      "Treating homepage visuals as more important than offer clarity.",
      "Burying contact actions below generic filler content.",
      "Using the same copy structure as competitors with no differentiation.",
      "Ignoring mobile trust cues where first impressions are formed.",
    ],
    examples: [
      "A services business tightened its homepage message and reduced low-intent enquiries.",
      "A founder-led brand replaced cluttered navigation with cleaner paths to contact.",
      "A team restructured service pages to support both SEO and conversion intent.",
    ],
    beforeAfter: [
      {
        before: "Visitors do not understand the offer quickly and bounce.",
        after: "Messaging and page hierarchy make value and next steps obvious in seconds.",
      },
      {
        before: "The website looks acceptable but underperforms commercially.",
        after: "The website supports trust and lead quality as part of daily sales operations.",
      },
    ],
    relatedGuideSlugs: [
      "how-to-build-a-small-business-website-that-converts",
      "homepage-structure-that-converts-visitors-into-customers",
      "small-business-website-redesign-checklist",
    ],
    exclusions: [
      "Bulk template deployments for unrelated niches",
      "Copy-paste multi-location doorway page packs",
    ],
  },
  "landing-page-design": {
    title: "Landing Page Design",
    slug: "landing-page-design",
    serviceParam: "Landing Page Design",
    metaDescription:
      "Landing page design service for campaigns, outreach, and paid traffic that need stronger message match and higher conversion quality.",
    keywords: [
      "landing page design",
      "high converting landing page design",
      "lead generation landing page",
      "campaign landing page service",
      "landing page conversion optimization",
    ],
    heroTitle:
      "Landing pages built to convert cold traffic into qualified enquiries",
    heroDescription:
      "We design and build focused landing pages for ads, outreach, and promotions with clear message match, buyer trust, and friction-free CTA flow.",
    heroImage: "/images/services/services-landing.webp",
    detailImage: "/images/services/services-landing-2.webp",
    highlights: [
      "Message match between traffic source and landing page",
      "Single-goal page architecture with clear CTA hierarchy",
      "Mobile-first layout tuned for fast scanning and action",
    ],
    deliverables: [
      "Offer-first hero section and conversion flow wireframe",
      "Section-by-section copy and trust architecture",
      "Lead capture form strategy and CTA placement logic",
      "Launch-ready responsive page build with performance baseline",
    ],
    process: [
      {
        title: "Offer and traffic alignment",
        text: "We align landing page messaging with the source intent so users get instant clarity after clicking.",
      },
      {
        title: "Conversion architecture",
        text: "We build a single-goal structure with proof sequencing, objection handling, and CTA intent control.",
      },
      {
        title: "Launch QA",
        text: "We check mobile readability, form flow, and CTA behavior before launch so campaigns are not wasted.",
      },
    ],
    faqs: [
      {
        question: "Can you redesign an existing campaign page?",
        answer:
          "Yes. We can audit and rebuild an existing page to improve conversion flow and reduce traffic waste.",
      },
      {
        question: "Is this useful for social traffic?",
        answer:
          "Yes. The service is especially effective for cold traffic from social, DMs, and direct outreach.",
      },
      {
        question: "Do you help with form strategy?",
        answer:
          "Yes. We structure form fields and placement around conversion quality and friction reduction.",
      },
    ],
    ctaTitle: "Need a landing page that stops traffic waste?",
    ctaDescription:
      "Get a focused page built for one job: turning qualified clicks into clear actions.",
    targetAudience: [
      "Businesses running paid traffic or direct outreach campaigns",
      "Teams with traffic but weak lead conversion rates",
      "Founders launching a focused offer with one clear objective",
    ],
    notFor: [
      "Businesses wanting a full multi-page website in this scope",
      "Teams that cannot provide offer clarity and approval feedback",
    ],
    commonMistakes: [
      "Using homepage structure for campaign traffic with no message match.",
      "Adding too many CTAs and confusing the next step.",
      "Forcing long forms before trust is established.",
      "Ignoring mobile spacing and readability under fast-scrolling behavior.",
    ],
    examples: [
      "A clinic campaign page moved from mixed messaging to one-offer conversion flow.",
      "A local service brand replaced a generic page with a direct social-traffic landing page.",
      "An ecommerce brand improved launch-page add-to-cart intent by clarifying value sequence.",
    ],
    beforeAfter: [
      {
        before: "Traffic lands but intent drops due to weak message match.",
        after: "The offer matches click intent and drives higher-quality enquiry behavior.",
      },
      {
        before: "The page looks polished but fails to guide action.",
        after: "CTA path, trust sequencing, and form flow create clearer conversion momentum.",
      },
    ],
    relatedGuideSlugs: [
      "high-converting-landing-pages-guide",
      "why-your-website-isnt-getting-leads",
      "high-converting-service-page",
    ],
  },
  "website-redesign": {
    title: "Website Redesign",
    slug: "website-redesign",
    serviceParam: "Website Redesign",
    metaDescription:
      "Website redesign service for businesses with outdated, low-trust, or underperforming websites that need stronger conversion and scalability.",
    keywords: [
      "website redesign",
      "website redesign service",
      "small business website redesign",
      "conversion-focused website redesign",
      "premium website revamp",
    ],
    heroTitle:
      "Website redesign for businesses that have outgrown weak first impressions",
    heroDescription:
      "We redesign underperforming websites into faster, clearer, and more trustworthy digital assets that support enquiries, sales, and growth decisions.",
    heroImage: "/images/services/services-redesign.webp",
    detailImage: "/images/services/services-cta.webp",
    highlights: [
      "Redesign strategy tied to business outcomes, not style trends",
      "Improved trust architecture and conversion sequencing",
      "Technical cleanup that supports future SEO and expansion",
    ],
    deliverables: [
      "Current-site diagnosis and redesign strategy blueprint",
      "Rebuilt page structure and conversion-oriented hierarchy",
      "Updated visual direction aligned to premium positioning",
      "Launch plan including performance and trust checks",
    ],
    process: [
      {
        title: "Diagnostic review",
        text: "We identify exactly where the current website is hurting trust, clarity, and conversion.",
      },
      {
        title: "Strategic redesign",
        text: "We rebuild structure and messaging around buyer decision flow, not generic design blocks.",
      },
      {
        title: "Controlled launch",
        text: "We test the redesign for usability, responsiveness, and lead path integrity before go-live.",
      },
    ],
    faqs: [
      {
        question: "Do I need to rebuild everything?",
        answer:
          "Not always. We preserve what is working and redesign only what is blocking growth.",
      },
      {
        question: "Will redesign hurt SEO?",
        answer:
          "No. We plan URL, structure, and metadata handling to protect and improve SEO foundations.",
      },
      {
        question: "Can you redesign without changing our brand identity?",
        answer:
          "Yes. We can modernize experience and conversion flow while preserving brand consistency.",
      },
    ],
    ctaTitle: "Ready to rebuild a website that is costing trust and leads?",
    ctaDescription:
      "Request a redesign assessment and get the highest-impact path forward.",
    targetAudience: [
      "Businesses with outdated sites that no longer reflect service quality",
      "Teams seeing traffic but weak enquiry quality or conversion rates",
      "Brands preparing to scale marketing and needing a stronger foundation",
    ],
    notFor: [
      "Businesses wanting cosmetic tweaks without strategic changes",
      "Teams unwilling to revisit weak messaging or page structure",
    ],
    commonMistakes: [
      "Changing colors and visuals without fixing conversion flow.",
      "Migrating redesigns without preserving critical SEO signals.",
      "Keeping bloated legacy sections because they are familiar.",
      "Skipping stakeholder alignment before design implementation.",
    ],
    examples: [
      "A premium service brand replaced cluttered pages with clear buyer journeys.",
      "A business improved lead quality after redesigning offer hierarchy and trust blocks.",
      "A team removed legacy design debt and unlocked easier SEO/content expansion.",
    ],
    beforeAfter: [
      {
        before: "Outdated design undermines trust and perceived quality.",
        after: "Premium visual and structural clarity aligns website perception with business reality.",
      },
      {
        before: "Visitors browse but do not progress to enquiry actions.",
        after: "Each section supports a clear progression toward conversion.",
      },
    ],
    relatedGuideSlugs: [
      "small-business-website-redesign-checklist",
      "05-premium-design-without-slow-pages",
      "04-writing-service-pages-that-convert",
    ],
  },
  "ecommerce-website-design": {
    title: "Ecommerce Website Design",
    slug: "ecommerce-website-design",
    serviceParam: "Ecommerce Website Design",
    metaDescription:
      "Ecommerce website design and redesign for brands that need better product presentation, checkout trust, and stronger conversion paths.",
    keywords: [
      "ecommerce website design",
      "ecommerce redesign agency",
      "online store redesign",
      "shopify redesign service",
      "ecommerce conversion optimization",
    ],
    heroTitle:
      "Ecommerce website design focused on faster buying decisions and cleaner checkout flow",
    heroDescription:
      "We design ecommerce storefronts for brands that need stronger product clarity, better mobile shopping UX, and conversion architecture built for revenue.",
    heroImage: "/images/services/services-ecommerce-2.webp",
    detailImage: "/images/services/services-speed-2.webp",
    highlights: [
      "Product discovery and merchandising hierarchy improvements",
      "Trust-focused checkout path and friction reduction",
      "Mobile-first storefront UX tuned for conversion behavior",
    ],
    deliverables: [
      "Storefront architecture and conversion journey mapping",
      "Product page, collection page, and CTA structure redesign",
      "Trust and reassurance modules across key buying steps",
      "Performance-aware build quality for commerce pages",
    ],
    process: [
      {
        title: "Commerce flow audit",
        text: "We identify where users lose confidence or drop off before checkout.",
      },
      {
        title: "Storefront redesign",
        text: "We rebuild the shopping journey around product clarity, trust, and intent progression.",
      },
      {
        title: "Pre-launch validation",
        text: "We test core paths from landing to checkout and refine high-friction points.",
      },
    ],
    faqs: [
      {
        question: "Do you work with existing stores?",
        answer:
          "Yes. We redesign existing ecommerce stores and can preserve existing platforms where practical.",
      },
      {
        question: "Can this improve add-to-cart behavior?",
        answer:
          "Yes. Improving product hierarchy, reassurance, and CTA clarity usually lifts add-to-cart intent quality.",
      },
      {
        question: "Is this only for large stores?",
        answer:
          "No. It fits both growing stores and established brands that need a stronger conversion foundation.",
      },
    ],
    ctaTitle: "Need a storefront that converts existing traffic better?",
    ctaDescription:
      "Get a conversion-focused ecommerce build plan tailored to your current bottlenecks.",
    targetAudience: [
      "Ecommerce brands with strong products but weak storefront conversion",
      "Store owners preparing to scale paid traffic or launch new collections",
      "Teams that need premium UX without sacrificing performance",
    ],
    notFor: [
      "Stores seeking visual refresh only with no conversion focus",
      "Teams unwilling to improve weak product or offer clarity",
    ],
    commonMistakes: [
      "Prioritizing animations over shopping clarity and speed.",
      "Hiding critical product trust details below the fold.",
      "Breaking mobile checkout flow with overcomplicated UI decisions.",
      "Ignoring category architecture and overloading navigation.",
    ],
    examples: [
      "A product brand improved buyer confidence by restructuring PDP trust sections.",
      "A store with strong traffic improved conversion by cleaning category logic.",
      "A team reduced drop-off by simplifying mobile checkout path entry points.",
    ],
    beforeAfter: [
      {
        before: "Shoppers browse but hesitate due to weak trust cues.",
        after: "Reassurance and product clarity support faster purchase decisions.",
      },
      {
        before: "Collections and product hierarchy feel cluttered.",
        after: "Store navigation and page structure guide users with less friction.",
      },
    ],
    relatedGuideSlugs: [
      "website-platform-comparison-small-business",
      "high-converting-landing-pages-guide",
      "how-to-make-your-website-load-fast",
    ],
  },
  "website-maintenance": {
    title: "Website Maintenance and Support",
    slug: "website-maintenance",
    serviceParam: "Website Maintenance & Support",
    metaDescription:
      "Website maintenance and support service covering updates, reliability checks, and performance hygiene for business-critical websites.",
    keywords: [
      "website maintenance service",
      "website support service",
      "website updates and maintenance",
      "wordpress maintenance support",
      "website reliability support",
    ],
    heroTitle:
      "Website maintenance support that protects performance, trust, and uptime",
    heroDescription:
      "We handle ongoing website maintenance for businesses that need reliable updates, cleaner technical hygiene, and fewer avoidable website failures.",
    heroImage: "/images/services/services-maintenance.webp",
    detailImage: "/images/services/services-maintenance-2.webp",
    highlights: [
      "Priority maintenance for business-critical pages and flows",
      "Proactive checks to reduce avoidable outages or breakage",
      "Performance and UX hygiene to protect conversion quality",
    ],
    deliverables: [
      "Routine updates and compatibility checks",
      "Technical issue triage and risk mitigation",
      "Core page integrity checks for lead or sales paths",
      "Maintenance reporting and improvement recommendations",
    ],
    process: [
      {
        title: "Baseline review",
        text: "We assess current stability, risk points, and maintenance debt.",
      },
      {
        title: "Maintenance cycle",
        text: "We apply scheduled updates and monitor business-critical behavior.",
      },
      {
        title: "Continuous improvement",
        text: "We log recurring issues and recommend improvements that reduce future support load.",
      },
    ],
    faqs: [
      {
        question: "Do you support websites you did not build?",
        answer:
          "Yes. We can maintain existing websites after a technical baseline review.",
      },
      {
        question: "Will this include performance checks?",
        answer:
          "Yes. Performance hygiene is part of maintenance because speed issues directly affect trust and conversion.",
      },
      {
        question: "Can support include quick fixes after updates?",
        answer:
          "Yes. We include post-update verification and priority fix handling where needed.",
      },
    ],
    ctaTitle: "Need reliable maintenance for a business-critical website?",
    ctaDescription:
      "Get a support plan that keeps your website stable, current, and commercially usable.",
    targetAudience: [
      "Businesses relying on websites for daily lead or sales operations",
      "Teams without internal technical ownership for routine maintenance",
      "Founders tired of recurring breakage after ad hoc updates",
    ],
    notFor: [
      "Businesses expecting emergency enterprise-level 24/7 SLA without scope",
      "Teams unwilling to maintain minimum technical hygiene standards",
    ],
    commonMistakes: [
      "Skipping updates for months and applying everything at once under pressure.",
      "Treating backup checks as optional until failure happens.",
      "Ignoring small frontend regressions that hurt conversion over time.",
      "Using multiple unvetted plugins/scripts without maintenance governance.",
    ],
    examples: [
      "A services website stabilized enquiry flow after routine maintenance cycles.",
      "A brand reduced recurring layout breakage from unmanaged updates.",
      "A team improved site reliability by introducing prioritized issue triage.",
    ],
    beforeAfter: [
      {
        before: "Website issues appear unpredictably and disrupt enquiries.",
        after: "Maintenance routines reduce incidents and protect core conversion paths.",
      },
      {
        before: "Updates are reactive and stressful.",
        after: "Support cadence keeps the site stable and easier to operate.",
      },
    ],
    relatedGuideSlugs: [
      "website-launch-checklist-for-small-businesses",
      "website-launch-checklist-for-small-businesses",
      "how-to-audit-slow-wordpress-site",
    ],
  },
  "performance-optimisation": {
    title: "Performance Optimisation",
    slug: "performance-optimisation",
    serviceParam: "Speed & Performance Optimisation",
    metaDescription:
      "Website performance optimisation service for businesses that need better Core Web Vitals, faster mobile experience, and stronger conversion support.",
    keywords: [
      "website speed optimization",
      "performance optimization service",
      "core web vitals optimization",
      "mobile website speed improvement",
      "technical performance audit",
    ],
    heroTitle:
      "Performance optimisation for faster websites and lower conversion friction",
    heroDescription:
      "We improve website speed and interaction quality where it matters most: mobile experience, Core Web Vitals, trust, and revenue-critical page flow.",
    heroImage: "/images/services/services-speed.webp",
    detailImage: "/images/services/services-speed-2.webp",
    highlights: [
      "Core Web Vitals-focused diagnosis and fix prioritization",
      "Mobile-first performance remediation for high-impact pages",
      "Speed improvements tied to conversion and trust outcomes",
    ],
    deliverables: [
      "Performance audit and bottleneck breakdown",
      "Prioritized fix implementation for page speed and UX smoothness",
      "Asset, script, and render-path optimization",
      "Post-fix validation notes and monitoring guidance",
    ],
    process: [
      {
        title: "Measure and diagnose",
        text: "We establish baseline metrics and identify the biggest performance bottlenecks.",
      },
      {
        title: "Implement key fixes",
        text: "We execute high-impact optimizations across assets, scripts, and rendering flow.",
      },
      {
        title: "Validate and monitor",
        text: "We confirm performance gains and define the maintenance actions that preserve them.",
      },
    ],
    faqs: [
      {
        question: "Will this improve SEO as well?",
        answer:
          "Yes. Better speed and technical quality support SEO performance and user trust at the same time.",
      },
      {
        question: "Can you optimize only selected pages first?",
        answer:
          "Yes. We can prioritize high-value pages first for faster business impact.",
      },
      {
        question: "Do you provide before/after diagnostics?",
        answer:
          "Yes. We provide measurable baseline and post-implementation context.",
      },
    ],
    ctaTitle: "Need speed improvements that support real business outcomes?",
    ctaDescription:
      "Request a performance pass focused on trust, conversion, and Core Web Vitals impact.",
    targetAudience: [
      "Businesses seeing slow mobile load times and high bounce rates",
      "Teams preparing to scale SEO or paid traffic on weak foundations",
      "Brands needing better UX smoothness on conversion-critical pages",
    ],
    notFor: [
      "Projects expecting instant top rankings from speed fixes alone",
      "Teams unwilling to remove heavy low-value scripts or assets",
    ],
    commonMistakes: [
      "Optimizing only homepage speed while key conversion pages stay heavy.",
      "Adding multiple third-party scripts without performance governance.",
      "Compressing images but ignoring rendering and script execution bottlenecks.",
      "Chasing synthetic scores without improving user-perceived speed.",
    ],
    examples: [
      "A service business cut mobile friction by optimizing critical render path.",
      "An ecommerce store improved browse-to-action flow with asset and script cleanup.",
      "A marketing site reduced bounce after fixing heavy hero and interaction lag.",
    ],
    beforeAfter: [
      {
        before: "Slow page response weakens trust before visitors read the offer.",
        after: "Faster perceived load supports better engagement and conversion intent.",
      },
      {
        before: "Performance fixes are random and hard to sustain.",
        after: "Prioritized optimization plan creates repeatable performance management.",
      },
    ],
    relatedGuideSlugs: [
      "how-to-make-your-website-load-fast",
      "how-to-audit-slow-wordpress-site",
      "website-launch-checklist-for-small-businesses",
    ],
  },
  "website-audit": {
    title: "Website Audit and Consultation",
    slug: "website-audit",
    serviceParam: "Website Audit & Consultation",
    metaDescription:
      "Website audit and consultation service to identify what is hurting SEO, trust, speed, and conversion, with a practical action roadmap.",
    keywords: [
      "website audit service",
      "website consultation service",
      "seo and conversion audit",
      "website performance audit",
      "website diagnosis service",
    ],
    heroTitle:
      "Website audit and consultation for teams that need clarity before rebuilding",
    heroDescription:
      "We diagnose what is actually blocking your website performance across messaging, UX, SEO, speed, and conversion paths, then map the right implementation sequence.",
    heroImage: "/images/services/services-audit.webp",
    detailImage: "/images/services/services-audit-2.webp",
    highlights: [
      "Business-first diagnosis across trust, conversion, and technical factors",
      "Action roadmap with priority order and expected impact",
      "Clear recommendations you can implement or hand over",
    ],
    deliverables: [
      "Audit report covering clarity, trust, SEO, and conversion bottlenecks",
      "Prioritized fix roadmap with quick wins and strategic actions",
      "Service-fit recommendation for redesign, SEO, or performance next steps",
      "Consultation notes with implementation guidance",
    ],
    process: [
      {
        title: "Audit intake",
        text: "We collect business goals, current pain points, and website context before assessment.",
      },
      {
        title: "Cross-functional diagnosis",
        text: "We evaluate structural, technical, and messaging factors affecting results.",
      },
      {
        title: "Action planning",
        text: "We deliver a practical roadmap so you can execute in the right order.",
      },
    ],
    faqs: [
      {
        question: "Can this work if I already have a developer?",
        answer:
          "Yes. We can deliver an actionable roadmap your existing developer or team can implement.",
      },
      {
        question: "Do you also implement audit recommendations?",
        answer:
          "Yes. We can move from audit to implementation across redesign, speed, or SEO support.",
      },
      {
        question: "Is this useful before paid ads?",
        answer:
          "Yes. Auditing first helps reduce waste by fixing core conversion and trust gaps before scaling traffic.",
      },
    ],
    ctaTitle: "Need a clear diagnosis before spending more budget?",
    ctaDescription:
      "Request an audit and get direct clarity on what to fix first and why it matters.",
    targetAudience: [
      "Businesses with underperforming websites and unclear root causes",
      "Founders planning redesign or SEO investments and needing clarity first",
      "Teams seeing weak lead quality despite steady traffic",
    ],
    notFor: [
      "Projects that only want generic opinions with no implementation intent",
      "Teams unwilling to address critical structural issues after diagnosis",
    ],
    commonMistakes: [
      "Starting redesign work before confirming real bottlenecks.",
      "Treating analytics snapshots as complete diagnosis.",
      "Fixing minor visual issues while core conversion path remains broken.",
      "Ignoring trust and clarity while focusing only on keyword targeting.",
    ],
    examples: [
      "A business discovered messaging clarity, not traffic, was the primary blocker.",
      "A team avoided a full rebuild by fixing conversion path and trust structure first.",
      "An audit uncovered technical SEO issues that were suppressing service-page visibility.",
    ],
    beforeAfter: [
      {
        before: "Website decisions are reactive and based on guesswork.",
        after: "A prioritized roadmap drives focused implementation and measurable outcomes.",
      },
      {
        before: "Budget is spread across random fixes with weak results.",
        after: "Implementation sequence is aligned to impact and commercial priority.",
      },
    ],
    relatedGuideSlugs: [
      "conversion-audit-checklist-service-homepage",
      "why-your-website-isnt-getting-leads",
      "how-to-audit-slow-wordpress-site",
    ],
  },
};
