"use client";

import { useEffect, useRef } from "react";

interface Spark {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  baseOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  rotation: number;
  spin: number;
}

const SPARK_COUNT = 22;
const ACCENT = "234, 88, 12"; // orange-500, as an rgb triplet for use in rgba()

function drawSpark(ctx: CanvasRenderingContext2D, s: Spark, opacity: number) {
  const r = s.size;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rotation);
  ctx.beginPath();
  // Same four-point spark as the logo mark and the tickets' tear-line.
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.22, -r * 0.22);
  ctx.lineTo(r, 0);
  ctx.lineTo(r * 0.22, r * 0.22);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.22, r * 0.22);
  ctx.lineTo(-r, 0);
  ctx.lineTo(-r * 0.22, -r * 0.22);
  ctx.closePath();
  ctx.fillStyle = `rgba(${ACCENT}, ${opacity})`;
  ctx.fill();
  ctx.restore();
}

/**
 * A slow field of drifting sparks behind the hero — the same four-point mark
 * as the logo and the ticket tear-line, so the motion feels like an extension
 * of the brand rather than generic decoration. Built on canvas rather than a
 * video file: no asset to license, nothing to download, and it disappears
 * entirely for anyone who's asked their OS for less motion.
 */
export function SparkField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      const rect = canvas.parentElement!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const sparks: Spark[] = Array.from({ length: SPARK_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 4 + Math.random() * 9,
      speed: 0.08 + Math.random() * 0.18,
      drift: (Math.random() - 0.5) * 0.12,
      baseOpacity: 0.12 + Math.random() * 0.22,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.006 + Math.random() * 0.01,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.002,
    }));

    // Reduced motion: draw one static, gently-varied frame and stop.
    if (reduceMotion) {
      ctx.clearRect(0, 0, width, height);
      sparks.forEach((s) => drawSpark(ctx, s, s.baseOpacity));
      const onResize = () => {
        resize();
        ctx.clearRect(0, 0, width, height);
        sparks.forEach((s) => drawSpark(ctx, s, s.baseOpacity));
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let frameId: number;
    let running = true;

    function tick() {
      if (!running || !ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const s of sparks) {
        s.y -= s.speed;
        s.x += s.drift;
        s.rotation += s.spin;
        s.twinklePhase += s.twinkleSpeed;
        if (s.y < -20) {
          s.y = height + 20;
          s.x = Math.random() * width;
        }
        if (s.x < -20) s.x = width + 20;
        if (s.x > width + 20) s.x = -20;
        const twinkle = 0.55 + 0.45 * Math.sin(s.twinklePhase);
        drawSpark(ctx, s, s.baseOpacity * twinkle);
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!running) {
        running = true;
        frameId = requestAnimationFrame(tick);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
}
