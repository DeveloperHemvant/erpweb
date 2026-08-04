"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Clock, Calendar, CheckCircle2, AlertCircle, FileText, Wallet, BookOpen, MapPin, Home } from "lucide-react";

export default function ParentDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ParentDashboardContent />
    </Suspense>
  );
}

function ParentDashboardContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [data, setData] = useState<any>(null);
  const [activeChildIdx, setActiveChildIdx] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [transport, setTransport] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [hostel, setHostel] = useState<any>(null);

  const [showMapModal, setShowMapModal] = useState(false);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [grievanceForm, setGrievanceForm] = useState({ title: "", description: "" });
  const [submittingGrievance, setSubmittingGrievance] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState<{ id: string; amount: string } | null>(null);
  const [payForm, setPayForm] = useState({ paymentMode: "UPI", referenceNo: "" });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`${API_URL}/portal/parent/${id}/dashboard`)
        .then(res => res.json())
        .then(setData)
        .catch(() => toast("Failed to load dashboard", { type: "error" }));
      
      fetch(`${API_URL}/communication/announcements`)
        .then(res => res.json())
        .then(data => setAnnouncements(data.filter((a: any) => ["ALL", "PARENTS"].includes(a.targetAudience))));
    }
  }, [id]);

  // When child data is loaded, fetch child-specific modules
  useEffect(() => {
    if (data && data.children && data.children[activeChildIdx]) {
      const childEnrollmentId = data.children[activeChildIdx].enrollment.id;
      const childClassId = data.children[activeChildIdx].enrollment.section?.classId;

      fetch(`${API_URL}/lms/assignments${childClassId ? `?classId=${childClassId}` : ""}`)
        .then(res => res.json())
        .then(setAssignments);

      fetch(`${API_URL}/transport/students/${childEnrollmentId}`)
        .then(res => res.json())
        .then(setTransport)
        .catch(() => setTransport(null));

      fetch(`${API_URL}/library/student/${childEnrollmentId}`)
        .then(res => res.json())
        .then(setLibrary)
        .catch(() => setLibrary([]));

      fetch(`${API_URL}/hostel/student/${childEnrollmentId}`)
        .then(res => res.json())
        .then(setHostel)
        .catch(() => setHostel(null));
    }
  }, [data, activeChildIdx]);

  if (!data) return <div className="p-8 text-center">Loading...</div>;

  const { parent, children } = data;
  if (!children || children.length === 0) return <div className="p-8 text-center">No linked children found.</div>;

  const childData = children[activeChildIdx];
  const { student, enrollment, attendanceRate, upcomingExams, timetable, reportCards, pendingInvoices } = childData;

  // No online payment gateway (Stripe/Razorpay) is configured for this deployment, so
  // "Pay Now" records a payment the parent already made externally (UPI/bank transfer/cheque)
  // against the real fee ledger, instead of faking a gateway success response.
  const openPayModal = (invoiceId: string, amount: string) => {
    setPayTarget({ id: invoiceId, amount });
    setPayForm({ paymentMode: "UPI", referenceNo: "" });
    setShowPayModal(true);
  };

  const handleRecordPayment = async () => {
    if (!payTarget) return;
    if (!payForm.referenceNo.trim()) {
      toast("Enter the transaction/reference number for this payment", { type: "error" });
      return;
    }
    setSubmittingPayment(true);
    try {
      const res = await fetch(`${API_URL}/erp-core/fees/${payTarget.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: payTarget.amount,
          paymentMode: payForm.paymentMode,
          referenceNo: payForm.referenceNo,
          paymentDate: new Date().toISOString().slice(0, 10),
        })
      });
      if (res.ok) {
        toast("Payment recorded — the school will reconcile it shortly", { type: "success" });
        setShowPayModal(false);
        setPayTarget(null);
        fetch(`${API_URL}/portal/parent/${id}/dashboard`).then(r => r.json()).then(setData);
      } else {
        toast("Could not record payment", { type: "error" });
      }
    } catch {
      toast("Action failed", { type: "error" });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const latestTrip = transport?.stop?.route?.TransportTrip?.[0] || transport?.route?.TransportTrip?.[0];
  const latestLog = latestTrip?.logs?.[0];

  const handleFileGrievance = async () => {
    const hostelId = hostel?.room?.hostel?.id;
    const enrollmentId = childData?.enrollment?.id;
    if (!hostelId || !enrollmentId) return;
    if (!grievanceForm.title.trim() || !grievanceForm.description.trim()) {
      toast("Please fill in both a title and description", { type: "error" });
      return;
    }
    setSubmittingGrievance(true);
    try {
      const res = await fetch(`${API_URL}/hostel/grievances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostelId, enrollmentId, ...grievanceForm })
      });
      if (res.ok) {
        toast("Grievance filed — the warden has been notified", { type: "success" });
        setShowGrievanceModal(false);
        setGrievanceForm({ title: "", description: "" });
      } else {
        toast("Could not file grievance", { type: "error" });
      }
    } catch {
      toast("Action failed", { type: "error" });
    } finally {
      setSubmittingGrievance(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl border shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {parent.name}</h1>
          <p className="text-text-secondary">Parent Portal</p>
        </div>
        <div className="w-full md:w-64">
          <Select
            label="Select Child"
            value={activeChildIdx.toString()}
            onChange={(e) => setActiveChildIdx(parseInt(e.target.value))}
            options={children.map((c: any, i: number) => ({
              label: `${c.student.fullName} (${c.student.admissionNumber})`,
              value: i.toString()
            }))}
          />
        </div>
      </div>

      {/* Pending Fees Section */}
      {pendingInvoices && pendingInvoices.length > 0 && (
        <Card className="border-warning border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning"><Wallet className="w-5 h-5"/> Pending Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvoices.map((inv: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>Term Fee</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell className="font-bold">₹{inv.totalAmount || inv.amount}</TableCell>
                    <TableCell>
                      <Button variant="primary" size="sm" onClick={() => openPayModal(inv.id, inv.totalAmount || inv.amount)}>
                        Pay Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Child Specific Content */}
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
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Today's Timetable</CardTitle>
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
            <div className="text-5xl font-bold text-primary mb-2">{attendanceRate || "0%"}</div>
            <p className="text-sm text-text-secondary">Overall Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Assignments */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-warning"/> Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((a, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-text-secondary text-sm">{a.subject?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-error">Due: {a.dueDate}</div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Not Submitted</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No pending assignments.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {/* Transport */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/> Transport</CardTitle>
          </CardHeader>
          <CardContent>
            {transport ? (
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-text-secondary text-sm">Route</span>
                  <span className="font-semibold text-sm">{transport.stop?.route?.routeName || transport.route?.routeName || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-text-secondary text-sm">Stop</span>
                  <span className="font-semibold text-sm">{transport.stop?.stopName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary text-sm">ETA</span>
                  <span className="font-bold text-primary">{transport.stop?.arrivalTime || "07:30 AM"}</span>
                </div>
                <Button variant="outline" className="w-full mt-4 text-xs" onClick={() => setShowMapModal(true)}>View Live Map</Button>
              </div>
            ) : (
              <p className="text-text-secondary text-sm">Not opted for school transport.</p>
            )}
          </CardContent>
        </Card>

        {/* Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-warning"/> Library Books</CardTitle>
          </CardHeader>
          <CardContent>
            {library.length > 0 ? (
              <div className="space-y-3">
                {library.map((issue, i) => (
                  <div key={i} className="flex justify-between items-start p-2 border rounded bg-slate-50 dark:bg-slate-800">
                    <div>
                      <div className="text-sm font-semibold">{issue.book?.title}</div>
                      <div className="text-xs text-text-secondary">Return by: {new Date(issue.dueDate).toLocaleDateString()}</div>
                    </div>
                    {issue.status === "Issued" ? (
                      <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">Pending</span>
                    ) : (
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">Returned</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">No books currently issued.</p>
            )}
          </CardContent>
        </Card>

        {/* Hostel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Home className="w-5 h-5 text-success"/> Hostel Info</CardTitle>
          </CardHeader>
          <CardContent>
            {hostel ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-text-secondary">Hostel</span>
                  <span className="font-semibold">{hostel.room.hostel.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-text-secondary">Room</span>
                  <span className="font-semibold">{hostel.room.roomNumber}</span>
                </div>
                <Button variant="outline" className="w-full mt-2 text-xs" onClick={() => setShowGrievanceModal(true)}>File Grievance</Button>
              </div>
            ) : (
              <p className="text-text-secondary text-sm">Not enrolled in hostel.</p>
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

      {/* Live Map Modal */}
      <Modal isOpen={showMapModal} onClose={() => setShowMapModal(false)} title="Live Bus Location" size="lg">
        {latestLog && latestLog.latitude != null && latestLog.longitude != null ? (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border h-80">
              <iframe
                title="Live bus location"
                className="w-full h-full"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${latestLog.longitude - 0.01}%2C${latestLog.latitude - 0.01}%2C${latestLog.longitude + 0.01}%2C${latestLog.latitude + 0.01}&layer=mapnik&marker=${latestLog.latitude}%2C${latestLog.longitude}`}
              />
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Status: <span className="font-semibold text-text-primary">{latestLog.status}</span></span>
              <span>Last updated: {new Date(latestLog.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-sm py-6 text-center">
            No live GPS ping has been received for this route's bus yet. Tracking data appears here once the driver's trip is underway.
          </p>
        )}
      </Modal>

      {/* File Grievance Modal */}
      <Modal isOpen={showGrievanceModal} onClose={() => setShowGrievanceModal(false)} title="File a Hostel Grievance" size="md">
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Broken window in room"
            value={grievanceForm.title}
            onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Describe the issue in detail"
            value={grievanceForm.description}
            onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
          />
          <Button variant="primary" className="w-full" onClick={handleFileGrievance} disabled={submittingGrievance}>
            {submittingGrievance ? "Submitting..." : "Submit Grievance"}
          </Button>
        </div>
      </Modal>

      {/* Pay Now Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Fee Payment" size="md">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Online card/UPI checkout isn't connected for this school yet. Pay via UPI, NetBanking, or Cheque outside the
            app, then record the transaction here so the front office can confirm it against the invoice.
          </p>
          <div className="text-sm">
            Amount due: <span className="font-bold text-primary">₹{payTarget?.amount}</span>
          </div>
          <Select
            label="Payment Mode"
            value={payForm.paymentMode}
            onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })}
            options={[
              { label: "UPI", value: "UPI" },
              { label: "NetBanking", value: "NetBanking" },
              { label: "Cheque", value: "Cheque" },
            ]}
          />
          <Input
            label="Transaction / Reference Number"
            placeholder="e.g. UPI Ref, Cheque No."
            value={payForm.referenceNo}
            onChange={(e) => setPayForm({ ...payForm, referenceNo: e.target.value })}
          />
          <Button variant="primary" className="w-full" onClick={handleRecordPayment} disabled={submittingPayment}>
            {submittingPayment ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
