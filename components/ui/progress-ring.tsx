import React from "react";
import { cn } from "@/lib/utils";

export type ProgressRingVariant = "primary" | "success" | "warning" | "danger" | "info";

export interface ProgressRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  variant?: ProgressRingVariant;
  /** Center text — defaults to `${value}%` */
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
}

const VARIANT_TEXT: Record<ProgressRingVariant, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

/** Circular progress indicator. Color comes from the same status tokens used by
 * StatusPill/Badge (never introduce a 5th color for a dashboard ring). */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  variant = "primary",
  label,
  sublabel,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-border/60"
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          stroke="currentColor"
          className={cn("transition-[stroke-dashoffset] duration-500 ease-out", VARIANT_TEXT[variant])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-text-primary leading-none">
          {label ?? `${Math.round(clamped)}%`}
        </span>
        {sublabel && <span className="text-[10px] text-text-secondary mt-1 leading-none">{sublabel}</span>}
      </div>
    </div>
  );
}
