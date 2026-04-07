"use client";

interface ShinyTextProps {
  text: string;
  className?: string;
  shimmerWidth?: number;
  duration?: number;
}

export function ShinyText({
  text,
  className,
  shimmerWidth = 220,
  duration = 4,
}: ShinyTextProps) {
  return (
    <span
      className={className}
      style={{
        backgroundImage: `linear-gradient(
          110deg,
          rgba(255,255,255,0) 0%,
          rgba(255,255,255,0) 42%,
          rgba(255,255,255,0.18) 47%,
          rgba(255,255,255,0.98) 50%,
          rgba(255,255,255,0.18) 53%,
          rgba(255,255,255,0) 58%,
          rgba(255,255,255,0) 100%
        )`,
        backgroundSize: `${shimmerWidth}% 100%`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: `shiny-slide ${duration}s linear infinite`,
        willChange: "background-position",
      }}
    >
      {text}
    </span>
  );
}
