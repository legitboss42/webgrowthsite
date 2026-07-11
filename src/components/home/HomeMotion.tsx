"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function getNumericParts(value: string) {
  const match = value.match(/^([^0-9$-]*\$?)([0-9.,]+)(.*)$/);
  if (!match) return null;

  const numeric = Number(match[2].replace(/,/g, ""));
  if (Number.isNaN(numeric)) return null;

  return {
    prefix: match[1] ?? "",
    value: numeric,
    suffix: match[3] ?? "",
    decimals: match[2].includes(".") ? match[2].split(".")[1]?.length ?? 0 : 0,
  };
}

export default function HomeMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.toggle("wg-reduced-motion", reduceMotion);
    document.documentElement.classList.toggle("wg-motion-ready", !reduceMotion);

    if (reduceMotion) {
      document.querySelectorAll<HTMLElement>("[data-count-to]").forEach((counter) => {
        counter.textContent = counter.dataset.countTo ?? counter.textContent;
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.to(element, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 84%",
            once: true,
          },
          onComplete: () => element.classList.add("is-visible"),
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        const children = Array.from(group.children) as HTMLElement[];
        gsap.to(children, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: group,
            start: "top 82%",
            once: true,
          },
          onComplete: () => children.forEach((child) => child.classList.add("is-visible")),
        });
      });

      gsap.utils.toArray<SVGPathElement>("[data-growth-path]").forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: path.dataset.growthHero === "true" ? 1.8 : 1,
          ease: "power2.out",
          scrollTrigger:
            path.dataset.growthHero === "true"
              ? undefined
              : {
                  trigger: path.closest("[data-growth-section]") ?? path,
                  start: "top 76%",
                  end: "bottom 45%",
                  scrub: 0.8,
                },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax-section]").forEach((section) => {
        const bg = section.querySelector<HTMLElement>("[data-parallax-bg]");
        if (!bg) return;

        gsap.to(bg, {
          yPercent: -20,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      const cycleLight = document.querySelector<HTMLElement>("[data-cycle-light]");
      const cycleSteps = gsap.utils.toArray<HTMLElement>("[data-cycle-step]");

      cycleSteps.forEach((step, index) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 72%",
          once: true,
          onEnter: () => {
            step.classList.add("is-active");
            if (cycleLight) {
              gsap.to(cycleLight, {
                xPercent: index * 32,
                duration: 0.55,
                ease: "power2.out",
              });
            }
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-count-to]").forEach((counter) => {
        const target = counter.dataset.countTo;
        if (!target) return;

        const parts = getNumericParts(target);
        if (!parts) {
          counter.textContent = target;
          return;
        }

        const state = { value: 0 };
        gsap.to(state, {
          value: parts.value,
          duration: 1.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: counter,
            start: "top 84%",
            once: true,
          },
          onUpdate: () => {
            const rendered = state.value.toLocaleString("en-US", {
              maximumFractionDigits: parts.decimals,
              minimumFractionDigits: parts.decimals,
            });
            counter.textContent = `${parts.prefix}${rendered}${parts.suffix}`;
          },
          onComplete: () => {
            counter.textContent = target;
          },
        });
      });
    });

    return () => context.revert();
  }, []);

  return null;
}
