"use client";

import { useMemo } from "react";

type Props = {
  title: string;
  excerpt: string;
  slug: string;
};

const SITE_URL = "https://webgrowth.info";

function IconX(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className}>
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.8 7.8L23.2 22h-6.4l-5-7-6.1 7H2.6l7.3-8.4L1.2 2h6.6l4.6 6 6.5-6Zm-1.1 18h1.7L6.1 3.9H4.3L17.8 20Z"
      />
    </svg>
  );
}

function IconFacebook(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className}>
      <path
        fill="currentColor"
        d="M13.5 22v-8h2.7l.4-3.1h-3.1V9c0-.9.3-1.5 1.6-1.5h1.7V4.7c-.3 0-1.4-.1-2.7-.1-2.7 0-4.6 1.6-4.6 4.6v1.7H7v3.1h2.8v8h3.7Z"
      />
    </svg>
  );
}

function IconLinkedIn(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className}>
      <path
        fill="currentColor"
        d="M6.9 6.5a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM3.9 22h6V8.2h-6V22ZM12 8.2h5.7v1.9h.1c.8-1.4 2.6-2.8 5.4-2.8 5.8 0 6.9 3.8 6.9 8.8V22h-6v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V22h-6V8.2Z"
      />
    </svg>
  );
}

function IconWhatsApp(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className}>
      <path
        fill="currentColor"
        d="M20 12a8 8 0 0 1-12.7 6.4L4 19l.7-3.2A8 8 0 1 1 20 12Zm-4.6 2.3c-.2.5-1 .9-1.4 1-.3.1-.7.1-1.1 0-.3-.1-.6-.2-1-.4a8.7 8.7 0 0 1-2.7-2.3 6.4 6.4 0 0 1-1.2-2.1c-.1-.3-.1-.6 0-.9.1-.4.4-.9.6-1.1.2-.2.3-.2.4-.2h.3c.1 0 .3 0 .4.3l.5 1.2c.1.3.1.4 0 .5l-.2.3-.2.2c-.1.1-.2.2-.1.4l.5.9c.3.5.8 1 1.3 1.3l.9.5c.1.1.3.1.4 0l.3-.3c.1-.2.2-.2.5-.1l1.2.6c.2.1.3.2.3.3 0 .1 0 .6-.2 1Z"
      />
    </svg>
  );
}

function IconTelegram(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className}>
      <path
        fill="currentColor"
        d="M21.8 4.7 19 19.3c-.2 1-1 1.3-1.8.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.2 9.5-8.6c.4-.4-.1-.6-.6-.3L6.3 12.6 1.6 11c-1-.3-1-1 .2-1.4L20 3c.9-.3 1.7.2 1.8 1.7Z"
      />
    </svg>
  );
}

export default function SocialShareDock({ title, excerpt, slug }: Props) {
  const url = `${SITE_URL}/blog/${slug}`;
  const text = `${title} - ${excerpt}`;

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

  const iconClass = "h-5 w-5";

  const btnBase =
    "group relative grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/35 text-white/80 transition";
  const btnHover =
    "hover:border-emerald-400/35 hover:bg-emerald-500/10 hover:text-white";

  // glow ring + sheen (subtle)
  const glow =
    "before:absolute before:inset-[-1px] before:rounded-[14px] before:opacity-0 before:transition before:duration-300 " +
    "before:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.35),transparent_65%)] " +
    "group-hover:before:opacity-100";

  return (
    <>
      {/* Desktop floating rail */}
      <div className="hidden md:block">
        <div className="sticky top-36">
          <div className="flex flex-col items-center gap-3">
            <div className="text-[11px] tracking-[0.25em] text-white/45 rotate-180 [writing-mode:vertical-rl]">
              SHARE
            </div>

            <a
              href={links.twitter}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on X"
              className={`${btnBase} ${btnHover} ${glow}`}
            >
              <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition">
                <span className="absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-white/8 blur-2xl translate-x-[-70%] group-hover:translate-x-[340%] transition duration-[1100ms]" />
              </span>
              <IconX className={iconClass} />
            </a>

            <a
              href={links.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on Facebook"
              className={`${btnBase} ${btnHover} ${glow}`}
            >
              <IconFacebook className={iconClass} />
            </a>

            <a
              href={links.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on LinkedIn"
              className={`${btnBase} ${btnHover} ${glow}`}
            >
              <IconLinkedIn className={iconClass} />
            </a>

            <a
              href={links.whatsapp}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on WhatsApp"
              className={`${btnBase} ${btnHover} ${glow}`}
            >
              <IconWhatsApp className={iconClass} />
            </a>

            <a
              href={links.telegram}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on Telegram"
              className={`${btnBase} ${btnHover} ${glow}`}
            >
              <IconTelegram className={iconClass} />
            </a>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden">
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/70 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white/70">
                Share this post
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={links.twitter}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Share on X"
                  className={`${btnBase} ${btnHover} ${glow} h-10 w-10`}
                >
                  <IconX className={iconClass} />
                </a>
                <a
                  href={links.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Share on Facebook"
                  className={`${btnBase} ${btnHover} ${glow} h-10 w-10`}
                >
                  <IconFacebook className={iconClass} />
                </a>
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Share on LinkedIn"
                  className={`${btnBase} ${btnHover} ${glow} h-10 w-10`}
                >
                  <IconLinkedIn className={iconClass} />
                </a>
                <a
                  href={links.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Share on WhatsApp"
                  className={`${btnBase} ${btnHover} ${glow} h-10 w-10`}
                >
                  <IconWhatsApp className={iconClass} />
                </a>
                <a
                  href={links.telegram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Share on Telegram"
                  className={`${btnBase} ${btnHover} ${glow} h-10 w-10`}
                >
                  <IconTelegram className={iconClass} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer so the bottom bar doesn't cover content */}
        <div className="h-16" />
      </div>
    </>
  );
}


