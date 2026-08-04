"use client";

import React from "react";
import { FileText, Download, Trash2, Loader2 } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Attachment {
  id: string;
  fileName: string;
  sizeBytes: number;
  uploadedByName: string;
  uploadedAt: string;
  url: string;
}

export interface AttachmentListProps {
  /** IA §16 #7 — one shared, entityType+entityId-keyed store; caller supplies the scoped list. */
  entityType: string;
  entityId: string;
  attachments: Attachment[];
  loading?: boolean;
  uploading?: boolean;
  onUpload?: (file: File) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  /** Read-only contexts (e.g. viewing someone else's record) hide the uploader and delete actions. */
  readOnly?: boolean;
  className?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AttachmentList({
  attachments,
  loading = false,
  uploading = false,
  onUpload,
  onDelete,
  readOnly = false,
  className,
}: AttachmentListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {loading ? (
        <p className="text-sm text-text-secondary py-4 text-center">
          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
          Loading attachments...
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-text-secondary py-2">No attachments yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-[14px] border border-border overflow-hidden">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3.5 py-2.5 bg-card">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-btn shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{a.fileName}</p>
                <p className="text-xs text-text-secondary">
                  {formatSize(a.sizeBytes)} · {a.uploadedByName} · {new Date(a.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" aria-label={`Download ${a.fileName}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                {!readOnly && onDelete && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(a.id)} aria-label={`Delete ${a.fileName}`}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && onUpload && (
        <FileUpload
          label="Add attachment"
          onFileSelect={(file) => onUpload(file)}
        />
      )}
      {uploading && <p className="text-xs text-text-secondary">Uploading...</p>}
    </div>
  );
}
