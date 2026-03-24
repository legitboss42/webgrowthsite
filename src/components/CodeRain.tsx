"use client";

import { useEffect, useRef } from "react";

export default function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resolutionScale = 0.6;
    let width = (canvas.width = Math.floor(window.innerWidth * resolutionScale));
    let height = (canvas.height = Math.floor(window.innerHeight * resolutionScale));

    const letters = "01<>/{}[]$#@";
    const fontSize = 12;
    let columns = Math.floor(width / fontSize);
    let drops = Array(columns).fill(1);
    const frameInterval = 1000 / 14;

    ctx.font = `${fontSize}px monospace`;
    ctx.setTransform(1 / resolutionScale, 0, 0, 1 / resolutionScale, 0, 0);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#22c55e"; // green accent
      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const loop = (timestamp: number) => {
      if (timestamp - lastFrameRef.current >= frameInterval) {
        draw();
        lastFrameRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    const start = () => {
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(loop);
      }
    };

    const stop = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    let inView = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting);
        if (inView && document.visibilityState === "visible") {
          start();
          return;
        }
        stop();
      },
      { threshold: 0.01 }
    );

    observer.observe(canvas);

    const handleResize = () => {
      width = canvas.width = Math.floor(window.innerWidth * resolutionScale);
      height = canvas.height = Math.floor(window.innerHeight * resolutionScale);
      columns = Math.floor(width / fontSize);
      drops = Array(columns).fill(1);
      ctx.setTransform(1 / resolutionScale, 0, 0, 1 / resolutionScale, 0, 0);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && inView) {
        start();
        return;
      }
      stop();
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
      aria-hidden="true"
    />
  );
}
