"use client";

import React, { useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Calendar,
  Wallet,
  ArrowRight,
  FileCheck2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useToast } from "@/components/ui/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DashboardSummary {
  attendanceRate: number;
  totalRevenue: number;
  totalOutstanding: number;
  staffCount: number;
  studentCount: number;
}

interface DashboardTrends {
  revenueByClass: { name: string; collected: number; outstanding: number }[];
  attendanceTrend: { date: string; rate: number }[];
}

interface AuditLogRow {
  id: string;
  action: string;
  module: string;
  entityType: string | null;
  performedBy: string;
  timestamp: string;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  targetAudience: string;
}

export default function DashboardHome() {
  const { toast } = useToast();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: HeadersInit | undefined = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [classCount, setClassCount] = useState<number | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/analytics/dashboard/summary`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then(setSummary)
      .catch(() => toast("Failed to load dashboard summary", { type: "error" }));

    fetch(`${API_URL}/analytics/dashboard/trends`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then(setTrends)
      .catch(() => toast("Failed to load dashboard trends", { type: "error" }));

    fetch(`${API_URL}/master-data/classes`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setClassCount(Array.isArray(data) ? data.length : null))
      .catch(() => {});

    fetch(`${API_URL}/audit-logs?pageSize=3`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setRecentLogs(json?.data || []))
      .catch(() => {});

    fetch(`${API_URL}/communication/announcements`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAnnouncements(Array.isArray(data) ? data.slice(0, 2) : []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (n: number) =>
    `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const activityIcon = (action: string) => {
    if (action?.includes("DELETE")) return <AlertCircle className="h-4 w-4 text-error" />;
    if (action?.includes("CREATE")) return <FileCheck2 className="h-4 w-4 text-success" />;
    return <ShieldAlert className="h-4 w-4 text-primary" />;
  };

  const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  return (
    <>
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Academic Performance Dashboard
          </h1>
          <p className="text-sm text-text-secondary">
            Aggregated real-time metrics for current term.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="success" className="h-6">
            System Live
          </Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Enrollment"
          value={summary ? summary.studentCount.toLocaleString() : "—"}
          description="Active students enrolled"
          icon={<GraduationCap className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Today's Attendance"
          value={summary ? `${summary.attendanceRate}%` : "—"}
          description="Present today, of records marked"
          icon={<Users className="h-5 w-5 text-success" />}
        />
        <MetricCard
          title="Outstanding Fees"
          value={summary ? formatCurrency(summary.totalOutstanding) : "—"}
          description="Unpaid across all invoices"
          icon={<Wallet className="h-5 w-5 text-danger" />}
        />
        <MetricCard
          title="Active Staff"
          value={summary ? summary.staffCount.toLocaleString() : "—"}
          description={classCount != null ? `${classCount} classes on record` : "Active staff on record"}
          icon={<Calendar className="h-5 w-5 text-info" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>
              Daily present rate across the last 7 days, all campuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.attendanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="rate" name="Present %" fill="#C99A3E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection by Class */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection by Class</CardTitle>
            <CardDescription>Collected vs. outstanding, current invoices.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.revenueByClass || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#4C7A6B" fill="rgba(76,122,107,0.15)" strokeWidth={2} />
                <Area type="monotone" dataKey="outstanding" name="Outstanding" stroke="#C1502E" fill="rgba(193,80,46,0.08)" strokeWidth={1.5} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recents and Announcements Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Log</CardTitle>
            <CardDescription>Latest entries from the system audit trail.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-text-secondary py-6 text-center">No recent activity recorded.</p>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 items-start p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-[10px] transition-colors">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700/60 rounded-btn">
                      {activityIcon(log.action)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{log.action} · {log.module}</p>
                      <p className="text-xs text-text-secondary mt-0.5">by {log.performedBy}</p>
                    </div>
                    <span className="text-[10px] text-text-secondary whitespace-nowrap pt-1">
                      {timeAgo(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Campus Announcements</CardTitle>
              <CardDescription>Institutional news from administration offices.</CardDescription>
            </div>
            <Link href="/dashboard/admin/announcements">
              <Button variant="ghost" size="sm" className="h-8 cursor-pointer">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-text-secondary py-6 text-center">No announcements yet.</p>
            ) : (
              <div className="space-y-4.5">
                {announcements.map((anc) => (
                  <div key={anc.id} className="border-l-4 border-primary pl-3 space-y-1">
                    <Badge variant="primary" className="text-[9px] uppercase tracking-wider py-0 px-2">
                      {anc.targetAudience}
                    </Badge>
                    <h4 className="text-sm font-bold text-text-primary">{anc.title}</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">{anc.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
