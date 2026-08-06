"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Trash2, Edit2, MapPin, School, BookOpen, Users, Calendar } from "lucide-react";

interface SessionDef {
  id: string;
  name: string;
  isActive: boolean;
}

interface CampusDef {
  id: string;
  name: string;
  address: string;
  capacity: string;
  status: string;
}

interface ClassDef {
  id: string;
  grade: string;
  sections: { id: string; name: string }[];
  campus: { name: string };
  session: { name: string };
}

interface SubjectDef {
  id: string;
  name: string;
  classes?: {
    class?: {
      grade: string;
      campus?: {
        name: string;
      };
    };
  }[];
  medium: string;
}

interface AllocationDef {
  id: string;
  staff?: { fullName: string };
  section?: { name: string, class?: { grade: string, campus?: { name: string } } };
  subject?: { class?: { grade: string, campus?: { name: string } } };
  hoursPerWeek?: number;
  workload?: string;
  status: string;
  isClassTeacher?: boolean;
}

export default function MasterDataPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [activeTab, setActiveTab] = useState("sessions");

  // Roster lists from backend
  const [sessions, setSessions] = useState<SessionDef[]>([]);
  const [campuses, setCampuses] = useState<CampusDef[]>([]);
  const [classes, setClasses] = useState<ClassDef[]>([]);
  const [subjects, setSubjects] = useState<SubjectDef[]>([]);
  const [allocations, setAllocations] = useState<AllocationDef[]>([]);

  // Modals booking controllers
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [isCampusOpen, setIsCampusOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isAllocationOpen, setIsAllocationOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Modal input fields
  const [sessionName, setSessionName] = useState("");
  const [campusName, setCampusName] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [campusCapacity, setCampusCapacity] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [classSections, setClassSections] = useState("");
  const [classCampusId, setClassCampusId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectGradeId, setSubjectGradeId] = useState("");
  const [subjectMedium, setSubjectMedium] = useState("English");
  const [allocSectionId, setAllocSectionId] = useState("");
  const [allocWorkload, setAllocWorkload] = useState("14");
  const [allocStaffId, setAllocStaffId] = useState("");
  const [staffList, setStaffList] = useState<{ id: string; fullName: string }[]>([]);

  // Subject Roster Filters
  const [filterClass, setFilterClass] = useState("All");
  const [filterMedium, setFilterMedium] = useState("All");

  // Pagination states for all tabs
  const [pageSessions, setPageSessions] = useState(1);
  const [pageCampuses, setPageCampuses] = useState(1);
  const [pageClasses, setPageClasses] = useState(1);
  const [pageTeachers, setPageTeachers] = useState(1);
  const [pageSubjects, setPageSubjects] = useState(1);
  const pageSize = 5;

  // Reset page sizes when activeTab changes
  useEffect(() => {
    setPageSessions(1);
    setPageCampuses(1);
    setPageClasses(1);
    setPageTeachers(1);
    setPageSubjects(1);
  }, [activeTab, filterClass, filterMedium]);

  // Fetch functions
  const fetchData = async () => {
    try {
      const sRes = await fetch(`${API_URL}/master-data/sessions`);
      if (sRes.ok) setSessions(await sRes.json());

      const cRes = await fetch(`${API_URL}/master-data/campuses`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCampuses(cData);
        if (cData.length > 0 && !classCampusId) {
          setClassCampusId(cData[0].id);
        }
      }

      const clRes = await fetch(`${API_URL}/master-data/classes`);
      if (clRes.ok) {
        const clData = await clRes.json();
        setClasses(clData);
        if (clData.length > 0) {
          if (!subjectGradeId) setSubjectGradeId(clData[0].id);
          if (!allocSectionId && clData[0].sections?.length > 0) {
            setAllocSectionId(clData[0].sections[0].id);
          }
        }
      }

      const subRes = await fetch(`${API_URL}/master-data/subjects`);
      if (subRes.ok) setSubjects(await subRes.json());

      const aRes = await fetch(`${API_URL}/master-data/allocations`);
      if (aRes.ok) setAllocations(await aRes.json());

      const sfRes = await fetch(`${API_URL}/staff`);
      if (sfRes.ok) {
        const sfData = await sfRes.json();
        setStaffList(sfData.data || sfData);
      }
    } catch {
      toast("Sync Offline", { description: "NestJS APIs offline.", type: "error" });
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to campus changes in Layout
    const listener = () => fetchData();
    window.addEventListener("campusChanged", listener);
    return () => window.removeEventListener("campusChanged", listener);
  }, [classCampusId, subjectGradeId, allocSectionId]);

  // ADD FORM HANDLERS
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName) return;
    try {
      const isEdit = !!editingRecordId;
      const url = isEdit ? `${API_URL}/master-data/sessions/${editingRecordId}` : `${API_URL}/master-data/sessions`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName }),
      });
      if (!res.ok) throw new Error();
      toast(isEdit ? "Session Updated" : "Session Created", { type: "success" });
      setIsSessionOpen(false);
      setEditingRecordId(null);
      fetchData();
    } catch {
      toast("Action Failed", { type: "error" });
    }
  };

  const handleSetActiveSession = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/master-data/sessions/${id}/set-active`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      toast("Active Session Shifted", { type: "success" });
      fetchData();
    } catch {
      toast("Update Failed", { type: "error" });
    }
  };

  const handleAddCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusName || !campusAddress) return;
    try {
      const isEdit = !!editingRecordId;
      const url = isEdit ? `${API_URL}/master-data/campuses/${editingRecordId}` : `${API_URL}/master-data/campuses`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: campusName, address: campusAddress, capacity: campusCapacity }),
      });
      if (!res.ok) throw new Error();
      toast(isEdit ? "Campus Updated" : "Campus Registered", { type: "success" });
      setIsCampusOpen(false);
      setEditingRecordId(null);
      fetchData();
    } catch {
      toast("Action Failed", { type: "error" });
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classGrade || !classSections) return;
    try {
      const parsedSections = classSections.split(",").map((s) => s.trim());
      const activeSession = sessions.find((s) => s.isActive);
      const activeSessionId = activeSession ? activeSession.id : sessions[0]?.id;

      const isEdit = !!editingRecordId;
      const url = isEdit ? `${API_URL}/master-data/classes/${editingRecordId}` : `${API_URL}/master-data/classes`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: classGrade,
          sections: parsedSections,
          campusId: classCampusId,
          sessionId: activeSessionId,
        }),
      });
      if (!res.ok) throw new Error();
      toast(isEdit ? "Class Updated" : "Class Setup Complete", { type: "success" });
      setIsClassOpen(false);
      setEditingRecordId(null);
      fetchData();
    } catch {
      toast("Action Failed", { type: "error" });
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName) return;
    try {
      const isEdit = !!editingRecordId;
      const url = isEdit ? `${API_URL}/master-data/subjects/${editingRecordId}` : `${API_URL}/master-data/subjects`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subjectName,
          classId: subjectGradeId,
          medium: subjectMedium,
        }),
      });
      if (!res.ok) throw new Error();
      toast(isEdit ? "Subject Updated" : "Subject Added", { type: "success" });
      setIsSubjectOpen(false);
      setEditingRecordId(null);
      fetchData();
    } catch {
      toast("Action Failed", { type: "error" });
    }
  };

  const handleAddAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocStaffId) return;
    try {
      const activeSession = sessions.find((s) => s.isActive);
      const activeSessionId = activeSession ? activeSession.id : sessions[0]?.id;
      
      const isEdit = !!editingRecordId;
      const url = isEdit ? `${API_URL}/master-data/allocations/${editingRecordId}` : `${API_URL}/master-data/allocations`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: allocStaffId,
          sessionId: activeSessionId,
          sectionId: allocSectionId,
          workload: allocWorkload,
        }),
      });
      if (!res.ok) throw new Error();
      toast(isEdit ? "Teacher Allocation Updated" : "Teacher Allocated", { type: "success" });
      setIsAllocationOpen(false);
      setEditingRecordId(null);
      fetchData();
    } catch {
      toast("Action Failed", { type: "error" });
    }
  };

  const handleDeleteMasterRecord = async (endpoint: string, id: string) => {
    if (!confirm("Are you sure you want to permanently delete this record?")) return;
    try {
      const res = await fetch(`${API_URL}/master-data/${endpoint}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast("Record Deleted", { type: "warning" });
      fetchData();
    } catch {
      toast("Deletion Refused", { description: "Record is mapped to child database constraints.", type: "error" });
    }
  };

  let activeCampusName = typeof window !== "undefined" 
    ? localStorage.getItem("activeCampus") || (campuses.length > 0 ? campuses[0].name : "Main Campus") 
    : "Main Campus";
  if (campuses.length > 0 && !campuses.some(c => c.name === activeCampusName)) {
    activeCampusName = campuses[0].name;
  }

  // Dynamic filtered lists
  const filteredClasses = classes;
  const filteredAllocations = allocations.filter(a => a.isClassTeacher === true);
  const filteredSubjects = subjects
    .filter((sub) => {
      if (filterClass === "All") return true;
      return sub.classes?.some((c) => c.class?.grade === filterClass);
    })
    .filter((sub) => {
      if (filterMedium === "All") return true;
      return sub.medium.toLowerCase().includes(filterMedium.toLowerCase());
    });

  const uniqueGrades = Array.from(new Set(classes.map((c) => c.grade)));

  // Paginated Data
  const paginatedSessions = sessions.slice((pageSessions - 1) * pageSize, pageSessions * pageSize);
  const totalSessionsPages = Math.ceil(sessions.length / pageSize);

  const paginatedCampuses = campuses.slice((pageCampuses - 1) * pageSize, pageCampuses * pageSize);
  const totalCampusesPages = Math.ceil(campuses.length / pageSize);

  const paginatedClasses = filteredClasses.slice((pageClasses - 1) * pageSize, pageClasses * pageSize);
  const totalClassesPages = Math.ceil(filteredClasses.length / pageSize);

  const paginatedTeachers = filteredAllocations.slice((pageTeachers - 1) * pageSize, pageTeachers * pageSize);
  const totalTeachersPages = Math.ceil(filteredAllocations.length / pageSize);

  const paginatedSubjects = filteredSubjects.slice((pageSubjects - 1) * pageSize, pageSubjects * pageSize);
  const totalSubjectsPages = Math.ceil(filteredSubjects.length / pageSize);

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Master Data Repository
          </h1>
          <p className="text-sm text-text-secondary">
            Configure academic sessions, campuses, classes, sections, subjects, and allocate class teachers.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4.5 w-4.5" />}
          onClick={() => {
            setEditingRecordId(null);
            if (activeTab === "sessions") { setSessionName(""); setIsSessionOpen(true); }
            else if (activeTab === "campuses") { setCampusName(""); setCampusAddress(""); setCampusCapacity("100"); setIsCampusOpen(true); }
            else if (activeTab === "classes") { setClassGrade(""); setClassSections(""); setIsClassOpen(true); }
            else if (activeTab === "subjects") { setSubjectName(""); setIsSubjectOpen(true); }
            else if (activeTab === "teachers") { setAllocStaffId(""); setAllocWorkload(""); setIsAllocationOpen(true); }
          }}
        >
          Add Master Record
        </Button>
      </div>

      {/* Tabs Selector */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "sessions", label: "Academic Sessions", icon: <Calendar className="h-4 w-4" /> },
          { id: "campuses", label: "Campuses", icon: <MapPin className="h-4 w-4" /> },
          { id: "classes", label: "Classes & Sections", icon: <School className="h-4 w-4" /> },
          { id: "teachers", label: "Class Teachers", icon: <Users className="h-4 w-4" /> },
          { id: "subjects", label: "Subjects Map", icon: <BookOpen className="h-4 w-4" /> },
        ]}
      />

      {/* SESSIONS TAB */}
      {activeTab === "sessions" && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Calendar Sessions</CardTitle>
            <CardDescription>Setup academic session years and set the active calendar range.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session Name</TableHead>
                  <TableHead>Active Marker</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-text-primary">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "success" : "neutral"}>
                        {s.isActive ? "Active Session" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-1" onClick={() => {
                        setEditingRecordId(s.id);
                        setSessionName(s.name);
                        setIsSessionOpen(true);
                      }}>
                        <Edit2 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      {!s.isActive && (
                        <Button variant="outline" size="sm" className="h-8 mr-2" onClick={() => handleSetActiveSession(s.id)}>
                          Set Active
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteMasterRecord("sessions", s.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paging Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-text-secondary">Page {pageSessions} of {totalSessionsPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pageSessions === 1} onClick={() => setPageSessions((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pageSessions === totalSessionsPages || totalSessionsPages === 0} onClick={() => setPageSessions((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CAMPUSES TAB */}
      {activeTab === "campuses" && (
        <Card>
          <CardHeader>
            <CardTitle>Institutional Campuses</CardTitle>
            <CardDescription>Configure physical locations and digital branch assets.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campus Name</TableHead>
                  <TableHead>Location Address</TableHead>
                  <TableHead>Enrollment Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCampuses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-text-primary">{c.name}</TableCell>
                    <TableCell>{c.address}</TableCell>
                    <TableCell>{c.capacity}</TableCell>
                    <TableCell>
                      <Badge variant="success">{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-1" onClick={() => {
                        setEditingRecordId(c.id);
                        setCampusName(c.name);
                        setCampusAddress(c.address);
                        setCampusCapacity(c.capacity);
                        setIsCampusOpen(true);
                      }}>
                        <Edit2 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteMasterRecord("campuses", c.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paging Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-text-secondary">Page {pageCampuses} of {totalCampusesPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pageCampuses === 1} onClick={() => setPageCampuses((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pageCampuses === totalCampusesPages || totalCampusesPages === 0} onClick={() => setPageCampuses((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CLASSES & SECTIONS TAB */}
      {activeTab === "classes" && (
        <Card>
          <CardHeader>
            <CardTitle>Grade Roster Map</CardTitle>
            <CardDescription>Classrooms, sections, and allocations mapped to campuses and active sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedClasses.map((cls) => (
                <div key={cls.id} className="p-5 bg-card border border-border rounded-card space-y-4 shadow-soft">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-text-primary">{cls.grade}</h4>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        Campus: {cls.campus.name} | Session: {cls.session.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                        setEditingRecordId(cls.id);
                        setClassGrade(cls.grade);
                        setClassSections(cls.sections?.map(s => s.name).join(", ") || "");
                        setClassCampusId(cls.campus?.name ? campuses.find(c => c.name === cls.campus.name)?.id || "" : "");
                        setIsClassOpen(true);
                      }}>
                        <Edit2 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteMasterRecord("classes", cls.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                    {cls.sections?.map((sec) => (
                      <span key={sec.id} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-xs font-semibold rounded-btn border text-text-primary">
                        {sec.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Paging Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-xs text-text-secondary">Page {pageClasses} of {totalClassesPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pageClasses === 1} onClick={() => setPageClasses((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pageClasses === totalClassesPages || totalClassesPages === 0} onClick={() => setPageClasses((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CLASS TEACHERS TAB */}
      {activeTab === "teachers" && (
        <Card>
          <CardHeader>
            <CardTitle>Class Teacher Allocations</CardTitle>
            <CardDescription>Assigned educators, active workload parameters, and status indicators.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Educator Name</TableHead>
                  <TableHead>Allocated Grade Class</TableHead>
                  <TableHead>Teaching Workload</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeachers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-text-primary">{t.staff?.fullName || "Unknown"}</TableCell>
                    <TableCell>{t.section ? `${t.section.class?.grade || ''} - ${t.section.name}` : t.subject?.class?.grade || "N/A"}</TableCell>
                    <TableCell>{t.hoursPerWeek !== undefined && t.hoursPerWeek !== null ? `${t.hoursPerWeek} hrs/week` : t.workload || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="success">{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-1" onClick={() => {
                        setEditingRecordId(t.id);
                        setAllocStaffId(t.staff?.fullName ? staffList.find(s => s.fullName === t.staff?.fullName)?.id || "" : "");
                        setAllocWorkload(t.hoursPerWeek !== undefined && t.hoursPerWeek !== null ? String(t.hoursPerWeek) : t.workload || "");
                        // Simplified setting for dropdowns - might require more complex state matching in production
                        setIsAllocationOpen(true);
                      }}>
                        <Edit2 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteMasterRecord("allocations", t.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paging Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-text-secondary">Page {pageTeachers} of {totalTeachersPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pageTeachers === 1} onClick={() => setPageTeachers((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pageTeachers === totalTeachersPages || totalTeachersPages === 0} onClick={() => setPageTeachers((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SUBJECTS TAB */}
      {activeTab === "subjects" && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Roster Map</CardTitle>
            <CardDescription>Curriculum configuration, class links, and mediums of instruction.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Roster Filters */}
            <div className="flex flex-wrap gap-4 items-center mb-5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-card border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-secondary">Class Grade:</span>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="bg-card text-xs border border-border rounded-btn p-1.5 outline-none cursor-pointer text-text-primary"
                >
                  <option value="All">All Grades</option>
                  {uniqueGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-secondary">Medium:</span>
                <select
                  value={filterMedium}
                  onChange={(e) => setFilterMedium(e.target.value)}
                  className="bg-card text-xs border border-border rounded-btn p-1.5 outline-none cursor-pointer text-text-primary"
                >
                  <option value="All">All Mediums</option>
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="Bilingual">Bilingual</option>
                </select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Associated Class Grade</TableHead>
                  <TableHead>Medium of Instruction</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubjects.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium text-text-primary">{sub.name}</TableCell>
                    <TableCell>{sub.classes && sub.classes.length > 0 ? Array.from(new Set(sub.classes.map((c) => c.class?.grade))).filter(Boolean).join(", ") : "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="primary">{sub.medium}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-1" onClick={() => {
                        setEditingRecordId(sub.id);
                        setSubjectName(sub.name);
                        setSubjectMedium(sub.medium);
                        setIsSubjectOpen(true);
                      }}>
                        <Edit2 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteMasterRecord("subjects", sub.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paging Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-text-secondary">Page {pageSubjects} of {totalSubjectsPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pageSubjects === 1} onClick={() => setPageSubjects((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pageSubjects === totalSubjectsPages || totalSubjectsPages === 0} onClick={() => setPageSubjects((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: ADD SESSION */}
      <Modal isOpen={isSessionOpen} onClose={() => setIsSessionOpen(false)} title={editingRecordId ? "Edit Academic Year Session" : "Register Academic Year Session"}>
        <form onSubmit={handleAddSession} className="space-y-4">
          <Input label="Session Name (e.g. 2026-2027) *" required value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsSessionOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingRecordId ? "Save Changes" : "Confirm Setup"}</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD CAMPUS */}
      <Modal isOpen={isCampusOpen} onClose={() => setIsCampusOpen(false)} title={editingRecordId ? "Edit Physical Campus Branch" : "Register Physical Campus Branch"}>
        <form onSubmit={handleAddCampus} className="space-y-4">
          <Input label="Campus Title Name *" required placeholder="e.g. South Extension Branch" value={campusName} onChange={(e) => setCampusName(e.target.value)} />
          <Input label="Physical Landmark Address *" required placeholder="e.g. Block B, Road 14, New Delhi" value={campusAddress} onChange={(e) => setCampusAddress(e.target.value)} />
          <Input label="Student Capacity Load limit *" type="number" required value={campusCapacity} onChange={(e) => setCampusCapacity(e.target.value)} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCampusOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingRecordId ? "Save Changes" : "Confirm Launch"}</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD CLASS */}
      <Modal isOpen={isClassOpen} onClose={() => setIsClassOpen(false)} title={editingRecordId ? "Edit Classroom Grade Level" : "Setup Classroom Grade Level"}>
        <form onSubmit={handleAddClass} className="space-y-4">
          <Input label="Class Grade Name *" required placeholder="e.g. Grade 10" value={classGrade} onChange={(e) => setClassGrade(e.target.value)} />
          <Input label="Comma separated Sections *" required placeholder="e.g. Section A, Section B, Section C" value={classSections} onChange={(e) => setClassSections(e.target.value)} />
          <Select label="Assign Campus Branch *" value={classCampusId} onChange={(e) => setClassCampusId(e.target.value)} options={campuses.map((c) => ({ label: c.name, value: c.id }))} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsClassOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingRecordId ? "Save Changes" : "Generate Classrooms"}</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: ADD SUBJECT */}
      <Modal isOpen={isSubjectOpen} onClose={() => setIsSubjectOpen(false)} title={editingRecordId ? "Edit Syllabus Course Subject" : "Add Syllabus Course Subject"}>
        <form onSubmit={handleAddSubject} className="space-y-4">
          <Input label="Subject Name *" required placeholder="e.g. Biology Core" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
          <Select label="Associated Class Grade *" value={subjectGradeId} onChange={(e) => setSubjectGradeId(e.target.value)} options={classes.map((c) => ({ label: `${c.grade} (${c.campus?.name})`, value: c.id }))} />
          <Select label="Instruction Medium *" value={subjectMedium} onChange={(e) => setSubjectMedium(e.target.value)} options={[{ label: "English", value: "English" }, { label: "French", value: "French" }, { label: "Bilingual", value: "Bilingual" }]} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsSubjectOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingRecordId ? "Save Changes" : "Append Subject"}</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: ALLOCATE TEACHER */}
      <Modal isOpen={isAllocationOpen} onClose={() => setIsAllocationOpen(false)} title="Allocate Teacher Workload">
        <form onSubmit={handleAddAllocation} className="space-y-4">
          <Select label="Educator Name *" value={allocStaffId} onChange={(e) => setAllocStaffId(e.target.value)} options={staffList.map((s) => ({ label: s.fullName, value: s.id }))} />
          <Select 
            label="Assigned Class Section *" 
            value={allocSectionId} 
            onChange={(e) => setAllocSectionId(e.target.value)} 
            options={classes.flatMap(c => c.sections?.map(sec => ({ label: `${c.grade} - ${sec.name} (${c.campus?.name})`, value: sec.id })) || [])} 
          />
          <Input type="number" label="Expected Weekly workload (hours) *" required placeholder="e.g. 14" value={allocWorkload} onChange={(e) => setAllocWorkload(e.target.value)} min={1} max={100} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAllocationOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Assignment</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
