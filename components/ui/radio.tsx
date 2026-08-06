"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;
    return (
      <div className="flex flex-col">
        <label htmlFor={radioId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <input
            id={radioId}
            type="radio"
            ref={ref}
            className={cn(
              "peer h-5 w-5 rounded-full border border-border bg-white dark:bg-slate-800 text-primary transition-all cursor-pointer",
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

Radio.displayName = "Radio";
