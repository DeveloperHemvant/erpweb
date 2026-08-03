"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

export function Accordion({ items, className, allowMultiple = false }: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setExpandedItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setExpandedItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isExpanded = expandedItems.includes(item.id);
        return (
          <div
            key={item.id}
            className="border border-border bg-card rounded-card overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <span>{item.title}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-text-secondary transition-transform duration-200",
                  isExpanded && "transform rotate-180"
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <div className="px-5 pb-5 pt-0 text-sm text-text-secondary leading-relaxed border-t border-border/40">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
