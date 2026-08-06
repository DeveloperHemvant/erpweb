"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  floating?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      success,
      isLoading,
      leftIcon,
      rightIcon,
      floating = false,
      disabled,
      placeholder,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    const hasStateIcon = success || error || isLoading;

    return (
      <div className="w-full">
        {/* Regular Top Label if not floating */}
        {label && !floating && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary mb-1 ml-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-text-secondary pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={actualType}
            ref={ref}
            disabled={disabled}
            placeholder={floating ? " " : placeholder}
            className={cn(
              "peer w-full h-10 px-3.5 rounded-input border bg-slate-50/90 dark:bg-slate-800/80 text-text-primary text-sm transition-all duration-200 outline-none shadow-[0_1px_2px_rgba(3,22,53,0.04)]",
              "border-slate-300/80 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/25",
              leftIcon && "pl-11",
              (rightIcon || isPassword || hasStateIcon) && "pr-11",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              success && "border-success focus:border-success focus:ring-success/20",
              disabled && "opacity-60 bg-slate-100 dark:bg-slate-900 cursor-not-allowed shadow-none",
              floating && "pt-5 pb-1 placeholder-transparent",
              className
            )}
            {...props}
          />

          {/* Floating Label */}
          {label && floating && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute text-xs text-text-secondary left-4 top-1.5 transition-all duration-200 pointer-events-none origin-left",
                "peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary",
                leftIcon && "left-11"
              )}
            >
              {label}
            </label>
          )}

          {/* Action/State Icon Container */}
          <div className="absolute right-4 flex items-center gap-1.5">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />}
            {!isLoading && error && <AlertCircle className="h-4 w-4 text-danger" />}
            {!isLoading && success && <CheckCircle2 className="h-4 w-4 text-success" />}
            
            {isPassword && !disabled && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-secondary hover:text-text-primary focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}

            {!isPassword && rightIcon && !hasStateIcon && (
              <div className="text-text-secondary pointer-events-none">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper/Error Text */}
        {error && (
          <p className="mt-1 ml-1 text-xs text-danger flex items-center gap-1 animate-fadeIn">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
