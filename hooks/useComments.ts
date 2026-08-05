"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comment } from "@/components/shared/CommentThread";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/** Backs CommentThread (IA §16 #6) with the real, generic /comments endpoint. */
export function useComments(entityType: string, entityId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(() => {
    if (!entityId) return;
    setLoading(true);
    fetch(`${API_URL}/comments?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: any[]) =>
        setComments(
          (Array.isArray(rows) ? rows : []).map((r) => ({
            id: r.id,
            authorName: r.author?.fullName ?? "Unknown",
            body: r.body,
            createdAt: r.createdAt,
          })),
        ),
      )
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submit = async (body: string) => {
    if (!entityId) return;
    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ entityType, entityId, body }),
      });
      if (res.ok) fetchComments();
    } finally {
      setPosting(false);
    }
  };

  return { comments, loading, posting, submit };
}
