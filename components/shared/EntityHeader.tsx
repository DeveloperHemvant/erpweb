"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill, type StatusValue } from "./StatusPill";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface EntityHeaderCrumb {
  label: string;
  href?: string;
}

export interface EntityHeaderMeta {
  label: string;
  value: React.ReactNode;
}

export interface EntityHeaderProps {
  /** Structural position (IA §10) — e.g. Finance › Invoices › INV-2026-0417. Last crumb has no href. */
  breadcrumb?: EntityHeaderCrumb[];
  title: string;
  subtitle?: string;
  avatarSrc?: string;
  avatarFallback?: string;
  status?: StatusValue | (string & {});
  /** Short key facts row — e.g. "Class 8B", "Roll No. 24", "Admitted 2024" */
  meta?: EntityHeaderMeta[];
  /** Primary actions — e.g. Edit, Request Refund. Rendered right-aligned. */
  actions?: React.ReactNode;
  className?: string;
}

export function EntityHeader({
  breadcrumb,
  title,
  subtitle,
  avatarSrc,
  avatarFallback,
  status,
  meta,
  actions,
  className,
}: EntityHeaderProps) {
  return (
    <div className={cn("pb-5 border-b border-border", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-text-secondary mb-3 flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-text-primary transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-text-primary font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          {(avatarSrc || avatarFallback) && (
            <Avatar src={avatarSrc} fallback={avatarFallback} size="lg" className="shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary truncate">{title}</h1>
              {status && <StatusPill status={status} />}
            </div>
            {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}

            {meta && meta.length > 0 && (
              <dl className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                {meta.map((m) => (
                  <div key={m.label} className="flex items-baseline gap-1.5">
                    <dt className="text-[11px] uppercase tracking-wide font-semibold text-text-secondary">{m.label}</dt>
                    <dd className="text-sm text-text-primary font-medium">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
