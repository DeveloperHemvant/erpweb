"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EntityPageShell } from "@/components/shared/EntityPageShell";
import { DataGrid } from "@/components/shared/DataGrid";
import { Timeline } from "@/components/ui/timeline";
import { useEntityTimeline } from "@/hooks/useEntityTimeline";
import { ActionMenu, useFavorite, buildStandardActions } from "@/components/shared/ActionMenu";
import { CommentThread } from "@/components/shared/CommentThread";
import { useComments } from "@/hooks/useComments";
import { getUserFromStorage } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MASTER_DATA_API_URL = `${API_URL}/master-data`;

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

const TABS = [
  { id: "roster", label: "Roster" },
  { id: "timetable", label: "Timetable" },
  { id: "attendance-summary", label: "Attendance Summary" },
  { id: "class-teacher", label: "Class Teacher" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

export default function ClassSectionEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const [section, setSection] = useState<any>(null);
  const [className, setClassName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [classTeacher, setClassTeacher] = useState<any>(null);
  const [classTeacherLoading, setClassTeacherLoading] = useState(false);
  const [roster, setRoster] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [attendanceSummaryLoading, setAttendanceSummaryLoading] = useState(false);
  const timeline = useEntityTimeline("class-section", id);
  const favorite = useFavorite("class-section", id);
  const comments = useComments("class-section", id);
  const currentUser = getUserFromStorage();

  // No GET /master-data/sections/:id today — classes carry nested sections,
  // so list-and-find through classes, same pattern as routes/invoices.
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${MASTER_DATA_API_URL}/classes`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((classes: any[]) => {
        for (const cls of Array.isArray(classes) ? classes : []) {
          const found = cls.sections?.find((s: any) => s.id === id);
          if (found) {
            setSection(found);
            setClassName(cls.name ?? cls.grade);
            return;
          }
        }
        setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== "roster" || roster.length > 0 || rosterLoading) return;
    setRosterLoading(true);
    fetch(`${API_URL}/erp-core/students?sectionId=${id}`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setRoster(Array.isArray(json) ? json : json.data ?? []))
      .catch(() => setRoster([]))
      .finally(() => setRosterLoading(false));
  }, [activeTab, id, roster.length, rosterLoading]);

  useEffect(() => {
    if (activeTab !== "attendance-summary" || attendanceSummary || attendanceSummaryLoading) return;
    setAttendanceSummaryLoading(true);
    fetch(`${API_URL}/erp-core/attendance/summary?sectionId=${id}`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then(setAttendanceSummary)
      .catch(() => setAttendanceSummary(null))
      .finally(() => setAttendanceSummaryLoading(false));
  }, [activeTab, id, attendanceSummary, attendanceSummaryLoading]);

  useEffect(() => {
    if (activeTab !== "timetable" || timetable.length > 0 || timetableLoading) return;
    setTimetableLoading(true);
    fetch(`${API_URL}/erp-core/timetables`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((all: any[]) => setTimetable((Array.isArray(all) ? all : []).filter((t) => t.sectionId === id || t.section?.id === id)))
      .catch(() => setTimetable([]))
      .finally(() => setTimetableLoading(false));
  }, [activeTab, id, timetable.length, timetableLoading]);

  useEffect(() => {
    if (activeTab !== "class-teacher" || classTeacher || classTeacherLoading) return;
    setClassTeacherLoading(true);
    fetch(`${MASTER_DATA_API_URL}/allocations`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((all: any[]) => {
        const found = (Array.isArray(all) ? all : []).find((a) => (a.sectionId === id || a.section?.id === id) && a.isClassTeacher);
        setClassTeacher(found ?? null);
      })
      .catch(() => setClassTeacher(null))
      .finally(() => setClassTeacherLoading(false));
  }, [activeTab, id, classTeacher, classTeacherLoading]);

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading class...</div>;
  if (notFound || !section) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Class/section not found.
        <div className="mt-3">
          <a href="/dashboard/admin/master-data"><Button variant="outline" size="sm">Back to Master Data</Button></a>
        </div>
      </div>
    );
  }

  return (
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Master Data", href: "/dashboard/admin/master-data" }, { label: `${className ?? ""} ${section.name ?? ""}`.trim() }],
        title: `${className ?? "Class"} ${section.name ?? ""}`.trim(),
        actions: <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />,
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[{ label: "Master Data Config", description: "Classes, sections and reference data.", href: "/dashboard/admin/master-data" }]}
    >
      {activeTab === "roster" && (
        <DataGrid
          columns={[
            { key: "admissionNumber", header: "Admission No.", render: (s: any) => <span className="font-semibold text-primary">{s.admissionNumber}</span> },
            { key: "fullName", header: "Full Name" },
            { key: "status", header: "Status" },
          ]}
          rows={roster}
          rowKey={(s: any) => s.id}
          loading={rosterLoading}
          onRowClick={(s: any) => router.push(`/students/${s.id}`)}
          emptyMessage="No students enrolled in this section."
        />
      )}

      {activeTab === "timetable" && (
        <DataGrid
          columns={[
            { key: "day", header: "Day", render: (t: any) => t.day ?? t.dayOfWeek ?? "—" },
            { key: "period", header: "Period", render: (t: any) => t.period?.name ?? t.periodName ?? "—" },
            { key: "subject", header: "Subject", render: (t: any) => t.subject?.name ?? "—" },
            { key: "teacher", header: "Teacher", render: (t: any) => t.staff?.fullName ?? t.teacher?.fullName ?? "—" },
          ]}
          rows={timetable}
          rowKey={(t: any) => t.id}
          loading={timetableLoading}
          emptyMessage="No timetable entries found for this section."
        />
      )}

      {activeTab === "attendance-summary" && (
        <div className="border border-border rounded-[14px] p-4">
          {attendanceSummaryLoading ? (
            <p className="text-sm text-text-secondary text-center py-4">Loading...</p>
          ) : attendanceSummary ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(attendanceSummary.byStatus ?? {}).map(([status, count]) => (
                <div key={status} className="text-center">
                  <p className="text-2xl font-bold text-text-primary">{count as number}</p>
                  <p className="text-xs text-text-secondary uppercase tracking-wide">{status}</p>
                </div>
              ))}
              <div className="text-center col-span-2 sm:col-span-4 pt-3 border-t border-border">
                <p className="text-xs text-text-secondary">{attendanceSummary.total} total records</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">No attendance records found for this section.</p>
          )}
        </div>
      )}

      {activeTab === "class-teacher" && (
        <div className="border border-border rounded-[14px] p-4">
          {classTeacherLoading ? (
            <p className="text-sm text-text-secondary text-center py-4">Loading...</p>
          ) : classTeacher ? (
            <p className="text-sm text-text-primary font-semibold">{classTeacher.staff?.fullName ?? "—"}</p>
          ) : (
            <p className="text-sm text-text-secondary">No class teacher assigned to this section.</p>
          )}
        </div>
      )}

      {activeTab === "comments" && (
        <CommentThread
          entityType="class-section"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this section yet." />
      )}
    </EntityPageShell>
  );
}
