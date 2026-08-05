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
  { id: "stops", label: "Stops" },
  { id: "students", label: "Assigned Students" },
  { id: "vehicle-crew", label: "Vehicle & Crew" },
  { id: "trips", label: "Trip History" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

export default function RouteEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("stops");
  const [roster, setRoster] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const timeline = useEntityTimeline("route", id);
  const favorite = useFavorite("route", id);
  const comments = useComments("route", id);
  const currentUser = getUserFromStorage();

  // No GET /transport/routes/:id today — list-and-find, same pattern used for
  // invoices (no GET fees/:id either).
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/transport/routes`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((all: any[]) => {
        const found = (Array.isArray(all) ? all : []).find((r) => r.id === id);
        if (!found) setNotFound(true);
        else setRoute(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== "students" || roster.length > 0 || rosterLoading) return;
    setRosterLoading(true);
    fetch(`${API_URL}/transport/routes/${id}/roster`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRoster(Array.isArray(data) ? data : []))
      .catch(() => setRoster([]))
      .finally(() => setRosterLoading(false));
  }, [activeTab, id, roster.length, rosterLoading]);

  useEffect(() => {
    if (activeTab !== "trips" || trips.length > 0 || tripsLoading) return;
    setTripsLoading(true);
    fetch(`${API_URL}/transport/trips`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((all: any[]) => setTrips((Array.isArray(all) ? all : []).filter((t) => t.route?.id === id || t.routeId === id)))
      .catch(() => setTrips([]))
      .finally(() => setTripsLoading(false));
  }, [activeTab, id, trips.length, tripsLoading]);

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading route...</div>;
  if (notFound || !route) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Route not found.
        <div className="mt-3">
          <a href="/dashboard/admin/transport"><Button variant="outline" size="sm">Back to Transport</Button></a>
        </div>
      </div>
    );
  }

  return (
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Transport", href: "/dashboard/admin/transport" }, { label: route.name ?? "Route" }],
        title: route.name ?? "Route",
        subtitle: route.vehicle?.registrationNumber ? `Vehicle ${route.vehicle.registrationNumber}` : undefined,
        actions: <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />,
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[{ label: "Transport Desk", description: "Full fleet, route and trip management.", href: "/dashboard/admin/transport" }]}
    >
      {activeTab === "stops" && (
        <DataGrid
          columns={[
            { key: "order", header: "#", render: (s: any, ) => s.order ?? s.sequence ?? "—" },
            { key: "name", header: "Stop" },
            { key: "time", header: "Time", render: (s: any) => s.time ?? s.pickupTime ?? "—" },
          ]}
          rows={route.stops ?? []}
          rowKey={(s: any) => s.id}
          emptyMessage="No stops configured for this route."
        />
      )}

      {activeTab === "students" && (
        <DataGrid
          columns={[
            { key: "student", header: "Student", render: (r: any) => r.student?.fullName ?? r.enrollment?.student?.fullName ?? "—" },
            { key: "stop", header: "Boarding Stop", render: (r: any) => r.stop?.name ?? "—" },
          ]}
          rows={roster}
          rowKey={(r: any) => r.id}
          loading={rosterLoading}
          emptyMessage="No students assigned to this route."
        />
      )}

      {activeTab === "vehicle-crew" && (
        <div className="border border-border rounded-[14px] p-4 space-y-2">
          <p className="text-sm font-semibold text-text-primary">Vehicle: {route.vehicle?.registrationNumber ?? "Unassigned"}</p>
          {route.vehicle?.id && (
            <a href={`/vehicles/${route.vehicle.id}`} className="text-xs font-semibold text-primary hover:underline">
              View vehicle profile for crew &amp; compliance →
            </a>
          )}
        </div>
      )}

      {activeTab === "trips" && (
        <DataGrid
          columns={[
            { key: "date", header: "Date", render: (t: any) => (t.date ? new Date(t.date).toLocaleDateString() : "—") },
            { key: "driver", header: "Driver", render: (t: any) => t.driver?.fullName ?? "—" },
            { key: "status", header: "Status", render: (t: any) => <StatusPill status={(t.status ?? "info").toLowerCase()} label={t.status ?? "Unknown"} /> },
          ]}
          rows={trips}
          rowKey={(t: any) => t.id}
          loading={tripsLoading}
          emptyMessage="No trip history found for this route."
        />
      )}

      {activeTab === "comments" && (
        <CommentThread
          entityType="route"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this route yet." />
      )}
    </EntityPageShell>
  );
}
