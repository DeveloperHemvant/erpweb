"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  options: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Tabs({ options, activeTab, onChange, className, orientation = "horizontal" }: TabsProps) {
  return (
    <div className={cn(
      "flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-btn border border-border/50",
      orientation === "vertical" ? "flex-col space-y-1" : "space-x-1",
      className
    )}>
      {options.map((option) => {
        const isActive = option.id === activeTab;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-btn transition-colors duration-200 cursor-pointer select-none focus-visible:outline-none flex-1 justify-center",
              isActive ? "text-primary dark:text-white" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-btn shadow-soft border border-slate-200/20"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
