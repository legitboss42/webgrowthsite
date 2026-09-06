import { buildSocialCopy } from "./copy";
import type { SocialArticle, SocialPlatform } from "./types";

export type SocialAutomationPublicationSeed = {
  platform: SocialPlatform;
  status: "PENDING";
  caption: string;
};

export function buildSocialAutomationJobSeed(
  article: SocialArticle,
  sourceCommitSha: string,
  automationVersion: string
) {
  const copy = buildSocialCopy(article);
  const publications: SocialAutomationPublicationSeed[] = [
    { platform: "INSTAGRAM", status: "PENDING", caption: copy.instagram.caption },
    { platform: "FACEBOOK", status: "PENDING", caption: copy.facebook.caption },
    { platform: "TIKTOK", status: "PENDING", caption: copy.tiktok.caption },
  ];

  return {
    idempotencyKey: `${article.slug}:${sourceCommitSha}:${automationVersion}`,
    articleSnapshot: { article, copy },
    publications,
  };
}
