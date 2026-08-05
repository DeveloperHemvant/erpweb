"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { DataGrid } from "@/components/shared/DataGrid";
import { Users, DollarSign, Activity, CheckCircle2, XCircle, Plus } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default function HrAdminDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("payroll");

  const [isRunning, setIsRunning] = useState(false);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loadingPayslips, setLoadingPayslips] = useState(true);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ staffId: "", reviewerId: "", cycle: "", rating: "5", comments: "" });

  const fetchPayslips = async (m?: string, y?: string) => {
    setLoadingPayslips(true);
    try {
      const data = await api(`/hr/payslips?month=${m ?? month}&year=${y ?? year}`);
      setPayslips(data || []);
    } catch (err: any) {
      toast("Error", { description: err.message, type: "error" });
    } finally {
      setLoadingPayslips(false);
    }
  };

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      setLeaves(await api("/hr/leave-applications"));
    } catch (err: any) {
      toast("Error", { description: err.message, type: "error" });
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      setReviews(await api("/hr/performance-reviews"));
    } catch (err: any) {
      toast("Error", { description: err.message, type: "error" });
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
    fetchLeaves();
    fetchReviews();
    fetch(`${API_URL}/staff`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setStaffList(list);
      })
      .catch(() => {});
  }, []);

  const runPayroll = async () => {
    setIsRunning(true);
    try {
      const data = await api("/hr/payroll/run", { method: "POST", body: JSON.stringify({ month: Number(month), year: Number(year) }) });
      toast("Payroll Run Complete", { description: `Successfully generated ${data.count} payslips.`, type: "success" });
      fetchPayslips();
    } catch (err: any) {
      toast("Payroll Error", { description: err.message, type: "error" });
    } finally {
      setIsRunning(false);
    }
  };

  const processLeave = async (id: string, status: "Approved" | "Rejected") => {
    setProcessingLeaveId(id);
    try {
      const admin = JSON.parse(localStorage.getItem("user") || "{}");
      await api(`/hr/leave-applications/${id}/process`, { method: "PATCH", body: JSON.stringify({ status, resolvedById: admin.id }) });
      toast("Success", { description: `Leave ${status.toLowerCase()}`, type: "success" });
      fetchLeaves();
    } catch (err: any) {
      toast("Error", { description: err.message, type: "error" });
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/hr/performance-reviews", { method: "POST", body: JSON.stringify({ ...reviewForm, rating: Number(reviewForm.rating) }) });
      toast("Success", { description: "Performance review logged", type: "success" });
      setReviewModalOpen(false);
      setReviewForm({ staffId: "", reviewerId: "", cycle: "", rating: "5", comments: "" });
      fetchReviews();
    } catch (err: any) {
      toast("Error", { description: err.message, type: "error" });
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const totalNet = payslips.reduce((s, p) => s + Number(p.netSalary || 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-primary">HR & Payroll Admin</h1>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "payroll", label: "Payroll", icon: <DollarSign className="w-4 h-4" /> },
          { id: "leaves", label: `Leave Requests${pendingLeaves.length ? ` (${pendingLeaves.length})` : ""}`, icon: <Users className="w-4 h-4" /> },
          { id: "reviews", label: "Performance", icon: <Activity className="w-4 h-4" /> },
        ]}
      />

      {activeTab === "payroll" && (
        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-success" /> Monthly Payroll</CardTitle>
              <CardDescription>Run the payroll engine for a month. Processes LOP deductions and generates (or updates) payslips.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="w-32">
                <Select label="Month" value={month} onChange={(e) => { setMonth(e.target.value); fetchPayslips(e.target.value, year); }}
                  options={Array.from({ length: 12 }, (_, i) => ({ label: new Date(2026, i, 1).toLocaleString("default", { month: "long" }), value: String(i + 1) }))} />
              </div>
              <div className="w-28">
                <Select label="Year" value={year} onChange={(e) => { setYear(e.target.value); fetchPayslips(month, e.target.value); }}
                  options={["2025", "2026", "2027"].map((y) => ({ label: y, value: y }))} />
              </div>
              <Button onClick={runPayroll} disabled={isRunning} isLoading={isRunning}>
                {isRunning ? "Processing..." : "Run Payroll Now"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Payslips — {new Date(2026, Number(month) - 1, 1).toLocaleString("default", { month: "long" })} {year}</CardTitle>
              <CardDescription>{payslips.length} payslips · Total net payout ₹{totalNet.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayslips ? (
                <p className="text-sm text-text-secondary">Loading...</p>
              ) : payslips.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">
                  No payslips generated for this month yet. Click &quot;Run Payroll Now&quot; above.
                </div>
              ) : (
                <DataGrid
                  columns={[
                    { key: "staff", header: "Staff", render: (p: any) => <span className="font-medium">{p.staff?.fullName}</span> },
                    { key: "role", header: "Role", render: (p: any) => <span className="text-text-secondary">{p.staff?.role?.name}</span> },
                    { key: "basicSalary", header: "Basic", render: (p: any) => `₹${Number(p.basicSalary).toLocaleString()}` },
                    { key: "allowances", header: "Allowances", render: (p: any) => `₹${Number(p.allowances).toLocaleString()}` },
                    { key: "fixedDeductions", header: "Deductions", render: (p: any) => `₹${Number(p.fixedDeductions).toLocaleString()}` },
                    { key: "lopDeductions", header: "LOP", render: (p: any) => <span className={Number(p.lopDeductions) > 0 ? "text-danger" : ""}>₹{Number(p.lopDeductions).toLocaleString()}</span> },
                    { key: "netSalary", header: "Net Salary", render: (p: any) => <span className="font-bold">₹{Number(p.netSalary).toLocaleString()}</span> },
                    { key: "status", header: "Status", render: (p: any) => <Badge variant={p.status === "Paid" ? "success" : "neutral"}>{p.status}</Badge> },
                  ]}
                  rows={payslips}
                  rowKey={(p: any) => p.id}
                  onRowClick={(p: any) => p.staff?.id && router.push(`/staff/${p.staff.id}`)}
                  emptyMessage="No payslips generated for this month yet."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "leaves" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Leave Requests</CardTitle>
            <CardDescription>{pendingLeaves.length} pending leave applications require your approval.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLeaves ? (
              <p className="text-sm text-text-secondary">Loading...</p>
            ) : leaves.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">No leave applications found.</div>
            ) : (
              <DataGrid
                columns={[
                  { key: "staff", header: "Staff", render: (l: any) => <span className="font-medium">{l.staff?.fullName}</span> },
                  { key: "leaveType", header: "Type" },
                  { key: "dates", header: "Dates", render: (l: any) => <span className="text-text-secondary">{new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}</span> },
                  { key: "reason", header: "Reason", render: (l: any) => <span className="text-text-secondary">{l.reason || "—"}</span> },
                  { key: "status", header: "Status", render: (l: any) => <Badge variant={l.status === "Approved" ? "success" : l.status === "Rejected" ? "danger" : "warning"}>{l.status}</Badge> },
                  {
                    key: "actions",
                    header: "Actions",
                    className: "text-right",
                    render: (l: any) =>
                      l.status === "Pending" ? (
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" disabled={processingLeaveId === l.id} onClick={() => processLeave(l.id, "Approved")}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-success" /> Approve
                          </Button>
                          <Button variant="outline" size="sm" disabled={processingLeaveId === l.id} onClick={() => processLeave(l.id, "Rejected")}>
                            <XCircle className="w-3.5 h-3.5 mr-1 text-danger" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary">by {l.resolvedBy?.fullName || "—"}</span>
                      ),
                  },
                ]}
                rows={leaves}
                rowKey={(l: any) => l.id}
                onRowClick={(l: any) => l.staff?.id && router.push(`/staff/${l.staff.id}`)}
                emptyMessage="No leave applications found."
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "reviews" && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-warning" /> Performance Reviews</CardTitle>
              <CardDescription>Log and track periodic performance reviews for staff members.</CardDescription>
            </div>
            <Button onClick={() => setReviewModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Log Review</Button>
          </CardHeader>
          <CardContent>
            {loadingReviews ? (
              <p className="text-sm text-text-secondary">Loading...</p>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">No performance reviews logged yet.</div>
            ) : (
              <DataGrid
                columns={[
                  { key: "staff", header: "Staff", render: (r: any) => <span className="font-medium">{r.staff?.fullName}</span> },
                  { key: "cycle", header: "Cycle" },
                  { key: "rating", header: "Rating", render: (r: any) => <Badge variant={r.rating >= 4 ? "success" : r.rating === 3 ? "warning" : "danger"}>{r.rating} / 5</Badge> },
                  { key: "reviewer", header: "Reviewer", render: (r: any) => <span className="text-text-secondary">{r.reviewer?.fullName}</span> },
                  { key: "comments", header: "Comments", render: (r: any) => <span className="text-text-secondary">{r.comments || "—"}</span> },
                ]}
                rows={reviews}
                rowKey={(r: any) => r.id}
                onRowClick={(r: any) => r.staff?.id && router.push(`/staff/${r.staff.id}`)}
                emptyMessage="No performance reviews logged yet."
              />
            )}
          </CardContent>
        </Card>
      )}

      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Log Performance Review">
        <form className="space-y-4 pt-4" onSubmit={submitReview}>
          <Select label="Staff Member" required value={reviewForm.staffId} onChange={(e) => setReviewForm({ ...reviewForm, staffId: e.target.value })}
            options={[{ label: "Select staff...", value: "" }, ...staffList.map((s: any) => ({ label: s.fullName, value: s.id }))]} />
          <Select label="Reviewer" required value={reviewForm.reviewerId} onChange={(e) => setReviewForm({ ...reviewForm, reviewerId: e.target.value })}
            options={[{ label: "Select reviewer...", value: "" }, ...staffList.map((s: any) => ({ label: s.fullName, value: s.id }))]} />
          <Select label="Review Cycle" required value={reviewForm.cycle} onChange={(e) => setReviewForm({ ...reviewForm, cycle: e.target.value })}
            options={[{ label: "Select cycle...", value: "" }, ...["2026 Q1", "2026 Q2", "2026 Q3", "2026 Q4"].map((c) => ({ label: c, value: c }))]} />
          <Select label="Rating" value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
            options={[1, 2, 3, 4, 5].map((n) => ({ label: `${n} / 5`, value: String(n) }))} />
          <div>
            <label className="block text-sm font-medium mb-1">Comments</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3}
              value={reviewForm.comments} onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Review</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
