"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EntityPageShell } from "@/components/shared/EntityPageShell";
import { DataGrid } from "@/components/shared/DataGrid";
import { StatusPill } from "@/components/shared/StatusPill";
import { Timeline } from "@/components/ui/timeline";
import { useEntityTimeline } from "@/hooks/useEntityTimeline";
import { ActionMenu, useFavorite, buildStandardActions } from "@/components/shared/ActionMenu";
import { CommentThread } from "@/components/shared/CommentThread";
import { useComments } from "@/hooks/useComments";
import { getUserFromStorage } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

const TABS = [
  { id: "children", label: "Linked Children" },
  { id: "payments", label: "Payment History" },
  { id: "communication", label: "Communication Log" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

export default function ParentEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("children");
  const timeline = useEntityTimeline("parent", id);
  const favorite = useFavorite("parent", id);
  const comments = useComments("parent", id);
  const currentUser = getUserFromStorage();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/portal/parent/${id}/dashboard`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading guardian...</div>;
  if (notFound || !data) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Parent/guardian not found.
        <div className="mt-3">
          <a href="/dashboard/students"><Button variant="outline" size="sm">Back to Student Registry</Button></a>
        </div>
      </div>
    );
  }

  const children = (data.children ?? []).map((c: any, i: number) => ({ ...c, _rowKey: c.id ?? c.studentId ?? `child-${i}` }));
  const allPayments = children
    .flatMap((child: any) =>
      (child.invoices ?? []).flatMap((inv: any) =>
        (inv.payments ?? []).map((p: any) => ({ ...p, studentName: child.fullName ?? child.student?.fullName, invoiceNumber: inv.invoiceNumber }))
      )
    )
    .map((p: any, i: number) => ({ ...p, _rowKey: p.id ?? `payment-${i}` }));

  return (
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Students", href: "/dashboard/students" }, { label: data.parent?.name ?? "Guardian" }],
        title: data.parent?.name ?? "Guardian",
        meta: [
          data.parent?.email ? { label: "Email", value: data.parent.email } : null,
          data.parent?.phone ? { label: "Phone", value: data.parent.phone } : null,
        ].filter(Boolean) as any,
        actions: <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />,
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "children" && (
        <DataGrid
          columns={[
            { key: "fullName", header: "Student", render: (c: any) => c.fullName ?? c.student?.fullName ?? "—" },
            { key: "status", header: "Status", render: (c: any) => <StatusPill status={(c.status ?? "active").toLowerCase()} label={c.status ?? "Active"} /> },
          ]}
          rows={children}
          rowKey={(c: any) => c._rowKey}
          onRowClick={(c: any) => {
            const studentId = c.id ?? c.studentId;
            if (studentId) window.location.href = `/students/${studentId}`;
          }}
          emptyMessage="No linked children on file."
        />
      )}

      {activeTab === "payments" && (
        <DataGrid
          columns={[
            { key: "studentName", header: "Student" },
            { key: "invoiceNumber", header: "Invoice" },
            { key: "amount", header: "Amount", render: (p: any) => (p.amount != null ? `₹${p.amount}` : "—") },
            { key: "paidAt", header: "Date", render: (p: any) => (p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—") },
          ]}
          rows={allPayments}
          rowKey={(p: any) => p._rowKey}
          emptyMessage="No payment history across linked children."
        />
      )}

      {activeTab === "communication" && (
        <div className="text-center py-10 border border-dashed border-border rounded-[14px]">
          <p className="text-sm text-text-secondary">
            No endpoint ties communication history to a parent/guardian entity yet — this tab is a placeholder.
          </p>
        </div>
      )}

      {activeTab === "comments" && (
        <CommentThread
          entityType="parent"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this guardian yet." />
      )}
    </EntityPageShell>
  );
}
