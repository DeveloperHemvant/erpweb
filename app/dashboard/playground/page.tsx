"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { Accordion } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/toast";
import { FileUpload } from "@/components/ui/file-upload";
import { Timeline } from "@/components/ui/timeline";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import {
  Sparkles,
  Inbox,
  UserCheck,
  Search,
  Filter,
  Download,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Calendar,
  AlertTriangle
} from "lucide-react";

export default function PlaygroundPage() {
  const { toast } = useToast();
  
  // States
  const [activePlaygroundTab, setActivePlaygroundTab] = useState("forms");
  const [switchChecked, setSwitchChecked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  
  // Multi-step Form State
  const [formStep, setFormStep] = useState(1);
  const [autoSaving, setAutoSaving] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: "", grade: "Grade 10", bio: "", registerId: "" });

  // Skeleton State
  const [isLoadingSkeletons, setIsLoadingSkeletons] = useState(false);

  const accordionItems = [
    { id: "1", title: "How does the academic year rollover work?", content: "Rollover shifts student statuses to the next academic cohort and freezes all current gradebook tables for legal records." },
    { id: "2", title: "Are parent notifications automated?", content: "Yes. Using SMS & Email triggers, guardians receive automated reports for class absences, gradebook updates, and pending dues." },
  ];

  const timelineItems = [
    { id: "1", title: "Class Gradebook Finalized", description: "Grade 10 Biology records submitted by Prof. Carson.", time: "10:30 AM", icon: <UserCheck className="h-4.5 w-4.5 text-success" /> },
    { id: "2", title: "Fee Collection System Rollover", description: "Term 3 invoices distributed.", time: "09:00 AM", icon: <Settings className="h-4.5 w-4.5 text-primary" /> },
  ];

  // Dummy Student Table Data
  const studentData = [
    { id: "STU001", name: "Alice Vance", grade: "Grade 11", status: "Active", attendance: "98.5%", dues: "Paid" },
    { id: "STU002", name: "Bob Carter", grade: "Grade 10", status: "Active", attendance: "91.2%", dues: "Pending" },
    { id: "STU003", name: "Claire Dixon", grade: "Grade 12", status: "Suspended", attendance: "74.8%", dues: "Paid" },
    { id: "STU004", name: "David Sterling", grade: "Grade 9", status: "Active", attendance: "95.6%", dues: "Pending" },
    { id: "STU005", name: "Emma Watson", grade: "Grade 11", status: "Active", attendance: "99.1%", dues: "Paid" },
  ];

  const handleFormChange = (field: string, val: string) => {
    setStudentForm({ ...studentForm, [field]: val });
    
    // Simulate auto-save behavior
    setAutoSaving(true);
    setTimeout(() => setAutoSaving(false), 800);
  };

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Component Showcase Playground
          </h1>
          <p className="text-sm text-text-secondary">
            Preview, test, and audit reusable design system components.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setIsLoadingSkeletons(!isLoadingSkeletons);
            toast("Loading state toggled", { description: "Skeletons are now visible", type: "info" });
          }}
        >
          Toggle Skeletons ({isLoadingSkeletons ? "Active" : "Inactive"})
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activePlaygroundTab}
        onChange={setActivePlaygroundTab}
        options={[
          { id: "forms", label: "Inputs & Forms" },
          { id: "tables", label: "Enterprise Tables" },
          { id: "interactive", label: "Interactive Overlays" },
          { id: "states", label: "States & Skeleton Logs" },
        ]}
      />

      {/* RENDER FORMS */}
      {activePlaygroundTab === "forms" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Controls Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Fields & Inputs</CardTitle>
              <CardDescription>Styled floating input fields and custom select choices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Normal Input" placeholder="Standard text input" />
                <Input label="Floating Label" placeholder="Floating" floating />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Input with Error" placeholder="Check syntax errors" error="This field is required." />
                <Input label="Input with Success" placeholder="Approved data input" success />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Password Visibility" type="password" placeholder="Enter key code" />
                <Input label="Disabled State" placeholder="Cannot type here" disabled />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <Select
                  label="Grade Level Dropdown"
                  options={[
                    { label: "Grade 9", value: "9" },
                    { label: "Grade 10", value: "10" },
                    { label: "Grade 11", value: "11" },
                    { label: "Grade 12", value: "12" },
                  ]}
                />
                <div className="flex flex-col gap-3 py-1">
                  <span className="text-xs font-semibold text-text-secondary">Checkbox / Toggle Items</span>
                  <div className="flex gap-4">
                    <Checkbox label="Send SMS Reports" defaultChecked />
                    <Radio label="Standard Fee Plan" name="feePlan" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-btn border">
                <Switch
                  checked={switchChecked}
                  onChange={setSwitchChecked}
                  label="Allow Parents Portal Registration"
                />
                <Badge variant={switchChecked ? "success" : "neutral"}>
                  {switchChecked ? "ON" : "OFF"}
                </Badge>
              </div>

              <Textarea label="Academic Bio Notes" placeholder="Insert notes on curriculum preferences..." />
            </CardContent>
          </Card>

          {/* Premium Multi Step Form with Auto Save Indicator */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Multi-Step Enrollment Form
                    <Badge variant="warning">Draft Mode</Badge>
                  </CardTitle>
                  <CardDescription>Wizard layout featuring live validation indicators.</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  {autoSaving ? (
                    <span className="text-primary animate-pulse font-medium">Auto-saving...</span>
                  ) : (
                    <span>Saved Draft</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Steps Counter */}
                <div className="flex items-center gap-3">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex-1 flex items-center gap-2">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                          formStep === step
                            ? "bg-primary text-white border-primary"
                            : formStep > step
                            ? "bg-success/10 text-success border-success/30"
                            : "bg-slate-100 text-text-secondary border-border"
                        }`}
                      >
                        {step}
                      </div>
                      <div className="h-0.5 bg-border flex-1 last:hidden" />
                    </div>
                  ))}
                </div>

                {formStep === 1 && (
                  <div className="space-y-4">
                    <Input
                      label="Student Full Name (Step 1)"
                      placeholder="Jane Smith"
                      value={studentForm.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                    />
                    <Input
                      label="Custom Registration ID"
                      placeholder="SIS-2026-04"
                      value={studentForm.registerId}
                      onChange={(e) => handleFormChange("registerId", e.target.value)}
                    />
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-4">
                    <Select
                      label="Select Class/Section (Step 2)"
                      value={studentForm.grade}
                      onChange={(e) => handleFormChange("grade", e.target.value)}
                      options={[
                        { label: "Grade 9", value: "Grade 9" },
                        { label: "Grade 10", value: "Grade 10" },
                        { label: "Grade 11", value: "Grade 11" },
                        { label: "Grade 12", value: "Grade 12" },
                      ]}
                    />
                    <Textarea
                      label="Reason for Enrollment"
                      placeholder="Provide background info..."
                      value={studentForm.bio}
                      onChange={(e) => handleFormChange("bio", e.target.value)}
                    />
                  </div>
                )}

                {formStep === 3 && (
                  <div className="space-y-4 text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-card border">
                    <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 animate-bounce" />
                    <h4 className="text-base font-bold text-text-primary">Confirm Verification Details</h4>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto px-4">
                      Press finish to log student profile into registry database.
                    </p>
                    <div className="text-left text-xs p-4 border bg-white dark:bg-slate-900 rounded-btn max-w-xs mx-auto space-y-1 mt-4">
                      <p><b>Name:</b> {studentForm.name || "N/A"}</p>
                      <p><b>ID:</b> {studentForm.registerId || "N/A"}</p>
                      <p><b>Grade:</b> {studentForm.grade}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>

            <CardFooter className="flex justify-between mt-auto">
              <Button
                variant="outline"
                disabled={formStep === 1}
                onClick={() => setFormStep((p) => p - 1)}
              >
                Previous Step
              </Button>
              {formStep < 3 ? (
                <Button variant="primary" onClick={() => setFormStep((p) => p + 1)}>
                  Next Step
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    toast("Enrollment Saved", { description: "Student has been added to registry.", type: "success" });
                    setFormStep(1);
                    setStudentForm({ name: "", grade: "Grade 10", bio: "", registerId: "" });
                  }}
                >
                  Finish Enrollment
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}

      {/* RENDER TABLES */}
      {activePlaygroundTab === "tables" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle>Enterprise Student Records</CardTitle>
                <CardDescription>Filterable listings featuring sticky headers and row actions.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => toast("Export Initiated", { description: "Downloading CSV spreadsheet file...", type: "info" })}>
                  Export CSV
                </Button>
                <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => toast("Bulk Delete Denied", { description: "Admin rights required.", type: "error" })}>
                  Bulk Delete
                </Button>
              </div>
            </div>

            {/* Filter Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border/60">
              <div className="relative flex-1">
                <span className="absolute left-3 top-3 text-text-secondary">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search students database..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full h-10 pl-9 rounded-btn bg-slate-50 dark:bg-slate-800 border border-border text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-primary"
                />
              </div>
              <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                Advanced Filters
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded border-border" />
                  </TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Grade Cohort</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Fee Dues Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentData
                  .filter((s) => s.name.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((stu) => (
                    <TableRow key={stu.id}>
                      <TableCell>
                        <input type="checkbox" className="rounded border-border" />
                      </TableCell>
                      <TableCell className="font-semibold text-primary">{stu.id}</TableCell>
                      <TableCell>{stu.name}</TableCell>
                      <TableCell>{stu.grade}</TableCell>
                      <TableCell>{stu.attendance}</TableCell>
                      <TableCell>
                        <Badge variant={stu.dues === "Paid" ? "success" : "warning"}>
                          {stu.dues}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast("View Profile", { description: `Loading profile of ${stu.name}`, type: "info" })}>
                            <Eye className="h-4 w-4 text-text-secondary" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-text-secondary" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              Showing 1-5 of 148 active registrations
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="primary" size="sm" className="h-8 w-8 p-0">
                1
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                2
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* RENDER INTERACTIVE OVERLAYS */}
      {activePlaygroundTab === "interactive" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Modal trigger triggers custom dialog components */}
          <Card>
            <CardHeader>
              <CardTitle>Dialogs, Modals, & Toasts</CardTitle>
              <CardDescription>Test overlays, action sheets and temporary screen notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  Open Animated Modal
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast("Database Backup Initialized", {
                      description: "Syncing files to AWS cloud storage...",
                      type: "success",
                    })
                  }
                >
                  Trigger Success Toast
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    toast("Connection Lost", {
                      description: "Verify your server ports before continuing.",
                      type: "error",
                    })
                  }
                >
                  Trigger Error Toast
                </Button>
              </div>

              {/* Accordion Questions */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-text-secondary uppercase mb-3">
                  Frequently Asked Questions (Accordion)
                </h4>
                <Accordion items={accordionItems} />
              </div>
            </CardContent>
          </Card>

          {/* Timelines and Uploaders */}
          <Card>
            <CardHeader>
              <CardTitle>Documents & Timelines</CardTitle>
              <CardDescription>File drag-and-drop boxes and academic event timelines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload label="Quarterly report uploads" accept=".pdf" />
              
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-text-secondary uppercase mb-4">
                  Campus Logs (Timeline)
                </h4>
                <Timeline items={timelineItems} />
              </div>
            </CardContent>
          </Card>

          {/* Modal Portal Component */}
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registry Term Enrollment">
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                You are about to register a parent/guardian invitation key. Ensure you have verifying credentials.
              </p>
              <Input label="Guardian Security Code" placeholder="SIS-PARENT-KEY" />
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => {
                  setModalOpen(false);
                  toast("Invite Sent", { description: "Guardian has been notified", type: "success" });
                }}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* RENDER SKELETONS AND EMPTY STATES */}
      {activePlaygroundTab === "states" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Beautiful Empty States */}
          <Card>
            <CardHeader>
              <CardTitle>Empty State Scenarios</CardTitle>
              <CardDescription>Fallback screens for search results or empty folders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-dashed border-border rounded-card p-8 text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/40">
                <Inbox className="h-10 w-10 text-text-secondary mb-3" />
                <h4 className="text-sm font-bold text-text-primary">No Records Registered</h4>
                <p className="text-xs text-text-secondary max-w-xs mt-1">
                  We could not find any active students matching this query. Please check filters.
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skeleton Loaders */}
          <Card>
            <CardHeader>
              <CardTitle>Skeleton Loaders</CardTitle>
              <CardDescription>Content placeholder shapes for background loading tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Card Skeleton */}
              <div className="flex gap-4 items-center p-4 bg-slate-50 dark:bg-slate-900/40 rounded-card border">
                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
                </div>
              </div>

              {/* Stats metric Skeleton */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-card border space-y-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
