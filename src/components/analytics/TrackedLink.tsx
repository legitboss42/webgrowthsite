"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { setClarityTags, trackEvent } from "@/lib/analytics";

type TrackedLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  ctaName: string;
  ctaLocation: string;
  destination: string;
  pageType: string;
  offerType?: string;
  contentGroup?: string;
  blogSlug?: string;
  blogTitle?: string;
  blogCategory?: string;
  blogTags?: string[];
  dataBlogSlug?: string;
  trackView?: boolean;
  viewEventName?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

function isInternalHref(href: string) {
  return href.startsWith("/") && !/^\/\//.test(href);
}

function isHashHref(href: string) {
  return href.startsWith("#") || /^\/[^?#]*#/.test(href);
}

function isDirectActionHref(href: string) {
  return href.startsWith("mailto:") || href.startsWith("tel:");
}

export default function TrackedLink({
  href,
  children,
  className,
  target,
  rel,
  prefetch,
  ctaName,
  ctaLocation,
  destination,
  pageType,
  offerType,
  contentGroup,
  blogSlug,
  blogTitle,
  blogCategory,
  blogTags,
  dataBlogSlug,
  trackView = false,
  viewEventName = "blog_cta_view",
  onClick,
}: TrackedLinkProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  const eventPayload = useMemo(
    () => ({
      cta_name: ctaName,
      cta_location: ctaLocation,
      destination,
      page_type: pageType,
      offer_type: offerType,
      content_group: contentGroup,
      blog_slug: blogSlug,
      blog_title: blogTitle,
      blog_category: blogCategory,
    }),
    [
      blogCategory,
      blogSlug,
      blogTitle,
      contentGroup,
      ctaLocation,
      ctaName,
      destination,
      offerType,
      pageType,
    ]
  );

  const clarityTags = useMemo(
    () => ({
      ...eventPayload,
      blog_tags: blogTags,
    }),
    [blogTags, eventPayload]
  );

  useEffect(() => {
    if (!trackView) return;

    const element = ref.current;
    if (!element || typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;

        trackEvent(viewEventName, {
          blog_slug: blogSlug,
          blog_title: blogTitle,
          cta_location: ctaLocation,
          page_type: pageType,
          content_group: contentGroup,
        });
        setClarityTags({
          page_type: pageType,
          content_group: contentGroup,
          cta_location: ctaLocation,
          blog_slug: blogSlug,
          blog_title: blogTitle,
        });
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [blogSlug, blogTitle, contentGroup, ctaLocation, pageType, trackView, viewEventName]);

  function handleClick(event: MouseEvent<HTMLElement>) {
    trackEvent("cta_click", eventPayload);
    setClarityTags(clarityTags);
    onClick?.(event);
  }

  const sharedProps = {
    ref,
    className,
    onClick: handleClick,
    "data-cta-name": ctaName,
    "data-cta-location": ctaLocation,
    "data-offer-type": offerType,
    "data-blog-slug": dataBlogSlug ?? blogSlug,
  };

  if (isInternalHref(href) && !isHashHref(href)) {
    return (
      <Link href={href} prefetch={prefetch} {...sharedProps}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target={target} rel={rel} {...sharedProps}>
      {children}
    </a>
  );
}
