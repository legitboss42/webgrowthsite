type PostQualityInput = {
  slug: string;
  title: string;
  author?: string;
  updatedAt?: string;
  lastReviewedAt?: string;
  keyTakeaways: string[];
  relatedGuideSlugs: string[];
  content: string;
};

type ServiceQualityInput = {
  slug: string;
  title: string;
  targetAudience?: string[];
  notFor?: string[];
  deliverables: string[];
  process: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
  commonMistakes?: string[];
  examples?: string[];
};

let didWarnPostQuality = false;
let didWarnServiceQuality = false;

function countMarkdownSections(content: string) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## ")).length;
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

  for (const post of posts) {
    const sectionCount = countMarkdownSections(post.content);
    const hasUpdatedDate = Boolean(toIsoDate(post.updatedAt || post.lastReviewedAt));

    if (!post.author) issues.push(`[blog/${post.slug}] missing author`);
    if (!hasUpdatedDate) issues.push(`[blog/${post.slug}] missing updatedAt or lastReviewedAt`);
    if (post.keyTakeaways.length < 3)
      issues.push(`[blog/${post.slug}] keyTakeaways should have at least 3 items`);
    if (post.relatedGuideSlugs.length < 2)
      issues.push(`[blog/${post.slug}] relatedGuideSlugs should have at least 2 items`);
    if (sectionCount < 4)
      issues.push(`[blog/${post.slug}] appears thin: only ${sectionCount} H2 sections`);
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
  }

  warnList("[content-quality] Service page quality warnings:", issues);
}
