"use client";

import { useEffect } from "react";

type Killable = { kill: () => void };

export default function HomeAnimations() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const setup = async () => {
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
            y: -120,
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
            ".hero-kicker",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", delay: 0.2 }
          )
        );

        addAnimation(
          gsap.fromTo(
            ".hero-title",
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: 0.75, ease: "power3.out", delay: 0.32 }
          )
        );

        addAnimation(
          gsap.fromTo(
            ".hero-copy",
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.46 }
          )
        );

        addAnimation(
          gsap.fromTo(
            ".hero-meta",
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", delay: 0.6 }
          )
        );

        addAnimation(
          gsap.fromTo(
            ".hero-stat",
            { opacity: 0, y: 18, scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "power3.out",
              stagger: 0.1,
              delay: 0.62,
            }
          )
        );

        addAnimation(
          gsap.fromTo(
            ".hero-cta",
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.7 }
          )
        );

        addAnimation(
          gsap.fromTo(
            ".hero-aside",
            { opacity: 0, x: 26, scale: 0.99 },
            { opacity: 1, x: 0, scale: 1, duration: 0.85, ease: "power3.out", delay: 0.52 }
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

    const startSetup = () => {
      void setup();
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(startSetup, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(startSetup, 700);
    }

    return () => {
      disposed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      cleanup?.();
    };
  }, []);

  return null;
}
