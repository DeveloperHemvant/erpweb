"use client";

import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Comment {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  createdAt: string;
}

export interface CommentThreadProps {
  /** Which record this thread is attached to (IA §16 #6 — one shared, entityType+entityId-keyed table). */
  entityType: string;
  entityId: string;
  comments: Comment[];
  currentUserName: string;
  currentUserAvatarUrl?: string;
  loading?: boolean;
  posting?: boolean;
  onSubmit: (body: string) => void | Promise<void>;
  className?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CommentThread({
  comments,
  currentUserName,
  currentUserAvatarUrl,
  loading = false,
  posting = false,
  onSubmit,
  className,
}: CommentThreadProps) {
  const [draft, setDraft] = useState("");

  const handleSubmit = async () => {
    const body = draft.trim();
    if (!body || posting) return;
    setDraft("");
    await onSubmit(body);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-text-secondary py-4 text-center">
            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-text-secondary py-4 text-center">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Avatar src={c.authorAvatarUrl} fallback={initials(c.authorName)} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text-primary">{c.authorName}</span>
                  <span className="text-xs text-text-secondary">{relativeTime(c.createdAt)}</span>
                </div>
                <p className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-start gap-3 pt-3 border-t border-border">
        <Avatar src={currentUserAvatarUrl} fallback={initials(currentUserName)} size="sm" />
        <div className="flex-1 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Add a comment..."
            rows={2}
            className="flex-1 resize-none rounded-input border border-slate-300/80 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/80 px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all"
          />
          <Button size="icon" onClick={handleSubmit} disabled={!draft.trim() || posting} isLoading={posting} aria-label="Post comment">
            {!posting && <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
