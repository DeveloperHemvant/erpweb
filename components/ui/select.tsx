"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || React.useId();
    return (
      <div className="w-full relative">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-text-secondary mb-1 ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "w-full h-10 px-3.5 pr-10 rounded-input border bg-slate-50/90 dark:bg-slate-800/80 text-text-primary text-sm appearance-none transition-all duration-200 outline-none cursor-pointer shadow-[0_1px_2px_rgba(3,22,53,0.04)]",
              "border-slate-300/80 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/25",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 pointer-events-none text-text-secondary">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="mt-1 ml-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
