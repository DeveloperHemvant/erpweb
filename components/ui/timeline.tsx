import React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  time: string;
  tag?: string;
  tagVariant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral";
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("flow-root", className)}>
      <ul className="-mb-8">
        {items.map((item, itemIdx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {itemIdx !== items.length - 1 ? (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-border"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-8 ring-card border border-border">
                    {item.icon ? (
                      <span className="text-text-primary text-sm">{item.icon}</span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-text-secondary">
                    <time dateTime={item.time}>{item.time}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
