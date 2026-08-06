"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Clock, Calendar, CheckCircle2, AlertCircle, FileText, BookOpen, ClipboardList } from "lucide-react";

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}

function StudentDashboardContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [data, setData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`${API_URL}/portal/student/${id}/dashboard`)
        .then(res => res.json())
        .then(setData)
        .catch(() => toast("Failed to load dashboard", { type: "error" }));
      
      fetch(`${API_URL}/communication/announcements`)
        .then(res => res.json())
        .then(data => setAnnouncements(data.filter((a: any) => ["ALL", "STUDENTS"].includes(a.targetAudience))));

    }
  }, [id]);

  // Scope LMS content/assignments to the student's own class once the dashboard has loaded
  useEffect(() => {
    const classId = data?.enrollment?.section?.classId;
    if (!classId) return;

    fetch(`${API_URL}/lms/resources?classId=${classId}`)
      .then(res => res.json())
      .then(setContent);

    fetch(`${API_URL}/lms/assignments?classId=${classId}`)
      .then(res => res.json())
      .then(setAssignments);
  }, [data]);

  const handleSubmitAssignment = async () => {
    if (!activeAssignment || !data?.student?.id) return;
    if (!submissionText.trim()) {
      toast("Write something (or paste a link) before submitting", { type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/lms/assignments/${activeAssignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: data.student.id, content: submissionText }),
      });
      if (res.ok) {
        const submission = await res.json();
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === activeAssignment.id
              ? { ...a, submissions: [...(a.submissions || []), submission] }
              : a
          )
        );
        toast("Homework submitted", { type: "success" });
        setActiveAssignment(null);
        setSubmissionText("");
      } else {
        toast("Could not submit homework", { type: "error" });
      }
    } catch {
      toast("Action failed", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return <div className="p-8 text-center">Loading...</div>;

  const { student, enrollment, attendanceRate, upcomingExams, timetable, reportCards } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500">
            {student.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.fullName}</h1>
            <p className="text-text-secondary">Adm No: {student.admissionNumber} | Class: {enrollment?.section?.class?.grade || "N/A"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-secondary">Document Status</p>
          {student.documentsVerified ? (
            <Badge variant="success" className="mt-1"><CheckCircle2 className="w-3 h-3 mr-1"/> Verified</Badge>
          ) : (
            <Badge variant="warning" className="mt-1"><AlertCircle className="w-3 h-3 mr-1"/> Pending</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Announcements */}
        <Card className="md:col-span-3 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">📢 School Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((ann, i) => (
                  <div key={i} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-bold text-lg mb-1">{ann.title}</h3>
                    <p className="text-sm text-text-secondary mb-2">{ann.body}</p>
                    {ann.eventDate && <span className="text-xs font-semibold text-primary">Event: {new Date(ann.eventDate).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No new announcements.</p>
            )}
          </CardContent>
        </Card>

        {/* Timetable */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Today&apos;s Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            {timetable && timetable.length > 0 ? (
              <div className="space-y-3">
                {timetable.map((t: any, i: number) => (
                  <div key={i} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                    <div className="font-semibold">{t.subject?.name}</div>
                    <div className="text-text-secondary text-sm">{t.startTime} - {t.endTime}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No classes scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success"/> Attendance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-bold text-primary mb-2">{attendanceRate}%</div>
            <p className="text-sm text-text-secondary">Overall Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary"/> Course Content</CardTitle>
          </CardHeader>
          <CardContent>
            {content.length > 0 ? (
              <div className="space-y-3">
                {content.map((c, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                    <div>
                      <div className="font-semibold">{c.title}</div>
                      <div className="text-text-secondary text-sm">{c.subject?.name}</div>
                    </div>
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">View</a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No course content available.</p>
            )}
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-warning"/> Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((a, i) => {
                  const mySubmission = a.submissions?.find((s: any) => s.studentId === student.id);
                  return (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold">{a.title}</div>
                        <div className="text-xs font-bold text-error">Due: {a.dueDate}</div>
                      </div>
                      <div className="text-text-secondary text-sm mb-3">{a.subject?.name}</div>
                      {mySubmission ? (
                        <Badge variant="success" className="w-full justify-center py-1.5">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => { setActiveAssignment(a); setSubmissionText(""); }}
                        >
                          Submit Homework
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-text-secondary">No pending assignments.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-warning"/> Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExams && upcomingExams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingExams.map((ex: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold">{ex.date}</TableCell>
                      <TableCell>{ex.subject?.name}</TableCell>
                      <TableCell>{ex.startTime} - {ex.endTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-text-secondary">No upcoming exams.</p>
            )}
          </CardContent>
        </Card>

        {/* Report Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/> Latest Report Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {reportCards && reportCards.length > 0 ? (
              <div className="space-y-4">
                {reportCards.map((rc: any, i: number) => (
                  <div key={i} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold">{rc.exam?.name}</div>
                      <Badge variant={rc.isApproved ? "success" : "warning"}>{rc.isApproved ? "Finalized" : "Draft"}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>GPA: <span className="font-bold">{rc.gpa}</span></div>
                      <div>Percentage: <span className="font-bold">{rc.computedData?.percentage}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No report cards issued yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={!!activeAssignment} onClose={() => setActiveAssignment(null)} title={activeAssignment?.title || "Submit Homework"} size="md">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{activeAssignment?.subject?.name} · Due {activeAssignment?.dueDate}</p>
          <Textarea
            label="Your answer"
            placeholder="Type your answer, or paste a link to your work"
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
          />
          <Button variant="primary" className="w-full" onClick={handleSubmitAssignment} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
