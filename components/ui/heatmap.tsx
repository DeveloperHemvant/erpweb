import React from "react";
import { cn } from "@/lib/utils";

export type HeatmapVariant = "success" | "warning" | "danger" | "neutral";

export interface HeatmapCell {
  id: string;
  label: string;
  /** 0–100. Used to derive a variant when `variant` isn't given explicitly. */
  value?: number;
  variant?: HeatmapVariant;
  tooltip?: string;
}

export interface HeatmapProps {
  cells: HeatmapCell[];
  /** Minimum cell width before wrapping — grid is responsive via auto-fit. */
  minCellWidth?: number;
  onCellClick?: (cell: HeatmapCell) => void;
  className?: string;
}

const VARIANT_CLASSES: Record<HeatmapVariant, string> = {
  success: "bg-success/15 hover:bg-success/25 text-success",
  warning: "bg-warning/15 hover:bg-warning/25 text-warning",
  danger: "bg-danger/15 hover:bg-danger/25 text-danger",
  neutral: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-secondary",
};

/** Default value→variant bands mirror the product's Green/Amber/Red KPI convention
 * (see KPI_DEFINITIONS.md) — override per-cell via `variant` when a KPI's own
 * thresholds differ from this generic default. */
function deriveVariant(value?: number): HeatmapVariant {
  if (value == null) return "neutral";
  if (value >= 80) return "success";
  if (value >= 50) return "warning";
  return "danger";
}

export function Heatmap({ cells, minCellWidth = 88, onCellClick, className }: HeatmapProps) {
  if (cells.length === 0) {
    return <p className="text-sm text-text-secondary py-6 text-center">No data yet.</p>;
  }

  return (
    <div
      className={cn("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCellWidth}px, 1fr))` }}
    >
      {cells.map((cell) => {
        const variant = cell.variant ?? deriveVariant(cell.value);
        const Comp = onCellClick ? "button" : "div";
        return (
          <Comp
            key={cell.id}
            type={onCellClick ? "button" : undefined}
            title={cell.tooltip}
            onClick={onCellClick ? () => onCellClick(cell) : undefined}
            className={cn(
              "flex flex-col items-center justify-center rounded-[10px] border border-border/30 px-2 py-3 text-center transition-colors",
              VARIANT_CLASSES[variant],
              onCellClick && "cursor-pointer"
            )}
          >
            <span className="text-sm font-bold leading-none">{cell.value != null ? `${Math.round(cell.value)}%` : "—"}</span>
            <span className="text-[10px] font-medium mt-1.5 leading-tight text-text-secondary line-clamp-2">{cell.label}</span>
          </Comp>
        );
      })}
    </div>
  );
}
