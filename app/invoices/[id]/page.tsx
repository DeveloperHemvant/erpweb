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
const ERP_API_URL = `${API_URL}/erp-core`;

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

const TABS = [
  { id: "line-items", label: "Line Items" },
  { id: "payments", label: "Payments" },
  { id: "refunds", label: "Refunds" },
  { id: "communication", label: "Communication" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

export default function InvoiceEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("line-items");
  const timeline = useEntityTimeline("invoice", id);
  const favorite = useFavorite("invoice", id);
  const comments = useComments("invoice", id);
  const currentUser = getUserFromStorage();

  // No GET /erp-core/fees/:id today — list-and-find, same pattern as routes.
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${ERP_API_URL}/fees`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const list = Array.isArray(json) ? json : json.data ?? [];
        const found = list.find((inv: any) => inv.id === id);
        if (!found) setNotFound(true);
        else setInvoice(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading invoice...</div>;
  if (notFound || !invoice) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Invoice not found.
        <div className="mt-3">
          <a href="/dashboard/fees"><Button variant="outline" size="sm">Back to Fees &amp; Finance</Button></a>
        </div>
      </div>
    );
  }

  const payments = invoice.payments ?? [];
  const refunds = payments.flatMap((p: any) => (p.refunds ?? []).map((r: any) => ({ ...r, paymentAmount: p.amount })));

  return (
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Fees & Finance", href: "/dashboard/fees" }, { label: invoice.invoiceNumber ?? invoice.id }],
        title: invoice.invoiceNumber ?? `Invoice ${invoice.id}`,
        subtitle: invoice.student?.fullName,
        status: invoice.status ? invoice.status.toLowerCase() : "pending",
        meta: [
          invoice.amount != null ? { label: "Amount", value: `₹${invoice.amount}` } : null,
          invoice.dueDate ? { label: "Due", value: new Date(invoice.dueDate).toLocaleDateString() } : null,
        ].filter(Boolean) as any,
        actions: <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />,
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[
        invoice.student?.id
          ? { label: invoice.student.fullName, description: "View this student's full 360 profile.", href: `/students/${invoice.student.id}` }
          : { label: "Fees & Finance", description: "Full invoice ledger.", href: "/dashboard/fees" },
      ]}
    >
      {activeTab === "line-items" && (
        <div className="text-center py-10 border border-dashed border-border rounded-[14px]">
          <p className="text-sm text-text-secondary">
            Invoices don&apos;t have a line-item breakdown in the data model today — each is a single flat amount. Adding
            line items would need a schema change, out of scope for this pass.
          </p>
        </div>
      )}

      {activeTab === "payments" && (
        <DataGrid
          columns={[
            { key: "paidAt", header: "Date", render: (p: any) => (p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—") },
            { key: "amount", header: "Amount", render: (p: any) => (p.amount != null ? `₹${p.amount}` : "—") },
            { key: "method", header: "Method" },
            { key: "status", header: "Status", render: (p: any) => <StatusPill status={(p.status ?? "info").toLowerCase()} label={p.status ?? "—"} /> },
          ]}
          rows={payments}
          rowKey={(p: any) => p.id}
          emptyMessage="No payments recorded against this invoice."
        />
      )}

      {activeTab === "refunds" && (
        <DataGrid
          columns={[
            { key: "amount", header: "Amount", render: (r: any) => (r.amount != null ? `₹${r.amount}` : "—") },
            { key: "reason", header: "Reason", className: "max-w-xs truncate" },
            { key: "status", header: "Status", render: (r: any) => <StatusPill status={(r.status ?? "pending").toLowerCase()} label={r.status ?? "Pending"} /> },
          ]}
          rows={refunds}
          rowKey={(r: any) => r.id}
          emptyMessage="No refunds recorded on this invoice's payments."
        />
      )}

      {activeTab === "communication" && (
        <div className="text-center py-10 border border-dashed border-border rounded-[14px]">
          <p className="text-sm text-text-secondary">
            No endpoint ties communication history to a specific invoice yet — this tab is a placeholder.
          </p>
        </div>
      )}

      {activeTab === "comments" && (
        <CommentThread
          entityType="invoice"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this invoice yet." />
      )}
    </EntityPageShell>
  );
}
