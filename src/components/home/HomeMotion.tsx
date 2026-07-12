"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".approved-homepage");
    if (!root) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduceMotion = mediaQuery.matches;

    document.documentElement.classList.toggle("wg-reduced-motion", reduceMotion);
    document.documentElement.classList.toggle("wg-motion-ready", !reduceMotion);

    if (reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const heroItems = gsap.utils.toArray<HTMLElement>("[data-home-hero]");
      const cycleRing = root.querySelector<HTMLElement>("[data-cycle-ring]");
      const cycleCore = root.querySelector<HTMLElement>("[data-cycle-core]");
      const cycleNodes = gsap.utils.toArray<HTMLElement>("[data-cycle-node]");
      const credibilityItems = gsap.utils.toArray<HTMLElement>("[data-credibility-item]");

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(heroItems, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.52,
          stagger: 0.06,
        })
        .to(
          cycleRing,
          {
            autoAlpha: 1,
            scale: 1,
            rotate: 0,
            duration: 0.62,
          },
          "-=0.3"
        )
        .to(
          cycleCore,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
          },
          "-=0.26"
        )
        .to(
          cycleNodes,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.36,
            stagger: 0.035,
          },
          "-=0.22"
        )
        .to(
          credibilityItems,
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.38,
            stagger: 0.035,
          },
          "-=0.16"
        );

      gsap.utils.toArray<HTMLElement>("[data-home-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0.92, y: 22, filter: "blur(4px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.58,
            ease: "power2.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: element,
              start: "top 84%",
              once: true,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-home-stagger]").forEach((group) => {
        const children = Array.from(group.children) as HTMLElement[];
        gsap.fromTo(
          children,
          { autoAlpha: 0.92, y: 18, filter: "blur(4px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.5,
            stagger: 0.055,
            ease: "power2.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: group,
              start: "top 84%",
              once: true,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-home-depth]").forEach((element) => {
        gsap.to(element, {
          yPercent: -4,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7,
          },
        });
      });
    }, root);

    return () => {
      context.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      document.documentElement.classList.remove("wg-motion-ready", "wg-reduced-motion");
    };
  }, []);

  return null;
}
