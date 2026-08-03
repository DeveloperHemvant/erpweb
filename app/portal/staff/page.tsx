"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { Briefcase, Calendar, CheckCircle2, DollarSign } from "lucide-react";

export default function StaffDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <StaffDashboardContent />
    </Suspense>
  );
}

function StaffDashboardContent() {
  const searchParams = useSearchParams();
  const staffId = searchParams.get("staffId");
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [workload, setWorkload] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);

  useEffect(() => {
    if (staffId) {
      // Workload
      fetch(`${API_URL}/hr/staff/${staffId}/workload`)
        .then(res => res.json())
        .then(setWorkload)
        .catch(() => toast("Failed to load workload", { type: "error" }));

      // Leave Balances for current year
      const year = new Date().getFullYear();
      fetch(`${API_URL}/hr/leave-balances/${staffId}/${year}`)
        .then(res => res.json())
        .then(setLeaveBalances)
        .catch(() => toast("Failed to load leave balances", { type: "error" }));
    }
  }, [staffId]);

  if (!staffId) return <div className="p-8 text-center text-error">No Staff ID provided.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Staff Portal</h1>
          <p className="text-text-secondary mt-1">Manage your workload, attendance, and payroll.</p>
        </div>
        <Button variant="primary">Mark Daily Attendance</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workload */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/> Current Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {workload.length > 0 ? (
              <div className="space-y-3">
                {workload.map((w, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded bg-slate-50 dark:bg-slate-800">
                    <div>
                      <div className="font-semibold">{w.subject?.name}</div>
                      <div className="text-sm text-text-secondary">Class {w.section?.class?.name} - {w.section?.name}</div>
                    </div>
                    <span className="text-xs font-bold text-primary">{w.periodsPerWeek} periods/wk</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">No active assignments.</p>
            )}
          </CardContent>
        </Card>

        {/* Leave Balances */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-warning"/> Leave Balances ({new Date().getFullYear()})</CardTitle>
            <Button size="sm" variant="outline">Apply Leave</Button>
          </CardHeader>
          <CardContent>
            {leaveBalances.length > 0 ? (
              <div className="space-y-3">
                {leaveBalances.map((lb, i) => (
                  <div key={i} className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold">{lb.leaveType}</span>
                    <div className="text-sm">
                      <span className="text-success font-bold">{lb.totalAllowed - lb.used}</span>
                      <span className="text-text-secondary"> / {lb.totalAllowed} remaining</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">No leave balances found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payslips Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-success"/> Monthly Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month/Year</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* In a full implementation, we'd fetch and map payslips here */}
              <TableRow>
                <TableCell colSpan={4} className="text-center text-text-secondary">No payslips generated yet.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
