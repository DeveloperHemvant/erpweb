"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EntityPageShell } from "@/components/shared/EntityPageShell";
import { DataGrid } from "@/components/shared/DataGrid";
import { AttachmentList } from "@/components/shared/AttachmentList";
import { StatusPill } from "@/components/shared/StatusPill";
import { Timeline } from "@/components/ui/timeline";
import { useEntityTimeline } from "@/hooks/useEntityTimeline";
import { ActionMenu, useFavorite, buildStandardActions } from "@/components/shared/ActionMenu";
import { CommentThread } from "@/components/shared/CommentThread";
import { useComments } from "@/hooks/useComments";
import { useAttachments } from "@/hooks/useAttachments";
import { getUserFromStorage } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "payroll", label: "Payroll" },
  { id: "performance", label: "Performance" },
  { id: "transport", label: "Transport Assignment" },
  { id: "documents", label: "Documents" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

function LinkOutTab({ message, href, label }: { message: string; href: string; label: string }) {
  return (
    <div className="text-center py-10 border border-dashed border-border rounded-[14px]">
      <p className="text-sm text-text-secondary mb-3">{message}</p>
      <a href={href}>
        <Button variant="outline" size="sm" className="inline-flex">
          {label} <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </a>
    </div>
  );
}

export default function StaffEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [tabData, setTabData] = useState<Record<string, any>>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const timeline = useEntityTimeline("staff", id);
  const favorite = useFavorite("staff", id);
  const comments = useComments("staff", id);
  const attachments = useAttachments("staff", id);
  const currentUser = getUserFromStorage();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/staff/${id}`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(setStaff)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!staff || tabData[activeTab] || tabLoading[activeTab]) return;
    if (!["payroll", "performance"].includes(activeTab)) return;

    setTabLoading((prev) => ({ ...prev, [activeTab]: true }));

    const load = async () => {
      if (activeTab === "payroll") {
        const year = new Date().getFullYear();
        const [payslipsRes, leaveRes] = await Promise.all([
          fetch(`${API_URL}/hr/payslips/${id}`, { headers: authHeaders() }),
          fetch(`${API_URL}/hr/leave-balances/${id}/${year}`, { headers: authHeaders() }),
        ]);
        return {
          payslips: payslipsRes.ok ? await payslipsRes.json() : [],
          leaveBalance: leaveRes.ok ? await leaveRes.json() : null,
        };
      }
      if (activeTab === "performance") {
        const res = await fetch(`${API_URL}/hr/performance-reviews/${id}`, { headers: authHeaders() });
        return res.ok ? res.json() : [];
      }
      return null;
    };

    load()
      .then((data) => setTabData((prev) => ({ ...prev, [activeTab]: data })))
      .catch(() => setTabData((prev) => ({ ...prev, [activeTab]: null })))
      .finally(() => setTabLoading((prev) => ({ ...prev, [activeTab]: false })));
  }, [activeTab, staff, id, tabData, tabLoading]);

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading staff record...</div>;
  if (notFound || !staff) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Staff member not found.
        <div className="mt-3">
          <a href="/dashboard/admin/hr"><Button variant="outline" size="sm">Back to HR &amp; Payroll</Button></a>
        </div>
      </div>
    );
  }

  return (
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Staff", href: "/dashboard/admin/hr" }, { label: staff.fullName }],
        title: staff.fullName,
        subtitle: staff.role?.name,
        avatarFallback: initials(staff.fullName),
        status: staff.status ? staff.status.toLowerCase() : "active",
        meta: [
          staff.email ? { label: "Email", value: staff.email } : null,
          staff.phone ? { label: "Phone", value: staff.phone } : null,
        ].filter(Boolean) as any,
        actions: (
          <div className="flex items-center gap-2">
            <a href={`/dashboard/admin/staff-management/${id}`}>
              <Button variant="outline" size="sm">Edit Assignments</Button>
            </a>
            <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />
          </div>
        ),
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[{ label: "HR & Payroll", description: "Leave, payroll and staff directory.", href: "/dashboard/admin/hr" }]}
    >
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 border border-border rounded-[14px] p-4">
            {[
              ["Role", staff.role?.name],
              ["Email", staff.email],
              ["Phone", staff.phone],
              ["Status", staff.status],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-text-secondary">{label}</p>
                  <p className="text-sm text-text-primary mt-0.5">{value as string}</p>
                </div>
              ))}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-2">Class / Subject Assignments</h3>
            {staff.assignments?.length ? (
              <ul className="divide-y divide-border border border-border rounded-[14px] overflow-hidden">
                {staff.assignments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-sm text-text-primary">
                      {a.subject?.name ?? "—"} · {a.section?.class?.name ?? "—"} {a.section?.name ?? ""}
                    </span>
                    {a.isClassTeacher && <StatusPill status="info" label="Class Teacher" />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary">No assignments on file.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <LinkOutTab
          message="Per-staff schedule isn't assembled on this page yet — the Timetable Desk has the full schedule."
          href="/dashboard/admin/timetable"
          label="Open Timetable Desk"
        />
      )}

      {activeTab === "payroll" && (
        <div className="space-y-5">
          {tabData.payroll?.leaveBalance && (
            <div className="border border-border rounded-[14px] p-4">
              <p className="text-sm font-semibold text-text-primary">Leave Balance ({new Date().getFullYear()})</p>
              <p className="text-xs text-text-secondary mt-1">
                {tabData.payroll.leaveBalance.available ?? tabData.payroll.leaveBalance.balance ?? "—"} days available
              </p>
            </div>
          )}
          <DataGrid
            columns={[
              { key: "period", header: "Period", render: (p: any) => p.period ?? p.month ?? "—" },
              { key: "netPay", header: "Net Pay", render: (p: any) => (p.netPay != null ? `₹${p.netPay}` : "—") },
              { key: "status", header: "Status", render: (p: any) => <StatusPill status={(p.status ?? "info").toLowerCase()} label={p.status ?? "—"} /> },
            ]}
            rows={tabData.payroll?.payslips ?? []}
            rowKey={(p: any) => p.id}
            loading={!!tabLoading.payroll}
            emptyMessage="No payslips on file."
          />
        </div>
      )}

      {activeTab === "performance" && (
        <DataGrid
          columns={[
            { key: "reviewDate", header: "Date", render: (r: any) => (r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : "—") },
            { key: "reviewer", header: "Reviewer", render: (r: any) => r.reviewer?.fullName ?? "—" },
            { key: "rating", header: "Rating" },
            { key: "comments", header: "Comments", className: "max-w-xs truncate" },
          ]}
          rows={tabData.performance ?? []}
          rowKey={(r: any) => r.id}
          loading={!!tabLoading.performance}
          emptyMessage="No performance reviews on file."
        />
      )}

      {activeTab === "transport" && (
        <div>
          {staff.transportAssignments?.length ? (
            <ul className="divide-y divide-border border border-border rounded-[14px] overflow-hidden">
              {staff.transportAssignments.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-sm text-text-primary">{a.vehicle?.registrationNumber ?? "—"}</span>
                  {a.vehicle?.id && (
                    <a href={`/vehicles/${a.vehicle.id}`} className="text-xs font-semibold text-primary hover:underline">
                      View vehicle →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary py-6 text-center">No transport assignment for this staff member.</p>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <AttachmentList
          entityType="staff"
          entityId={id}
          attachments={attachments.attachments}
          loading={attachments.loading}
          uploading={attachments.uploading}
          onUpload={attachments.upload}
          onDelete={attachments.remove}
        />
      )}

      {activeTab === "comments" && (
        <CommentThread
          entityType="staff"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this staff member yet." />
      )}
    </EntityPageShell>
  );
}
