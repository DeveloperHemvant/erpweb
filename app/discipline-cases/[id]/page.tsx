"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EntityPageShell } from "@/components/shared/EntityPageShell";
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
  { id: "incident", label: "Incident" },
  { id: "involved", label: "Involved Students/Staff" },
  { id: "actions", label: "Actions Taken" },
  { id: "resolution", label: "Resolution" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

export default function DisciplineCaseEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("incident");
  const timeline = useEntityTimeline("discipline-case", id);
  const favorite = useFavorite("discipline-case", id);
  const comments = useComments("discipline-case", id);
  const currentUser = getUserFromStorage();

  // No GET /discipline/incidents/:id today — list-and-find, same pattern as
  // routes/invoices.
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/discipline/incidents`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((all: any[]) => {
        const found = (Array.isArray(all) ? all : []).find((i) => i.id === id);
        if (!found) setNotFound(true);
        else setIncident(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading case...</div>;
  if (notFound || !incident) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Discipline case not found.
        <div className="mt-3">
          <a href="/dashboard/admin/discipline"><Button variant="outline" size="sm">Back to Discipline &amp; Behavior</Button></a>
        </div>
      </div>
    );
  }

  return (
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Discipline & Behavior", href: "/dashboard/admin/discipline" }, { label: incident.category ?? "Case" }],
        title: incident.category ?? "Discipline Case",
        subtitle: incident.student?.fullName,
        status: incident.status ? incident.status.toLowerCase() === "resolved" ? "resolved" : incident.status.toLowerCase() === "escalated" ? "rejected" : "pending" : "pending",
        meta: [
          incident.incidentDate ? { label: "Date", value: new Date(incident.incidentDate).toLocaleDateString() } : null,
          incident.severity ? { label: "Severity", value: incident.severity } : null,
        ].filter(Boolean) as any,
        actions: <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />,
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[
        incident.student?.id
          ? { label: incident.student.fullName, description: "View this student's full 360 profile.", href: `/students/${incident.student.id}` }
          : { label: "Discipline & Behavior", description: "Full incident register.", href: "/dashboard/admin/discipline" },
      ]}
    >
      {activeTab === "incident" && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 border border-border rounded-[14px] p-4">
          {[
            ["Category", incident.category],
            ["Severity", incident.severity],
            ["Date", incident.incidentDate ? new Date(incident.incidentDate).toLocaleDateString() : null],
            ["Description", incident.description],
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

      {activeTab === "involved" && (
        <div className="text-center py-10 border border-dashed border-border rounded-[14px]">
          <p className="text-sm text-text-secondary">
            Discipline incidents are single-student-keyed in the data model today — there&apos;s no multi-party
            (staff/other students) field to source this tab from. Would need a schema change, out of scope for this pass.
          </p>
        </div>
      )}

      {activeTab === "actions" && (
        <div className="border border-border rounded-[14px] p-4">
          <p className="text-sm text-text-primary">{incident.actionTaken || "No action recorded yet."}</p>
        </div>
      )}

      {activeTab === "resolution" && (
        <div className="border border-border rounded-[14px] p-4 space-y-3">
          <StatusPill status={incident.status?.toLowerCase() === "resolved" ? "resolved" : incident.status?.toLowerCase() === "escalated" ? "rejected" : "pending"} label={incident.status ?? "Open"} />
          {(incident.counselingNotes ?? []).length > 0 ? (
            <ul className="space-y-2">
              {incident.counselingNotes.map((n: any) => (
                <li key={n.id} className="border-t border-border pt-2">
                  <p className="text-sm text-text-primary">{n.note}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{n.createdByStaff?.fullName} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No counseling notes on file.</p>
          )}
        </div>
      )}

      {activeTab === "comments" && (
        <CommentThread
          entityType="discipline-case"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this case yet." />
      )}
    </EntityPageShell>
  );
}
