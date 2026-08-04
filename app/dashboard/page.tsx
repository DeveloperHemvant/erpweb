"use client";

import React from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  Calendar,
  Wallet,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  AlertCircle
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
  Legend
} from "recharts";

// Mock Data
const attendanceData = [
  { name: "Grade 6", present: 94, absent: 6 },
  { name: "Grade 7", present: 92, absent: 8 },
  { name: "Grade 8", present: 96, absent: 4 },
  { name: "Grade 9", present: 88, absent: 12 },
  { name: "Grade 10", present: 95, absent: 5 },
  { name: "Grade 11", present: 91, absent: 9 },
  { name: "Grade 12", present: 97, absent: 3 },
];

const feeCollectionData = [
  { month: "Jan", target: 45000, collected: 42000 },
  { month: "Feb", target: 45000, collected: 43500 },
  { month: "Mar", target: 50000, collected: 49000 },
  { month: "Apr", target: 50000, collected: 48000 },
  { month: "May", target: 55000, collected: 54000 },
  { month: "Jun", target: 55000, collected: 53000 },
];

export default function DashboardHome() {
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
          <Badge variant="primary" className="h-6">
            AY 2026-27
          </Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Enrollment"
          value="1,482"
          description="Active students registered"
          trend={{ value: "+4.2%", type: "up" }}
          icon={<GraduationCap className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Daily Attendance"
          value="93.4%"
          description="Average present today"
          trend={{ value: "+0.8%", type: "up" }}
          icon={<Users className="h-5 w-5 text-success" />}
        />
        <MetricCard
          title="Outstanding Fees"
          value="$12,450"
          description="Term dues pending"
          trend={{ value: "-8.5%", type: "down" }}
          icon={<Wallet className="h-5 w-5 text-danger" />}
        />
        <MetricCard
          title="Active Classes"
          value="54"
          description="Sections running online/hybrid"
          trend={{ value: "Stable", type: "neutral" }}
          icon={<Calendar className="h-5 w-5 text-info" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>
              Average percentage distribution of present/absent students by grade level.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
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
                <Bar dataKey="present" name="Present %" fill="#C99A3E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent %" fill="#C1502E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Goals</CardTitle>
            <CardDescription>Target vs actual fee collection. </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeCollectionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#4C7A6B" fill="rgba(76,122,107,0.15)" strokeWidth={2} />
                <Area type="monotone" dataKey="target" name="Target" stroke="#6B6B63" fill="rgba(107,107,99,0.05)" strokeWidth={1.5} strokeDasharray="5 5" />
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
            <CardDescription>Academic status updates from faculty portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "1",
                  title: "Gradebook Closed for Semester 1",
                  desc: "Gradebook registers finalized by Director.",
                  time: "10 mins ago",
                  icon: <FileCheck2 className="h-4 w-4 text-success" />,
                },
                {
                  id: "2",
                  title: "Alert: Low Attendance Notice Dispatched",
                  desc: "Automated emails sent to 12 guardians.",
                  time: "2 hours ago",
                  icon: <AlertCircle className="h-4 w-4 text-warning" />,
                },
                {
                  id: "3",
                  title: "Quarterly Fee Statement Dispatched",
                  desc: "Invoicing processed for North campus division.",
                  time: "5 hours ago",
                  icon: <Wallet className="h-4 w-4 text-primary" />,
                },
              ].map((activity) => (
                <div key={activity.id} className="flex gap-3 items-start p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-[10px] transition-colors">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700/60 rounded-btn">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{activity.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{activity.desc}</p>
                  </div>
                  <span className="text-[10px] text-text-secondary whitespace-nowrap pt-1">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Campus Announcements</CardTitle>
              <CardDescription>Institutional news from administration offices.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 cursor-pointer">
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4.5">
              {[
                {
                  tag: "Academic",
                  title: "Term 3 Examination Schedules Released",
                  desc: "All physical campus divisions will hold final tests starting from August 10th. Make sure all gradebook logs are updated.",
                },
                {
                  tag: "Finance",
                  title: "Academic Fee Instalment 2 Deadline Alert",
                  desc: "Guardians are advised that fee portals will close collections on August 1st. Standard late charges will be active thereafter.",
                },
              ].map((anc, idx) => (
                <div key={idx} className="border-l-4 border-primary pl-3 space-y-1">
                  <Badge variant="primary" className="text-[9px] uppercase tracking-wider py-0 px-2">
                    {anc.tag}
                  </Badge>
                  <h4 className="text-sm font-bold text-text-primary">{anc.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">{anc.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
