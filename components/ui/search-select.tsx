"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SearchSelectOption {
  id: string;
  title: string;
  subtitle?: string;
}

export interface SearchSelectProps {
  label?: string;
  entityType: string;
  placeholder?: string;
  value?: SearchSelectOption | null;
  onChange: (value: SearchSelectOption | null) => void;
}

/**
 * Server-searched picker for large entity lists (students, staff, ...) —
 * backed by the existing federated /search endpoint instead of loading every
 * row into a native <select>, which stops being usable in the thousands.
 */
export function SearchSelect({ label, entityType, placeholder = "Type to search...", value, onChange }: SearchSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&limit=30`);
        if (res.ok) {
          const data = await res.json();
          setResults(
            data
              .filter((r: any) => r.entityType === entityType)
              .map((r: any) => ({ id: r.id, title: r.title, subtitle: r.subtitle }))
          );
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, entityType]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && <label className="block text-xs font-medium text-text-secondary mb-1 ml-1">{label}</label>}

      {value ? (
        <div className="w-full h-10 px-3.5 rounded-input border border-slate-300/80 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-sm font-medium text-text-primary truncate block">{value.title}</span>
          </div>
          <button type="button" onClick={() => { onChange(null); setQuery(""); }} className="text-text-secondary hover:text-text-primary flex-shrink-0 ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center">
          <Search className="h-4 w-4 text-text-secondary absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full h-10 pl-10 pr-9 rounded-input border border-slate-300/80 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/80 text-text-primary text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-text-secondary absolute right-3.5" />}
        </div>
      )}

      {open && !value && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white dark:bg-dark-paper border border-border rounded-lg shadow-premium">
          {results.length === 0 ? (
            <p className={cn("text-sm text-text-secondary text-center py-4", loading && "opacity-50")}>
              {loading ? "Searching..." : "No matches."}
            </p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { onChange(r); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <span className="block text-sm font-medium text-text-primary truncate">{r.title}</span>
                {r.subtitle && <span className="block text-xs text-text-secondary truncate">{r.subtitle}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
