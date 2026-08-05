"use client";

import { useEffect, useState } from "react";
import type { TimelineItem } from "@/components/ui/timeline";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/**
 * Assembles the Activity Timeline (IA §16 #1) for one entity. Today this
 * composes audit-log entries only, via the entityType/entityId filter added
 * to GET /audit-logs for this purpose. Comments (#6) and a generic approval
 * feed (#5) have no backend service yet — no shared Comment model, and no
 * unified Approval model (FeeRefund/Transport approvals are separate tables
 * per entity type). Add those sources here once #6/#5 exist as real shared
 * services, rather than fabricating data now.
 */
export function useEntityTimeline(entityType: string, entityId: string | undefined) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    fetch(`${API_URL}/audit-logs?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&pageSize=50`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const logs = Array.isArray(json) ? json : json.data ?? [];
        setItems(
          logs.map((log: any) => ({
            id: log.id,
            title: `${log.action ?? "Event"} · ${log.module ?? entityType}`,
            description: log.performedBy ? `by ${log.performedBy}` : undefined,
            time: log.timestamp ? new Date(log.timestamp).toLocaleString() : "",
            tag: log.role,
            tagVariant: "neutral" as const,
          }))
        );
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  return { items, loading };
}
