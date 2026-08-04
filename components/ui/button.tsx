"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold tracking-[0.01em] rounded-btn transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98] hover:-translate-y-[1px]";

    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover shadow-soft",
      secondary: "bg-white/95 dark:bg-slate-800/90 text-text-primary border border-border hover:bg-slate-50 dark:hover:bg-slate-700 shadow-[0_2px_8px_rgba(3,22,53,0.06)]",
      outline: "border border-border text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-transparent shadow-[0_1px_3px_rgba(3,22,53,0.04)]",
      ghost: "text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent active:scale-100 shadow-none",
      danger: "bg-danger text-white hover:bg-red-700 shadow-soft",
    };

    const sizes = {
      sm: "h-8.5 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        {size === "icon" ? children : <span>{children}</span>}
        {!isLoading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
