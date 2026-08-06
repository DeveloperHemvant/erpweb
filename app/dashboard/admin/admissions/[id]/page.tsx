"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, User, Phone, MapPin, Upload, Printer, Download, BookOpen, Activity, Bus } from "lucide-react";
import { useReactToPrint } from "react-to-print";

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Profile Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);
  
  // Transport State
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [currentTransport, setCurrentTransport] = useState<any>(null);
  const [transportForm, setTransportForm] = useState({
    routeId: "",
    stopId: "",
    morningPickup: true,
    afternoonDrop: true,
    seatNumber: "",
    feePeriod: "Monthly",
    guardianAuth: ""
  });
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  // ID Card Generation States
  const [renderedIdCard, setRenderedIdCard] = useState<any>(null);
  const idCardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: idCardRef,
    documentTitle: student?.fullName ? `${student.fullName} - ID Card` : "ID Card",
  });

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchIdCard();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`${API_URL}/erp-core/students/${id}/profile`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
        setEditData({
          photoUrl: data.photoUrl || "",
          details: {
            fatherPhotoUrl: data.details?.fatherPhotoUrl || "",
            motherPhotoUrl: data.details?.motherPhotoUrl || "",
          }
        });
        
        // Fetch Transport Data
        if (data.enrollments && data.enrollments.length > 0) {
          const enrollmentId = data.enrollments[0].id;
          const resTransport = await fetch(`${API_URL}/transport/students/${enrollmentId}`);
          if (resTransport.ok) {
            const transportData = await resTransport.json();
            setCurrentTransport(transportData);
          }
        }
      } else {
        toast("Error", { description: "Failed to load student profile", type: "error" });
      }

      // Fetch all routes
      const resRoutes = await fetch(`${API_URL}/transport/routes`);
      if (resRoutes.ok) {
        const routesData = await resRoutes.json();
        console.log("Fetched routes:", routesData);
        setTransportRoutes(Array.isArray(routesData.data) ? routesData.data : (Array.isArray(routesData) ? routesData : []));
      } else {
        console.error("Failed to fetch routes");
      }

    } catch {
      toast("Error", { description: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchIdCard = async () => {
    try {
      const res = await fetch(`${API_URL}/idcards/student/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRenderedIdCard(data);
      }
    } catch {
      console.error("Failed to load ID card");
    }
  };

  const handleSaveEdits = async () => {
    try {
      const res = await fetch(`${API_URL}/erp-core/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: editData.photoUrl,
          details: {
            ...student.details,
            fatherPhotoUrl: editData.details.fatherPhotoUrl,
            motherPhotoUrl: editData.details.motherPhotoUrl,
          }
        })
      });
      if (res.ok) {
        toast("Success", { description: "Profile photos updated successfully", type: "success" });
        setIsEditing(false);
        fetchStudent();
      } else {
        throw new Error();
      }
    } catch {
      toast("Error", { description: "Failed to update profile", type: "error" });
    }
  };

  const handleUpdateParentCredentials = async (parentId: string) => {
    if (!parentEmail && !parentPassword) return;
    setIsUpdatingCredentials(true);
    try {
      const res = await fetch(`${API_URL}/erp-core/parents/${parentId}/credentials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parentEmail || undefined,
          password: parentPassword || undefined,
        })
      });
      if (res.ok) {
        toast("Success", { description: "Parent credentials updated.", type: "success" });
        setParentEmail("");
        setParentPassword("");
        fetchStudent();
      } else {
        const err = await res.json();
        toast("Error", { description: err.message || "Failed to update credentials", type: "error" });
      }
    } catch {
      toast("Error", { description: "Network error while updating credentials", type: "error" });
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  const handleSetupParentPortal = async () => {
    if (!setupEmail) return;
    setIsSettingUp(true);
    try {
      const res = await fetch(`${API_URL}/erp-core/students/${id}/setup-parent-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: setupEmail, password: setupPassword || undefined })
      });
      if (res.ok) {
        toast("Success", { description: "Parent portal set up successfully.", type: "success" });
        setSetupEmail("");
        setSetupPassword("");
        fetchStudent();
      } else {
        const err = await res.json();
        toast("Error", { description: err.message || "Failed to setup portal", type: "error" });
      }
    } catch {
      toast("Error", { description: "Network error", type: "error" });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handlePhotoUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (field === "student") setEditData({ ...editData, photoUrl: base64Url });
      else if (field === "father") setEditData({ ...editData, details: { ...editData.details, fatherPhotoUrl: base64Url } });
      else if (field === "mother") setEditData({ ...editData, details: { ...editData.details, motherPhotoUrl: base64Url } });
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading Profile...</div>;
  if (!student) return <div className="p-8 text-center text-text-secondary">Student not found.</div>;

  const enrollment = student.enrollments?.[0] || {};
  const section = enrollment.section || {};
  const cls = section.class || {};
  const classTeacher = section.assignments?.find((a: any) => !a.subjectId)?.staff;



  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/admin/admissions")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">Student Complete Profile</h1>
        <Badge variant={student.status === "Active" ? "success" : "warning"}>{student.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border mb-4 bg-slate-100 flex items-center justify-center">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-slate-300" />
                )}
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-1">{student.fullName}</h2>
              <p className="text-sm text-text-secondary mb-3">{student.admissionNumber}</p>
              
              <div className="w-full flex justify-center gap-2 mt-2">
                <Badge variant="primary" className="font-mono">{cls.grade || "N/A"} - {section.name || "N/A"}</Badge>
                <Badge variant="neutral" className="font-mono">Roll: {enrollment.rollNumber || "N/A"}</Badge>
              </div>

              <div className="w-full mt-6 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="truncate">{student.details?.residenceAddress || "No Address Provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>DOB: {student.details?.dob || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Tabs */}
        <div className="md:col-span-3 space-y-4">
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            options={[
              { id: "overview", label: "Academic Overview", icon: <BookOpen className="h-4 w-4" /> },
              { id: "personal", label: "Personal & Parents", icon: <User className="h-4 w-4" /> },
              { id: "documents", label: "Photos & Docs", icon: <Upload className="h-4 w-4" /> },
              { id: "transport", label: "Transport Allocation", icon: <Bus className="h-4 w-4" /> },
              { id: "idcard", label: "ID Card Generator", icon: <Printer className="h-4 w-4" /> },
            ]}
          />

          {/* ACADEMIC OVERVIEW */}
          {activeTab === "overview" && (
            <Card>
              <CardHeader>
                <CardTitle>Academic Enrollment Details</CardTitle>
                <CardDescription>Current class, section, subjects and teachers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border">
                    <p className="text-xs text-text-secondary font-medium">Class</p>
                    <p className="font-semibold">{cls.grade || "Not Assigned"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border">
                    <p className="text-xs text-text-secondary font-medium">Section</p>
                    <p className="font-semibold">{section.name || "Not Assigned"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border">
                    <p className="text-xs text-text-secondary font-medium">Roll Number</p>
                    <p className="font-semibold">{enrollment.rollNumber || "Not Assigned"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border">
                    <p className="text-xs text-text-secondary font-medium">Academic Session</p>
                    <p className="font-semibold">{enrollment.session?.name || student.details?.session || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 border-b pb-1">Class Teacher</h4>
                  {classTeacher ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold uppercase">
                        {classTeacher.fullName?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{classTeacher.fullName}</p>
                        <p className="text-xs text-text-secondary">{classTeacher.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary italic">No class teacher assigned.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 border-b pb-1">Subjects Enrolled</h4>
                  <div className="flex flex-wrap gap-2">
                    {cls.subjects?.length > 0 ? (
                      cls.subjects.map((sub: any) => (
                        <Badge key={sub.subjectId} variant="neutral">{sub.subject?.name}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-text-secondary italic">No subjects configured for this class.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PERSONAL & PARENTS */}
          {activeTab === "personal" && (
            <Card>
              <CardHeader>
                <CardTitle>Family & Background Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1 text-primary">Father&apos;s Details</h4>
                    <p className="text-sm"><span className="text-text-secondary">Name:</span> {student.details?.fatherName || student.guardianName}</p>
                    <p className="text-sm"><span className="text-text-secondary">Contact:</span> {student.details?.fatherContact || student.phone}</p>
                    <p className="text-sm"><span className="text-text-secondary">Profession:</span> {student.details?.fatherProfession || "N/A"}</p>
                    <p className="text-sm"><span className="text-text-secondary">Company:</span> {student.details?.fatherCompany || "N/A"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1 text-primary">Mother&apos;s Details</h4>
                    <p className="text-sm"><span className="text-text-secondary">Name:</span> {student.details?.motherName || "N/A"}</p>
                    <p className="text-sm"><span className="text-text-secondary">Contact:</span> {student.details?.motherContact || "N/A"}</p>
                    <p className="text-sm"><span className="text-text-secondary">Profession:</span> {student.details?.motherProfession || "N/A"}</p>
                    <p className="text-sm"><span className="text-text-secondary">Company:</span> {student.details?.motherCompany || "N/A"}</p>
                  </div>
                </div>
                
                {/* Parent Portal Access Section */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold text-base mb-3 text-primary">Portal Access Credentials</h4>
                  {student.parents?.length > 0 ? (
                    student.parents.map((ps: any) => (
                      <div key={ps.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded border mb-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{ps.parent.name} ({ps.relationship})</p>
                            <p className="text-sm text-text-secondary">Current Email: {ps.parent.email || "Not set"}</p>
                          </div>
                          <Badge variant="neutral">Parent Portal</Badge>
                        </div>
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="text-xs text-text-secondary font-medium mb-1 block">Update Email / Username</label>
                            <Input 
                              placeholder="New Email" 
                              value={parentEmail}
                              onChange={(e) => setParentEmail(e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-text-secondary font-medium mb-1 block">New Password</label>
                            <Input 
                              type="password"
                              placeholder="New Password" 
                              value={parentPassword}
                              onChange={(e) => setParentPassword(e.target.value)}
                            />
                          </div>
                          <Button 
                            variant="primary" 
                            disabled={isUpdatingCredentials || (!parentEmail && !parentPassword)}
                            onClick={() => handleUpdateParentCredentials(ps.parent.id)}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border mb-4 space-y-4">
                      <p className="text-sm text-text-secondary">This student does not have a parent portal account set up.</p>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-text-secondary font-medium mb-1 block">Parent Email / Username *</label>
                          <Input 
                            placeholder="Enter parent's email" 
                            value={setupEmail}
                            onChange={(e) => setSetupEmail(e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-text-secondary font-medium mb-1 block">Initial Password (Optional)</label>
                          <Input 
                            type="password"
                            placeholder="Leave blank to auto-generate" 
                            value={setupPassword}
                            onChange={(e) => setSetupPassword(e.target.value)}
                          />
                        </div>
                        <Button 
                          variant="primary" 
                          disabled={isSettingUp || !setupEmail}
                          onClick={handleSetupParentPortal}
                        >
                          Set Up Portal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* DOCUMENTS & PHOTOS */}
          {activeTab === "documents" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Photos & Documents</CardTitle>
                  <CardDescription>Upload candidate and parent photographs.</CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Photos</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleSaveEdits}>Save Changes</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Student Photo */}
                  <div className="border rounded p-4 flex flex-col items-center gap-3">
                    <p className="text-sm font-semibold">Student Photo</p>
                    <div className="w-24 h-24 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
                      {(isEditing ? editData.photoUrl : student.photoUrl) ? (
                        <img src={isEditing ? editData.photoUrl : student.photoUrl} alt="Student" className="w-full h-full object-cover" />
                      ) : <User className="text-slate-300 w-10 h-10" />}
                    </div>
                    {isEditing && (
                      <div className="mt-2 text-center">
                        <label className="cursor-pointer bg-primary/10 text-primary px-3 py-1.5 rounded text-xs font-semibold hover:bg-primary/20 transition-colors">
                          Select Image
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload("student", e)} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Father Photo */}
                  <div className="border rounded p-4 flex flex-col items-center gap-3">
                    <p className="text-sm font-semibold">Father&apos;s Photo</p>
                    <div className="w-24 h-24 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
                      {(isEditing ? editData.details?.fatherPhotoUrl : student.details?.fatherPhotoUrl) ? (
                        <img src={isEditing ? editData.details?.fatherPhotoUrl : student.details?.fatherPhotoUrl} alt="Father" className="w-full h-full object-cover" />
                      ) : <User className="text-slate-300 w-10 h-10" />}
                    </div>
                    {isEditing && (
                      <div className="mt-2 text-center">
                        <label className="cursor-pointer bg-primary/10 text-primary px-3 py-1.5 rounded text-xs font-semibold hover:bg-primary/20 transition-colors">
                          Select Image
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload("father", e)} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Mother Photo */}
                  <div className="border rounded p-4 flex flex-col items-center gap-3">
                    <p className="text-sm font-semibold">Mother&apos;s Photo</p>
                    <div className="w-24 h-24 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
                      {(isEditing ? editData.details?.motherPhotoUrl : student.details?.motherPhotoUrl) ? (
                        <img src={isEditing ? editData.details?.motherPhotoUrl : student.details?.motherPhotoUrl} alt="Mother" className="w-full h-full object-cover" />
                      ) : <User className="text-slate-300 w-10 h-10" />}
                    </div>
                    {isEditing && (
                      <div className="mt-2 text-center">
                        <label className="cursor-pointer bg-primary/10 text-primary px-3 py-1.5 rounded text-xs font-semibold hover:bg-primary/20 transition-colors">
                          Select Image
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload("mother", e)} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TRANSPORT ALLOCATION */}
          {activeTab === "transport" && (
            <Card>
              <CardHeader>
                <CardTitle>Transport & Route Allocation</CardTitle>
                <CardDescription>Assign or update this student&apos;s transport route. A student can only have one active route at a time. Assigning a new route will automatically archive the previous one.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Active Assignment Display */}
                {currentTransport && (
                  <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 p-4 rounded-md">
                    <h3 className="font-semibold text-primary-700 dark:text-primary-400 mb-4 flex items-center">
                      <Bus className="h-5 w-5 mr-2" /> Current Active Route
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-text-secondary">Route Name</p>
                        <p className="font-medium">{currentTransport.route?.routeName || currentTransport.stop?.route?.routeName}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Assigned Stop</p>
                        <p className="font-medium">{currentTransport.stop?.stopName || "To be assigned"}</p>
                        <p className="text-xs text-text-secondary">
                          {currentTransport.stop ? `${currentTransport.stop.arrivalTime || '--:--'} - ${currentTransport.stop.departureTime || '--:--'}` : "Driver will assign"}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Crew Details</p>
                        <div className="space-y-2 mt-1">
                          {(() => {
                            const latestTrip = (currentTransport.route || currentTransport.stop?.route)?.TransportTrip?.[0];
                            const vehicleStaff = latestTrip?.vehicle?.staff || [];
                            const driver = vehicleStaff.find((s: any) => s.shift.includes("Driver"))?.staff;
                            const conductor = vehicleStaff.find((s: any) => s.shift.includes("Conductor"))?.staff;

                            return (
                              <>
                                <div>
                                  <p className="font-medium text-xs text-text-secondary">Driver</p>
                                  <p className="font-semibold">{driver?.fullName || latestTrip?.driver?.fullName || "Not Assigned"}</p>
                                  {driver?.phone && <p className="text-xs text-primary">{driver.phone}</p>}
                                </div>
                                <div>
                                  <p className="font-medium text-xs text-text-secondary">Conductor</p>
                                  <p className="font-semibold">{conductor?.fullName || "Not Assigned"}</p>
                                  {conductor?.phone && <p className="text-xs text-primary">{conductor.phone}</p>}
                                </div>
                                <p className="text-xs text-text-secondary mt-1 border-t pt-1">
                                  Bus: {latestTrip?.vehicle?.vehicleNumber || "No Bus Linked"}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        <p className="text-text-secondary">Schedule</p>
                        <p className="font-medium">
                          {currentTransport.morningPickup && "Morning"} 
                          {currentTransport.morningPickup && currentTransport.afternoonDrop && " & "} 
                          {currentTransport.afternoonDrop && "Afternoon"}
                        </p>
                        <p className="text-xs text-text-secondary">Seat: {currentTransport.seatNumber || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment Form */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md border mt-4">
                  <h4 className="font-medium mb-3">{currentTransport ? "Assign New Route" : "Assign Route"}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Select Route"
                      value={transportForm.routeId}
                      onChange={(e) => setTransportForm({...transportForm, routeId: e.target.value, stopId: ""})}
                      options={[{label: "Select Route", value: ""}, ...transportRoutes.map(r => ({label: r.routeName, value: r.id}))]}
                    />
                    <Select
                      label="Select Stop"
                      value={transportForm.stopId}
                      onChange={(e) => setTransportForm({...transportForm, stopId: e.target.value})}
                      disabled={!transportForm.routeId}
                      options={
                        [{label: "Select Stop", value: ""}]
                        .concat(
                          (transportRoutes.find(r => r.id === transportForm.routeId)?.stops || [])
                          .map((s: any) => ({label: `${s.stopName} (${s.arrivalTime || 'N/A'})`, value: s.id}))
                        )
                      }
                    />
                  </div>
                  
                  <div className="flex gap-4 mt-4 items-center">
                    <label className="flex items-center space-x-2 text-sm font-medium">
                      <input 
                        type="checkbox" 
                        checked={transportForm.morningPickup} 
                        onChange={(e) => setTransportForm({...transportForm, morningPickup: e.target.checked})}
                        className="rounded border-border"
                      />
                      <span>Morning Pickup</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm font-medium">
                      <input 
                        type="checkbox" 
                        checked={transportForm.afternoonDrop} 
                        onChange={(e) => setTransportForm({...transportForm, afternoonDrop: e.target.checked})}
                        className="rounded border-border"
                      />
                      <span>Afternoon Drop</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Input
                      label="Seat Number (Optional)"
                      value={transportForm.seatNumber}
                      onChange={(e) => setTransportForm({...transportForm, seatNumber: e.target.value})}
                      placeholder="e.g. 12A"
                    />
                    <Select
                      label="Fee Period"
                      value={transportForm.feePeriod}
                      onChange={(e) => setTransportForm({...transportForm, feePeriod: e.target.value})}
                      options={[
                        {label: "Monthly", value: "Monthly"},
                        {label: "Quarterly", value: "Quarterly"},
                        {label: "Yearly", value: "Yearly"}
                      ]}
                    />
                    <Input
                      label="Guardian Auth (Optional)"
                      value={transportForm.guardianAuth}
                      onChange={(e) => setTransportForm({...transportForm, guardianAuth: e.target.value})}
                      placeholder="e.g. Mother/Father"
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button 
                      onClick={async () => {
                        if (!transportForm.routeId) {
                          toast("Incomplete", { description: "Please select a route to assign.", type: "warning" });
                          return;
                        }
                        if (!student.enrollments || student.enrollments.length === 0) {
                          toast("Error", { description: "Student has no active enrollment to assign transport.", type: "error" });
                          return;
                        }
                        
                        try {
                          const res = await fetch(`${API_URL}/transport/student-assignments`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              enrollmentId: student.enrollments[0].id,
                              routeId: transportForm.routeId,
                              stopId: transportForm.stopId || null,
                              morningPickup: transportForm.morningPickup,
                              afternoonDrop: transportForm.afternoonDrop,
                              seatNumber: transportForm.seatNumber,
                              feePeriod: transportForm.feePeriod,
                              guardianAuth: transportForm.guardianAuth
                            })
                          });
                          
                          if (res.ok) {
                            toast("Assigned", { description: "Student successfully assigned to route.", type: "success" });
                            fetchStudent();
                            setTransportForm({
                              routeId: "",
                              stopId: "",
                              morningPickup: true,
                              afternoonDrop: true,
                              seatNumber: "",
                              feePeriod: "Monthly",
                              guardianAuth: ""
                            });
                          } else {
                            toast("Error", { description: "Failed to assign transport.", type: "error" });
                          }
                        } catch {
                          toast("Error", { description: "Network error.", type: "error" });
                        }
                      }}
                    >
                      Save Transport Assignment
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

          {/* ID CARD GENERATOR */}
          {activeTab === "idcard" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <div>
                  <CardTitle className="text-lg">Digital ID Card</CardTitle>
                  <CardDescription>Generated ID card for student identification</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center">
                {renderedIdCard ? (
                  <div className="flex flex-col items-center">
                    <div 
                      ref={idCardRef}
                      className="relative overflow-hidden shadow-xl border rounded-xl flex flex-col items-center pt-8 bg-white"
                      style={{
                        width: '260px', 
                        height: '400px',
                        backgroundColor: renderedIdCard.template.primaryColor,
                        color: 'white'
                      }}
                    >
                      <h3 className="font-bold text-xl mb-6">{renderedIdCard.template.schoolName}</h3>
                      
                      <div className="w-28 h-28 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                        <img src={renderedIdCard.student.photoUrl || "https://i.pravatar.cc/300"} alt="Photo" className="w-full h-full object-cover" />
                      </div>
                      
                      <h4 className="font-bold text-xl mb-1">{renderedIdCard.student.fullName}</h4>
                      <p className="text-sm opacity-90 mb-1">Class {renderedIdCard.student.enrollments?.[0]?.section?.class?.grade || "N/A"}</p>
                      <p className="text-xs opacity-80 mb-4">DOB: {new Date(renderedIdCard.student.dateOfBirth).toLocaleDateString()}</p>

                      <div className="w-full bg-white text-black p-4 text-center mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                        <p className="text-[10px] font-bold text-gray-500 tracking-wider">ID NUMBER</p>
                        <p className="font-mono text-sm font-bold">{renderedIdCard.idNumber}</p>
                        
                        <div className="mt-3 w-40 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center border">
                          <span className="text-sm font-mono text-gray-600 font-bold tracking-[4px]">|||| | || || | | ||</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-8">
                      <Button variant="outline" onClick={handlePrint} leftIcon={<Printer className="h-4 w-4" />}>
                        Print ID Card
                      </Button>
                      <Button variant="primary" leftIcon={<Download className="h-4 w-4" />}>
                        Download PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary">
                    <User className="h-16 w-16 mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold text-text-primary mb-1">No ID Card Generated</h3>
                    <p className="text-sm max-w-sm">This student does not have an active ID card template assigned.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
