"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Switch({ checked, onChange, disabled = false, label, className }: SwitchProps) {
  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed", className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={cn(
          "w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full transition-all duration-200",
          checked && "bg-primary"
        )} />
        <div className={cn(
          "absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 shadow-sm",
          checked && "transform translate-x-4"
        )} />
      </div>
      {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
    </label>
  );
}
