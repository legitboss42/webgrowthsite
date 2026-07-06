"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type CinematicOrbitSceneProps = {
  children: React.ReactNode;
  className?: string;
};

export default function CinematicOrbitScene({
  children,
  className = "",
}: CinematicOrbitSceneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const rings = root.querySelectorAll<HTMLElement>("[data-orbit-ring]");
    const tracks = root.querySelectorAll<HTMLElement>("[data-orbit-track]");
    const cards = root.querySelectorAll<HTMLElement>("[data-orbit-card]");
    const floatCards = root.querySelectorAll<HTMLElement>("[data-float-card]");
    const glow = root.querySelector<HTMLElement>("[data-orbit-glow]");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 18, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          stagger: 0.08,
          ease: "power3.out",
        }
      );

      rings.forEach((ring, index) => {
        gsap.to(ring, {
          rotate: index % 2 === 0 ? 360 : -360,
          duration: 56 + index * 10,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      });

      tracks.forEach((track, index) => {
        gsap.set(track, { transformOrigin: "50% 50%" });
        gsap.to(track, {
          rotate: 360,
          duration: 54 + index * 3,
          ease: "none",
          repeat: -1,
        });
      });

      cards.forEach((card, index) => {
        gsap.set(card, { transformOrigin: "50% 50%" });
        gsap.to(card, {
          rotate: -360,
          duration: 54 + index * 3,
          ease: "none",
          repeat: -1,
        });
      });

      floatCards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 24, rotateX: 10 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.9,
            delay: 0.24 + index * 0.08,
            ease: "power3.out",
          }
        );

        gsap.to(card, {
          y: index % 2 === 0 ? -8 : 8,
          rotateZ: index % 2 === 0 ? -0.8 : 0.8,
          duration: 4.2 + index * 0.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      if (glow) {
        gsap.to(glow, {
          scale: 1.06,
          opacity: 0.9,
          duration: 3.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
