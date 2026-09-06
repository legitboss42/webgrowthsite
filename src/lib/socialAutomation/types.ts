export type SocialPlatform = "INSTAGRAM" | "FACEBOOK" | "TIKTOK";
export type SocialRenderProfile = "META" | "TIKTOK";
export type SocialRenderCta = "ARTICLE" | "NONE";

export type SocialArticle = {
  slug: string;
  title: string;
  excerpt: string;
  canonicalUrl: string;
  category: string;
  topic: string;
  primaryKeyword: string;
  tags: string[];
  cover: string;
  keyTakeaways: string[];
  steps: string[];
  commonMistakes: string[];
  prose: string;
};

export type PlatformCopy = {
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  branding: boolean;
  renderCta: SocialRenderCta;
};

export type SocialCopyBundle = {
  instagram: PlatformCopy;
  facebook: PlatformCopy;
  tiktok: PlatformCopy;
};
