import type { SocialRenderProfile } from "./types";

export type ResolvedRenderProfile = {
  branding: boolean;
  articleCta: boolean;
  showPresenter: boolean;
  showWebsiteText: boolean;
};

export function resolveRenderProfile(profile: SocialRenderProfile): ResolvedRenderProfile {
  if (profile === "TIKTOK") {
    return {
      branding: false,
      articleCta: false,
      showPresenter: false,
      showWebsiteText: false,
    };
  }

  return {
    branding: true,
    articleCta: true,
    showPresenter: true,
    showWebsiteText: true,
  };
}
