"use client";

import { useMemo } from "react";

type Props = {
  title: string;
  excerpt: string;
  slug: string;
};

const SITE_URL = "https://webgrowth.info";

export default function SocialShare({ title, excerpt, slug }: Props) {
  const url = `${SITE_URL}/blog/${slug}`;

  // short summary the user shares
  const text = `${title} — ${excerpt}`;

  const links = useMemo(
    () => ({
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`,

      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,

      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`,

      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,

      telegram: `https://t.me/share/url?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(text)}`,
    }),
    [text, url]
  );

  const btn =
    "inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-emerald-600 hover:text-white transition";

  return (
    <div className="mt-16 border-t border-white/10 pt-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="text-lg font-semibold text-white">Share this post</h3>
        <div className="text-sm text-white/55">
          Send it to someone who needs it.
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a className={btn} href={links.twitter} target="_blank" rel="noreferrer">
          X / Twitter
        </a>
        <a className={btn} href={links.facebook} target="_blank" rel="noreferrer">
          Facebook
        </a>
        <a className={btn} href={links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a className={btn} href={links.whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a className={btn} href={links.telegram} target="_blank" rel="noreferrer">
          Telegram
        </a>
      </div>
    </div>
  );
}
