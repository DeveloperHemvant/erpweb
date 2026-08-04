"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill, type StatusValue } from "./StatusPill";
import { cn } from "@/lib/utils";

export interface ApprovalActionBarProps {
  /** Current lifecycle state — "pending" is the only state that shows action buttons. */
  status: StatusValue | (string & {});
  /** e.g. "Requires Transport Manager approval" */
  approverLabel?: string;
  /** Reason shown once already resolved (mirrors `rejectionReason`/`remarks` on FeeRefund & transport resolve endpoints). */
  resolutionNote?: string;
  /** False hides the action buttons entirely (viewer lacks the approval permission) but keeps the status/note visible. */
  canAct?: boolean;
  busy?: boolean;
  onApprove: () => void | Promise<void>;
  onReject: (reason: string) => void | Promise<void>;
  className?: string;
}

/**
 * The Approve/Reject-with-reason pattern this codebase built twice
 * independently (FeeRefund, Transport fuel/expense/breakdown/accident) —
 * one shared version (IA §16 #5 / Appendix A.2), same shape both times:
 * status + approver + reason + timestamps.
 */
export function ApprovalActionBar({
  status,
  approverLabel,
  resolutionNote,
  canAct = true,
  busy = false,
  onApprove,
  onReject,
  className,
}: ApprovalActionBarProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const isPending = status === "pending";

  const submitReject = async () => {
    if (!reason.trim()) return;
    await onReject(reason.trim());
    setRejecting(false);
    setReason("");
  };

  return (
    <div className={cn("border-t border-border pt-3.5 mt-3.5", className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <StatusPill status={status} />
          {isPending && approverLabel && <span className="text-xs text-text-secondary">{approverLabel}</span>}
          {!isPending && resolutionNote && <span className="text-xs text-text-secondary">{resolutionNote}</span>}
        </div>

        {isPending && canAct && !rejecting && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejecting(true)} disabled={busy}>
              Reject
            </Button>
            <Button variant="primary" size="sm" onClick={onApprove} isLoading={busy}>
              Approve
            </Button>
          </div>
        )}
      </div>

      {rejecting && (
        <div className="mt-3 flex items-start gap-2">
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (required)"
            rows={2}
            className="flex-1 resize-none rounded-input border border-slate-300/80 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/80 px-3.5 py-2 text-sm text-text-primary outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 transition-all"
          />
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button variant="danger" size="sm" onClick={submitReject} disabled={!reason.trim()} isLoading={busy}>
              Confirm
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setRejecting(false); setReason(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
