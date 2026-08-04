"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { AlertTriangle, BedDouble, Building, CalendarCheck2, Utensils, Users } from "lucide-react";

const todayIso = new Date().toISOString().slice(0, 10);

export default function HostelAdminPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [activeTab, setActiveTab] = useState("hostels");
  const [hostels, setHostels] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [hostelName, setHostelName] = useState("");
  const [hostelType, setHostelType] = useState("COED");
  const [wardenName, setWardenName] = useState("");

  const [roomHostelId, setRoomHostelId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("");

  const [assignEnrollmentId, setAssignEnrollmentId] = useState("");
  const [assignRoomId, setAssignRoomId] = useState("");

  const [attendanceHostelId, setAttendanceHostelId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(todayIso);

  const [menuHostelId, setMenuHostelId] = useState("");
  const [menuDay, setMenuDay] = useState("Monday");
  const [menuMealType, setMenuMealType] = useState("Breakfast");
  const [menuItems, setMenuItems] = useState("");

  useEffect(() => {
    void loadAll();
  }, []);

  async function apiJson(path: string, init?: RequestInit) {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [hostelsData, studentsRes, allocationsData, grievancesData] = await Promise.all([
        apiJson("/hostel/hostels"),
        apiJson("/erp-core/students"),
        apiJson("/hostel/allocations"),
        apiJson("/hostel/grievances"),
      ]);

      setHostels(hostelsData || []);
      setStudents(studentsRes?.data || []);
      setAllocations(allocationsData || []);
      setGrievances(grievancesData || []);
    } catch (error) {
      toast("Error", { description: "Failed to load hostel management data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function loadAttendance(hostelId = attendanceHostelId, date = attendanceDate) {
    if (!date) return;
    try {
      const query = new URLSearchParams({ date });
      if (hostelId) query.set("hostelId", hostelId);
      const data = await apiJson(`/hostel/attendance?${query.toString()}`);
      setAttendanceRows(data || []);
    } catch {
      toast("Error", { description: "Failed to load hostel attendance.", type: "error" });
    }
  }

  useEffect(() => {
    void loadAttendance();
  }, [attendanceDate, attendanceHostelId]);

  const hostelOptions = useMemo(
    () => [{ label: "All hostels", value: "" }, ...hostels.map((h) => ({ label: `${h.name} (${h.type})`, value: h.id }))],
    [hostels]
  );

  const roomOptions = useMemo(
    () => hostels.flatMap((h) =>
      (h.rooms || []).map((r: any) => ({
        label: `${h.name} - Room ${r.roomNumber} (${(r.allocations || []).length}/${r.capacity})`,
        value: r.id,
      }))
    ),
    [hostels]
  );

  const studentOptions = useMemo(
    () =>
      students
        .filter((s) => s.enrollments?.length > 0)
        .map((s) => ({
          label: `${s.fullName} · ${s.enrollments?.[0]?.section?.class?.grade || "N/A"} ${s.enrollments?.[0]?.section?.name || ""}`,
          value: s.enrollments[0].id,
        })),
    [students]
  );

  const boardersWithoutAttendance = useMemo(() => {
    const presentIds = new Set(attendanceRows.map((row: any) => row.enrollmentId));
    return allocations.filter((allocation: any) => !presentIds.has(allocation.enrollmentId));
  }, [allocations, attendanceRows]);

  async function handleCreateHostel(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiJson("/hostel/hostels", {
        method: "POST",
        body: JSON.stringify({ name: hostelName, type: hostelType, warden: wardenName }),
      });
      setHostelName("");
      setWardenName("");
      await loadAll();
      toast("Success", { description: "Hostel block created.", type: "success" });
    } catch {
      toast("Error", { description: "Failed to create hostel.", type: "error" });
    }
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!roomHostelId) return;
    try {
      await apiJson(`/hostel/hostels/${roomHostelId}/rooms`, {
        method: "POST",
        body: JSON.stringify({ roomNumber, capacity: Number(roomCapacity) }),
      });
      setRoomNumber("");
      setRoomCapacity("");
      await loadAll();
      toast("Success", { description: "Room added.", type: "success" });
    } catch {
      toast("Error", { description: "Failed to add room.", type: "error" });
    }
  }

  async function handleAssignStudent(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiJson("/hostel/allocations", {
        method: "POST",
        body: JSON.stringify({ enrollmentId: assignEnrollmentId, roomId: assignRoomId }),
      });
      await loadAll();
      await loadAttendance();
      toast("Success", { description: "Student allocated to room.", type: "success" });
    } catch {
      toast("Error", { description: "Failed to allocate room.", type: "error" });
    }
  }

  async function markAttendance(enrollmentId: string, status: string) {
    try {
      await apiJson("/hostel/attendance", {
        method: "POST",
        body: JSON.stringify({ enrollmentId, date: attendanceDate, status }),
      });
      await loadAttendance();
      toast("Saved", { description: "Attendance updated.", type: "success" });
    } catch {
      toast("Error", { description: "Failed to save hostel attendance.", type: "error" });
    }
  }

  async function handleCreateMenu(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiJson("/hostel/mess-menus", {
        method: "POST",
        body: JSON.stringify({
          hostelId: menuHostelId,
          dayOfWeek: menuDay,
          mealType: menuMealType,
          items: menuItems,
        }),
      });
      setMenuItems("");
      await loadAll();
      toast("Success", { description: "Mess menu added.", type: "success" });
    } catch {
      toast("Error", { description: "Failed to add mess menu.", type: "error" });
    }
  }

  async function updateGrievance(id: string, status: string) {
    try {
      await apiJson(`/hostel/grievances/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadAll();
      toast("Success", { description: `Grievance marked ${status}.`, type: "success" });
    } catch {
      toast("Error", { description: "Failed to update grievance.", type: "error" });
    }
  }

  async function updateAllocation(id: string, status: string) {
    try {
      await apiJson(`/hostel/allocations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadAll();
      toast("Success", { description: `Allocation marked ${status}.`, type: "success" });
    } catch {
      toast("Error", { description: "Failed to update allocation.", type: "error" });
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Hostel & Mess Management</h1>
        <p className="text-sm text-text-secondary">
          Manage rooms, boarders, hostel attendance, mess menus, and grievance resolution.
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "hostels", label: "Hostels & Rooms", icon: <Building className="w-4 h-4" /> },
          { id: "allocation", label: "Allocations", icon: <Users className="w-4 h-4" /> },
          { id: "attendance", label: "Attendance", icon: <CalendarCheck2 className="w-4 h-4" /> },
          { id: "mess", label: "Mess Menu", icon: <Utensils className="w-4 h-4" /> },
          { id: "grievances", label: "Grievances", icon: <AlertTriangle className="w-4 h-4" /> },
        ]}
      />

      {activeTab === "hostels" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader><CardTitle>Add Hostel Block</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateHostel} className="space-y-4">
                <Input label="Hostel Name" value={hostelName} onChange={(e) => setHostelName(e.target.value)} required />
                <Select
                  label="Hostel Type"
                  value={hostelType}
                  onChange={(e) => setHostelType(e.target.value)}
                  options={[
                    { label: "BOYS", value: "BOYS" },
                    { label: "GIRLS", value: "GIRLS" },
                    { label: "COED", value: "COED" },
                  ]}
                />
                <Input label="Warden Name" value={wardenName} onChange={(e) => setWardenName(e.target.value)} />
                <Button type="submit" className="w-full">Create Hostel</Button>
              </form>

              <div className="space-y-3">
                {hostels.map((hostel) => {
                  const occupied = (hostel.rooms || []).reduce(
                    (sum: number, room: any) => sum + (room.allocations || []).length,
                    0
                  );
                  const capacity = (hostel.rooms || []).reduce(
                    (sum: number, room: any) => sum + (room.capacity || 0),
                    0
                  );
                  return (
                    <div key={hostel.id} className="rounded-xl border p-3 bg-slate-50 dark:bg-slate-800/60">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">{hostel.name}</p>
                          <p className="text-xs text-text-secondary">
                            {hostel.type} · {hostel.rooms?.length || 0} rooms · {occupied}/{capacity} occupied
                          </p>
                        </div>
                        <BedDouble className="w-4 h-4 text-text-secondary" />
                      </div>
                    </div>
                  );
                })}
                {!loading && hostels.length === 0 && (
                  <div className="rounded-xl border p-4 text-sm text-text-secondary">No hostels created yet.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add Room</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <Select label="Hostel" value={roomHostelId} onChange={(e) => setRoomHostelId(e.target.value)} options={hostelOptions} required />
                <Input label="Room Number" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required />
                <Input label="Capacity" type="number" min={1} value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} required />
                <Button type="submit" className="w-full">Add Room</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "allocation" && (
        <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-6 mt-6">
          <Card>
            <CardHeader><CardTitle>Allocate Student</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAssignStudent} className="space-y-4">
                <Select label="Student" value={assignEnrollmentId} onChange={(e) => setAssignEnrollmentId(e.target.value)} options={[{ label: "Select student", value: "" }, ...studentOptions]} required />
                <Select label="Room" value={assignRoomId} onChange={(e) => setAssignRoomId(e.target.value)} options={[{ label: "Select room", value: "" }, ...roomOptions]} required />
                <Button type="submit" className="w-full">Allocate Room</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active Boarders</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {allocations.map((allocation) => (
                <div key={allocation.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{allocation.enrollment?.student?.fullName}</p>
                    <p className="text-xs text-text-secondary">
                      {allocation.room?.hostel?.name} · Room {allocation.room?.roomNumber} · {allocation.enrollment?.section?.class?.grade} {allocation.enrollment?.section?.name}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => updateAllocation(allocation.id, "Inactive")}>
                    Deallocate
                  </Button>
                </div>
              ))}
              {!loading && allocations.length === 0 && (
                <div className="rounded-xl border p-4 text-sm text-text-secondary">No active hostel allocations.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle>Attendance Filter</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Date" type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
              <Select label="Hostel" value={attendanceHostelId} onChange={(e) => setAttendanceHostelId(e.target.value)} options={hostelOptions} />
              <Button onClick={() => loadAttendance()} className="self-end">Refresh Attendance</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Mark / Update Attendance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[...attendanceRows, ...boardersWithoutAttendance].map((entry: any) => {
                const row = entry.enrollment ? entry : { enrollment: entry.enrollment, enrollmentId: entry.enrollmentId, status: "Not Marked" };
                const activeAllocation = row.enrollment?.hostelAllocations?.[0];
                return (
                  <div key={`${row.enrollmentId}-${row.status}`} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{row.enrollment?.student?.fullName}</p>
                      <p className="text-xs text-text-secondary">
                        {activeAllocation?.room?.hostel?.name || "Hostel"} · Room {activeAllocation?.room?.roomNumber || "N/A"} · Current: {row.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => markAttendance(row.enrollmentId, "Present")}>Present</Button>
                      <Button size="sm" variant="outline" onClick={() => markAttendance(row.enrollmentId, "Leave")}>Leave</Button>
                      <Button size="sm" variant="danger" onClick={() => markAttendance(row.enrollmentId, "Absent")}>Absent</Button>
                    </div>
                  </div>
                );
              })}
              {!loading && attendanceRows.length === 0 && boardersWithoutAttendance.length === 0 && (
                <div className="rounded-xl border p-4 text-sm text-text-secondary">No boarders found for the selected filter.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "mess" && (
        <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-6 mt-6">
          <Card>
            <CardHeader><CardTitle>Add Mess Menu Entry</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMenu} className="space-y-4">
                <Select label="Hostel" value={menuHostelId} onChange={(e) => setMenuHostelId(e.target.value)} options={hostelOptions.filter((opt) => opt.value !== "")} required />
                <Select label="Day" value={menuDay} onChange={(e) => setMenuDay(e.target.value)} options={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => ({ label: day, value: day }))} />
                <Select label="Meal" value={menuMealType} onChange={(e) => setMenuMealType(e.target.value)} options={["Breakfast", "Lunch", "Dinner"].map((meal) => ({ label: meal, value: meal }))} />
                <Textarea label="Items" value={menuItems} onChange={(e) => setMenuItems(e.target.value)} placeholder="Idli, sambar, fruit" required />
                <Button type="submit" className="w-full">Add Menu Row</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Current Menus</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {hostels.map((hostel) => (
                <div key={hostel.id} className="rounded-xl border p-4">
                  <p className="font-semibold text-sm mb-3">{hostel.name}</p>
                  <div className="space-y-2">
                    {(hostel.menus || []).map((menu: any) => (
                      <div key={menu.id} className="text-sm rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                        <span className="font-medium">{menu.dayOfWeek} · {menu.mealType}</span>
                        <span className="text-text-secondary"> — {menu.items}</span>
                      </div>
                    ))}
                    {(!hostel.menus || hostel.menus.length === 0) && (
                      <p className="text-sm text-text-secondary">No menu rows added yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "grievances" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Warden Grievance Desk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {grievances.map((grievance) => (
              <div key={grievance.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{grievance.title}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      {grievance.enrollment?.student?.fullName} · {grievance.hostel?.name} · {grievance.status}
                    </p>
                    <p className="text-sm mt-2">{grievance.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateGrievance(grievance.id, "Open")}>Open</Button>
                    <Button size="sm" onClick={() => updateGrievance(grievance.id, "Resolved")}>Resolve</Button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && grievances.length === 0 && (
              <div className="rounded-xl border p-4 text-sm text-text-secondary">No hostel grievances reported.</div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
