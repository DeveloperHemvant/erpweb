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
import { getUserFromStorage } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "route", label: "Assigned Route" },
  { id: "crew", label: "Crew" },
  { id: "fuel-expenses", label: "Fuel & Expenses" },
  { id: "daily-checks", label: "Daily Checks" },
  { id: "maintenance", label: "Maintenance" },
  { id: "documents", label: "Compliance Documents" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

export default function VehicleEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [dailyChecks, setDailyChecks] = useState<any[]>([]);
  const [dailyChecksLoading, setDailyChecksLoading] = useState(false);
  const timeline = useEntityTimeline("vehicle", id);
  const favorite = useFavorite("vehicle", id);
  const comments = useComments("vehicle", id);
  const currentUser = getUserFromStorage();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/transport/vehicles/${id}/profile`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== "daily-checks" || dailyChecks.length > 0 || dailyChecksLoading) return;
    setDailyChecksLoading(true);
    fetch(`${API_URL}/transport/daily-checks`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((all: any[]) => setDailyChecks((Array.isArray(all) ? all : []).filter((c) => c.vehicleId === id || c.vehicle?.id === id)))
      .catch(() => setDailyChecks([]))
      .finally(() => setDailyChecksLoading(false));
  }, [activeTab, id, dailyChecks.length, dailyChecksLoading]);

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading vehicle...</div>;
  if (notFound || !profile) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Vehicle not found.
        <div className="mt-3">
          <a href="/dashboard/admin/transport"><Button variant="outline" size="sm">Back to Transport</Button></a>
        </div>
      </div>
    );
  }

  return (
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Transport", href: "/dashboard/admin/transport" }, { label: profile.vehicleNumber ?? "Vehicle" }],
        title: profile.vehicleNumber ?? "Vehicle",
        subtitle: [profile.vehicleType, profile.fuelType].filter(Boolean).join(" · ") || undefined,
        status: profile.status ? profile.status.toLowerCase() : "active",
        meta: [
          profile.seatingCapacity ? { label: "Capacity", value: `${profile.seatingCapacity} Seats` } : null,
          profile.totalStudents != null ? { label: "Students Assigned", value: profile.totalStudents } : null,
        ].filter(Boolean) as any,
        actions: <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />,
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[{ label: "Transport Desk", description: "Full fleet, route and trip management.", href: "/dashboard/admin/transport" }]}
    >
      {activeTab === "overview" && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 border border-border rounded-[14px] p-4">
          {[
            ["Registration No.", profile.vehicleNumber],
            ["Type", profile.vehicleType],
            ["Fuel Type", profile.fuelType],
            ["Capacity", profile.seatingCapacity ? `${profile.seatingCapacity} Seats` : null],
            ["Status", profile.status],
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label as string}>
                <p className="text-[11px] uppercase tracking-wide font-semibold text-text-secondary">{label}</p>
                <p className="text-sm text-text-primary mt-0.5">{value as string}</p>
              </div>
            ))}
        </div>
      )}

      {activeTab === "route" && (
        <DataGrid
          columns={[
            { key: "routeName", header: "Route", render: (r: any) => r.routeName ?? r.name ?? "—" },
            { key: "distance", header: "Distance", render: (r: any) => (r.distance ? `${r.distance} KM` : "—") },
          ]}
          rows={profile.assignedRoutes ?? []}
          rowKey={(r: any) => r.id}
          onRowClick={(r: any) => (window.location.href = `/routes/${r.id}`)}
          emptyMessage="No routes assigned to this vehicle."
        />
      )}

      {activeTab === "crew" && (
        <DataGrid
          columns={[
            { key: "fullName", header: "Name", render: (s: any) => s.staff?.fullName ?? "—" },
            { key: "shift", header: "Shift", render: (s: any) => s.shift ?? "—" },
          ]}
          rows={profile.staff ?? []}
          rowKey={(s: any) => s.id}
          emptyMessage="No crew assigned to this vehicle."
        />
      )}

      {activeTab === "fuel-expenses" && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-2">Recent Fuel Logs</h3>
            <DataGrid
              columns={[
                { key: "date", header: "Date", render: (f: any) => f.date ?? "—" },
                { key: "litres", header: "Litres" },
                { key: "totalCost", header: "Cost", render: (f: any) => (f.totalCost != null ? `₹${f.totalCost}` : "—") },
              ]}
              rows={profile.fuelLogs ?? []}
              rowKey={(f: any) => f.id}
              emptyMessage="No fuel logs recorded."
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-2">Recent Expenses</h3>
            <DataGrid
              columns={[
                { key: "date", header: "Date", render: (e: any) => e.date ?? "—" },
                { key: "category", header: "Category", render: (e: any) => e.category ?? e.expenseType ?? "—" },
                { key: "amount", header: "Amount", render: (e: any) => (e.amount ?? e.totalCost) != null ? `₹${e.amount ?? e.totalCost}` : "—" },
              ]}
              rows={profile.expenses ?? []}
              rowKey={(e: any) => e.id}
              emptyMessage="No expenses recorded."
            />
          </div>
        </div>
      )}

      {activeTab === "daily-checks" && (
        <DataGrid
          columns={[
            { key: "date", header: "Date", render: (c: any) => (c.date ? new Date(c.date).toLocaleDateString() : "—") },
            { key: "checkedBy", header: "Checked By", render: (c: any) => c.checkedBy?.fullName ?? "—" },
            { key: "fitForService", header: "Result", render: (c: any) => <StatusPill status={c.fitForService ? "approved" : "rejected"} label={c.fitForService ? "Fit" : "Flagged"} /> },
          ]}
          rows={dailyChecks}
          rowKey={(c: any) => c.id}
          loading={dailyChecksLoading}
          emptyMessage="No daily safety checks found for this vehicle."
        />
      )}

      {activeTab === "maintenance" && (
        <DataGrid
          columns={[
            { key: "date", header: "Date", render: (s: any) => s.date ?? "—" },
            { key: "vendor", header: "Vendor", render: (s: any) => s.vendor?.name ?? "—" },
            { key: "serviceType", header: "Type" },
            { key: "totalCost", header: "Cost", render: (s: any) => (s.totalCost != null ? `₹${s.totalCost}` : "—") },
          ]}
          rows={profile.services ?? []}
          rowKey={(s: any) => s.id}
          emptyMessage="No service/maintenance history recorded."
        />
      )}

      {activeTab === "documents" && (
        <AttachmentList
          entityType="vehicle"
          entityId={id}
          readOnly
          attachments={(profile.documents ?? []).map((d: any) => ({
            id: d.id,
            fileName: d.documentType ?? d.name ?? "Document",
            sizeBytes: 0,
            uploadedByName: d.isVerified ? "Verified" : "Pending verification",
            uploadedAt: d.uploadedAt ?? d.createdAt ?? new Date().toISOString(),
            url: d.fileUrl ?? d.url ?? "#",
          }))}
        />
      )}

      {activeTab === "comments" && (
        <CommentThread
          entityType="vehicle"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this vehicle yet." />
      )}
    </EntityPageShell>
  );
}
