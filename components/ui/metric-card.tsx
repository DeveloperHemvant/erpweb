import React from "react";
import { Card } from "./card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string | number;
    type: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, description, trend, icon, className }: MetricCardProps) {
  return (
    <Card className={cn("flex flex-col justify-between hoverable min-h-[132px]", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-[10px] bg-slate-50 dark:bg-slate-800 text-text-secondary border border-border/30">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-xl font-bold tracking-tight text-text-primary">
          {value}
        </h3>

        {(trend || description) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full border",
                  trend.type === "up" && "bg-success/10 text-success border-success/20",
                  trend.type === "down" && "bg-danger/10 text-danger border-danger/20",
                  trend.type === "neutral" && "bg-slate-100 dark:bg-slate-800 text-text-secondary border-border"
                )}
              >
                {trend.type === "up" && <ArrowUpRight className="h-3 w-3" />}
                {trend.type === "down" && <ArrowDownRight className="h-3 w-3" />}
                {trend.value}
              </span>
            )}
            {description && (
              <span className="text-xs text-text-secondary leading-none">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
