"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { Home, Users, Building, AlertTriangle } from "lucide-react";

export default function HostelAdminPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [activeTab, setActiveTab] = useState("hostels");
  const [hostels, setHostels] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Forms
  const [hostelName, setHostelName] = useState("");
  const [hostelType, setHostelType] = useState("COED");
  const [wardenName, setWardenName] = useState("");
  
  const [roomHostelId, setRoomHostelId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("");

  const [assignEnrollmentId, setAssignEnrollmentId] = useState("");
  const [assignRoomId, setAssignRoomId] = useState("");

  useEffect(() => {
    fetchHostels();
    fetchStudents();
  }, []);

  const fetchHostels = async () => {
    try {
      const res = await fetch(`${API_URL}/hostel/hostels`);
      if (res.ok) setHostels(await res.json());
    } catch {
      toast("Error", { description: "Failed to load hostels", type: "error" });
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/erp-core/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      }
    } catch {
      console.error("Failed to load students");
    }
  };

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/hostel/hostels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: hostelName, type: hostelType, warden: wardenName })
      });
      if (res.ok) {
        toast("Success", { description: "Hostel block created", type: "success" });
        setHostelName(""); setWardenName("");
        fetchHostels();
      }
    } catch {
      toast("Error", { description: "Failed to create hostel", type: "error" });
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomHostelId) return toast("Error", { description: "Select a hostel", type: "error" });
    try {
      const res = await fetch(`${API_URL}/hostel/hostels/${roomHostelId}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber,
          capacity: parseInt(roomCapacity)
        })
      });
      if (res.ok) {
        toast("Success", { description: "Room added", type: "success" });
        setRoomNumber(""); setRoomCapacity("");
        fetchHostels();
      }
    } catch {
      toast("Error", { description: "Failed to add room", type: "error" });
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/hostel/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: assignEnrollmentId, roomId: assignRoomId })
      });
      if (res.ok) {
        toast("Success", { description: "Student allocated to room", type: "success" });
      }
    } catch {
      toast("Error", { description: "Failed to allocate room", type: "error" });
    }
  };

  // Helper arrays for selects
  const hostelOptions = hostels.map(h => ({ label: `${h.name} (${h.type})`, value: h.id }));
  const roomOptions = hostels.flatMap(h => h.rooms.map((r: any) => ({ label: `${h.name} - Room ${r.roomNumber}`, value: r.id })));
  const studentOptions = students.map(s => ({ label: s.fullName, value: s.enrollments?.[0]?.id || s.id }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Hostel & Mess Management</h1>
        <p className="text-sm text-text-secondary">Configure hostel blocks, rooms, and allocate students.</p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "hostels", label: "Hostels & Rooms", icon: <Building className="w-4 h-4"/> },
          { id: "allocation", label: "Room Allocation", icon: <Users className="w-4 h-4"/> },
          { id: "grievances", label: "Grievance Desk", icon: <AlertTriangle className="w-4 h-4"/> }
        ]}
      />

      {activeTab === "hostels" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader><CardTitle>Add Hostel Block</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateHostel} className="space-y-4">
                <Input label="Hostel Name" placeholder="e.g. Boys Wing A" value={hostelName} onChange={e => setHostelName(e.target.value)} required />
                <Select label="Hostel Type" value={hostelType} onChange={e => setHostelType(e.target.value)} options={[
                  { label: "BOYS", value: "BOYS" },
                  { label: "GIRLS", value: "GIRLS" },
                  { label: "COED", value: "COED" }
                ]} />
                <Input label="Warden Name" value={wardenName} onChange={e => setWardenName(e.target.value)} />
                <Button type="submit" className="w-full">Create Hostel</Button>
              </form>
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Existing Hostels</h4>
                <ul className="space-y-2">
                  {hostels.map(h => (
                    <li key={h.id} className="p-2 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800">
                      <strong>{h.name}</strong> ({h.type}) - {h.rooms?.length || 0} rooms
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add Room</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <Select label="Select Hostel" value={roomHostelId} onChange={e => setRoomHostelId(e.target.value)} options={[{label: "Select...", value: ""}, ...hostelOptions]} required />
                <Input label="Room Number" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required />
                <Input label="Capacity (Beds)" type="number" value={roomCapacity} onChange={e => setRoomCapacity(e.target.value)} required />
                <Button type="submit" className="w-full">Add Room</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "allocation" && (
        <Card className="mt-6 max-w-2xl mx-auto">
          <CardHeader><CardTitle>Allocate Room</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAssignStudent} className="space-y-4">
              <Select label="Select Student" value={assignEnrollmentId} onChange={e => setAssignEnrollmentId(e.target.value)} options={[{label: "Select...", value: ""}, ...studentOptions]} required />
              <Select label="Select Room" value={assignRoomId} onChange={e => setAssignRoomId(e.target.value)} options={[{label: "Select...", value: ""}, ...roomOptions]} required />
              <Button type="submit" className="w-full">Allocate Room</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "grievances" && (
        <Card className="mt-6 max-w-2xl mx-auto border-warning border-2">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Warden Grievance Desk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary mb-4">
              This panel allows the warden to view grievances filed by students through their portal.
            </p>
            <div className="mt-4 p-4 border rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-sm font-semibold text-slate-500">
              No active grievances reported.
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
