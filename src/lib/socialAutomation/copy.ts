import type { SocialArticle, SocialCopyBundle } from "./types";

function clip(value: string, max: number) {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

function hook(article: SocialArticle) {
  const title = article.title.toLowerCase();
  const keyword = article.primaryKeyword.toLowerCase();
  if (keyword.includes("landing page") || title.includes("landing page")) {
    return "A landing page is not a pretty flyer. It has one job.";
  }
  if (keyword.includes("seo") || title.includes("seo")) {
    return "Most SEO problems start before Google ever sees the page.";
  }
  if (keyword.includes("conversion") || title.includes("conversion")) {
    return "More traffic will not fix a page that cannot convert.";
  }
  if (title.includes("rebuild") || title.includes("redesign")) {
    return "The website looked good. That was not the real problem.";
  }
  return clip(article.excerpt || article.title, 110);
}

function hashtags(article: SocialArticle) {
  const candidates = [
    article.primaryKeyword,
    article.category,
    article.topic,
    ...article.tags.slice(0, 3),
    "web growth",
  ];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = String(candidate || "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
    if (!normalized) continue;
    const tag = `#${normalized.replace(/\s+/g, "")}`;
    if (seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
    if (result.length === 6) break;
  }
  return result;
}

export function buildSocialCopy(article: SocialArticle): SocialCopyBundle {
  const opening = hook(article);
  const tags = hashtags(article);
  const takeaway = article.keyTakeaways[0] || article.steps[0] || article.excerpt;

  return {
    instagram: {
      platform: "INSTAGRAM",
      caption: [opening, clip(takeaway, 180), `Read the full guide: ${article.canonicalUrl}`, tags.join(" ")]
        .filter(Boolean)
        .join("\n\n"),
      hashtags: tags,
      branding: true,
      renderCta: "ARTICLE",
    },
    facebook: {
      platform: "FACEBOOK",
      caption: [opening, clip(article.excerpt || takeaway, 240), `Full guide: ${article.canonicalUrl}`]
        .filter(Boolean)
        .join("\n\n"),
      hashtags: tags.slice(0, 3),
      branding: true,
      renderCta: "ARTICLE",
    },
    tiktok: {
      platform: "TIKTOK",
      caption: [opening, tags.join(" ")].filter(Boolean).join("\n"),
      hashtags: tags,
      branding: false,
      renderCta: "NONE",
    },
  };
}
