"use client";

import { useCallback, useEffect, useState } from "react";
import type { Attachment } from "@/components/shared/AttachmentList";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/** Backs AttachmentList (IA §16 #7) with the real, generic /attachments endpoint. */
export function useAttachments(entityType: string, entityId: string | undefined) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = useCallback(() => {
    if (!entityId) return;
    setLoading(true);
    fetch(`${API_URL}/attachments?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: any[]) =>
        setAttachments(
          (Array.isArray(rows) ? rows : []).map((r) => ({
            id: r.id,
            fileName: r.fileName,
            sizeBytes: r.sizeBytes ?? 0,
            uploadedByName: r.uploadedBy?.fullName ?? "Unknown",
            uploadedAt: r.uploadedAt,
            url: r.url,
          })),
        ),
      )
      .catch(() => setAttachments([]))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const upload = async (file: File) => {
    if (!entityId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);
      const res = await fetch(`${API_URL}/attachments`, { method: "POST", headers: authHeaders(), body: formData });
      if (res.ok) fetchAttachments();
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`${API_URL}/attachments/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) fetchAttachments();
  };

  return { attachments, loading, uploading, upload, remove };
}
