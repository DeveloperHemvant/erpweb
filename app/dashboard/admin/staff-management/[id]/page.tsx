"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, UserCircle, Bus, BookOpen, Plus, Trash2 } from "lucide-react";

export default function StaffManagementPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Teacher Master Data
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Teacher Editing State
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [newAssignment, setNewAssignment] = useState({ sectionId: "", subjectId: "", isClassTeacher: false });

  // Transport Editing State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [newTransportAssignment, setNewTransportAssignment] = useState({ vehicleId: "", routeId: "", shift: "Full Day", tripType: "Morning" });


  useEffect(() => {
    fetchStaff();
    fetchMasterData();
  }, [id]);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/staff/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
        setTeacherAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [resClasses, resSubjects, resVehicles, resRoutes] = await Promise.all([
        fetch(`${API_URL}/master-data/classes`),
        fetch(`${API_URL}/master-data/subjects`),
        fetch(`${API_URL}/transport/vehicles`),
        fetch(`${API_URL}/transport/routes`)
      ]);
      
      if (resClasses.ok) {
        const dataClasses = await resClasses.json();
        const allClasses: any[] = [];
        const seenNames = new Set();
        
        const sortedClasses = dataClasses?.sort((a: any, b: any) => (b.session?.isActive ? 1 : 0) - (a.session?.isActive ? 1 : 0)) || [];
        
        sortedClasses.forEach((c: any) => {
          c.sections?.forEach((s: any) => {
            const name = `${c.grade} - ${s.name}`;
            if (!seenNames.has(name)) {
              seenNames.add(name);
              allClasses.push({ id: s.id, name });
            }
          });
        });
        
        allClasses.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        setClasses(allClasses);
      }
      
      if (resSubjects.ok) {
        const dataSubjects = await resSubjects.json();
        setSubjects(dataSubjects || []);
      }

      if (resVehicles.ok) {
        setVehicles(await resVehicles.json() || []);
      }
      if (resRoutes.ok) {
        setRoutes(await resRoutes.json() || []);
      }

    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTeacherAssignment = () => {
    if (!newAssignment.sectionId || (!newAssignment.subjectId && !newAssignment.isClassTeacher)) {
      toast("Incomplete", { description: "Select a class and a subject (or mark as class teacher).", type: "warning" });
      return;
    }
    
    // Add locally for UI
    const s = classes.find(c => c.id === newAssignment.sectionId);
    const sub = subjects.find(s => s.id === newAssignment.subjectId);

    setTeacherAssignments([...teacherAssignments, {
      id: `temp-${Date.now()}`,
      sectionId: newAssignment.sectionId,
      subjectId: newAssignment.subjectId || null,
      isClassTeacher: newAssignment.isClassTeacher,
      section: { class: { grade: s?.name.split(" - ")[0] }, name: s?.name.split(" - ")[1] },
      subject: sub ? { name: sub.name } : null
    }]);

    setNewAssignment({ sectionId: "", subjectId: "", isClassTeacher: false });
  };

  const handleRemoveAssignment = (index: number) => {
    const updated = [...teacherAssignments];
    updated.splice(index, 1);
    setTeacherAssignments(updated);
  };

  const handleSaveAssignments = async () => {
    try {
      const res = await fetch(`${API_URL}/staff/${id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: teacherAssignments })
      });
      if (res.ok) {
        toast("Saved", { description: "Teacher assignments updated successfully.", type: "success" });
        fetchStaff();
      } else {
        toast("Error", { description: "Failed to save assignments.", type: "error" });
      }
    } catch {
      toast("Error", { description: "Network error saving assignments.", type: "error" });
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;
  if (!staff) return <div className="p-8 text-center text-danger">Staff not found</div>;

  const isTransportStaff = ["Driver", "Conductor", "Transport Manager"].includes(staff.role?.name) || (staff.transportAssignments?.length > 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-text-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <UserCircle className="h-6 w-6 text-primary" />
              {staff.fullName}
            </h1>
            <p className="text-sm text-text-secondary">
              {staff.email} • Role: <Badge variant="primary" className="ml-1">{staff.role?.name}</Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Teacher Assignments Section */}
      {staff.role?.name === "Teacher" && (
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Academic Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Assignment Addition Form */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md border flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select
                  label="Class & Section"
                  value={newAssignment.sectionId}
                  onChange={(e) => setNewAssignment({...newAssignment, sectionId: e.target.value})}
                  options={[{label: "Select Class", value: ""}, ...classes.map(c => ({label: c.name, value: c.id}))]}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Select
                  label="Subject Taught"
                  value={newAssignment.subjectId}
                  onChange={(e) => setNewAssignment({...newAssignment, subjectId: e.target.value})}
                  options={[{label: "Select Subject", value: ""}, ...subjects.map(s => ({label: s.name, value: s.id}))]}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox 
                  id="classTeacher"
                  checked={newAssignment.isClassTeacher}
                  onChange={(e: any) => setNewAssignment({...newAssignment, isClassTeacher: e.target.checked})}
                />
                <label htmlFor="classTeacher" className="text-sm cursor-pointer whitespace-nowrap mr-2">Is Class Teacher?</label>
              </div>
              <Button onClick={handleAddTeacherAssignment} variant="outline"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>

            {/* Existing Assignments Table */}
            {teacherAssignments.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class & Section</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class Teacher</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherAssignments.map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {assignment.section?.class?.grade} - {assignment.section?.name}
                        </TableCell>
                        <TableCell>{assignment.subject?.name || <span className="text-text-secondary italic">Class Teacher Only</span>}</TableCell>
                        <TableCell>
                          {assignment.isClassTeacher ? (
                            <Badge variant="success">Yes</Badge>
                          ) : (
                            <span className="text-text-secondary text-xs">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveAssignment(index)}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-text-secondary text-center py-4 italic">No active teaching assignments.</p>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveAssignments}>Save All Teaching Assignments</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transport Assignments Section */}
      {isTransportStaff && (
        <Card className="border-t-4 border-t-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" /> Transport & Vehicle Allocations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Assignment Addition Form */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md border flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select
                  label="Select Vehicle"
                  value={newTransportAssignment.vehicleId}
                  onChange={(e) => setNewTransportAssignment({...newTransportAssignment, vehicleId: e.target.value})}
                  options={[{label: "Select Vehicle", value: ""}, ...vehicles.map(v => ({label: `${v.vehicleNumber} (${v.vehicleType})`, value: v.id}))]}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Select
                  label="Select Route (Optional)"
                  value={newTransportAssignment.routeId}
                  onChange={(e) => setNewTransportAssignment({...newTransportAssignment, routeId: e.target.value})}
                  options={[{label: "Select Route", value: ""}, ...routes.map(r => ({label: r.routeName, value: r.id}))]}
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <Select
                  label="Trip Type"
                  value={newTransportAssignment.tripType}
                  onChange={(e) => setNewTransportAssignment({...newTransportAssignment, tripType: e.target.value})}
                  options={[
                    {label: "Morning", value: "Morning"},
                    {label: "Afternoon", value: "Afternoon"},
                    {label: "Special", value: "Special"}
                  ]}
                />
              </div>
              <Button 
                onClick={async () => {
                  if (!newTransportAssignment.vehicleId) {
                    toast("Incomplete", { description: "You must select a vehicle.", type: "warning" });
                    return;
                  }
                  try {
                    const res = await fetch(`${API_URL}/staff/${id}/transport-assignments`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ assignments: [newTransportAssignment] })
                    });
                    if (res.ok) {
                      toast("Assigned", { description: "Transport assignment saved successfully.", type: "success" });
                      fetchStaff(); // Refresh UI
                      setNewTransportAssignment({ vehicleId: "", routeId: "", shift: "Full Day", tripType: "Morning" });
                    } else {
                      toast("Error", { description: "Failed to save assignment.", type: "error" });
                    }
                  } catch {
                    toast("Error", { description: "Network error.", type: "error" });
                  }
                }} 
              >
                <Plus className="h-4 w-4 mr-1" /> Assign Route
              </Button>
            </div>

            {staff.transportAssignments?.length > 0 || staff.TransportTrip?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="border p-4 rounded-md bg-slate-50 dark:bg-slate-900">
                  <h4 className="text-sm font-semibold mb-3 border-b pb-1">Assigned Vehicles</h4>
                  {staff.transportAssignments?.map((ta: any, i: number) => (
                    <div key={i} className="mb-2">
                      <p className="font-medium text-primary">{ta.vehicle?.vehicleNumber}</p>
                      <p className="text-xs text-text-secondary">{ta.vehicle?.vehicleType} • {ta.vehicle?.seatingCapacity} Seats</p>
                    </div>
                  ))}
                  {(!staff.transportAssignments || staff.transportAssignments.length === 0) && (
                    <p className="text-xs text-text-secondary italic">No dedicated vehicle allocated.</p>
                  )}
                </div>

                <div className="border p-4 rounded-md bg-slate-50 dark:bg-slate-900">
                  <h4 className="text-sm font-semibold mb-3 border-b pb-1">Assigned Routes (Trips)</h4>
                  {staff.TransportTrip?.map((trip: any, i: number) => (
                    <div key={i} className="mb-2">
                      <p className="font-medium text-primary">{trip.route?.routeName}</p>
                      <p className="text-xs text-text-secondary">{trip.tripType} • Vehicle: {trip.vehicle?.vehicleNumber}</p>
                    </div>
                  ))}
                  {(!staff.TransportTrip || staff.TransportTrip.length === 0) && (
                    <p className="text-xs text-text-secondary italic">No active route trips allocated.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary italic p-4 text-center border rounded">
                This staff member is recognized as Transport Staff but currently has no active vehicles or routes assigned. Allocate them from the Transport Module.
              </p>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
