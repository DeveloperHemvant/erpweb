"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || React.useId();
    return (
      <div className="flex flex-col">
        <label htmlFor={checkboxId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            className={cn(
              "peer h-5 w-5 rounded-md border border-border bg-white dark:bg-slate-800 text-primary transition-all cursor-pointer",
              "focus:ring-2 focus:ring-primary/20 checked:bg-primary checked:border-primary",
              className
            )}
            {...props}
          />
          {label && (
            <span className="text-sm font-medium text-text-primary peer-disabled:opacity-50">
              {label}
            </span>
          )}
        </label>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
