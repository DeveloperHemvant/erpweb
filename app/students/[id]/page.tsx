"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ArrowUpRight, Home } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ERP_API_URL = `${API_URL}/erp-core`;

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
  { id: "attendance", label: "Attendance" },
  { id: "grades", label: "Grades" },
  { id: "fees", label: "Fees" },
  { id: "transport", label: "Transport" },
  { id: "health", label: "Health" },
  { id: "discipline", label: "Discipline" },
  { id: "documents", label: "Documents" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

/** Tabs with no admin-scoped backend endpoint today — bridge out to the existing workspace rather than fabricate data. */
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

export default function StudentEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [tabData, setTabData] = useState<Record<string, any>>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const timeline = useEntityTimeline("student", id);
  const favorite = useFavorite("student", id);
  const comments = useComments("student", id);
  const currentUser = getUserFromStorage();
  const { toast } = useToast();

  const [houses, setHouses] = useState<any[]>([]);
  const [isHouseModalOpen, setIsHouseModalOpen] = useState(false);
  const [savingHouse, setSavingHouse] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    return fetch(`${ERP_API_URL}/students/${id}/profile`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!id) return;
    fetchProfile();
    fetch(`${API_URL}/activities/houses/standings`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then(setHouses)
      .catch(() => setHouses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChangeHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    setSavingHouse(true);
    try {
      const res = await fetch(`${ERP_API_URL}/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ houseId: form.houseId.value || undefined }),
      });
      if (!res.ok) throw new Error("Failed to update house");
      toast("House updated", { type: "success" });
      setIsHouseModalOpen(false);
      fetchProfile();
    } catch {
      toast("Failed to update house", { type: "error" });
    } finally {
      setSavingHouse(false);
    }
  };

  const activeEnrollment = useMemo(() => {
    if (!profile?.enrollments) return null;
    return profile.enrollments.find((e: any) => e.status === "Enrolled") ?? profile.enrollments[0] ?? null;
  }, [profile]);

  useEffect(() => {
    if (!profile || tabData[activeTab] || tabLoading[activeTab]) return;
    if (!["grades", "transport", "health", "discipline"].includes(activeTab)) return;

    setTabLoading((prev) => ({ ...prev, [activeTab]: true }));

    const load = async () => {
      if (activeTab === "grades") {
        const res = await fetch(`${API_URL}/ems/students/${id}/results`, { headers: authHeaders() });
        return res.ok ? res.json() : { results: [], reportCards: [] };
      }
      if (activeTab === "transport") {
        if (!activeEnrollment) return null;
        const res = await fetch(`${API_URL}/transport/students/${activeEnrollment.id}`, { headers: authHeaders() });
        return res.ok ? res.json() : null;
      }
      if (activeTab === "health") {
        const [profRes, visitsRes] = await Promise.all([
          fetch(`${API_URL}/health-records/students/${id}/profile`, { headers: authHeaders() }),
          fetch(`${API_URL}/health-records/students/${id}/visits`, { headers: authHeaders() }),
        ]);
        return {
          profile: profRes.ok ? await profRes.json() : null,
          visits: visitsRes.ok ? await visitsRes.json() : [],
        };
      }
      if (activeTab === "discipline") {
        const res = await fetch(`${API_URL}/discipline/students/${id}/incidents`, { headers: authHeaders() });
        return res.ok ? res.json() : [];
      }
      return null;
    };

    load()
      .then((data) => setTabData((prev) => ({ ...prev, [activeTab]: data })))
      .catch(() => setTabData((prev) => ({ ...prev, [activeTab]: null })))
      .finally(() => setTabLoading((prev) => ({ ...prev, [activeTab]: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile, activeEnrollment]);

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading student...</div>;
  if (notFound || !profile) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Student not found.
        <div className="mt-3">
          <a href="/dashboard/students"><Button variant="outline" size="sm">Back to Student Registry</Button></a>
        </div>
      </div>
    );
  }

  const className = activeEnrollment?.section?.class?.name;
  const sectionName = activeEnrollment?.section?.name;

  return (
    <>
    <EntityPageShell
      header={{
        breadcrumb: [
          { label: "Students", href: "/dashboard/students" },
          { label: profile.fullName },
        ],
        title: profile.fullName,
        subtitle: `Admission No. ${profile.admissionNumber}`,
        avatarSrc: profile.photoUrl || profile.profilePicture || undefined,
        avatarFallback: initials(profile.fullName),
        status: profile.status === "Active" ? "active" : "inactive",
        meta: [
          className ? { label: "Class", value: sectionName ? `${className} · ${sectionName}` : className } : null,
          activeEnrollment?.rollNumber ? { label: "Roll No.", value: activeEnrollment.rollNumber } : null,
          profile.house?.name ? { label: "House", value: profile.house.name } : null,
          profile.gender ? { label: "Gender", value: profile.gender } : null,
          profile.phone ? { label: "Phone", value: profile.phone } : null,
        ].filter(Boolean) as any,
        actions: (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Home className="h-3.5 w-3.5" />} onClick={() => setIsHouseModalOpen(true)}>
              House
            </Button>
            {profile.admissionInquiry ? (
              <Button variant="outline" size="sm" onClick={() => router.push(`/applicants/${profile.admissionInquiry.id}`)}>
                View Application
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/admin/admissions`)}>
                Admissions
              </Button>
            )}
            <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />
          </div>
        ),
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[
        { label: "Fees & Finance", description: "Invoices and payment history live here for now.", href: "/dashboard/fees" },
        { label: "Attendance Desk", description: "Mark or review daily attendance.", href: "/dashboard/admin/attendance" },
        { label: "Transport", description: "Fleet, routes and driver assignments.", href: "/dashboard/admin/transport" },
      ]}
    >
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-2">Guardians</h3>
            {profile.parents?.length ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {profile.parents.map((ps: any) => (
                  <div key={ps.parent?.id ?? ps.parentId} className="border border-border rounded-[14px] p-3.5">
                    <p className="text-sm font-semibold text-text-primary">{ps.parent?.name ?? "—"}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{ps.relation || "Guardian"}</p>
                    <p className="text-xs text-text-secondary mt-1.5">{ps.parent?.phone ?? "—"} · {ps.parent?.email ?? "No email on file"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No guardians on file.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-text-primary mb-2">Enrollment History</h3>
            {profile.enrollments?.length ? (
              <ul className="divide-y divide-border border border-border rounded-[14px] overflow-hidden">
                {profile.enrollments.map((e: any) => (
                  <li key={e.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-sm text-text-primary">
                      {e.section?.class?.name ?? "—"} · {e.section?.name ?? "—"} {e.rollNumber ? `· Roll ${e.rollNumber}` : ""}
                    </span>
                    <StatusPill status={e.status?.toLowerCase() === "enrolled" ? "active" : e.status?.toLowerCase() === "promoted" ? "resolved" : "inactive"} label={e.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary">No enrollment records.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <LinkOutTab
          message="Per-student attendance history isn't wired into this page yet — the Attendance Desk has full records."
          href="/dashboard/admin/attendance"
          label="Open Attendance Desk"
        />
      )}

      {activeTab === "grades" && (
        <div className="space-y-5">
          <DataGrid
            columns={[
              { key: "exam", header: "Exam", render: (r: any) => r.gradebook?.subject?.name ?? r.gradebook?.exam?.name ?? "Exam Result" },
              { key: "totalMarks", header: "Marks", render: (r: any) => r.totalMarks ?? "—" },
              { key: "percentage", header: "Percentage", render: (r: any) => (r.percentage != null ? `${r.percentage}%` : "—") },
              { key: "grade", header: "Grade", render: (r: any) => r.grade ?? "—" },
              { key: "rank", header: "Rank", render: (r: any) => r.rank ?? "—" },
            ]}
            rows={tabData.grades?.results ?? []}
            rowKey={(r: any) => r.id}
            loading={!!tabLoading.grades}
            emptyMessage="No exam results recorded yet."
          />
          {tabData.grades?.reportCards?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-2">Report Cards</h3>
              <ul className="divide-y divide-border border border-border rounded-[14px] overflow-hidden">
                {tabData.grades.reportCards.map((rc: any) => (
                  <li key={rc.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-sm text-text-primary">{rc.session?.name ?? "Report Card"}</span>
                    {rc.fileUrl ? (
                      <a href={rc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary">No file</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === "fees" && (
        <LinkOutTab
          message="Per-student invoice history isn't wired into this page yet — Fees & Finance has the full ledger."
          href="/dashboard/fees"
          label="Open Fees & Finance"
        />
      )}

      {activeTab === "transport" && (
        <div>
          {tabLoading.transport ? (
            <p className="text-sm text-text-secondary py-6 text-center">Loading transport assignment...</p>
          ) : !activeEnrollment ? (
            <p className="text-sm text-text-secondary py-6 text-center">No active enrollment on file.</p>
          ) : !tabData.transport ? (
            <p className="text-sm text-text-secondary py-6 text-center">No active transport assignment for this student.</p>
          ) : (
            <div className="border border-border rounded-[14px] p-4 space-y-2">
              <p className="text-sm font-semibold text-text-primary">Route: {tabData.transport.route?.name ?? "—"}</p>
              <p className="text-xs text-text-secondary">
                Vehicle: {tabData.transport.route?.TransportTrip?.[0]?.vehicle?.registrationNumber ?? "—"} · Driver:{" "}
                {tabData.transport.route?.TransportTrip?.[0]?.driver?.fullName ?? "—"}
              </p>
              {tabData.transport.route?.TransportTrip?.[0] && (
                <StatusPill status={tabData.transport.route.TransportTrip[0].status?.toLowerCase?.() ?? "info"} label={tabData.transport.route.TransportTrip[0].status ?? "Trip status unknown"} />
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "health" && (
        <div className="space-y-5">
          {tabData.health?.profile && (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 border border-border rounded-[14px] p-4">
              {[
                ["Blood Group", tabData.health.profile.bloodGroup],
                ["Allergies", tabData.health.profile.allergies],
                ["Chronic Conditions", tabData.health.profile.chronicConditions],
                ["Emergency Contact", tabData.health.profile.emergencyContactName && `${tabData.health.profile.emergencyContactName} (${tabData.health.profile.emergencyContactPhone ?? "—"})`],
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
          <DataGrid
            columns={[
              { key: "visitDate", header: "Date", render: (v: any) => new Date(v.visitDate).toLocaleDateString() },
              { key: "reason", header: "Reason" },
              { key: "actionTaken", header: "Action Taken" },
              { key: "parentNotified", header: "Parent Notified", render: (v: any) => (v.parentNotified ? <StatusPill status="approved" label="Notified" /> : <StatusPill status="neutral" label="Not notified" />) },
            ]}
            rows={tabData.health?.visits ?? []}
            rowKey={(v: any) => v.id}
            loading={!!tabLoading.health}
            emptyMessage="No health centre visits recorded."
          />
        </div>
      )}

      {activeTab === "discipline" && (
        <DataGrid
          columns={[
            { key: "incidentDate", header: "Date", render: (i: any) => new Date(i.incidentDate).toLocaleDateString() },
            { key: "category", header: "Category" },
            { key: "severity", header: "Severity", render: (i: any) => <StatusPill status={i.severity === "Major" ? "rejected" : i.severity === "Moderate" ? "pending" : "neutral"} label={i.severity} /> },
            { key: "description", header: "Description", className: "max-w-xs truncate" },
            { key: "status", header: "Status", render: (i: any) => <StatusPill status={i.status === "Resolved" ? "resolved" : i.status === "Escalated" ? "rejected" : "pending"} label={i.status} /> },
          ]}
          rows={tabData.discipline ?? []}
          rowKey={(i: any) => i.id}
          loading={!!tabLoading.discipline}
          emptyMessage="No discipline incidents on record."
        />
      )}

      {activeTab === "documents" && (
        <AttachmentList
          entityType="student"
          entityId={id}
          readOnly
          attachments={(profile.documents ?? []).map((d: any) => ({
            id: d.id,
            fileName: d.documentType,
            sizeBytes: 0,
            uploadedByName: d.isVerified ? "Verified" : "Pending verification",
            uploadedAt: d.uploadedAt,
            url: d.fileUrl,
          }))}
        />
      )}

      {activeTab === "comments" && (
        <CommentThread
          entityType="student"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this student yet." />
      )}
    </EntityPageShell>

    <Modal isOpen={isHouseModalOpen} onClose={() => setIsHouseModalOpen(false)} title="Assign House">
      <form className="space-y-4 pt-4" onSubmit={handleChangeHouse}>
        <Select
          label="House"
          name="houseId"
          defaultValue={profile.house?.id || ""}
          options={houses.map((h: any) => ({ label: h.name, value: h.id }))}
          required
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsHouseModalOpen(false)}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={savingHouse}>{savingHouse ? "Saving..." : "Save"}</Button>
        </div>
      </form>
    </Modal>
    </>
  );
}
