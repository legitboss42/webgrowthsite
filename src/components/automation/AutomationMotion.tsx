"use client";

import { useEffect } from "react";

/**
 * Motion controller for the /automation page.
 *
 * Intentionally does NOT reuse HomeMotion: that component is scoped to
 * `.approved-homepage`, drives GSAP timelines against `[data-home-*]` hooks, and
 * its cleanup strips the global motion classes. Reusing it would mean editing a
 * shared homepage file.
 *
 * All animation here is plain CSS keyframes. This component only decides *when*
 * they run:
 *
 * - `automation-motion-ready` is added to the page root only when the visitor
 *   has not asked for reduced motion. Every animated rule is nested under that
 *   class, so with reduced motion or with JavaScript disabled the page renders
 *   in its final, fully readable state and nothing moves.
 * - `[data-automation-reveal]` elements get `is-visible` once, on entrance.
 * - `[data-automation-demo]` elements get `is-running` while on screen and lose
 *   it when they scroll away, so looping demos are not animating offscreen.
 *
 * A demo reports `automation_demo_started` the first time it actually begins.
 */

type AutomationMotionProps = {
  /** Fired once per demo, the first time it starts. Receives the demo's name. */
  onDemoStart?: (demo: string) => void;
};

export default function AutomationMotion({ onDemoStart }: AutomationMotionProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-automation-root]");
    if (!root) return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const started = new Set<string>();

    const reveals = Array.from(root.querySelectorAll<HTMLElement>("[data-automation-reveal]"));
    const demos = Array.from(root.querySelectorAll<HTMLElement>("[data-automation-demo]"));

    // Reporting a demo as started is about engagement, not animation, so it also
    // happens for visitors who prefer reduced motion.
    function reportStart(element: HTMLElement) {
      const name = element.dataset.automationDemo || "unknown";
      if (started.has(name)) return;
      started.add(name);
      onDemoStart?.(name);
    }

    let revealObserver: IntersectionObserver | undefined;
    let demoObserver: IntersectionObserver | undefined;

    function connect(reduceMotion: boolean) {
      revealObserver?.disconnect();
      demoObserver?.disconnect();
      revealObserver = undefined;
      demoObserver = undefined;

      root!.classList.toggle("automation-motion-ready", !reduceMotion);

      if (reduceMotion) {
        // Clear any state a previous non-reduced pass applied.
        reveals.forEach((element) => element.classList.remove("is-visible"));
        demos.forEach((element) => element.classList.remove("is-running"));
      } else {
        revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              revealObserver?.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
        );
        reveals.forEach((element) => revealObserver?.observe(element));
      }

      // Demos are observed either way: reduced motion still needs the start
      // event, and the class toggle is harmless because no rule reads it
      // outside `.automation-motion-ready`.
      demoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const element = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              element.classList.add("is-running");
              reportStart(element);
            } else {
              element.classList.remove("is-running");
            }
          });
        },
        { threshold: 0.25 }
      );
      demos.forEach((element) => demoObserver?.observe(element));
    }

    connect(query.matches);

    const onPreferenceChange = (event: MediaQueryListEvent) => connect(event.matches);
    query.addEventListener("change", onPreferenceChange);

    return () => {
      query.removeEventListener("change", onPreferenceChange);
      revealObserver?.disconnect();
      demoObserver?.disconnect();
      root.classList.remove("automation-motion-ready");
    };
  }, [onDemoStart]);

  return null;
}
