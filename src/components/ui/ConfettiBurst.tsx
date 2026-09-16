"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  shape: "rect" | "circle";
  life: number;
};

function palette(): string[] {
  const styles = getComputedStyle(document.documentElement);
  const brand = styles.getPropertyValue("--accent-primary").trim() || "#84cc16";
  const hover = styles.getPropertyValue("--accent-hover").trim() || "#eab308";
  const ink = styles.getPropertyValue("--color-ink").trim() || "#f4f4f5";
  return [brand, hover, ink, "#ffffff", "#fbbf24", "#fb7185"];
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  const mounted = useIsClient();

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      const timer = window.setTimeout(() => onDoneRef.current(), 1200);
      return () => window.clearTimeout(timer);
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const timer = window.setTimeout(() => onDoneRef.current(), 1100);
      return () => window.clearTimeout(timer);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onDoneRef.current();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const colors = palette();
    const origins = [
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.58 },
      { x: window.innerWidth * 0.28, y: window.innerHeight * 0.72 },
      { x: window.innerWidth * 0.72, y: window.innerHeight * 0.72 },
    ];
    const particles: Particle[] = [];
    for (let i = 0; i < 140; i += 1) {
      const origin = origins[i % origins.length];
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
      const speed = 6 + Math.random() * 12;
      particles.push({
        x: origin.x + (Math.random() - 0.5) * 24,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 6 + Math.random() * 7,
        h: 9 + Math.random() * 9,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.32,
        color: colors[i % colors.length],
        shape: Math.random() > 0.72 ? "circle" : "rect",
        life: 1,
      });
    }

    let frame = 0;
    let raf = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onDoneRef.current();
    };
    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = false;
      for (const p of particles) {
        p.vy += 0.18;
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.0085;
        if (p.life <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (alive && frame < 220) {
        raf = window.requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    raf = window.requestAnimationFrame(tick);
    const failSafe = window.setTimeout(finish, 2800);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(failSafe);
      window.removeEventListener("resize", resize);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <>
      <p role="status" className="sr-only">
        New personal record
      </p>
      <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden="true">
        <canvas ref={canvasRef} className="h-full w-full" />
        <p className="confetti-label font-display absolute top-[34%] left-1/2 text-3xl font-extrabold tracking-tight text-brand-text">
          New PR
        </p>
      </div>
    </>,
    document.body,
  );
}
