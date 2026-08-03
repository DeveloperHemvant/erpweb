"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Search, Printer, FileCheck2 } from "lucide-react";

export default function ReportCardsPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [searchQuery, setSearchQuery] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [activeExamId, setActiveExamId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [reportCards, setReportCards] = useState<any[]>([]);

  // Report card modal viewer state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeRemarks, setActiveRemarks] = useState("");
  const [activeApproved, setActiveApproved] = useState(false);
  
  // Certificate state
  const [certificateData, setCertificateData] = useState<any>(null);
  const [certificateType, setCertificateType] = useState<"bonafide"|"transfer">("bonafide");
  const [isCertOpen, setIsCertOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [exRes, stuRes] = await Promise.all([
        fetch(`${API_URL}/erp-core/exams`),
        fetch(`${API_URL}/erp-core/students`)
      ]);
      if (exRes.ok) {
        const exs = await exRes.json();
        setExams(exs);
        if (exs.length > 0) setActiveExamId(exs[0].id);
      }
      if (stuRes.ok) {
        const data = await stuRes.json();
        setStudents(data.data || []);
      }
    } catch {
      toast("Error loading data", { type: "error" });
    }
  };

  const handleGenerateReportCard = async (enrollmentId: string) => {
    if (!activeExamId) return toast("Select an exam first", { type: "warning" });
    try {
      const res = await fetch(`${API_URL}/erp-core/report-cards/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, examId: activeExamId })
      });
      if (res.ok) {
        const rc = await res.json();
        toast("Report Card Generated", { type: "success" });
        // Instead of a full refetch, just merge it into local state for now
        setReportCards(prev => {
          const filtered = prev.filter(p => p.id !== rc.id);
          return [...filtered, rc];
        });
      } else {
        const err = await res.json();
        toast(err.message || "Failed to generate", { type: "error" });
      }
    } catch {
      toast("Action failed", { type: "error" });
    }
  };

  const handleOpenViewer = (stu: any) => {
    const enrId = stu.enrollments?.[0]?.id;
    // For demo purposes, we look in our local reportCards state first, 
    // or simulate finding one if not generated locally in this session yet.
    const rep = reportCards.find(r => r.enrollmentId === enrId && r.examId === activeExamId);
    if (!rep) {
      toast("Please generate report card first.", { type: "warning" });
      return;
    }
    setSelectedReport({ student: stu, report: rep });
    setActiveRemarks(rep.remarks || "");
    setActiveApproved(rep.isApproved);
    setIsViewerOpen(true);
  };

  const handleSaveReportChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    // Ideally call API to update ReportCard remarks & isApproved
    // For this mock, we just update local state
    setReportCards(prev => prev.map(r => 
      r.id === selectedReport.report.id ? { ...r, remarks: activeRemarks, isApproved: activeApproved } : r
    ));
    
    setIsViewerOpen(false);
    toast("Report Card Updated", { type: "success" });
  };

  const handleOpenCertificate = async (stu: any, type: "bonafide"|"transfer") => {
    const enrId = stu.enrollments?.[0]?.id;
    if (!enrId) return toast("No active enrollment found", { type: "error" });

    try {
      const res = await fetch(`${API_URL}/erp-core/students/${enrId}/certificates`);
      if (res.ok) {
        const data = await res.json();
        setCertificateData(data[type]);
        setCertificateType(type);
        setIsCertOpen(true);
      }
    } catch {
      toast("Error generating certificate", { type: "error" });
    }
  };

  const filteredStudents = students.filter((s) => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <div className="mb-4 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-text-secondary">
        <span className="font-semibold text-text-primary">Quick term exams.</span> Uses the simple built-in Exam/Marks system for fast per-term report cards. For full exam lifecycle
        management — question banks, seating plans, invigilators, moderation, and grading schemes — use the{" "}
        <a href="/dashboard/admin/exams" className="text-primary underline underline-offset-2">Examination Command Center (EMS)</a>.
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Student Gradebook &amp; Report Cards
          </h1>
          <p className="text-sm text-text-secondary">
            Generate report cards based on computed grades, and issue certificates.
          </p>
        </div>
        <div className="w-64">
          <Select 
            label="Filter by Exam" 
            value={activeExamId} 
            onChange={e => setActiveExamId(e.target.value)} 
            options={exams.map(e => ({label: e.name, value: e.id}))} 
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <span className="absolute left-3 top-3 text-text-secondary">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 rounded-btn bg-slate-50 dark:bg-slate-800 border border-border text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-primary"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adm No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status (Local Session)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((stu) => {
                const enrId = stu.enrollments?.[0]?.id;
                const hasReport = reportCards.find(r => r.enrollmentId === enrId && r.examId === activeExamId);
                return (
                  <TableRow key={stu.id}>
                    <TableCell className="font-semibold text-primary">{stu.admissionNumber}</TableCell>
                    <TableCell className="font-semibold text-text-primary">{stu.fullName}</TableCell>
                    <TableCell>{stu.classId}</TableCell>
                    <TableCell>
                      {hasReport ? (
                        <Badge variant={hasReport.isApproved ? "success" : "neutral"}>
                          {hasReport.isApproved ? "Approved & Sealed" : "Generated (Pending)"}
                        </Badge>
                      ) : (
                        <Badge variant="warning">Not Generated</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleGenerateReportCard(enrId)}>
                        Generate
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleOpenViewer(stu)} disabled={!hasReport}>
                        View RC
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenCertificate(stu, "bonafide")}>
                        Bonafide
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Card Viewer Modal */}
      <Modal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} title="Student Report Card" size="lg">
        {selectedReport && (
          <form onSubmit={handleSaveReportChanges} className="space-y-6">
            <div id="report-card-print" className="p-6 bg-white dark:bg-slate-900 border rounded-xl space-y-6 text-text-primary">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">AETHERIA GLOBAL SCHOOL</h2>
                <p className="text-sm text-text-secondary">Official Academic Report Card</p>
                <Badge variant="neutral" className="mt-2">Exam: {exams.find(e => e.id === activeExamId)?.name}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <p><span className="font-semibold">Student Name:</span> {selectedReport.student.fullName}</p>
                  <p><span className="font-semibold">Adm No:</span> {selectedReport.student.admissionNumber}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-semibold">Attendance:</span> {selectedReport.report.attendanceRate}</p>
                  <p><span className="font-semibold">Overall Grade (GPA):</span> {selectedReport.report.gpa}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3">Academic Performance</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Marks Obtained</TableHead>
                      <TableHead>Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReport.report.computedData?.subjects?.map((s: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{s.subject}</TableCell>
                        <TableCell>{s.marksObtained}</TableCell>
                        <TableCell>{s.isAbsent ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="font-bold mb-2">Teacher Remarks</h3>
                <Textarea
                  value={activeRemarks}
                  onChange={(e) => setActiveRemarks(e.target.value)}
                  className="w-full text-sm"
                  placeholder="Enter evaluation remarks..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t">
                <input
                  type="checkbox"
                  id="approve-seal"
                  checked={activeApproved}
                  onChange={(e) => setActiveApproved(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                />
                <label htmlFor="approve-seal" className="text-sm font-semibold cursor-pointer">
                  Principal Approval (Lock Report Card)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                Print
              </Button>
              <Button type="submit" variant="primary" leftIcon={<FileCheck2 className="h-4 w-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Certificate Modal */}
      <Modal isOpen={isCertOpen} onClose={() => setIsCertOpen(false)} title="Certificate Generator" size="md">
        {certificateData && (
          <div className="space-y-6 text-center">
            <div className="p-8 border-4 border-double border-slate-300 space-y-6">
              <h1 className="text-2xl font-bold tracking-widest">{certificateData.title}</h1>
              <h2 className="text-lg">AETHERIA GLOBAL SCHOOL</h2>
              <div className="text-left mt-8 leading-loose">
                <p>Date: {certificateData.date}</p>
                <p className="mt-4 italic text-lg">{certificateData.message}</p>
              </div>
              <div className="mt-16 flex justify-between">
                <div>____________________<br/>Clerk</div>
                <div>____________________<br/>Principal</div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>Print Certificate</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
