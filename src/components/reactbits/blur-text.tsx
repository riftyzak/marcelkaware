"use client";

import { useEffect, useRef, useState } from "react";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function BlurText({
  text,
  delay = 40,
  className,
  as: Tag = "h1",
}: BlurTextProps) {
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
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <Tag ref={ref as any} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-500"
          style={{
            filter: visible ? "blur(0px)" : "blur(8px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(4px)",
            transitionDelay: `${i * delay}ms`,
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
