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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/admission-inquiries/${id}`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(setInquiry)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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

  // admission-inquiry.service.ts::getById's exact shape wasn't fully confirmed —
  // follow-ups are read defensively; if absent, the Communication tab honestly
  // falls back to the gap-state message below.
  const followups = inquiry.followups ?? inquiry.followUps ?? [];

  return (
    <EntityPageShell
      header={{
        breadcrumb: [{ label: "Admissions Pipeline", href: "/dashboard/admin/admissions-pipeline" }, { label: inquiry.studentName ?? inquiry.fullName ?? "Applicant" }],
        title: inquiry.studentName ?? inquiry.fullName ?? "Applicant",
        subtitle: inquiry.classApplied ? `Applying for ${inquiry.classApplied}` : undefined,
        status: inquiry.status ? inquiry.status.toLowerCase() : "pending",
        meta: [
          inquiry.phone ? { label: "Phone", value: inquiry.phone } : null,
          inquiry.email ? { label: "Email", value: inquiry.email } : null,
        ].filter(Boolean) as any,
        actions: <ActionMenu items={buildStandardActions({ isFavorite: favorite.isFavorite, onToggleFavorite: favorite.toggle })} />,
      }}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      relatedLinks={[{ label: "Admissions Pipeline", description: "Full inquiry-to-enrolled pipeline.", href: "/dashboard/admin/admissions-pipeline" }]}
    >
      {activeTab === "application" && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 border border-border rounded-[14px] p-4">
          {[
            ["Applicant Name", inquiry.studentName ?? inquiry.fullName],
            ["Class Applied", inquiry.classApplied],
            ["Parent / Guardian", inquiry.guardianName ?? inquiry.parentName],
            ["Phone", inquiry.phone],
            ["Email", inquiry.email],
            ["Source", inquiry.sourceOfInfo],
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
                <p className="text-sm text-text-primary">{f.note ?? f.remarks ?? "Follow-up"}</p>
                <p className="text-xs text-text-secondary mt-0.5">{f.date ? new Date(f.date).toLocaleDateString() : ""}</p>
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
  );
}
