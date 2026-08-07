import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export interface DashboardWidgetShellProps {
  loading?: boolean;
  /** Error message to show, or null/undefined when there's no error. */
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  /** Minimum height while loading, so the skeleton matches the eventual content's footprint. */
  minHeight?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * One shared loading/empty/error contract for every dashboard widget
 * (ADMIN_DASHBOARD_BLUEPRINT.md §1's "shared UX pattern"), so Sprint 1–4
 * widgets don't each reimplement their own skeleton/empty/error handling.
 * Toast-on-error is the data-fetching hook's responsibility, not this shell's —
 * this only controls what renders in the widget's own footprint.
 */
export function DashboardWidgetShell({
  loading,
  error,
  isEmpty,
  emptyMessage = "No records yet.",
  onRetry,
  minHeight = 96,
  children,
  className,
}: DashboardWidgetShellProps) {
  if (loading) {
    return (
      <div className={cn("animate-pulse space-y-2.5", className)} style={{ minHeight }}>
        <div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-7 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-3/5 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 text-center py-6", className)} style={{ minHeight }}>
        <AlertTriangle className="h-4.5 w-4.5 text-text-secondary" aria-hidden="true" />
        <span className="text-lg font-bold text-text-secondary">—</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="text-xs font-semibold text-primary underline underline-offset-2 hover:no-underline">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn("flex items-center justify-center py-6", className)} style={{ minHeight }}>
        <p className="text-sm text-text-secondary text-center">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
