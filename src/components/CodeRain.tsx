"use client";

import { useEffect, useRef } from "react";

export default function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    if (reduceMotion || saveData || lowMemory || lowCpu || smallViewport) {
      return;
    }

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const letters = "01<>/{}[]$#@";
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    let drops = Array(columns).fill(1);
    const frameInterval = 1000 / 24;
    let lastFrameTime = 0;

    ctx.font = `${fontSize}px monospace`;

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
      if (timestamp - lastFrameTime >= frameInterval) {
        draw();
        lastFrameTime = timestamp;
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
          if (idleTimerRef.current) {
            window.clearTimeout(idleTimerRef.current);
          }
          idleTimerRef.current = window.setTimeout(start, 600);
          return;
        }
        stop();
      },
      { threshold: 0.01 }
    );

    observer.observe(canvas);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = Array(columns).fill(1);
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
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
    />
  );
}
