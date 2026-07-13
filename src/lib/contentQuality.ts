type PostQualityInput = {
  slug: string;
  title: string;
  author?: string;
  reviewedBy?: string;
  updatedAt?: string;
  lastReviewedAt?: string;
  keyTakeaways: string[];
  relatedGuideSlugs: string[];
  primaryKeyword: string;
  searchIntent: string;
  coverAlt: string;
  cover?: string;
  readTime: string;
  declaredReadTime?: string;
  evidenceNote?: string;
  methodologyNote?: string;
  content: string;
};

type ServiceQualityInput = {
  slug: string;
  title: string;
  searchIntent: string;
  targetAudience: string[];
  notFor: string[];
  deliverables: string[];
  process: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
  commonMistakes: string[];
  examples: string[];
  useCases: string[];
  evidence: { src: string; alt: string; note?: string }[];
  relatedGuideSlugs: string[];
};

let didWarnPostQuality = false;
let didWarnServiceQuality = false;

function countMarkdownSections(content: string) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## ")).length;
}

function plainWordCount(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`|~-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function expectedReadMinutes(content: string) {
  return Math.max(1, Math.ceil(plainWordCount(content) / 220));
}

const GENERIC_TRUST_PATTERNS = [
  /updated using observed implementation patterns/i,
  /recurring project outcomes/i,
  /execution quality improves when/i,
  /sustained results depend/i,
  /priority one is/i,
];

function normalizedListValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function toIsoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function warnList(prefix: string, issues: string[]) {
  if (!issues.length) return;
  console.warn(`${prefix}\n${issues.map((issue) => ` - ${issue}`).join("\n")}`);
}

export function warnOnPostQuality(posts: PostQualityInput[]) {
  if (didWarnPostQuality) return;
  didWarnPostQuality = true;

  const issues: string[] = [];
  const repeatedTakeaways = new Map<string, string[]>();

  for (const post of posts) {
    const sectionCount = countMarkdownSections(post.content);
    const wordCount = plainWordCount(post.content);
    const hasUpdatedDate = Boolean(toIsoDate(post.updatedAt || post.lastReviewedAt));
    const declaredMinutes = Number.parseInt(post.readTime, 10);
    const sourceMinutes = Number.parseInt(post.declaredReadTime || "", 10);
    const calculatedMinutes = expectedReadMinutes(post.content);

    if (!post.author) issues.push(`[blog/${post.slug}] missing author`);
    if (!post.reviewedBy) issues.push(`[blog/${post.slug}] missing named reviewer`);
    if (!hasUpdatedDate) issues.push(`[blog/${post.slug}] missing updatedAt or lastReviewedAt`);
    if (post.keyTakeaways.length < 3)
      issues.push(`[blog/${post.slug}] keyTakeaways should have at least 3 items`);
    if (post.relatedGuideSlugs.length < 2)
      issues.push(`[blog/${post.slug}] relatedGuideSlugs should have at least 2 items`);
    if (!post.primaryKeyword) issues.push(`[blog/${post.slug}] missing primaryKeyword`);
    if (!post.searchIntent) issues.push(`[blog/${post.slug}] missing searchIntent`);
    if (!post.coverAlt) issues.push(`[blog/${post.slug}] missing coverAlt`);
    if (!post.cover || post.cover.toLowerCase().endsWith(".svg"))
      issues.push(`[blog/${post.slug}] requires a non-SVG cover image`);
    if (sectionCount < 4)
      issues.push(`[blog/${post.slug}] appears thin: only ${sectionCount} H2 sections`);
    if (wordCount < 700)
      issues.push(
        `[blog/${post.slug}] requires editorial review: only ${wordCount} body words`
      );
    if (
      Number.isFinite(sourceMinutes) &&
      Math.abs(sourceMinutes - calculatedMinutes) > 1
    ) {
      issues.push(
        `[blog/${post.slug}] frontmatter readTime says ${sourceMinutes} minutes; body calculates to ${calculatedMinutes}`
      );
    }
    const trustText = `${post.evidenceNote || ""} ${post.methodologyNote || ""}`;
    if (GENERIC_TRUST_PATTERNS.some((pattern) => pattern.test(trustText))) {
      issues.push(`[blog/${post.slug}] contains generic evidence or methodology language`);
    }

    for (const takeaway of post.keyTakeaways) {
      const normalized = normalizedListValue(takeaway);
      if (!normalized) continue;
      const slugs = repeatedTakeaways.get(normalized) || [];
      slugs.push(post.slug);
      repeatedTakeaways.set(normalized, slugs);
    }
  }

  for (const [takeaway, slugs] of repeatedTakeaways) {
    if (slugs.length > 1) {
      issues.push(
        `[blog] repeated takeaway across ${slugs.join(", ")}: "${takeaway}"`
      );
    }
  }

  warnList("[content-quality] Blog quality warnings:", issues);
}

export function warnOnServiceQuality(services: ServiceQualityInput[]) {
  if (didWarnServiceQuality) return;
  didWarnServiceQuality = true;

  const issues: string[] = [];

  for (const service of services) {
    if (!service.targetAudience?.length) {
      issues.push(`[services/${service.slug}] missing targetAudience`);
    }
    if (!service.notFor?.length) {
      issues.push(`[services/${service.slug}] missing notFor`);
    }
    if (service.deliverables.length < 4) {
      issues.push(`[services/${service.slug}] deliverables should have at least 4 items`);
    }
    if (service.process.length < 3) {
      issues.push(`[services/${service.slug}] process should have at least 3 steps`);
    }
    if (service.faqs.length < 3) {
      issues.push(`[services/${service.slug}] faqs should have at least 3 items`);
    }
    if (!service.commonMistakes?.length) {
      issues.push(`[services/${service.slug}] missing commonMistakes`);
    }
    if (!service.examples?.length) {
      issues.push(`[services/${service.slug}] missing examples`);
    }
    if (!service.searchIntent) {
      issues.push(`[services/${service.slug}] missing searchIntent`);
    }
    if (service.useCases.length < 2) {
      issues.push(`[services/${service.slug}] useCases should have at least 2 items`);
    }
    if (service.evidence.length < 1 || service.evidence.some((item) => !item.alt)) {
      issues.push(`[services/${service.slug}] evidence requires descriptive alt text`);
    }
    if (service.relatedGuideSlugs.length < 3) {
      issues.push(`[services/${service.slug}] relatedGuideSlugs should have at least 3 items`);
    }
  }

  warnList("[content-quality] Service page quality warnings:", issues);
}
