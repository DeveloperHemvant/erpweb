"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, DollarSign, Activity, GraduationCap } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/analytics/dashboard/summary`)
      .then(res => res.json())
      .then(setSummary)
      .catch(console.error);

    fetch(`${API_URL}/analytics/dashboard/trends`)
      .then(res => res.json())
      .then(setTrends)
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-text-secondary mt-1">Unified view of school performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Attendance</CardTitle>
            <Activity className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.attendanceRate ?? "--"}%</div>
            <p className="text-xs text-text-secondary">Across all students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₹{summary?.totalRevenue?.toLocaleString() ?? "--"}</div>
            <p className="text-xs text-text-secondary">₹{summary?.totalOutstanding?.toLocaleString() ?? "0"} outstanding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summary?.studentCount ?? "--"}</div>
            <p className="text-xs text-text-secondary">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.staffCount ?? "--"}</div>
            <p className="text-xs text-text-secondary">Active employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection by Class</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {trends?.revenueByClass ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.revenueByClass} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="collected" name="Collected (₹)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" name="Outstanding (₹)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-text-secondary">Loading chart...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {trends?.attendanceTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.attendanceTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rate" name="Attendance %" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-text-secondary">Loading chart...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
