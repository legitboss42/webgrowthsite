"use client";

import { useEffect } from "react";

type Killable = { kill: () => void };

export default function HomeAnimations() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    let kickoffTimer: number | undefined;

    const setup = async () => {
      const reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData === true;
      const lowMemory =
        typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number" &&
        ((navigator as Navigator & { deviceMemory?: number }).deviceMemory as number) <= 4;
      const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
      const smallViewport = window.innerWidth < 1024;

      if (reduceMotion || saveData || lowMemory || lowCpu || smallViewport || disposed) return;

      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (disposed) return;

      gsap.registerPlugin(ScrollTrigger);

      const hero = document.getElementById("home-hero");
      const services = document.getElementById("services");
      const about = document.getElementById("about");
      const portfolio = document.getElementById("portfolio");
      const contact = document.getElementById("contact");

      const animations: Killable[] = [];
      const addAnimation = (animation: Killable | null | undefined) => {
        if (animation) animations.push(animation);
      };

      if (hero) {
        addAnimation(
          gsap.to(hero, {
            opacity: 0,
            y: -180,
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          })
        );

        addAnimation(
          gsap.fromTo(
            ".hero-cta",
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.8 }
          )
        );
      }

      const reveal = (
        selector: string,
        triggerEl: HTMLElement | null,
        stagger = 0
      ) => {
        if (!triggerEl) return;
        addAnimation(
          gsap.fromTo(
            selector,
            { opacity: 0, y: 64, scale: 0.99 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              stagger,
              scrollTrigger: {
                trigger: triggerEl,
                start: "top 75%",
              },
            }
          )
        );
      };

      reveal(".services-head", services, 0);
      reveal(".service-card", services, 0.14);

      if (services) {
        addAnimation(
          gsap.fromTo(
            ".services-bg",
            { y: -28 },
            {
              y: 28,
              ease: "none",
              scrollTrigger: {
                trigger: services,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          )
        );
      }

      reveal(".about-block", about, 0.12);
      reveal(".case-card", portfolio, 0.14);
      reveal(".contact-block", contact, 0.12);

      ScrollTrigger.refresh();

      cleanup = () => {
        animations.forEach((animation) => animation.kill());
      };
    };

    // Delay animation engine setup so initial rendering wins on mobile/slow CPUs.
    kickoffTimer = window.setTimeout(() => {
      void setup();
    }, 1200);

    return () => {
      disposed = true;
      if (kickoffTimer) window.clearTimeout(kickoffTimer);
      cleanup?.();
    };
  }, []);

  return null;
}
