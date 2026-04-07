"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface FadeContentProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "none";
  className?: string;
}

export function FadeContent({
  children,
  delay = 0,
  duration = 600,
  direction = "up",
  className,
}: FadeContentProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const translateMap = {
    up: "translateY(16px)",
    down: "translateY(-16px)",
    none: "none",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : translateMap[direction],
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
