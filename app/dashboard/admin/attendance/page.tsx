"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  UserCheck,
  Users,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  name: string;
  role: "Student" | "Teacher" | "Staff";
  details: string; // e.g. "Grade 10B", "Biology Dept", "Finance Office"
  status: "Present" | "Absent" | "Late" | "Leave" | "";
  time?: string;
  checkInTime?: string;
  checkOutTime?: string;
  date?: string; // For history view
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("students");
  const [gradeFilter, setGradeFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterMode, setFilterMode] = useState<"daily" | "monthly">("daily");
  const [classOptions, setClassOptions] = useState<{ label: string; value: string }[]>([]);

  // Roster lists states
  const [studentRoster, setStudentRoster] = useState<AttendanceRecord[]>([]);
  const [teacherRoster, setTeacherRoster] = useState<AttendanceRecord[]>([]);
  const [staffRoster, setStaffRoster] = useState<AttendanceRecord[]>([]);
  const [historyList, setHistoryList] = useState<AttendanceRecord[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch classes for dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${API_URL}/master-data/classes`);
        if (!res.ok) return;
        const data = await res.json();
        const options: { label: string; value: string }[] = [];
        data.forEach((c: any) => {
          c.sections?.forEach((s: any) => {
            options.push({ label: `Grade ${c.grade} - ${s.name}`, value: `Grade ${c.grade} - ${s.name}` });
          });
        });
        setClassOptions(options);
        if (options.length > 0 && !gradeFilter) {
          setGradeFilter(options[0].value);
        }
      } catch (e) {
        console.error("Failed to load classes", e);
      }
    };
    fetchClasses();
  }, [API_URL, gradeFilter]);

  // Fetch Attendance & Roster
  useEffect(() => {
    const loadData = async () => {
      try {
        const [stuRes, staffRes, attRes] = await Promise.all([
          fetch(`${API_URL}/erp-core/students`),
          fetch(`${API_URL}/staff`),
          fetch(`${API_URL}/erp-core/attendance?${filterMode === 'monthly' ? `month=${selectedMonth}` : `date=${selectedDate}`}`)
        ]);
        const stuData = await stuRes.json();
        const staffData = await staffRes.json();
        const attData = await attRes.json();

        const attMap = new Map();
        const historyArr: AttendanceRecord[] = [];
        
        attData.forEach((a: any) => {
          if (a.enrollmentId) attMap.set(`STU-${a.enrollmentId}`, a);
          if (a.staffId) attMap.set(`STF-${a.staffId}`, a);
          
          if (filterMode === 'monthly') {
            historyArr.push({
              id: a.id,
              name: a.enrollment?.student?.fullName || a.staff?.fullName || "Unknown",
              role: a.staffId ? (a.staff?.role?.name?.includes("Teacher") ? "Teacher" : "Staff") : "Student",
              details: a.staffId ? (a.staff?.department || "General") : (a.enrollment?.section?.class?.grade ? `Grade ${a.enrollment.section.class.grade}` : "Student"),
              status: a.status,
              time: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              checkInTime: a.checkInTime,
              checkOutTime: a.checkOutTime,
              date: a.date
            });
          }
        });

        const studentsMapped = (stuData.data || []).map((s: any) => {
          const enrollment = s.enrollments?.[0];
          const att = attMap.get(`STU-${enrollment?.id}`);
          return {
            id: enrollment?.id || s.id,
            name: s.fullName,
            role: "Student",
            details: enrollment?.section ? `Grade ${enrollment.section.class?.grade} - ${enrollment.section.name}` : "Unassigned",
            status: att ? att.status : "",
            time: att ? new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            checkInTime: att ? att.checkInTime : undefined,
            checkOutTime: att ? att.checkOutTime : undefined,
          };
        });

        const staffMapped = (staffData.data || []).map((st: any) => {
          const att = attMap.get(`STF-${st.id}`);
          return {
            id: st.id,
            name: st.fullName,
            role: st.role?.name?.includes("Teacher") ? "Teacher" : "Staff",
            details: st.department || "General",
            status: att ? att.status : "",
            time: att ? new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            checkInTime: att ? att.checkInTime : undefined,
            checkOutTime: att ? att.checkOutTime : undefined,
          };
        });

        setStudentRoster(studentsMapped);
        setTeacherRoster(staffMapped.filter((s: any) => s.role === "Teacher"));
        setStaffRoster(staffMapped.filter((s: any) => s.role === "Staff"));
        setHistoryList(historyArr);
        setHasUnsavedChanges(false);
      } catch (e) {
        console.error("Failed to load attendance data", e);
      }
    };
    loadData();
  }, [API_URL, selectedDate, selectedMonth, filterMode]);



  const handleStatusChange = (id: string, newStatus: "Present" | "Absent" | "Late" | "Leave", role: string) => {
    const time = (newStatus === "Present" || newStatus === "Late") ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
    
    setHasUnsavedChanges(true);
    if (role === "Student") {
      setStudentRoster((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus, time } : s));
    } else if (role === "Teacher") {
      setTeacherRoster((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus, time } : t));
    } else {
      setStaffRoster((prev) => prev.map((st) => st.id === id ? { ...st, status: newStatus, time } : st));
    }
  };

  const handleSaveRegister = async () => {
    setIsSaving(true);
    try {
      const roster = activeTab === "students" 
        ? studentRoster.filter(s => s.details === gradeFilter) 
        : activeTab === "teachers" ? teacherRoster : staffRoster;

      // Only save records that have a status set
      const validRecords = roster.filter(r => r.status);

      await Promise.all(validRecords.map(async (record) => {
        const body: any = {
          date: selectedDate,
          status: record.status,
          faceVerified: false,
        };
        if (record.role === "Student") body.enrollmentId = record.id;
        else body.staffId = record.id;

        return fetch(`${API_URL}/erp-core/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      }));

      setHasUnsavedChanges(false);
      toast("Register Saved", { description: "Attendance records synchronized successfully.", type: "success" });
    } catch {
      toast("Error", { description: "Failed to save some records.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleHistoryStatusUpdate = async (id: string, newStatus: "Present" | "Absent" | "Late" | "Leave") => {
    try {
      const res = await fetch(`${API_URL}/erp-core/attendance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to correct attendance.");
      
      // Update local state in history list
      setHistoryList((prev) => prev.map((h) => h.id === id ? { ...h, status: newStatus } : h));
      toast("Attendance Corrected", { description: `Corrected status to ${newStatus} successfully.`, type: "success" });
    } catch (e) {
      toast("Error", { description: "Failed to correct attendance.", type: "error" });
    }
  };

  const openSubModal = (teacherName: string) => {
    toast("Substitute Lookup", { description: `Find a substitute for ${teacherName} from the Timetable page, where period/subject context is available.`, type: "info" });
  };

  const handleBulkMark = (status: "Present" | "Absent") => {
    const time = status === "Present" ? "08:00 AM" : undefined;
    setHasUnsavedChanges(true);
    if (activeTab === "students") {
      setStudentRoster((prev) => prev.map((s) => s.details === gradeFilter ? { ...s, status, time } : s));
    } else if (activeTab === "teachers") {
      setTeacherRoster((prev) => prev.map((t) => ({ ...t, status, time })));
    } else {
      setStaffRoster((prev) => prev.map((st) => ({ ...st, status, time })));
    }
  };

  // Calculate aggregates
  const getCounts = (roster: AttendanceRecord[]) => {
    const total = roster.length;
    const present = roster.filter((r) => r.status === "Present" || r.status === "Late").length;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "100";
    return { total, present, rate };
  };

  const studentCounts = getCounts(studentRoster.filter((s) => s.details === gradeFilter));
  const teacherCounts = getCounts(teacherRoster);
  const staffCounts = getCounts(staffRoster);

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Attendance Desk
          </h1>
          <p className="text-sm text-text-secondary">
            Process daily attendance logs and audit daily attendance rosters.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-4">

        {/* Right Column: Attendance Registers */}
        <div className="w-full space-y-4">
          {/* Tabs */}
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            options={[
                { id: "students", label: "Students", icon: <Users className="h-4 w-4" /> },
                { id: "teachers", label: "Teachers", icon: <UserCheck className="h-4 w-4" /> },
                { id: "staff", label: "Non-Teaching Staff", icon: <CheckCircle className="h-4 w-4" /> },
                { id: "history", label: "History Log", icon: <Clock className="h-4 w-4" /> }
              ]}
            />

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle>Roster Logs &amp; Registry</CardTitle>
                <CardDescription>
                  {activeTab === "students" && `Current Attendance: ${studentCounts.rate}% (${studentCounts.present}/${studentCounts.total} Present)`}
                  {activeTab === "teachers" && `Current Attendance: ${teacherCounts.rate}% (${teacherCounts.present}/${teacherCounts.total} Present)`}
                  {activeTab === "staff" && `Current Attendance: ${staffCounts.rate}% (${staffCounts.present}/${staffCounts.total} Present)`}
                </CardDescription>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                <Select
                  label=""
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  options={[
                    { label: "Daily View", value: "daily" },
                    { label: "Monthly View", value: "monthly" }
                  ]}
                />
                
                {filterMode === "daily" ? (
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                ) : (
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40"
                  />
                )}
                
                {activeTab === "students" && filterMode === "daily" && (
                  <Select
                    label=""
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    options={classOptions}
                  />
                )}
                <div className="flex items-center gap-1 border-r border-border pr-3">
                  <Button variant="outline" size="sm" onClick={() => handleBulkMark("Present")}>
                    All Present
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkMark("Absent")}>
                    All Absent
                  </Button>
                </div>
                {filterMode === "daily" && (
                  <Button 
                    variant={hasUnsavedChanges ? "primary" : "secondary"} 
                    size="sm" 
                    onClick={handleSaveRegister}
                    disabled={!hasUnsavedChanges || isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Register"}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeTab === "history" ? (
                      <>
                        <TableHead>Date</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Check-In</TableHead>
                        <TableHead>Check-Out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>SIS ID</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>{activeTab === "students" ? "Class" : activeTab === "teachers" ? "Department" : "Office Role"}</TableHead>
                        {activeTab === "students" ? (
                          <TableHead>Status Time</TableHead>
                        ) : (
                          <>
                            <TableHead>Check-In</TableHead>
                            <TableHead>Check-Out</TableHead>
                          </>
                        )}
                        <TableHead>Attendance Status</TableHead>
                        {filterMode === "daily" && <TableHead className="text-right">Mark Status Actions</TableHead>}
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* STUDENTS TAB */}
                  {activeTab === "students" &&
                    studentRoster
                      .filter((s) => s.details === gradeFilter)
                      .map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-semibold text-primary">{row.id}</TableCell>
                          <TableCell className="font-semibold text-text-primary">{row.name}</TableCell>
                          <TableCell>{row.details}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                              <Clock className="h-3.5 w-3.5 text-text-secondary" /> {row.time || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              row.status === "Present" ? "success" :
                                row.status === "Late" ? "warning" :
                                  row.status === "Leave" ? "info" :
                                    row.status === "Absent" ? "danger" : "neutral"
                            }>
                              {row.status || "Unmarked"}
                            </Badge>
                          </TableCell>
                          {filterMode === "daily" && (
                            <TableCell className="text-right">
                              <div className="inline-flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-md border border-border">
                                {(["Present", "Absent", "Late", "Leave"] as const).map((st) => (
                                  <label key={st} className="flex items-center gap-1.5 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`status-${row.id}`} 
                                      checked={row.status === st}
                                      onChange={() => handleStatusChange(row.id, st, "Student")}
                                      className="w-3.5 h-3.5 text-primary focus:ring-primary"
                                    />
                                    <span className={`text-[11px] font-semibold ${row.status === st ? "text-primary" : "text-text-secondary"}`}>{st}</span>
                                  </label>
                                ))}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}

                  {/* TEACHERS TAB */}
                  {activeTab === "teachers" &&
                    teacherRoster.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-semibold text-primary">{row.id}</TableCell>
                        <TableCell className="font-semibold text-text-primary">{row.name}</TableCell>
                        <TableCell>{row.details}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            <Clock className="h-3.5 w-3.5" /> {row.checkInTime || "--"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            <Clock className="h-3.5 w-3.5" /> {row.checkOutTime || "--"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            row.status === "Present" ? "success" :
                              row.status === "Late" ? "warning" :
                                row.status === "Leave" ? "info" : "danger"
                          }>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {filterMode === "daily" && (
                            <div className="flex items-center justify-end gap-3">
                              {(row.status === "Absent" || row.status === "Leave") && (
                                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => openSubModal(row.name)}>
                                  Find Sub
                                </Button>
                              )}
                              <div className="inline-flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-md border border-border">
                                {(["Present", "Absent", "Late", "Leave"] as const).map((st) => (
                                  <label key={st} className="flex items-center gap-1.5 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`status-${row.id}`} 
                                      checked={row.status === st}
                                      onChange={() => handleStatusChange(row.id, st, "Teacher")}
                                      className="w-3.5 h-3.5 text-primary focus:ring-primary"
                                    />
                                    <span className={`text-[11px] font-semibold ${row.status === st ? "text-primary" : "text-text-secondary"}`}>{st}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                  {/* STAFF TAB */}
                  {activeTab === "staff" &&
                    staffRoster.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-semibold text-primary">{row.id}</TableCell>
                        <TableCell className="font-semibold text-text-primary">{row.name}</TableCell>
                        <TableCell>{row.details}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            <Clock className="h-3.5 w-3.5" /> {row.checkInTime || "--"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            <Clock className="h-3.5 w-3.5" /> {row.checkOutTime || "--"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            row.status === "Present" ? "success" :
                              row.status === "Late" ? "warning" :
                                row.status === "Leave" ? "info" : "danger"
                          }>
                            {row.status}
                          </Badge>
                        </TableCell>
                          {filterMode === "daily" && (
                            <TableCell className="text-right">
                              <div className="inline-flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-md border border-border">
                                {(["Present", "Absent", "Late", "Leave"] as const).map((st) => (
                                  <label key={st} className="flex items-center gap-1.5 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`status-${row.id}`} 
                                      checked={row.status === st}
                                      onChange={() => handleStatusChange(row.id, st, "Staff")}
                                      className="w-3.5 h-3.5 text-primary focus:ring-primary"
                                    />
                                    <span className={`text-[11px] font-semibold ${row.status === st ? "text-primary" : "text-text-secondary"}`}>{st}</span>
                                  </label>
                                ))}
                              </div>
                            </TableCell>
                          )}
                      </TableRow>
                    ))}

                  {/* HISTORY TAB */}
                  {activeTab === "history" &&
                    historyList.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-semibold text-text-primary whitespace-nowrap">{row.date}</TableCell>
                        <TableCell className="font-semibold text-primary">{row.name}</TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.details}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            <Clock className="h-3.5 w-3.5" /> {row.checkInTime || "--"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            <Clock className="h-3.5 w-3.5" /> {row.checkOutTime || "--"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            row.status === "Present" ? "success" :
                              row.status === "Late" ? "warning" :
                                row.status === "Leave" ? "info" : "danger"
                          }>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-md border border-border">
                            {(["Present", "Absent", "Late", "Leave"] as const).map((st) => (
                              <label key={st} className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`status-hist-${row.id}`} 
                                  checked={row.status === st}
                                  onChange={() => handleHistoryStatusUpdate(row.id, st)}
                                  className="w-3.5 h-3.5 text-primary focus:ring-primary"
                                />
                                <span className={`text-[11px] font-semibold ${row.status === st ? "text-primary" : "text-text-secondary"}`}>{st}</span>
                              </label>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border mt-4 pt-4">
              <span className="text-xs text-text-secondary">
                Showing {activeTab === "history" ? historyList.length : activeTab === "students" ? studentRoster.filter((s) => s.details === gradeFilter).length : activeTab === "teachers" ? teacherRoster.length : staffRoster.length} active registry rows
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="primary" size="sm" className="h-8 w-8 p-0">1</Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
