"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OmniboxItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  href?: string;
  onSelect?: () => void;
}

export interface OmniboxGroup {
  group: string;
  items: OmniboxItem[];
}

export interface OmniboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  groups: OmniboxGroup[];
  loading?: boolean;
  placeholder?: string;
}

/**
 * The unified search + command palette (IA §6/§7) behind Ctrl+K — a superset
 * of search, not a second tool: navigation results and action results share
 * one input, one list, one set of keyboard bindings. Today's sidebar search
 * box is a non-functional stand-in this replaces; `groups` is supplied by
 * the caller (wired to the real federated search endpoint once Phase 7
 * builds it — this component doesn't know or care where results come from).
 */
export function Omnibox({ open, onOpenChange, value, onChange, groups, loading, placeholder = "Search or run a command..." }: OmniboxProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [groups]);

  const select = (item: OmniboxItem) => {
    onOpenChange(false);
    if (item.onSelect) item.onSelect();
    else if (item.href) router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) select(item);
    }
  };

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Search and commands">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => onOpenChange(false)} />

      <div className="relative w-full max-w-xl bg-card border border-border rounded-card shadow-premium overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-13 border-b border-border">
          <Search className="h-4 w-4 text-text-secondary shrink-0" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-text-secondary shrink-0" />}
          <kbd className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-text-secondary px-1.5 py-0.5 rounded shrink-0">Esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {flatItems.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">
              {loading ? "Searching..." : value ? "No results." : "Type to search records and commands."}
            </p>
          ) : (
            groups.map((g) =>
              g.items.length === 0 ? null : (
                <div key={g.group} className="mb-1.5">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">{g.group}</p>
                  {g.items.map((item) => {
                    runningIndex += 1;
                    const isActive = runningIndex === activeIndex;
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setActiveIndex(runningIndex)}
                        onClick={() => select(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer",
                          isActive ? "bg-primary/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        )}
                      >
                        {item.icon && <span className="text-text-secondary shrink-0">{item.icon}</span>}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-text-primary truncate">{item.label}</span>
                          {item.description && (
                            <span className="block text-xs text-text-secondary truncate">{item.description}</span>
                          )}
                        </span>
                        {isActive && <CornerDownLeft className="h-3.5 w-3.5 text-text-secondary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
