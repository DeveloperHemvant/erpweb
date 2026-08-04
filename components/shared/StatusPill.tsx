"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Reserved status vocabulary (IA §16 #5 Approval Engine, Appendix A §2) — every
 * approval/compliance/lifecycle state in the product maps onto one of four
 * colors. Never add a 5th color here; add a new `status` key mapped onto an
 * existing variant instead, so status pills never compete with the
 * categorical brand palette for attention.
 */
export type StatusValue =
  | "pending"
  | "approved"
  | "rejected"
  | "acknowledged"
  | "resolved"
  | "active"
  | "inactive"
  | "warning"
  | "info"
  | "neutral";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const STATUS_VARIANT: Record<StatusValue, StatusVariant> = {
  pending: "warning",
  warning: "warning",
  approved: "success",
  acknowledged: "success",
  resolved: "success",
  active: "success",
  rejected: "danger",
  inactive: "danger",
  info: "info",
  neutral: "neutral",
};

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-slate-100 dark:bg-slate-800 text-text-secondary",
};

export interface StatusPillProps {
  /** A known status keyword (auto-colored) or any other string (renders as `neutral`). */
  status: StatusValue | (string & {});
  /** Override the displayed text — defaults to a capitalized `status`. */
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const variant = STATUS_VARIANT[status as StatusValue] ?? "neutral";
  const text = label ?? (status.charAt(0).toUpperCase() + status.slice(1));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
      {text}
    </span>
  );
}
