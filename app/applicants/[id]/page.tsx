"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EntityPageShell } from "@/components/shared/EntityPageShell";
import { StatusPill } from "@/components/shared/StatusPill";
import { AttachmentList } from "@/components/shared/AttachmentList";
import { Timeline } from "@/components/ui/timeline";
import { useEntityTimeline } from "@/hooks/useEntityTimeline";
import { ActionMenu, useFavorite, buildStandardActions } from "@/components/shared/ActionMenu";
import { CommentThread } from "@/components/shared/CommentThread";
import { useComments } from "@/hooks/useComments";
import { useAttachments } from "@/hooks/useAttachments";
import { getUserFromStorage } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SearchSelect, SearchSelectOption } from "@/components/ui/search-select";
import { useToast } from "@/components/ui/toast";
import { ArrowUpRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit | undefined {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

const TABS = [
  { id: "application", label: "Application" },
  { id: "pipeline", label: "Pipeline Stage" },
  { id: "documents", label: "Documents" },
  { id: "communication", label: "Communication" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

export default function ApplicantEntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("application");
  const timeline = useEntityTimeline("applicant", id);
  const favorite = useFavorite("applicant", id);
  const comments = useComments("applicant", id);
  const attachments = useAttachments("applicant", id);
  const currentUser = getUserFromStorage();
  const { toast } = useToast();

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertStudent, setConvertStudent] = useState<SearchSelectOption | null>(null);
  const [converting, setConverting] = useState(false);

  const fetchInquiry = () => {
    setLoading(true);
    return fetch(`${API_URL}/admission-inquiries/${id}`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(setInquiry)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!id) return;
    fetchInquiry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertStudent) return;
    setConverting(true);
    try {
      const res = await fetch(`${API_URL}/admission-inquiries/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ studentId: convertStudent.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to link student");
      }
      toast("Linked to student record", { type: "success" });
      setIsConvertModalOpen(false);
      setConvertStudent(null);
      fetchInquiry();
    } catch (err: any) {
      toast(err.message || "Failed to link student", { type: "error" });
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-text-secondary">Loading applicant...</div>;
  if (notFound || !inquiry) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Applicant not found.
        <div className="mt-3">
          <a href="/dashboard/admin/admissions-pipeline"><Button variant="outline" size="sm">Back to Admissions Pipeline</Button></a>
        </div>
      </div>
    );
  }

  const followups = inquiry.followUps ?? [];

  return (
    <>
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Admissions Pipeline", href: "/dashboard/admin/admissions-pipeline" }, { label: inquiry.childName ?? "Applicant" }],
        title: inquiry.childName ?? "Applicant",
        subtitle: inquiry.gradeInterested ? `Applying for ${inquiry.gradeInterested}` : undefined,
        status: inquiry.status ? inquiry.status.toLowerCase() : "pending",
        meta: [
          inquiry.phone ? { label: "Phone", value: inquiry.phone } : null,
          inquiry.email ? { label: "Email", value: inquiry.email } : null,
          inquiry.source ? { label: "Source", value: inquiry.source } : null,
        ].filter(Boolean) as any,
        actions: (
          <div className="flex items-center gap-2">
            {inquiry.convertedStudentId ? (
              <a href={`/students/${inquiry.convertedStudentId}`}>
                <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                  View Student{inquiry.convertedStudent?.fullName ? `: ${inquiry.convertedStudent.fullName}` : ""}
                </Button>
              </a>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsConvertModalOpen(true)}>
                Link to Student
              </Button>
            )}
            <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />
          </div>
        ),
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[{ label: "Admissions Pipeline", description: "Full inquiry-to-enrolled pipeline.", href: "/dashboard/admin/admissions-pipeline" }]}
    >
      {activeTab === "application" && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 border border-border rounded-[14px] p-4">
          {[
            ["Applicant Name", inquiry.childName],
            ["Grade Interested", inquiry.gradeInterested],
            ["Parent / Guardian", inquiry.parentName],
            ["Phone", inquiry.phone],
            ["Email", inquiry.email],
            ["Source", inquiry.source],
            ["Assigned To", inquiry.assignedToStaff?.fullName],
            ["Notes", inquiry.notes],
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

      {activeTab === "pipeline" && (
        <div className="border border-border rounded-[14px] p-4 flex items-center justify-between">
          <span className="text-sm text-text-primary">Current stage</span>
          <StatusPill status={(inquiry.status ?? "pending").toLowerCase()} label={inquiry.status ?? "Pending"} />
        </div>
      )}

      {activeTab === "documents" && (
        <AttachmentList
          entityType="applicant"
          entityId={id}
          attachments={attachments.attachments}
          loading={attachments.loading}
          uploading={attachments.uploading}
          onUpload={attachments.upload}
          onDelete={attachments.remove}
        />
      )}

      {activeTab === "communication" &&
        (followups.length > 0 ? (
          <ul className="divide-y divide-border border border-border rounded-[14px] overflow-hidden">
            {followups.map((f: any) => (
              <li key={f.id} className="px-3.5 py-2.5">
                <p className="text-sm text-text-primary">{f.note}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {f.followUpDate ? new Date(f.followUpDate).toLocaleDateString() : ""}{f.createdByStaff?.fullName ? ` · ${f.createdByStaff.fullName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 border border-dashed border-border rounded-[14px]">
            <p className="text-sm text-text-secondary">No follow-up communication on file for this applicant.</p>
          </div>
        ))}

      {activeTab === "comments" && (
        <CommentThread
          entityType="applicant"
          entityId={id}
          comments={comments.comments}
          loading={comments.loading}
          posting={comments.posting}
          onSubmit={comments.submit}
          currentUserName={currentUser?.fullName ?? "You"}
        />
      )}

      {activeTab === "activity" && (
        <Timeline items={timeline.items} loading={timeline.loading} emptyMessage="No audit-log activity recorded for this applicant yet." />
      )}
    </EntityPageShell>

    <Modal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title="Link to Student Record">
      <form className="space-y-4 pt-4" onSubmit={handleConvert}>
        <p className="text-sm text-text-secondary">
          If this applicant has already been admitted and registered as a student (via Student Admissions), search for and select that record to permanently link the two — this marks the inquiry Converted and lets both records cross-navigate to each other.
        </p>
        <SearchSelect
          label="Student"
          entityType="student"
          placeholder="Search by name or admission no..."
          value={convertStudent}
          onChange={setConvertStudent}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsConvertModalOpen(false)}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!convertStudent || converting}>
            {converting ? "Linking..." : "Link Student"}
          </Button>
        </div>
      </form>
    </Modal>
    </>
  );
}
