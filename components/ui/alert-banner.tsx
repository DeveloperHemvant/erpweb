import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, X } from "lucide-react";

export type AlertBannerVariant = "warning" | "danger" | "info";

export interface AlertBannerProps {
  variant?: AlertBannerVariant;
  title?: string;
  message?: React.ReactNode;
  /** Individual alert lines, e.g. "3 medical visits logged in the last hour" */
  items?: string[];
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<AlertBannerVariant, { wrap: string; icon: React.ElementType }> = {
  warning: { wrap: "bg-warning-soft border-warning/30 text-warning", icon: AlertTriangle },
  danger: { wrap: "bg-danger/10 border-danger/30 text-danger", icon: AlertTriangle },
  info: { wrap: "bg-info/10 border-info/30 text-info", icon: Info },
};

/** Top-of-page banner for Critical/Action-Center items only — do not use for
 * routine informational messages (that's what Card/Badge are for). Rendering
 * is entirely controlled by the caller: pass no banner at all when there's
 * nothing critical, rather than showing an always-on empty-state banner. */
export function AlertBanner({ variant = "warning", title, message, items, action, onDismiss, className }: AlertBannerProps) {
  const { wrap, icon: Icon } = VARIANT_STYLES[variant];

  return (
    <div className={cn("flex items-start gap-3 rounded-[12px] border px-4 py-3", wrap, className)} role="alert">
      <Icon className="h-4.5 w-4.5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold leading-tight">{title}</p>}
        {message && <p className="text-sm leading-snug mt-0.5">{message}</p>}
        {items && items.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {items.map((item, i) => (
              <li key={i} className="text-xs leading-snug flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-current shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-xs font-semibold underline underline-offset-2 hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
