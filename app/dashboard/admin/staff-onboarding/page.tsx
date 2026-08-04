"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { UserPlus, Trash2, Search, Sparkles, UserCircle, Users, ClipboardList, Edit } from "lucide-react";
import { StaffProfileModal } from "./StaffProfileModal";
import { useRouter } from "next/navigation";

interface RoleDef {
  id: string;
  name: string;
}

interface CampusDef {
  id: string;
  name: string;
}

interface StaffDef {
  id: string;
  fullName: string;
  email: string;
  status: string;
  role: {
    name: string;
  };
}

export default function StaffOnboardingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: HeadersInit | undefined = token ? { Authorization: `Bearer ${token}` } : undefined;

  // Mode: "directory" or "wizard"
  const [activeTab, setActiveTab] = useState("directory");
  const [step, setStep] = useState(1);
  const [autoSaving, setAutoSaving] = useState(false);

  // Profile Modal State
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  
  const [credentialsModal, setCredentialsModal] = useState<{isOpen: boolean, identifier: string, password: string, name: string} | null>(null);

  // Lists from backend
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [campuses, setCampuses] = useState<CampusDef[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<StaffDef[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Form State
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleId: "",
    campusId: "",
    qualification: "",
    experience: "",
    hasBackgroundCheck: false,
    isCasual: false,
    teacherSubjectId: "",
    teacherSectionId: "",
    teacherWorkload: "14 hrs/week",
    password: "",
    subjectExpertise: [] as string[],
    classRange: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch dynamic metadata options
  const fetchMetadata = async () => {
    try {
      const rRes = await fetch(`${API_URL}/roles`, { headers: authHeaders });
      const cRes = await fetch(`${API_URL}/master-data/campuses`, { headers: authHeaders });
      const clRes = await fetch(`${API_URL}/master-data/classes`, { headers: authHeaders });
      const subRes = await fetch(`${API_URL}/master-data/subjects`, { headers: authHeaders });

      if (rRes.status === 401 || cRes.status === 401 || clRes.status === 401 || subRes.status === 401) {
        router.push("/login");
        return;
      }

      if (rRes.ok && cRes.ok && clRes.ok && subRes.ok) {
        const rData = await rRes.json();
        const cData = await cRes.json();
        const clData = await clRes.json();
        const subData = await subRes.json();
        
        setRoles(rData);
        setCampuses(cData);
        setClasses(clData);
        setSubjects(subData);

        // Populate initial defaults
        setForm((prev) => ({
          ...prev,
          roleId: rData[0]?.id || "",
          campusId: cData[0]?.id || "",
          password: Math.random().toString(36).slice(-8) + "Pass123!",
        }));
      }
    } catch (err) {
      toast("Metadata Offline", { description: "NestJS APIs offline.", type: "error" });
    }
  };

  const fetchStaffList = async () => {
    try {
      setIsLoadingStaff(true);
      const res = await fetch(`${API_URL}/staff`, { headers: authHeaders });
      if (res.ok) {
        const result = await res.json();
        setStaffList(result.data || result);
      } else if (res.status === 401) {
        router.push("/login");
        return;
      }
    } catch (err) {
      toast("Error", { description: "Could not retrieve staff roster.", type: "error" });
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchMetadata();
    fetchStaffList();
  }, [router, token]);

  const handleFieldChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }

    setAutoSaving(true);
    const saveTimer = setTimeout(() => {
      setAutoSaving(false);
    }, 400);
    return () => clearTimeout(saveTimer);
  };

  const validateStep = (currentStep: number) => {
    const stepErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!form.firstName.trim()) stepErrors.firstName = "First name is required.";
      if (!form.lastName.trim()) stepErrors.lastName = "Last name is required.";
      if (!form.email.trim()) {
        stepErrors.email = "Email is required.";
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        stepErrors.email = "Please enter a valid campus email address.";
      }
    } else if (currentStep === 2) {
      if (!form.qualification.trim()) stepErrors.qualification = "Academic qualification is required.";
      
      const activeRole = roles.find(r => r.id === form.roleId);
      if (activeRole?.name === "Teacher") {
        if (!form.teacherSubjectId) stepErrors.teacherSubjectId = "Subject is required for teachers.";
        if (!form.teacherSectionId) stepErrors.teacherSectionId = "Section is required for teachers.";
      }
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((p) => p + 1);
    } else {
      toast("Validation Errors", { description: "Please resolve the highlighted fields.", type: "error" });
    }
  };

  const handleFinish = async () => {
    if (!form.hasBackgroundCheck && !form.isCasual) {
      toast("Requirement Missing", { description: "Please complete background check validation.", type: "warning" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          email: form.email,
          fullName: `${form.firstName} ${form.lastName}`,
          passwordHash: form.password,
          roleId: form.roleId,
          status: "Active",
          details: {
            subjectExpertise: form.subjectExpertise,
            classRange: form.classRange,
            qualification: form.qualification,
            experience: form.experience
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to onboard staff.");
      }
      
      const activeRole = roles.find(r => r.id === form.roleId);
      if (activeRole?.name === "Teacher" && form.teacherSectionId && form.teacherSubjectId) {
        const allocRes = await fetch(`${API_URL}/master-data/allocations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            staffId: data.id,
            sessionId: classes.find(c => c.sections?.some((s:any) => s.id === form.teacherSectionId))?.sessionId || "",
            subjectId: form.teacherSubjectId,
            sectionId: form.teacherSectionId,
            workload: form.teacherWorkload,
          }),
        });
        if (!allocRes.ok) {
          toast("Assignment Warning", { description: "Staff registered, but subject assignment failed.", type: "warning" });
        }
      }

      setCredentialsModal({
        isOpen: true,
        identifier: data.email,
        password: data.generatedPassword,
        name: data.fullName
      });

      toast("Staff Registered Successfully", { description: `${form.firstName} ${form.lastName} has been added.`, type: "success" });
      setStep(1);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        roleId: roles[0]?.id || "",
        campusId: campuses[0]?.id || "",
        qualification: "",
        experience: "",
        hasBackgroundCheck: false,
        isCasual: false,
        teacherSubjectId: "",
        teacherSectionId: "",
        teacherWorkload: "14 hrs/week",
        password: Math.random().toString(36).slice(-8) + "Pass123!",
        subjectExpertise: [] as string[],
        classRange: [] as string[],
      });
      setActiveTab("directory");
      fetchStaffList();
    } catch (err: any) {
      toast("Enrollment Failed", { description: err.message || "Could not register staff record.", type: "error" });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`${API_URL}/staff/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      toast("Staff Member Removed", { type: "warning" });
      fetchStaffList();
    } catch (err) {
      toast("Action Denied", { description: "Cannot remove staff user with active allocations.", type: "error" });
    }
  };

  const activeRoleName = roles.find((r) => r.id === form.roleId)?.name || "N/A";
  const activeCampusName = campuses.find((c) => c.id === form.campusId)?.name || "N/A";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredStaff = staffList.filter(
    (s: any) => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.role.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = filterRole ? s.role.name === filterRole : true;
      const matchesSubject = filterSubject ? (s.details?.subjectExpertise?.includes(filterSubject)) : true;

      return matchesSearch && matchesRole && matchesSubject;
    }
  );

  const totalPages = Math.ceil(filteredStaff.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + pageSize);

  // Reset page on search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, filterSubject]);

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Staff Management Center
          </h1>
          <p className="text-sm text-text-secondary">
            Onboard new educators, manage roles, and review the active campus staff directory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "wizard" && (
            <Button variant="outline" size="sm" onClick={() => setActiveTab("directory")}>
              Back to Directory
            </Button>
          )}
          {activeTab === "directory" && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => {
                setStep(1);
                setActiveTab("wizard");
              }}
            >
              Onboard Staff
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "directory", label: "Staff Directory Roster", icon: <Users className="h-4 w-4" /> },
          { id: "wizard", label: "Enrollment Wizard", icon: <ClipboardList className="h-4 w-4" /> },
        ]}
      />

      {activeTab === "directory" && (
        <Card>
          <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <CardTitle>Institutional Staff Directory</CardTitle>
              <CardDescription>Roster of all registered educators and system administrators.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                options={[{ label: "All Roles", value: "" }, ...roles.map(r => ({ label: r.name, value: r.name }))]}
              />
              <Select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                options={[{ label: "All Subjects", value: "" }, ...subjects.map(s => ({ label: s.name, value: s.name }))]}
              />
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-border rounded-btn pl-9 pr-4 py-1.5 text-xs text-text-primary outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {isLoadingStaff ? (
              <div className="py-12 text-center text-xs text-text-secondary italic">
                Loading staff registry from PostgreSQL...
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary italic">
                No staff members found matching criteria.
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Campus Email Address</TableHead>
                      <TableHead>Access Role</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStaff.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-semibold text-text-primary">{staff.fullName}</TableCell>
                        <TableCell className="text-text-secondary">{staff.email}</TableCell>
                        <TableCell>
                          <Badge variant="primary">{staff.role.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={staff.status === "Active" ? "success" : "neutral"}>
                            {staff.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => setSelectedStaffId(staff.id)}
                          >
                            <UserCircle className="h-3.5 w-3.5 mr-1" /> View Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => router.push(`/dashboard/admin/staff-management/${staff.id}`)}
                          >
                            <ClipboardList className="h-3.5 w-3.5 mr-1" /> Assignments
                          </Button>
                          {staff.email !== "admin@school.com" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDeleteStaff(staff.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-danger" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <p className="text-xs text-text-secondary">
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredStaff.length)} of {filteredStaff.length} staff members
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Progress Sidebar */}
          <aside className="lg:col-span-1 bg-card rounded-card border border-border p-4 space-y-3 shadow-soft">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Onboarding Progress
            </h3>
            <div className="space-y-4">
              {[
                { num: 1, title: "Personal File", desc: "Profile details & email" },
                { num: 2, title: "Role Assignment", desc: "Campus context & metrics" },
                { num: 3, title: "Dossier Documents", desc: "Background check & credentials" },
                { num: 4, title: "Registry Review", desc: "Submission summary" },
              ].map((s) => (
                <div key={s.num} className="flex gap-3 items-start">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 ${
                      step === s.num
                        ? "bg-primary text-white border-primary"
                        : step > s.num
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-slate-50 dark:bg-slate-800 text-text-secondary border-border"
                    }`}
                  >
                    {s.num}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${step === s.num ? "text-primary" : "text-text-primary"}`}>
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-text-secondary mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Wizard Panel */}
          <div className="lg:col-span-3">
            <Card className="flex flex-col h-full justify-between">
              <CardHeader>
                <CardTitle>Step {step}: Registering Profile Parameters</CardTitle>
                <CardDescription>All fields marked with (*) are required parameters for legal payroll and database entries.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                {/* Step 1: Personal Details */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="First Name *"
                        placeholder="Jane"
                        value={form.firstName}
                        error={errors.firstName}
                        onChange={(e) => handleFieldChange("firstName", e.target.value)}
                      />
                      <Input
                        label="Last Name *"
                        placeholder="Smith"
                        value={form.lastName}
                        error={errors.lastName}
                        onChange={(e) => handleFieldChange("lastName", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Campus Email Address *"
                        type="email"
                        placeholder="jsmith@school.edu"
                        value={form.email}
                        error={errors.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                      />
                      <Input
                        label="Phone Number"
                        placeholder="+1 (555) 019-2834"
                        value={form.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Role Details */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Assigned Access Role *"
                        value={form.roleId}
                        onChange={(e) => handleFieldChange("roleId", e.target.value)}
                        options={roles.map((r) => ({ label: r.name, value: r.id }))}
                      />
                      <Select
                        label="Allocated Campus Branch *"
                        value={form.campusId}
                        onChange={(e) => handleFieldChange("campusId", e.target.value)}
                        options={campuses.map((c) => ({ label: c.name, value: c.id }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Highest Academic Qualification *"
                        placeholder="M.Sc. in Biology"
                        value={form.qualification}
                        error={errors.qualification}
                        onChange={(e) => handleFieldChange("qualification", e.target.value)}
                      />
                      <Input
                        label="Years of Experience"
                        type="number"
                        placeholder="5"
                        value={form.experience}
                        onChange={(e) => handleFieldChange("experience", e.target.value)}
                      />
                    </div>
                    {roles.find(r => r.id === form.roleId)?.name === "Teacher" && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        
                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Teacher Qualifications & Expertise</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Subject Expertise</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border p-3 rounded h-40 overflow-y-auto space-y-2">
                              {subjects.map(sub => (
                                <div key={sub.id} className="flex items-center gap-2">
                                  <Checkbox 
                                    id={`subj-${sub.id}`} 
                                    checked={form.subjectExpertise.includes(sub.name)}
                                    onChange={(e: any) => {
                                      const checked = e.target.checked;
                                      if (checked) handleFieldChange("subjectExpertise", [...form.subjectExpertise, sub.name] as any);
                                      else handleFieldChange("subjectExpertise", form.subjectExpertise.filter(s => s !== sub.name) as any);
                                    }}
                                  />
                                  <label htmlFor={`subj-${sub.id}`} className="text-sm cursor-pointer">{sub.name}</label>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Qualified Class Range</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border p-3 rounded h-40 overflow-y-auto space-y-2">
                              {classes.map(cls => (
                                <div key={cls.id} className="flex items-center gap-2">
                                  <Checkbox 
                                    id={`cls-${cls.id}`} 
                                    checked={form.classRange.includes(cls.grade)}
                                    onChange={(e: any) => {
                                      const checked = e.target.checked;
                                      if (checked) handleFieldChange("classRange", [...form.classRange, cls.grade] as any);
                                      else handleFieldChange("classRange", form.classRange.filter(c => c !== cls.grade) as any);
                                    }}
                                  />
                                  <label htmlFor={`cls-${cls.id}`} className="text-sm cursor-pointer">{cls.grade}</label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mt-6 pt-4 border-t"><Sparkles className="h-4 w-4 text-primary" /> Immediate Workload Assignment (Optional)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Select
                            label="Subject Taught *"
                            value={form.teacherSubjectId}
                            onChange={(e) => handleFieldChange("teacherSubjectId", e.target.value)}
                            options={[{label: "Select Subject...", value: ""}, ...subjects.map(s => ({ label: s.name, value: s.id }))]}
                          />
                          <Select
                            label="Class Section *"
                            value={form.teacherSectionId}
                            onChange={(e) => handleFieldChange("teacherSectionId", e.target.value)}
                            options={[{label: "Select Section...", value: ""}, ...classes.flatMap(c => c.sections?.map((sec:any) => ({ label: `${c.grade} - ${sec.name}`, value: sec.id })) || [])]}
                          />
                        </div>
                        <Input
                           label="Expected Weekly Workload"
                           value={form.teacherWorkload}
                           onChange={(e) => handleFieldChange("teacherWorkload", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Verification Credentials */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FileUpload label="Academic Diplomas & Transcripts" accept=".pdf" />
                      <Input
                        label="Create Temporary Login Password *"
                        type="text"
                        placeholder="Enter a secure password..."
                        value={form.password}
                        onChange={(e) => handleFieldChange("password", e.target.value)}
                      />
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-card border">
                      <div className="mb-4 pb-4 border-b border-border/40">
                        <Checkbox
                          id="isCasual"
                          label="Casual/Support Worker (Bypass Documents & Background Check)"
                          checked={form.isCasual}
                          onChange={(e: any) => handleFieldChange("isCasual", e.target.checked)}
                        />
                        <p className="text-[11px] text-text-secondary mt-1.5 ml-7">
                          Enable this for non-permanent staff (e.g. peons) who do not have formal documents.
                        </p>
                      </div>
                      
                      <div className={form.isCasual ? "opacity-50 pointer-events-none" : ""}>
                        <Checkbox
                          id="bgCheck"
                          label="Confirm background check verification has passed legal and safety criteria."
                          checked={form.hasBackgroundCheck}
                          onChange={(e: any) => handleFieldChange("hasBackgroundCheck", e.target.checked)}
                        />
                        <p className="text-[11px] text-text-secondary mt-1.5 ml-7">
                          Registration cannot be finalized until background dossiers are cleared.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Final Summary Review */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-card border border-primary/20">
                      <UserCircle className="h-10 w-10 text-primary" />
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">
                          Review Staff Enrollment Dossier
                        </h4>
                        <p className="text-xs text-text-secondary">
                          Please review the metadata below before writing changes to the server database.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-5 bg-slate-50 dark:bg-slate-900 rounded-card border">
                      <p><b>First Name:</b> {form.firstName}</p>
                      <p><b>Last Name:</b> {form.lastName}</p>
                      <p><b>Email:</b> {form.email}</p>
                      <p><b>Phone:</b> {form.phone || "Not provided"}</p>
                      <p><b>Access Role:</b> {activeRoleName}</p>
                      <p><b>Campus Allocation:</b> {activeCampusName}</p>
                      <p><b>Qualification:</b> {form.qualification}</p>
                      <p><b>Temporary Password:</b> {form.password}</p>
                      <p><b>Background Status:</b> {form.isCasual ? "Bypassed (Casual Worker)" : (form.hasBackgroundCheck ? "Validated & Passed" : "Pending Action")}</p>
                      {activeRoleName === "Teacher" && (
                        <>
                          <div className="col-span-1 md:col-span-2 mt-2 pt-2 border-t">
                            <p className="font-semibold text-primary mb-1">Teacher Expertise</p>
                            <p><b>Subjects:</b> {form.subjectExpertise.length > 0 ? form.subjectExpertise.join(", ") : "None Selected"}</p>
                            <p><b>Class Range:</b> {form.classRange.length > 0 ? form.classRange.join(", ") : "None Selected"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between border-t border-border pt-4">
                <Button
                  variant="outline"
                  disabled={step === 1}
                  onClick={() => setStep((p) => p - 1)}
                >
                  Previous Step
                </Button>
                {step < 4 ? (
                  <Button variant="primary" onClick={handleNext}>
                    Continue
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleFinish} leftIcon={<UserPlus className="h-4.5 w-4.5" />}>
                    Finish &amp; Register Staff
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {selectedStaffId && (
        <StaffProfileModal
          isOpen={true}
          onClose={() => setSelectedStaffId(null)}
          staffId={selectedStaffId}
          API_URL={API_URL}
          onUpdated={fetchStaffList}
        />
      )}
    </>
  );
}
