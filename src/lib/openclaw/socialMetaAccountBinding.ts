/** Immutable owner-registered Meta business bindings, no credentials stored here. */
export const META_ACCOUNT_BINDINGS = {
  webgrowth: {
    page: "108238171907695",
    instagram: "17841478169406233",
  },
  nouncompass: {
    page: "102469882650501",
    instagram: "17841446869937750",
  },
} as const;

export type MetaBusiness = keyof typeof META_ACCOUNT_BINDINGS;
export type MetaChannel = "page" | "instagram";
export type ManagedMetaPage = {
  facebookPageId: string;
  instagramAccountId: string;
  pageAccessToken: string;
  tasks?: string[];
};

/**
 * Returns only an exact owner-registered pair's token and Graph ID.
 * No fallback to a selected Page from another business is ever permitted.
 */
export function selectManagedMetaAccount(
  business: MetaBusiness,
  operation: string,
  resource: string,
  pages: readonly ManagedMetaPage[],
): { graphId: string; pageToken: string; channel: MetaChannel } | null {
  const binding = META_ACCOUNT_BINDINGS[business];
  if (!binding || !/^(meta\.page\.|meta\.instagram\.)/.test(operation)) return null;
  const channel: MetaChannel = operation.startsWith("meta.page.") ? "page" : "instagram";
  const graphId = binding[channel];
  if (resource !== graphId) return null;
  const pair = pages.find(p =>
    p.facebookPageId === binding.page &&
    p.instagramAccountId === binding.instagram &&
    typeof p.pageAccessToken === "string" &&
    p.pageAccessToken.length >= 15
  );
  if (!pair) return null;
  return { graphId, pageToken: pair.pageAccessToken, channel };
}
