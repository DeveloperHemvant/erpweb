"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoreVertical, Link2, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkPermission } from "@/lib/auth";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Permission string checked via checkPermission() — omit to always show. */
  permission?: string;
  danger?: boolean;
  onSelect: () => void;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  className?: string;
}

/**
 * Universal Action Menu (IA §16 #13) — every 360 page's action-menu contract,
 * computed from the caller-supplied capability list intersected with the
 * acting role's permissions (via lib/auth's checkPermission). No Workflow
 * Engine (§16 #4) state axis yet — that service doesn't exist; add it here
 * once it does, rather than fabricate the intersection now.
 */
export function ActionMenu({ items, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClickAway);
    return () => window.removeEventListener("mousedown", onClickAway);
  }, [open]);

  const visible = items.filter((i) => !i.permission || checkPermission(i.permission));
  if (visible.length === 0) return null;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <Button variant="ghost" size="icon" aria-label="More actions" onClick={() => setOpen((o) => !o)}>
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-card shadow-premium py-1.5 text-sm z-30">
          {visible.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800",
                item.danger ? "text-danger" : "text-text-primary"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FAVORITES_KEY = "favoriteEntities";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Favorites & Recent Items (IA §16 #12), minimal per-browser implementation — a real shared service is future work. */
export function useFavorite(entityType: string, entityId: string | undefined) {
  const key = entityId ? `${entityType}:${entityId}` : "";
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!key) return;
    setIsFavorite(readFavorites().includes(key));
  }, [key]);

  const toggle = () => {
    if (!key) return;
    const current = readFavorites();
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setIsFavorite(next.includes(key));
  };

  return { isFavorite, toggle };
}

/**
 * Standard capability set every 360 page can safely offer today: copy-link
 * (always available) and favorite (client-local per IA §16 #12 above).
 * Entity-specific edit/delete actions are added by the caller alongside
 * these, not fabricated here — most entities don't have a confirmed
 * dedicated edit destination yet.
 */
export function buildStandardActions(opts: { isFavorite: boolean; onToggleFavorite: () => void }): ActionMenuItem[] {
  return [
    {
      id: "copy-link",
      label: "Copy Link",
      icon: <Link2 className="h-4 w-4" />,
      onSelect: () => {
        if (typeof window !== "undefined") navigator.clipboard?.writeText(window.location.href);
      },
    },
    {
      id: "favorite",
      label: opts.isFavorite ? "Remove from Favorites" : "Add to Favorites",
      icon: opts.isFavorite ? <Check className="h-4 w-4" /> : <Star className="h-4 w-4" />,
      onSelect: opts.onToggleFavorite,
    },
  ];
}
