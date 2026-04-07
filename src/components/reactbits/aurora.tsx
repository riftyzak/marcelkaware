"use client";

import { useEffect, useRef } from "react";

interface AuroraProps {
  colorStops?: [string, string, string];
  speed?: number;
  blend?: number;
  className?: string;
}

export function Aurora({
  colorStops = ["#1a3a5c", "#8fb0d8", "#2a4a6a"],
  speed = 1,
  blend = 0.4,
  className,
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < 3; i++) {
        const cx = w * (0.3 + 0.2 * Math.sin(time * 0.3 * speed + i * 2.1));
        const cy = h * (0.2 + 0.3 * Math.sin(time * 0.2 * speed + i * 1.7));
        const r = Math.max(w, h) * (0.4 + 0.1 * Math.sin(time * 0.15 * speed + i));

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, colorStops[i] + "60");
        gradient.addColorStop(0.5, colorStops[i] + "20");
        gradient.addColorStop(1, "transparent");

        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      time += 0.016;
      animationId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [colorStops, speed, blend]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ opacity: blend }}
    />
  );
}
