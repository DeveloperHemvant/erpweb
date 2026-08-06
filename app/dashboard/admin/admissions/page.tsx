"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { DataGrid } from "@/components/shared/DataGrid";
import { Plus, Trash2, Edit2, CheckCircle, Search, Users, ClipboardList, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface SiblingDetails {
  name: string;
  dob: string;
  gender: string;
  classApplied: string;
  currentSchool: string;
}

interface ClassDef {
  id: string;
  grade: string;
}

interface StudentDef {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string;
  guardianName: string;
  phone: string;
  status: string;
  documentsVerified?: boolean;
  enrollments?: any[];
  details?: {
    dob?: string;
    session?: string;
    currentSchool?: string;
    fatherName?: string;
    fatherContact?: string;
    fatherProfession?: string;
    fatherCompany?: string;
    motherName?: string;
    motherContact?: string;
    motherProfession?: string;
    motherCompany?: string;
    emailId?: string;
    sourceOfInfo?: string;
    residenceAddress?: string;
    siblings?: SiblingDetails[];
  };
}

export default function StudentAdmissionsPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Tab: "active" or "drafts"
  const [activeTab, setActiveTab] = useState("active");

  const [credentialsModal, setCredentialsModal] = useState<{isOpen: boolean, identifier: string, password: string, name: string} | null>(null);

  const [students, setStudents] = useState<StudentDef[]>([]);
  const [classes, setClasses] = useState<ClassDef[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [filterSection, setFilterSection] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // INTAKE FORM FIELDS
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [dob, setDob] = useState("");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState("Male");
  const [session, setSession] = useState("2026-2027");
  const [currentSchool, setCurrentSchool] = useState("");
  const [documentsVerified, setDocumentsVerified] = useState(false);
  
  const [fatherName, setFatherName] = useState("");
  const [fatherContact, setFatherContact] = useState("");
  const [fatherProfession, setFatherProfession] = useState("");
  const [fatherCompany, setFatherCompany] = useState("");
  
  const [motherName, setMotherName] = useState("");
  const [motherContact, setMotherContact] = useState("");
  const [motherProfession, setMotherProfession] = useState("");
  const [motherCompany, setMotherCompany] = useState("");
  
  const [emailId, setEmailId] = useState("");
  const [sourceOfInfo, setSourceOfInfo] = useState("Search Engine");
  const [residenceAddress, setResidenceAddress] = useState("");
  const [siblingInputs, setSiblingInputs] = useState<SiblingDetails[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const sRes = await fetch(`${API_URL}/erp-core/students`);
      const cRes = await fetch(`${API_URL}/master-data/classes`);

      if (sRes.ok && cRes.ok) {
        const sData = await sRes.json();
        setStudents(sData.data || sData);
        const classesData = await cRes.json();
        setClasses(classesData);
        if (classesData.length > 0 && !classId) {
          setClassId(classesData[0].id);
        }
      }
    } catch {
      toast("Sync Offline", { description: "NestJS APIs offline.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingStudentId(null);
    setAdmissionNumber(`ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setStudentName("");
    setDob("");
    setGender("Male");
    setSession("2026-2027");
    setCurrentSchool("");
    setFatherName("");
    setFatherContact("");
    setFatherProfession("");
    setFatherCompany("");
    setMotherName("");
    setMotherContact("");
    setMotherProfession("");
    setMotherCompany("");
    setEmailId("");
    setSourceOfInfo("Search Engine");
    setResidenceAddress("");
    setSiblingInputs([]);
    setDocumentsVerified(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (stu: StudentDef) => {
    setEditingStudentId(stu.id);
    setAdmissionNumber(stu.admissionNumber);
    setStudentName(stu.fullName);
    setGender(stu.gender);
    
    // Find classId
    const stuGrade = stu.enrollments?.[0]?.section?.class?.grade;
    const foundClass = classes.find((c) => c.grade === stuGrade);
    setClassId(foundClass ? foundClass.id : classes[0]?.id || "");

    // Load additional details
    const det = stu.details || {};
    setDob(det.dob || "");
    setSession(det.session || "2026-2027");
    setCurrentSchool(det.currentSchool || "");
    setFatherName(det.fatherName || stu.guardianName);
    setFatherContact(det.fatherContact || stu.phone);
    setFatherProfession(det.fatherProfession || "");
    setFatherCompany(det.fatherCompany || "");
    setMotherName(det.motherName || "");
    setMotherContact(det.motherContact || "");
    setMotherProfession(det.motherProfession || "");
    setMotherCompany(det.motherCompany || "");
    setEmailId(det.emailId || "");
    setSourceOfInfo(det.sourceOfInfo || "Search Engine");
    setResidenceAddress(det.residenceAddress || "");
    setSiblingInputs(det.siblings || []);
    setDocumentsVerified(stu.documentsVerified || false);

    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !fatherName || !fatherContact || !motherName || !motherContact || !emailId) {
      toast("Validation Error", { description: "Please populate all required fields.", type: "error" });
      return;
    }

    const payloadDetails = {
      dob,
      session,
      currentSchool,
      fatherName,
      fatherContact,
      fatherProfession,
      fatherCompany,
      motherName,
      motherContact,
      motherProfession,
      motherCompany,
      emailId,
      sourceOfInfo,
      residenceAddress,
      siblings: siblingInputs,
    };

    try {
      const isEdit = !!editingStudentId;
      const url = isEdit ? `${API_URL}/erp-core/students/${editingStudentId}` : `${API_URL}/erp-core/students`;
      const method = isEdit ? "PATCH" : "POST";

      const payload = isEdit
        ? { fullName: studentName, classId, gender, guardianName: fatherName, phone: fatherContact, documentsVerified, details: payloadDetails }
        : { admissionNumber, fullName: studentName, classId, gender, guardianName: fatherName, phone: fatherContact, status: "Draft", documentsVerified, details: payloadDetails };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save student record.");

      if (!isEdit && data.isNewParent && data.generatedPassword) {
        setCredentialsModal({
          isOpen: true,
          identifier: data.parentUsername,
          password: data.generatedPassword,
          name: data.parentName
        });
      } else if (!isEdit && !data.isNewParent) {
        toast("Registration Drafted", {
          description: `Student successfully linked to existing Parent (${data.parentUsername}).`,
          type: "success",
        });
      } else if (isEdit) {
        toast("Record Updated", {
          description: "Changes saved successfully.",
          type: "success",
        });
      } else {
        toast("Registration Drafted", {
          description: "Draft added to Pending Registrations.",
          type: "success",
        });
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      toast("Action Failed", { description: err.message || "Could not save record.", type: "error" });
    }
  };

  const handleFinalSubmit = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/erp-core/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Active" }),
      });

      if (!res.ok) throw new Error();
      toast("Student Enrolled", { description: "Student moved to active roster.", type: "success" });
      fetchData();
    } catch {
      toast("Action Failed", { description: "Could not finalize registration.", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this record?")) return;
    try {
      const res = await fetch(`${API_URL}/erp-core/students/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast("Record Deleted", { type: "warning" });
      fetchData();
    } catch {
      toast("Action Denied", { description: "Could not remove record.", type: "error" });
    }
  };

  const addSiblingRow = () => {
    setSiblingInputs((prev) => [
      ...prev,
      { name: "", dob: "", gender: "Male", classApplied: "Grade 6", currentSchool: "" },
    ]);
  };

  const removeSiblingRow = (index: number) => {
    setSiblingInputs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateSiblingField = (index: number, field: keyof SiblingDetails, val: string) => {
    setSiblingInputs((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, [field]: val } : s))
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filters based on tab status
  const currentStatusFilter = activeTab === "active" ? "Active" : "Draft";
  const filteredStudents = students
    .filter((s) => s.status === currentStatusFilter)
    .filter((s) => {
      if (filterClass !== "All" && s.enrollments?.[0]?.section?.class?.grade !== filterClass) return false;
      if (filterSection !== "All" && s.enrollments?.[0]?.section?.name !== filterSection) return false;
      if (filterGender !== "All" && s.gender !== filterGender) return false;
      return (
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.guardianName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  // Extract unique classes and sections from the student data for dropdowns
  const uniqueClasses = Array.from(new Set(students.map((s) => s.enrollments?.[0]?.section?.class?.grade).filter(Boolean)));
  const uniqueSections = Array.from(new Set(students.map((s) => s.enrollments?.[0]?.section?.name).filter(Boolean)));

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  // Reset page when tab or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Student Admissions Desk
          </h1>
          <p className="text-sm text-text-secondary">
            Process registrations, review drafts, and execute final submissions to move candidates into active rosters.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4.5 w-4.5" />}
          onClick={handleOpenCreate}
        >
          New Registration Draft
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "active", label: "Active Student Roster", icon: <Users className="h-4 w-4" /> },
          { id: "drafts", label: "Pending Registrations (Drafts)", icon: <ClipboardList className="h-4 w-4" /> },
        ]}
      />

      {/* Roster Card */}
      <Card>
        <CardHeader className="flex flex-col pb-4 border-b gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{activeTab === "active" ? "Enrolled Candidates Directory" : "Pending Registration Desk"}</CardTitle>
              <CardDescription>
                {activeTab === "active"
                  ? "Roster of all fully submitted and enrolled students."
                  : "Candidate drafts awaiting final administrative checks and enrollment submit."}
              </CardDescription>
            </div>
          </div>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-1/3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search name, admission #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-btn pl-9 pr-4 py-1.5 text-xs text-text-primary outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap flex-1">
              <Select 
                value={filterClass} 
                onChange={(e) => setFilterClass(e.target.value)}
                options={[
                  { label: "All Classes", value: "All" },
                  ...uniqueClasses.map(c => ({ label: String(c), value: String(c) }))
                ]}
              />
              
              <Select 
                value={filterSection} 
                onChange={(e) => setFilterSection(e.target.value)}
                options={[
                  { label: "All Sections", value: "All" },
                  ...uniqueSections.map(s => ({ label: `Sec ${s}`, value: String(s) }))
                ]}
              />
              
              <Select 
                value={filterGender} 
                onChange={(e) => setFilterGender(e.target.value)}
                options={[
                  { label: "All Genders", value: "All" },
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" }
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-secondary italic">
              Loading candidates from PostgreSQL...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary italic">
              No candidates found in this category.
            </div>
          ) : (
            <DataGrid
              columns={[
                { key: "admissionNumber", header: "Admission Number", render: (student: any) => <span className="font-semibold text-text-primary">{student.admissionNumber}</span> },
                { key: "fullName", header: "Student Name", render: (student: any) => <span className="font-medium text-text-primary">{student.fullName}</span> },
                { key: "rollNumber", header: "Roll No.", render: (student: any) => <span className="font-mono text-xs">{student.enrollments?.[0]?.rollNumber || "N/A"}</span> },
                { key: "grade", header: "Placement Class", render: (student: any) => <Badge variant="primary">{student.enrollments?.[0]?.section?.class?.grade || "N/A"}</Badge> },
                { key: "gender", header: "Gender", render: (student: any) => student.gender },
                { key: "guardianName", header: "Guardian Name", render: (student: any) => student.guardianName },
                {
                  key: "documentsVerified",
                  header: "Doc Status",
                  render: (student: any) => <Badge variant={student.documentsVerified ? "success" : "warning"}>{student.documentsVerified ? "Verified" : "Pending"}</Badge>,
                },
                {
                  key: "actions",
                  header: "Actions",
                  className: "text-right",
                  render: (student: any) => (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {activeTab === "drafts" && (
                        <Button variant="primary" size="sm" className="h-8 px-2.5" leftIcon={<CheckCircle className="h-3.5 w-3.5" />} onClick={() => handleFinalSubmit(student.id)}>
                          Final Enroll
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/admin/admissions/${student.id}`)}>
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(student)}>
                        <Edit2 className="h-4 w-4 text-text-secondary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(student.id)}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              rows={paginatedStudents}
              rowKey={(student: any) => student.id}
              onRowClick={(student: any) => router.push(`/dashboard/admin/admissions/${student.id}`)}
              emptyMessage="No candidates found in this category."
              page={currentPage}
              pageSize={pageSize}
              totalCount={filteredStudents.length}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* ADMISSION INTAKE FORM MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingStudentId ? "Edit Student Details" : "Student Admission Intake Form"} size="lg">
        <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          {/* SECTION 1: Student Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary border-b pb-1">1. Student Candidate Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Admission Code" disabled value={admissionNumber} />
              <Input
                label="Student Full Name *"
                placeholder="Rahul Sharma"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <Input
                label="Date of Birth *"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Select
                label="Class Applied *"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                options={classes.map((c) => ({ label: c.grade, value: c.id }))}
              />
              <Select
                label="Gender *"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                  { label: "Other", value: "Other" },
                ]}
              />
              <Input
                label="Academic Session *"
                placeholder="2026-2027"
                required
                value={session}
                onChange={(e) => setSession(e.target.value)}
              />
              <Input
                label="Previous School Name"
                placeholder="St. Mary Academy"
                value={currentSchool}
                onChange={(e) => setCurrentSchool(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-md border">
              <div>
                <p className="text-sm font-semibold">Document Verification (KYC)</p>
                <p className="text-xs text-text-secondary">Have the parent&apos;s ID and student birth certificate been physically verified?</p>
              </div>
              <div className="flex items-center justify-end">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={documentsVerified}
                    onChange={(e) => setDocumentsVerified(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  <span className="ml-3 text-sm font-medium text-text-primary">{documentsVerified ? "Verified" : "Pending"}</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 2: Parents Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary border-b pb-1">2. Parent / Guardian Directory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Father's Name *"
                placeholder="Amit Sharma"
                required
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
              />
              <Input
                label="Father's Contact *"
                placeholder="+91 98765 43210"
                required
                value={fatherContact}
                onChange={(e) => setFatherContact(e.target.value)}
              />
              <Input
                label="Father's Profession"
                placeholder="Civil Engineer"
                value={fatherProfession}
                onChange={(e) => setFatherProfession(e.target.value)}
              />
              <Input
                label="Father's Company"
                placeholder="BuildCorp Ltd"
                value={fatherCompany}
                onChange={(e) => setFatherCompany(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Mother's Name *"
                placeholder="Kiran Sharma"
                required
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
              />
              <Input
                label="Mother's Contact *"
                placeholder="+91 98765 43211"
                required
                value={motherContact}
                onChange={(e) => setMotherContact(e.target.value)}
              />
              <Input
                label="Mother's Profession"
                placeholder="Homemaker"
                value={motherProfession}
                onChange={(e) => setMotherProfession(e.target.value)}
              />
              <Input
                label="Mother's Company"
                placeholder="N/A"
                value={motherCompany}
                onChange={(e) => setMotherCompany(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 3: Contact & Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary border-b pb-1">3. Contact &amp; Residential Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Communication Email Address *"
                placeholder="sharma.parents@gmail.com"
                type="email"
                required
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
              />
              <Select
                label="Source of Information"
                value={sourceOfInfo}
                onChange={(e) => setSourceOfInfo(e.target.value)}
                options={[
                  { label: "Search Engine", value: "Search Engine" },
                  { label: "Social Media", value: "Social Media" },
                  { label: "Newspaper Ad", value: "Newspaper Ad" },
                  { label: "Parent Reference", value: "Parent Reference" },
                ]}
              />
            </div>
            <Textarea
              label="Residence Address *"
              placeholder="House no 12, Pine Vista Road, New Delhi"
              required
              value={residenceAddress}
              onChange={(e) => setResidenceAddress(e.target.value)}
            />
          </div>

          {/* SECTION 4: Sibling details */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-1">
              <h3 className="text-sm font-bold text-primary">4. Sibling Registry (Optional)</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSiblingRow}>
                Add Sibling Row
              </Button>
            </div>
            {siblingInputs.length === 0 ? (
              <p className="text-xs text-text-secondary italic">No siblings registered.</p>
            ) : (
              siblingInputs.map((sib, sIdx) => (
                <div key={sIdx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-btn border relative">
                  <Input
                    label="Sibling Name"
                    value={sib.name}
                    onChange={(e) => updateSiblingField(sIdx, "name", e.target.value)}
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={sib.dob}
                    onChange={(e) => updateSiblingField(sIdx, "dob", e.target.value)}
                  />
                  <Select
                    label="Gender"
                    value={sib.gender}
                    onChange={(e) => updateSiblingField(sIdx, "gender", e.target.value)}
                    options={[
                      { label: "Male", value: "Male" },
                      { label: "Female", value: "Female" },
                    ]}
                  />
                  <Input
                    label="Class Grade"
                    value={sib.classApplied}
                    onChange={(e) => updateSiblingField(sIdx, "classApplied", e.target.value)}
                  />
                  <div className="flex items-end gap-2">
                    <Input
                      label="School Name"
                      value={sib.currentSchool}
                      onChange={(e) => updateSiblingField(sIdx, "currentSchool", e.target.value)}
                    />
                    <Button type="button" variant="ghost" className="h-10 text-danger" onClick={() => removeSiblingRow(sIdx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingStudentId ? "Save Changes" : "Save Draft"}
            </Button>
          </div>
        </form>
      </Modal>
      {/* CREDENTIALS MODAL */}
      {credentialsModal && (
        <Modal
          isOpen={credentialsModal.isOpen}
          onClose={() => setCredentialsModal(null)}
          title="Parent Account Created!"
        >
          <div className="space-y-4 text-center pb-4">
            <CheckCircle className="mx-auto h-12 w-12 text-success mb-2" />
            <p className="text-text-secondary text-sm">
              The student has been successfully registered and a new Parent portal account was generated. Please securely share these credentials with the parent.
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border text-left mt-4 space-y-2">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-semibold text-text-secondary">Portal Link:</span>
                <span className="text-sm font-mono text-primary select-all">parents.school.edu</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-semibold text-text-secondary">Username (Email):</span>
                <span className="text-sm font-mono text-primary font-bold select-all">{credentialsModal.identifier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-text-secondary">Temporary Password:</span>
                <span className="text-sm font-mono text-danger font-bold select-all">{credentialsModal.password}</span>
              </div>
            </div>
            <div className="pt-4">
              <Button variant="primary" className="w-full" onClick={() => setCredentialsModal(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
