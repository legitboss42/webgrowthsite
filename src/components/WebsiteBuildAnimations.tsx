"use client";

import { useEffect } from "react";

export default function WebsiteBuildAnimations() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      void (async () => {
        const reduceMotion =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion || disposed) return;

        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);

        if (disposed) return;

        gsap.registerPlugin(ScrollTrigger);

        const root = document.getElementById("website-build-page");
        const hero = document.getElementById("website-build-hero");
        if (!root || !hero) return;

        const ctx = gsap.context(() => {
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .fromTo(
              "[data-wb-hero-kicker]",
              { y: 18, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5 }
            )
            .fromTo(
              "[data-wb-hero-title]",
              { y: 28, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.75 },
              "-=0.2"
            )
            .fromTo(
              "[data-wb-hero-copy]",
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.65 },
              "-=0.28"
            )
            .fromTo(
              "[data-wb-hero-cta]",
              { y: 22, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.65 },
              "-=0.25"
            )
            .fromTo(
              "[data-wb-hero-meta]",
              { y: 14, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.55 },
              "-=0.35"
            )
            .fromTo(
              "[data-wb-hero-panel]",
              { x: 24, opacity: 0, scale: 0.985 },
              { x: 0, opacity: 1, scale: 1, duration: 0.75 },
              "-=0.45"
            );

          const generatedBg = hero.querySelector<HTMLElement>("[data-wb-generated-bg]");
          if (generatedBg) {
            gsap.fromTo(
              generatedBg,
              { scale: 1.03, opacity: 0.4 },
              { scale: 1, opacity: 0.7, duration: 1, ease: "power2.out" }
            );

            gsap.to(generatedBg, {
              yPercent: 10,
              ease: "none",
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
            });
          }

          gsap.utils.toArray<HTMLElement>("[data-wb-section-bg]").forEach((bg) => {
            const section = bg.closest("section");
            if (!section) return;

            gsap.fromTo(
              bg,
              { opacity: 0.35, scale: 1.02 },
              {
                opacity: 0.65,
                scale: 1,
                duration: 0.9,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 88%",
                },
              }
            );

            gsap.to(bg, {
              yPercent: 7,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            });
          });

          gsap.utils.toArray<HTMLElement>("[data-wb-reveal]").forEach((section) => {
            gsap.fromTo(
              section,
              { y: 44, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 84%",
                },
              }
            );

            const cards = section.querySelectorAll<HTMLElement>("[data-wb-card]");
            if (!cards.length) return;

            gsap.fromTo(
              cards,
              { y: 24, opacity: 0, scale: 0.988 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.62,
                stagger: 0.08,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 80%",
                },
              }
            );
          });
        }, root);

        ScrollTrigger.refresh();
        cleanup = () => ctx.revert();
      })();
    }, 260);

    return () => {
      disposed = true;
      clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  return null;
}
