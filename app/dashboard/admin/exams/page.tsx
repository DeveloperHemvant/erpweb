"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText, Calendar, LayoutDashboard, Plus, CheckCircle, BookOpen,
  Trash2, Award, ClipboardList, ChevronRight, X, Laptop, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const opt = (label: string, value: string) => ({ label, value });

export default function EMSPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("setup");

  // Reference data
  const [sessions, setSessions] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [questionBanks, setQuestionBanks] = useState<any[]>([]);
  const [questionPapers, setQuestionPapers] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [gradingSchemes, setGradingSchemes] = useState<any[]>([]);
  const [gradebooks, setGradebooks] = useState<any[]>([]);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const fetchAll = async () => {
    try {
      const [
        sessRes, typesRes, tplRes, clsRes, subRes, stfRes, roomRes, campRes,
        schedRes, qbRes, evalRes, gsRes, gbRes, rcRes, stuRes, qpRes,
      ] = await Promise.all([
        fetch(`${API_URL}/ems/sessions`),
        fetch(`${API_URL}/ems/types`),
        fetch(`${API_URL}/ems/templates`),
        fetch(`${API_URL}/master-data/classes`),
        fetch(`${API_URL}/master-data/subjects`),
        fetch(`${API_URL}/staff`),
        fetch(`${API_URL}/master-data/rooms`),
        fetch(`${API_URL}/master-data/campuses`),
        fetch(`${API_URL}/ems/schedules`),
        fetch(`${API_URL}/ems/question-banks`),
        fetch(`${API_URL}/ems/evaluations`),
        fetch(`${API_URL}/ems/grading-schemes`),
        fetch(`${API_URL}/ems/gradebooks`),
        fetch(`${API_URL}/ems/report-cards`),
        fetch(`${API_URL}/erp-core/students`),
        fetch(`${API_URL}/ems/question-papers`),
      ]);
      if (sessRes.ok) setSessions(await sessRes.json());
      if (typesRes.ok) setTypes(await typesRes.json());
      if (tplRes.ok) setTemplates(await tplRes.json());
      if (clsRes.ok) setClasses(await clsRes.json());
      if (subRes.ok) setSubjects(await subRes.json());
      if (stfRes.ok) { const d = await stfRes.json(); setStaffList(d.data || d); }
      if (roomRes.ok) setRooms(await roomRes.json());
      if (campRes.ok) setCampuses(await campRes.json());
      if (schedRes.ok) setSchedules(await schedRes.json());
      if (qbRes.ok) setQuestionBanks(await qbRes.json());
      if (evalRes.ok) setEvaluations(await evalRes.json());
      if (gsRes.ok) setGradingSchemes(await gsRes.json());
      if (gbRes.ok) setGradebooks(await gbRes.json());
      if (rcRes.ok) setReportCards(await rcRes.json());
      if (stuRes.ok) { const d = await stuRes.json(); setStudents(d.data || d); }
      if (qpRes.ok) setQuestionPapers(await qpRes.json());
    } catch (e) {
      console.error("Failed to fetch EMS data", e);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const classOptions = useMemo(
    () => classes.map((c) => opt(c.grade, c.id)),
    [classes]
  );
  const subjectOptions = useMemo(
    () => subjects.map((s) => opt(s.name, s.id)),
    [subjects]
  );
  const sessionOptions = useMemo(
    () => sessions.map((s) => opt(s.name, s.id)),
    [sessions]
  );
  const templateOptions = useMemo(
    () => templates.map((t) => opt(`${t.name} (${t.type?.name || "—"})`, t.id)),
    [templates]
  );
  const staffOptions = useMemo(
    () => staffList.map((s) => opt(s.fullName || "Unnamed Staff", s.id)),
    [staffList]
  );
  const roomOptions = useMemo(
    () => rooms.map((r) => opt(`${r.name} (cap. ${r.capacity})`, r.id)),
    [rooms]
  );
  const campusOptions = useMemo(
    () => campuses.map((c) => opt(c.name, c.id)),
    [campuses]
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="mb-2 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-text-secondary">
        <span className="font-semibold text-text-primary">Full Examination Management System (EMS).</span> Handles the complete exam
        lifecycle — question banks, seating &amp; invigilation, evaluation, moderation, grading schemes and computed results. For quick
        term exams and printable report cards, use{" "}
        <a href="/dashboard/admin/report-cards" className="text-primary underline underline-offset-2">Student Gradebook &amp; Report Cards</a>.
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Examination Command Center</h1>
          <p className="text-text-secondary mt-1">Manage exam operations, timetables, and question banks.</p>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "setup", label: "Exam Setup", icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: "timetable", label: "Timetable & Seating", icon: <Calendar className="w-4 h-4" /> },
          { id: "question-banks", label: "Question Banks", icon: <BookOpen className="w-4 h-4" /> },
          { id: "online-tests", label: "Online Tests", icon: <Laptop className="w-4 h-4" /> },
          { id: "evaluation", label: "Evaluation Desk", icon: <CheckCircle className="w-4 h-4" /> },
          { id: "grading", label: "Grading & Results", icon: <Award className="w-4 h-4" /> },
          { id: "report-cards", label: "Report Cards", icon: <FileText className="w-4 h-4" /> },
        ]}
      />

      {activeTab === "setup" && (
        <SetupTab
          sessions={sessions} types={types} templates={templates}
          typeOptions={types.map((t) => opt(t.name, t.id))}
          fetchAll={fetchAll} toast={toast} api={api}
        />
      )}

      {activeTab === "timetable" && (
        <TimetableTab
          schedules={schedules} sessionOptions={sessionOptions} templateOptions={templateOptions}
          subjectOptions={subjectOptions} classOptions={classOptions} roomOptions={roomOptions}
          campusOptions={campusOptions} staffOptions={staffOptions}
          fetchAll={fetchAll} toast={toast} api={api}
        />
      )}

      {activeTab === "question-banks" && (
        <QuestionBanksTab
          questionBanks={questionBanks} subjectOptions={subjectOptions}
          fetchAll={fetchAll} toast={toast} api={api}
        />
      )}

      {activeTab === "online-tests" && (
        <OnlineTestsTab
          questionPapers={questionPapers} questionBanks={questionBanks} schedules={schedules}
          subjectOptions={subjectOptions}
          fetchAll={fetchAll} toast={toast} api={api}
        />
      )}

      {activeTab === "evaluation" && (
        <EvaluationTab
          schedules={schedules} evaluations={evaluations} staffOptions={staffOptions}
          fetchAll={fetchAll} toast={toast} api={api}
        />
      )}

      {activeTab === "grading" && (
        <GradingTab
          gradingSchemes={gradingSchemes} gradebooks={gradebooks}
          sessionOptions={sessionOptions} classOptions={classOptions}
          fetchAll={fetchAll} toast={toast} api={api}
        />
      )}

      {activeTab === "report-cards" && (
        <ReportCardsTab
          reportCards={reportCards} students={students} sessionOptions={sessionOptions}
          fetchAll={fetchAll} toast={toast} api={api}
        />
      )}
    </div>
  );
}

// ==========================================
// SETUP TAB — Sessions / Types / Templates
// ==========================================
function SetupTab({ sessions, types, templates, typeOptions, fetchAll, toast, api }: any) {
  const [sessionOpen, setSessionOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const [sessionForm, setSessionForm] = useState({ name: "", startDate: "", endDate: "" });
  const [typeForm, setTypeForm] = useState({ name: "", description: "" });
  const [templateForm, setTemplateForm] = useState({ typeId: "", name: "", totalMarks: "100", passMarks: "35" });

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/sessions", { method: "POST", body: JSON.stringify(sessionForm) });
      toast("Success", { description: "Exam session created", type: "success" });
      setSessionOpen(false); setSessionForm({ name: "", startDate: "", endDate: "" }); fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const createType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/types", { method: "POST", body: JSON.stringify(typeForm) });
      toast("Success", { description: "Exam type created", type: "success" });
      setTypeOpen(false); setTypeForm({ name: "", description: "" }); fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/templates", {
        method: "POST",
        body: JSON.stringify({ ...templateForm, totalMarks: Number(templateForm.totalMarks), passMarks: Number(templateForm.passMarks) }),
      });
      toast("Success", { description: "Exam template created", type: "success" });
      setTemplateOpen(false); setTemplateForm({ typeId: "", name: "", totalMarks: "100", passMarks: "35" }); fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const del = async (path: string, label: string) => {
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
    try { await api(path, { method: "DELETE" }); toast("Deleted", { description: `${label} removed`, type: "success" }); fetchAll(); }
    catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Exam Sessions</CardTitle>
            <CardDescription>Top-level examination blocks (e.g. Term 1 2026)</CardDescription>
          </div>
          <Button onClick={() => setSessionOpen(true)} variant="primary"><Plus className="w-4 h-4 mr-2" /> New Session</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.length === 0 ? (
              <div className="col-span-full p-8 text-center border border-dashed rounded-lg text-text-secondary">No sessions yet.</div>
            ) : sessions.map((s: any) => (
              <div key={s.id} className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between transition-colors hover:border-primary/30 hover:bg-primary/5">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{s.name}</h3>
                    <Badge variant={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Archived"}</Badge>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-text-secondary">{s.schedules?.length || 0} schedules</p>
                </div>
                <Button variant="ghost" size="sm" className="text-danger mt-2" onClick={() => del(`/ems/sessions/${s.id}`, "session")}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Exam Types</CardTitle><CardDescription>Categories (Unit Test, Mid-Term, Final)</CardDescription></div>
            <Button onClick={() => setTypeOpen(true)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
          </CardHeader>
          <CardContent>
            {types.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No exam types yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {types.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center py-2 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 rounded-md px-2 -mx-2">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      {t.description && <p className="text-xs text-text-secondary">{t.description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => del(`/ems/types/${t.id}`, "exam type")}><Trash2 className="w-3.5 h-3.5 text-danger" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Exam Templates</CardTitle><CardDescription>Marks scheme blueprints for scheduling</CardDescription></div>
            <Button onClick={() => setTemplateOpen(true)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No templates yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {templates.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center py-2 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 rounded-md px-2 -mx-2">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-text-secondary">{t.type?.name} · Total {t.totalMarks} · Pass {t.passMarks}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => del(`/ems/templates/${t.id}`, "template")}><Trash2 className="w-3.5 h-3.5 text-danger" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={sessionOpen} onClose={() => setSessionOpen(false)} title="Create Exam Session">
        <form className="space-y-4 pt-4" onSubmit={createSession}>
          <Input label="Session Name (e.g. Term 1 2026)" required value={sessionForm.name} onChange={e => setSessionForm({ ...sessionForm, name: e.target.value })} />
          <Input label="Start Date" type="date" required value={sessionForm.startDate} onChange={e => setSessionForm({ ...sessionForm, startDate: e.target.value })} />
          <Input label="End Date" type="date" required value={sessionForm.endDate} onChange={e => setSessionForm({ ...sessionForm, endDate: e.target.value })} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setSessionOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={typeOpen} onClose={() => setTypeOpen(false)} title="Create Exam Type">
        <form className="space-y-4 pt-4" onSubmit={createType}>
          <Input label="Type Name (e.g. Unit Test)" required value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} />
          <Input label="Description" value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setTypeOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={templateOpen} onClose={() => setTemplateOpen(false)} title="Create Exam Template">
        <form className="space-y-4 pt-4" onSubmit={createTemplate}>
          <Select label="Exam Type" required value={templateForm.typeId} onChange={e => setTemplateForm({ ...templateForm, typeId: e.target.value })} options={[opt("Select type...", ""), ...typeOptions]} />
          <Input label="Template Name" required value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Marks" type="number" required value={templateForm.totalMarks} onChange={e => setTemplateForm({ ...templateForm, totalMarks: e.target.value })} />
            <Input label="Pass Marks" type="number" required value={templateForm.passMarks} onChange={e => setTemplateForm({ ...templateForm, passMarks: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setTemplateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ==========================================
// TIMETABLE TAB — Schedules / Rooms / Seating / Invigilators / Attempts
// ==========================================
function TimetableTab({
  schedules, sessionOptions, templateOptions, subjectOptions, classOptions, roomOptions, campusOptions, staffOptions,
  fetchAll, toast, api,
}: any) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ sessionId: "", templateId: "", subjectId: "", date: "", startTime: "", endTime: "" });
  const [detailSchedule, setDetailSchedule] = useState<any | null>(null);
  const [roomOpen, setRoomOpen] = useState(false);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomId: "", capacity: "40" });
  const [newRoomForm, setNewRoomForm] = useState({ name: "", capacity: "40", campusId: "" });
  const [seatingRoomId, setSeatingRoomId] = useState<string | null>(null);
  const [seatingClassId, setSeatingClassId] = useState("");
  const [invRoomId, setInvRoomId] = useState<string | null>(null);
  const [invStaffId, setInvStaffId] = useState("");
  const [attemptsClassId, setAttemptsClassId] = useState("");
  const [attempts, setAttempts] = useState<any[]>([]);
  const [roomDetails, setRoomDetails] = useState<any[]>([]);

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/schedules", { method: "POST", body: JSON.stringify(scheduleForm) });
      toast("Success", { description: "Exam schedule added", type: "success" });
      setScheduleOpen(false);
      setScheduleForm({ sessionId: "", templateId: "", subjectId: "", date: "", startTime: "", endTime: "" });
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Delete this schedule? Rooms, seating, and attempts under it will also be removed.")) return;
    try { await api(`/ems/schedules/${id}`, { method: "DELETE" }); toast("Deleted", { type: "success" }); fetchAll(); }
    catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const openDetail = async (schedule: any) => {
    setDetailSchedule(schedule);
    await refreshRooms(schedule.id);
    try { setAttempts(await api(`/ems/schedules/${schedule.id}/attempts`)); } catch { setAttempts([]); }
  };

  const refreshRooms = async (scheduleId: string) => {
    try { setRoomDetails(await api(`/ems/schedules/${scheduleId}/rooms`)); } catch { setRoomDetails([]); }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailSchedule) return;
    try {
      await api(`/ems/schedules/${detailSchedule.id}/rooms`, {
        method: "POST",
        body: JSON.stringify({ roomId: roomForm.roomId, capacity: Number(roomForm.capacity) }),
      });
      toast("Success", { description: "Room allocated", type: "success" });
      setRoomOpen(false); setRoomForm({ roomId: "", capacity: "40" });
      refreshRooms(detailSchedule.id);
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const createNewRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/master-data/rooms", {
        method: "POST",
        body: JSON.stringify({ name: newRoomForm.name, capacity: Number(newRoomForm.capacity), campusId: newRoomForm.campusId }),
      });
      toast("Success", { description: "Room registered", type: "success" });
      setNewRoomOpen(false); setNewRoomForm({ name: "", capacity: "40", campusId: "" });
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const deleteRoom = async (id: string) => {
    if (!confirm("Remove this room allocation?")) return;
    try { await api(`/ems/rooms/${id}`, { method: "DELETE" }); toast("Removed", { type: "success" }); if (detailSchedule) refreshRooms(detailSchedule.id); }
    catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const generateSeating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatingRoomId) return;
    try {
      await api(`/ems/rooms/${seatingRoomId}/seating/generate`, { method: "POST", body: JSON.stringify({ classId: seatingClassId }) });
      toast("Success", { description: "Seating plan generated", type: "success" });
      setSeatingRoomId(null); setSeatingClassId("");
      if (detailSchedule) refreshRooms(detailSchedule.id);
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const addInvigilator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invRoomId) return;
    try {
      await api(`/ems/rooms/${invRoomId}/invigilators`, { method: "POST", body: JSON.stringify({ staffId: invStaffId }) });
      toast("Success", { description: "Invigilator assigned", type: "success" });
      setInvRoomId(null); setInvStaffId("");
      if (detailSchedule) refreshRooms(detailSchedule.id);
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const removeInvigilator = async (id: string) => {
    try { await api(`/ems/invigilators/${id}`, { method: "DELETE" }); toast("Removed", { type: "success" }); if (detailSchedule) refreshRooms(detailSchedule.id); }
    catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const generateAttempts = async () => {
    if (!detailSchedule || !attemptsClassId) { toast("Select a class first", { type: "error" }); return; }
    try {
      const result = await api(`/ems/schedules/${detailSchedule.id}/attempts/generate`, { method: "POST", body: JSON.stringify({ classId: attemptsClassId }) });
      setAttempts(result);
      toast("Success", { description: `${result.length} attempts registered`, type: "success" });
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Timetable & Seating Logistics</CardTitle><CardDescription>Allocate rooms and generate seating plans</CardDescription></div>
          <Button onClick={() => setScheduleOpen(true)} variant="primary"><Plus className="w-4 h-4 mr-2" /> Add Schedule</Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Template</th>
                  <th className="px-4 py-3 font-medium">Date & Time</th>
                  <th className="px-4 py-3 font-medium">Rooms</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schedules.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No exam schedules yet.</td></tr>
                ) : schedules.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-medium">{s.subject?.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.template?.name}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {new Date(s.date).toLocaleDateString()} | {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.rooms?.length > 0 ? "success" : "neutral"}>{s.rooms?.length || 0} room(s)</Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="outline" size="sm" onClick={() => openDetail(s)}>Manage <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteSchedule(s.id)}><Trash2 className="w-3.5 h-3.5 text-danger" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Add Timetable Schedule">
        <form className="space-y-4 pt-4" onSubmit={createSchedule}>
          <Select label="Exam Session" required value={scheduleForm.sessionId} onChange={e => setScheduleForm({ ...scheduleForm, sessionId: e.target.value })} options={[opt("Select session...", ""), ...sessionOptions]} />
          <Select label="Exam Template" required value={scheduleForm.templateId} onChange={e => setScheduleForm({ ...scheduleForm, templateId: e.target.value })} options={[opt("Select template...", ""), ...templateOptions]} />
          <Select label="Subject" required value={scheduleForm.subjectId} onChange={e => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })} options={[opt("Select subject...", ""), ...subjectOptions]} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Date" type="date" required value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} />
            <Input label="Start Time" type="time" required value={scheduleForm.startTime} onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} />
            <Input label="End Time" type="time" required value={scheduleForm.endTime} onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule detail: rooms, seating, invigilators, attempts */}
      <Modal isOpen={!!detailSchedule} onClose={() => setDetailSchedule(null)} title={detailSchedule ? `${detailSchedule.subject?.name} — ${detailSchedule.template?.name}` : ""} size="xl">
        {detailSchedule && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Room & Invigilator Allocation</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setNewRoomOpen(true)}>+ Register Room</Button>
                <Button variant="primary" size="sm" onClick={() => setRoomOpen(true)}>+ Allocate Room</Button>
              </div>
            </div>

            {roomDetails.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No rooms allocated to this schedule yet.</div>
            ) : (
              <div className="space-y-3">
                {roomDetails.map((r: any) => (
                  <div key={r.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-sm">Room capacity: {r.capacity}</div>
                      <Button variant="ghost" size="sm" onClick={() => deleteRoom(r.id)}><Trash2 className="w-3.5 h-3.5 text-danger" /></Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-text-secondary">Seating ({r.seatings?.length || 0})</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setSeatingRoomId(r.id)}>Generate</Button>
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-0.5">
                          {(r.seatings || []).map((st: any) => (
                            <div key={st.id} className="flex justify-between"><span>{st.student?.fullName}</span><span className="text-text-secondary">{st.seatNumber}</span></div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-text-secondary">Invigilators ({r.invigilators?.length || 0})</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setInvRoomId(r.id)}>Add</Button>
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-0.5">
                          {(r.invigilators || []).map((iv: any) => (
                            <div key={iv.id} className="flex justify-between items-center">
                              <span>{iv.staff?.fullName}</span>
                              <button onClick={() => removeInvigilator(iv.id)} className="text-danger"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Exam Attempts (Attendance Roll)</h4>
                <div className="flex gap-2 items-end">
                  <div className="w-48"><Select label="Generate for Class" value={attemptsClassId} onChange={e => setAttemptsClassId(e.target.value)} options={[opt("Select class...", ""), ...classOptions]} /></div>
                  <Button variant="outline" size="sm" onClick={generateAttempts}>Generate</Button>
                </div>
              </div>
              {attempts.length === 0 ? (
                <div className="p-4 text-center border border-dashed rounded-lg text-text-secondary text-xs">No attempts registered yet.</div>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y divide-border text-xs">
                  {attempts.map((a: any) => (
                    <div key={a.id} className="flex justify-between px-3 py-2">
                      <span>{a.student?.fullName}</span>
                      <Badge variant={a.status === "PRESENT" ? "success" : a.status === "ABSENT" ? "danger" : "neutral"}>{a.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={roomOpen} onClose={() => setRoomOpen(false)} title="Allocate Room to Schedule">
        <form className="space-y-4 pt-4" onSubmit={createRoom}>
          <Select label="Room" required value={roomForm.roomId} onChange={e => setRoomForm({ ...roomForm, roomId: e.target.value })} options={[opt("Select room...", ""), ...roomOptions]} />
          <Input label="Seating Capacity" type="number" required value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setRoomOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Allocate</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={newRoomOpen} onClose={() => setNewRoomOpen(false)} title="Register New Room">
        <form className="space-y-4 pt-4" onSubmit={createNewRoom}>
          <Input label="Room Name" required value={newRoomForm.name} onChange={e => setNewRoomForm({ ...newRoomForm, name: e.target.value })} />
          <Input label="Capacity" type="number" required value={newRoomForm.capacity} onChange={e => setNewRoomForm({ ...newRoomForm, capacity: e.target.value })} />
          <Select label="Campus" required value={newRoomForm.campusId} onChange={e => setNewRoomForm({ ...newRoomForm, campusId: e.target.value })} options={[opt("Select campus...", ""), ...campusOptions]} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setNewRoomOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Register</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!seatingRoomId} onClose={() => setSeatingRoomId(null)} title="Generate Seating Plan">
        <form className="space-y-4 pt-4" onSubmit={generateSeating}>
          <p className="text-xs text-text-secondary">Auto-assigns sequential seats to every enrolled student in the selected class, up to room capacity.</p>
          <Select label="Class" required value={seatingClassId} onChange={e => setSeatingClassId(e.target.value)} options={[opt("Select class...", ""), ...classOptions]} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setSeatingRoomId(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!invRoomId} onClose={() => setInvRoomId(null)} title="Assign Invigilator">
        <form className="space-y-4 pt-4" onSubmit={addInvigilator}>
          <Select label="Staff Member" required value={invStaffId} onChange={e => setInvStaffId(e.target.value)} options={[opt("Select staff...", ""), ...staffOptions]} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setInvRoomId(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ==========================================
// QUESTION BANKS TAB
// ==========================================
function QuestionBanksTab({ questionBanks, subjectOptions, fetchAll, toast, api }: any) {
  const [bankOpen, setBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ title: "", description: "", subjectId: "" });
  const [detailBank, setDetailBank] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionOpen, setQuestionOpen] = useState(false);
  const emptyQuestionForm = { type: "MCQ", text: "", bloomLevel: "", difficulty: "MEDIUM", marks: "1", options: [{ id: "A", text: "" }, { id: "B", text: "" }], correctOptionId: "A" };
  const [questionForm, setQuestionForm] = useState<any>(emptyQuestionForm);

  const addOption = () => {
    const nextId = String.fromCharCode(65 + questionForm.options.length); // A, B, C, D...
    setQuestionForm({ ...questionForm, options: [...questionForm.options, { id: nextId, text: "" }] });
  };
  const updateOptionText = (id: string, text: string) => {
    setQuestionForm({ ...questionForm, options: questionForm.options.map((o: any) => (o.id === id ? { ...o, text } : o)) });
  };
  const removeOption = (id: string) => {
    const options = questionForm.options.filter((o: any) => o.id !== id);
    setQuestionForm({ ...questionForm, options, correctOptionId: questionForm.correctOptionId === id ? (options[0]?.id || "") : questionForm.correctOptionId });
  };

  const createBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/question-banks", { method: "POST", body: JSON.stringify({ ...bankForm, subjectId: bankForm.subjectId || undefined }) });
      toast("Success", { description: "Question bank created", type: "success" });
      setBankOpen(false); setBankForm({ title: "", description: "", subjectId: "" }); fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const deleteBank = async (id: string) => {
    if (!confirm("Delete this question bank and all its questions?")) return;
    try { await api(`/ems/question-banks/${id}`, { method: "DELETE" }); toast("Deleted", { type: "success" }); fetchAll(); }
    catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const openBank = async (bank: any) => {
    setDetailBank(bank);
    try { setQuestions(await api(`/ems/question-banks/${bank.id}/questions`)); } catch { setQuestions([]); }
  };

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailBank) return;
    try {
      const isMcq = questionForm.type === "MCQ";
      await api(`/ems/question-banks/${detailBank.id}/questions`, {
        method: "POST",
        body: JSON.stringify({
          type: questionForm.type,
          text: questionForm.text,
          bloomLevel: questionForm.bloomLevel || undefined,
          difficulty: questionForm.difficulty,
          marks: Number(questionForm.marks) || 1,
          options: isMcq ? questionForm.options.filter((o: any) => o.text.trim()) : undefined,
          correctOptionId: isMcq ? questionForm.correctOptionId : undefined,
        }),
      });
      toast("Success", { description: "Question added", type: "success" });
      setQuestionOpen(false); setQuestionForm(emptyQuestionForm);
      setQuestions(await api(`/ems/question-banks/${detailBank.id}/questions`));
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await api(`/ems/questions/${id}`, { method: "DELETE" });
      if (detailBank) setQuestions(await api(`/ems/question-banks/${detailBank.id}/questions`));
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Global Question Bank</CardTitle><CardDescription>Repository of all approved examination questions</CardDescription></div>
          <Button variant="primary" onClick={() => setBankOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Bank</Button>
        </CardHeader>
        <CardContent>
          {questionBanks.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">No question banks yet.</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Bank Name</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Questions</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {questionBanks.map((bank: any) => (
                    <tr key={bank.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-medium">{bank.title}</td>
                      <td className="px-4 py-3 text-text-secondary">{bank.description}</td>
                      <td className="px-4 py-3"><Badge variant="neutral">{bank.questions?.length || 0}</Badge></td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => openBank(bank)}>View</Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteBank(bank.id)}><Trash2 className="w-3.5 h-3.5 text-danger" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={bankOpen} onClose={() => setBankOpen(false)} title="Create Question Bank">
        <form className="space-y-4 pt-4" onSubmit={createBank}>
          <Input label="Bank Title" required value={bankForm.title} onChange={e => setBankForm({ ...bankForm, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={bankForm.description} onChange={e => setBankForm({ ...bankForm, description: e.target.value })} />
          </div>
          <Select label="Subject (optional)" value={bankForm.subjectId} onChange={e => setBankForm({ ...bankForm, subjectId: e.target.value })} options={[opt("General / Unassigned", ""), ...subjectOptions]} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setBankOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailBank} onClose={() => setDetailBank(null)} title={detailBank ? detailBank.title : ""} size="lg">
        {detailBank && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setQuestionOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
            </div>
            {questions.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No questions in this bank yet.</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {questions.map((q: any) => (
                  <div key={q.id} className="border rounded-lg p-3 flex justify-between items-start gap-3">
                    <div>
                      <div className="flex gap-2 mb-1">
                        <Badge variant="neutral">{q.type}</Badge>
                        <Badge variant={q.difficulty === "HARD" ? "danger" : q.difficulty === "EASY" ? "success" : "neutral"}>{q.difficulty}</Badge>
                        {q.bloomLevel && <Badge variant="neutral">{q.bloomLevel}</Badge>}
                      </div>
                      <p className="text-sm">{q.text}</p>
                      {q.type === "MCQ" && Array.isArray(q.options) && (
                        <div className="mt-1.5 space-y-0.5">
                          {q.options.map((o: any) => (
                            <div key={o.id} className={`text-xs flex gap-1.5 ${o.id === q.correctOptionId ? "text-success font-medium" : "text-text-secondary"}`}>
                              <span>{o.id === q.correctOptionId ? "✓" : "•"}</span><span>{o.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)}><Trash2 className="w-3.5 h-3.5 text-danger" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={questionOpen} onClose={() => setQuestionOpen(false)} title="Add Question to Bank">
        <form className="space-y-4 pt-4" onSubmit={createQuestion}>
          <div>
            <label className="block text-sm font-medium mb-1">Question Text</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required rows={3} value={questionForm.text} onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })} />
          </div>
          <Select label="Type" value={questionForm.type} onChange={e => setQuestionForm({ ...questionForm, type: e.target.value })} options={[opt("Multiple Choice (MCQ)", "MCQ"), opt("Descriptive", "DESCRIPTIVE"), opt("Practical", "PRACTICAL")]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Difficulty" value={questionForm.difficulty} onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })} options={[opt("Easy", "EASY"), opt("Medium", "MEDIUM"), opt("Hard", "HARD")]} />
            <Input label="Marks" type="number" min="0" step="0.5" value={questionForm.marks} onChange={e => setQuestionForm({ ...questionForm, marks: e.target.value })} />
          </div>
          <Input label="Bloom's Level (optional)" value={questionForm.bloomLevel} onChange={e => setQuestionForm({ ...questionForm, bloomLevel: e.target.value })} placeholder="e.g. Application, Analysis" />

          {questionForm.type === "MCQ" && (
            <div className="space-y-2 border rounded-lg p-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Options — mark the correct answer</label>
                <Button type="button" variant="ghost" size="sm" onClick={addOption}>+ Option</Button>
              </div>
              {questionForm.options.map((o: any) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    type="radio" name="correctOptionId" checked={questionForm.correctOptionId === o.id}
                    onChange={() => setQuestionForm({ ...questionForm, correctOptionId: o.id })}
                    title="Mark as correct answer"
                  />
                  <span className="text-xs font-mono w-5 text-text-secondary">{o.id}</span>
                  <input
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    value={o.text} placeholder={`Option ${o.id} text`}
                    onChange={e => updateOptionText(o.id, e.target.value)}
                  />
                  {questionForm.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(o.id)} className="text-danger"><X className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              <p className="text-xs text-text-secondary">Online tests require every question to have options and a marked correct answer.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setQuestionOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add to Bank</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ==========================================
// ONLINE TESTS TAB — Question Papers / Activate Schedule / Live Monitor
// ==========================================
function OnlineTestsTab({ questionPapers, questionBanks, schedules, subjectOptions, fetchAll, toast, api }: any) {
  const [paperOpen, setPaperOpen] = useState(false);
  const [paperForm, setPaperForm] = useState({ title: "", subjectId: "", totalMarks: "20", durationMin: "30" });
  const [detailPaper, setDetailPaper] = useState<any | null>(null);
  const [addBankId, setAddBankId] = useState("");
  const [addQuestionId, setAddQuestionId] = useState("");

  const [activateScheduleId, setActivateScheduleId] = useState("");
  const [activateForm, setActivateForm] = useState({ questionPaperId: "", durationMin: "" });

  const [monitorScheduleId, setMonitorScheduleId] = useState("");
  const [monitorRows, setMonitorRows] = useState<any[] | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);

  const createPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/question-papers", {
        method: "POST",
        body: JSON.stringify({ ...paperForm, totalMarks: Number(paperForm.totalMarks), durationMin: Number(paperForm.durationMin) }),
      });
      toast("Success", { description: "Question paper created", type: "success" });
      setPaperOpen(false); setPaperForm({ title: "", subjectId: "", totalMarks: "20", durationMin: "30" }); fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const refreshDetailPaper = async (id: string) => {
    try { setDetailPaper(await api(`/ems/question-papers/${id}`)); } catch { /* keep prior state on transient failure */ }
  };

  const addQuestionToPaper = async () => {
    if (!detailPaper || !addQuestionId) return;
    try {
      await api(`/ems/question-papers/${detailPaper.id}/questions`, { method: "POST", body: JSON.stringify({ questionId: addQuestionId }) });
      toast("Success", { description: "Question added to paper", type: "success" });
      setAddQuestionId("");
      await refreshDetailPaper(detailPaper.id);
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const approvePaper = async (id: string) => {
    try {
      await api(`/ems/question-papers/${id}/approve`, { method: "PATCH" });
      toast("Approved", { description: "Paper can now be scheduled online", type: "success" });
      await refreshDetailPaper(id);
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const activateOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateScheduleId || !activateForm.questionPaperId) return;
    try {
      await api(`/ems/schedules/${activateScheduleId}/online`, {
        method: "PATCH",
        body: JSON.stringify({
          questionPaperId: activateForm.questionPaperId,
          durationMin: activateForm.durationMin ? Number(activateForm.durationMin) : undefined,
        }),
      });
      toast("Success", { description: "Schedule activated as an online test", type: "success" });
      setActivateScheduleId(""); setActivateForm({ questionPaperId: "", durationMin: "" });
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const loadMonitor = async (scheduleId: string) => {
    setMonitorScheduleId(scheduleId);
    if (!scheduleId) { setMonitorRows(null); return; }
    setMonitorLoading(true);
    try { setMonitorRows(await api(`/ems/schedules/${scheduleId}/online-status`)); }
    catch (err: any) { toast("Error", { description: err.message, type: "error" }); setMonitorRows(null); }
    finally { setMonitorLoading(false); }
  };

  const approvedPapers = questionPapers.filter((p: any) => p.isApproved);
  const onlineSchedules = schedules.filter((s: any) => s.mode === "ONLINE");
  const statusVariant = (status: string) =>
    status === "GRADED" ? "success" : status === "IN_PROGRESS" ? "warning" : status === "SUBMITTED" ? "success" : "neutral";

  return (
    <div className="space-y-6 mt-6">
      <div className="px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-text-secondary">
        Build an MCQ question paper, approve it, then activate any exam schedule as an <span className="font-semibold text-text-primary">online test</span> so
        students can take it from the mobile app (via their own or a parent-mediated login) with a live countdown and instant auto-grading.
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Question Papers</CardTitle><CardDescription>MCQ papers assembled from your question banks</CardDescription></div>
          <Button variant="primary" onClick={() => setPaperOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Paper</Button>
        </CardHeader>
        <CardContent>
          {questionPapers.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">No question papers yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionPapers.map((p: any) => (
                <div key={p.id} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{p.title}</h3>
                      <Badge variant={p.isApproved ? "success" : "neutral"}>{p.isApproved ? "Approved" : "Draft"}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary mb-1">{p.subject?.name} · {p.totalMarks} marks · {p.durationMin} min</p>
                    <p className="text-xs text-text-secondary">{p.items?.length || 0} question(s)</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => refreshDetailPaper(p.id)}>Manage <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Activate a Schedule Online</CardTitle><CardDescription>Turn an existing exam schedule into an MCQ online test</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={activateOnline}>
              <Select
                label="Exam Schedule" required value={activateScheduleId} onChange={e => setActivateScheduleId(e.target.value)}
                options={[opt("Select schedule...", ""), ...schedules.map((s: any) => opt(`${s.subject?.name} — ${s.template?.name} (${new Date(s.date).toLocaleDateString()})${s.mode === "ONLINE" ? " · already ONLINE" : ""}`, s.id))]}
              />
              <Select
                label="Approved Question Paper" required value={activateForm.questionPaperId}
                onChange={e => setActivateForm({ ...activateForm, questionPaperId: e.target.value })}
                options={[opt(approvedPapers.length ? "Select paper..." : "No approved papers yet", ""), ...approvedPapers.map((p: any) => opt(`${p.title} (${p.durationMin} min)`, p.id))]}
              />
              <Input label="Duration override (minutes, optional)" type="number" value={activateForm.durationMin} onChange={e => setActivateForm({ ...activateForm, durationMin: e.target.value })} placeholder="Defaults to the paper's duration" />
              <Button type="submit" variant="primary" disabled={!approvedPapers.length}>Activate Online</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Live Monitor</CardTitle><CardDescription>Who&apos;s started, in progress, or submitted</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Online Schedule" value={monitorScheduleId} onChange={e => loadMonitor(e.target.value)}
              options={[opt("Select an online schedule...", ""), ...onlineSchedules.map((s: any) => opt(`${s.subject?.name} — ${s.template?.name} (${new Date(s.date).toLocaleDateString()})`, s.id))]}
            />
            {monitorLoading && <p className="text-xs text-text-secondary">Loading…</p>}
            {monitorRows && (
              monitorRows.length === 0 ? (
                <div className="p-4 text-center border border-dashed rounded-lg text-text-secondary text-xs">No attempts registered for this schedule yet.</div>
              ) : (
                <div className="max-h-72 overflow-y-auto border rounded-lg divide-y divide-border text-xs">
                  {monitorRows.map((r: any) => (
                    <div key={r.attemptId} className="flex justify-between items-center px-3 py-2">
                      <span>{r.student?.fullName}</span>
                      <div className="flex items-center gap-2">
                        {r.autoSubmitted && <span className="text-text-secondary" title="Auto-submitted when time expired"><Timer className="w-3 h-3" /></span>}
                        <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            {monitorScheduleId && (
              <Button variant="outline" size="sm" onClick={() => loadMonitor(monitorScheduleId)}>Refresh</Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={paperOpen} onClose={() => setPaperOpen(false)} title="Create Question Paper">
        <form className="space-y-4 pt-4" onSubmit={createPaper}>
          <Input label="Title (e.g. Weekly Test — Algebra)" required value={paperForm.title} onChange={e => setPaperForm({ ...paperForm, title: e.target.value })} />
          <Select label="Subject" required value={paperForm.subjectId} onChange={e => setPaperForm({ ...paperForm, subjectId: e.target.value })} options={[opt("Select subject...", ""), ...subjectOptions]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Marks" type="number" required value={paperForm.totalMarks} onChange={e => setPaperForm({ ...paperForm, totalMarks: e.target.value })} />
            <Input label="Duration (minutes)" type="number" required value={paperForm.durationMin} onChange={e => setPaperForm({ ...paperForm, durationMin: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setPaperOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailPaper} onClose={() => setDetailPaper(null)} title={detailPaper ? detailPaper.title : ""} size="lg">
        {detailPaper && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant={detailPaper.isApproved ? "success" : "neutral"}>{detailPaper.isApproved ? "Approved" : "Draft"}</Badge>
              {!detailPaper.isApproved && (
                <Button variant="primary" size="sm" disabled={!detailPaper.items?.length} onClick={() => approvePaper(detailPaper.id)}>
                  Approve Paper
                </Button>
              )}
            </div>

            {!detailPaper.isApproved && (
              <div className="flex gap-2 items-end border rounded-lg p-3">
                <div className="flex-1">
                  <Select label="From Bank" value={addBankId} onChange={e => { setAddBankId(e.target.value); setAddQuestionId(""); }} options={[opt("Select bank...", ""), ...questionBanks.map((b: any) => opt(b.title, b.id))]} />
                </div>
                <div className="flex-1">
                  <Select
                    label="Question" value={addQuestionId} onChange={e => setAddQuestionId(e.target.value)}
                    options={[opt("Select question...", ""), ...(questionBanks.find((b: any) => b.id === addBankId)?.questions || [])
                      .filter((q: any) => !detailPaper.items?.some((it: any) => it.questionId === q.id))
                      .map((q: any) => opt(`${q.type !== "MCQ" ? "⚠ " : ""}${q.text.slice(0, 50)}`, q.id))]}
                  />
                </div>
                <Button variant="primary" size="sm" disabled={!addQuestionId} onClick={addQuestionToPaper}>Add</Button>
              </div>
            )}

            {(!detailPaper.items || detailPaper.items.length === 0) ? (
              <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No questions added yet.</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {detailPaper.items.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex gap-2 mb-1">
                          <span className="text-xs text-text-secondary font-mono">#{item.sequence}</span>
                          <Badge variant="neutral">{item.question.type}</Badge>
                          <Badge variant="neutral">{item.marks} marks</Badge>
                          {(item.question.type !== "MCQ" || !item.question.correctOptionId) && (
                            <Badge variant="danger">Not online-eligible</Badge>
                          )}
                        </div>
                        <p className="text-sm">{item.question.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// EVALUATION TAB
// ==========================================
function EvaluationTab({ schedules, evaluations, staffOptions, fetchAll, toast, api }: any) {
  const [scheduleId, setScheduleId] = useState("");
  const [attempts, setAttempts] = useState<any[]>([]);
  const [evalOpen, setEvalOpen] = useState<any | null>(null);
  const [evalForm, setEvalForm] = useState({ evaluatorId: "", marksObtained: "", remarks: "" });

  const loadAttempts = async (id: string) => {
    setScheduleId(id);
    if (!id) { setAttempts([]); return; }
    try { setAttempts(await api(`/ems/schedules/${id}/attempts`)); } catch { setAttempts([]); }
  };

  const openEval = (attempt: any) => {
    const existing = attempt.evaluations?.[0];
    setEvalForm({ evaluatorId: existing?.evaluatorId || "", marksObtained: existing?.marksObtained?.toString() || "", remarks: existing?.remarks || "" });
    setEvalOpen(attempt);
  };

  const submitEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalOpen) return;
    try {
      const existing = evalOpen.evaluations?.[0];
      if (existing) {
        await api(`/ems/evaluations/${existing.id}`, { method: "PATCH", body: JSON.stringify({ marksObtained: Number(evalForm.marksObtained), remarks: evalForm.remarks }) });
      } else {
        await api("/ems/evaluations", { method: "POST", body: JSON.stringify({ attemptId: evalOpen.id, evaluatorId: evalForm.evaluatorId, marksObtained: Number(evalForm.marksObtained), remarks: evalForm.remarks }) });
      }
      toast("Success", { description: "Marks recorded", type: "success" });
      setEvalOpen(null);
      if (scheduleId) setAttempts(await api(`/ems/schedules/${scheduleId}/attempts`));
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Digital Evaluation Desk</CardTitle>
          <CardDescription>Select a schedule to evaluate answer sheets and enter marks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-72">
            <Select
              label="Exam Schedule"
              value={scheduleId}
              onChange={e => loadAttempts(e.target.value)}
              options={[opt("Select schedule...", ""), ...schedules.map((s: any) => opt(`${s.subject?.name} — ${s.template?.name} (${new Date(s.date).toLocaleDateString()})`, s.id))]}
            />
          </div>

          {scheduleId && (
            attempts.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">No attempts registered for this schedule. Generate attempts from the Timetable tab first.</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Attendance</th>
                      <th className="px-4 py-3 font-medium">Marks Obtained</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attempts.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="px-4 py-3 font-medium">{a.student?.fullName}</td>
                        <td className="px-4 py-3"><Badge variant={a.status === "PRESENT" ? "success" : "danger"}>{a.status}</Badge></td>
                        <td className="px-4 py-3">{a.evaluations?.[0]?.marksObtained ?? <span className="text-text-secondary">Not graded</span>}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant={a.evaluations?.length ? "outline" : "primary"} size="sm" onClick={() => openEval(a)}>
                            {a.evaluations?.length ? "Update Marks" : "Enter Marks"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Evaluations</CardTitle><CardDescription>Across all schedules</CardDescription></CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No evaluations recorded yet.</div>
          ) : (
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {evaluations.slice(0, 30).map((ev: any) => (
                <div key={ev.id} className="flex justify-between items-center py-2 text-sm">
                  <div>
                    <span className="font-medium">{ev.attempt?.student?.fullName}</span>
                    <span className="text-text-secondary ml-2">{ev.attempt?.schedule?.date ? new Date(ev.attempt.schedule.date).toLocaleDateString() : ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary text-xs">by {ev.evaluator?.fullName}</span>
                    <Badge variant="neutral">{ev.marksObtained} marks</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!evalOpen} onClose={() => setEvalOpen(null)} title={evalOpen ? `Grade — ${evalOpen.student?.fullName}` : ""}>
        {evalOpen && (
          <form className="space-y-4 pt-4" onSubmit={submitEval}>
            {!evalOpen.evaluations?.length && (
              <Select label="Evaluator" required value={evalForm.evaluatorId} onChange={e => setEvalForm({ ...evalForm, evaluatorId: e.target.value })} options={[opt("Select evaluator...", ""), ...staffOptions]} />
            )}
            <Input label="Marks Obtained" type="number" step="0.01" required value={evalForm.marksObtained} onChange={e => setEvalForm({ ...evalForm, marksObtained: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={evalForm.remarks} onChange={e => setEvalForm({ ...evalForm, remarks: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEvalOpen(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Marks</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// GRADING TAB — Grading Schemes / Gradebooks / Compute Results
// ==========================================
function GradingTab({ gradingSchemes, gradebooks, sessionOptions, classOptions, fetchAll, toast, api }: any) {
  const [schemeOpen, setSchemeOpen] = useState(false);
  const [schemeForm, setSchemeForm] = useState({ name: "", description: "" });
  const [ranges, setRanges] = useState([{ min: "90", max: "100", grade: "A+" }]);

  const [gbOpen, setGbOpen] = useState(false);
  const [gbForm, setGbForm] = useState({ sessionId: "", classId: "" });

  const [computeOpen, setComputeOpen] = useState<any | null>(null);
  const [computeSchemeId, setComputeSchemeId] = useState("");
  const [computedResults, setComputedResults] = useState<any[] | null>(null);

  const addRange = () => setRanges([...ranges, { min: "", max: "", grade: "" }]);
  const updateRange = (i: number, field: string, value: string) => {
    const next = [...ranges]; (next[i] as any)[field] = value; setRanges(next);
  };
  const removeRange = (i: number) => setRanges(ranges.filter((_: any, idx: number) => idx !== i));

  const createScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/grading-schemes", {
        method: "POST",
        body: JSON.stringify({ ...schemeForm, ranges: ranges.map(r => ({ min: Number(r.min), max: Number(r.max), grade: r.grade })) }),
      });
      toast("Success", { description: "Grading scheme created", type: "success" });
      setSchemeOpen(false); setSchemeForm({ name: "", description: "" }); setRanges([{ min: "90", max: "100", grade: "A+" }]);
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const deleteScheme = async (id: string) => {
    if (!confirm("Delete this grading scheme?")) return;
    try { await api(`/ems/grading-schemes/${id}`, { method: "DELETE" }); toast("Deleted", { type: "success" }); fetchAll(); }
    catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const createGradebook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/gradebooks", { method: "POST", body: JSON.stringify(gbForm) });
      toast("Success", { description: "Gradebook created", type: "success" });
      setGbOpen(false); setGbForm({ sessionId: "", classId: "" }); fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const openCompute = (gb: any) => { setComputeOpen(gb); setComputeSchemeId(""); setComputedResults(null); };

  const runCompute = async () => {
    if (!computeOpen) return;
    try {
      const result = await api(`/ems/gradebooks/${computeOpen.id}/compute-results`, {
        method: "POST",
        body: JSON.stringify({ gradingSchemeId: computeSchemeId || undefined }),
      });
      setComputedResults(result);
      toast("Success", { description: `Results computed for ${result.length} students`, type: "success" });
      fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  const publish = async (id: string) => {
    try { await api(`/ems/gradebooks/${id}/publish`, { method: "PATCH" }); toast("Success", { description: "Gradebook published", type: "success" }); fetchAll(); }
    catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Grading Schemes</CardTitle><CardDescription>Percentage → letter grade bands</CardDescription></div>
            <Button variant="outline" size="sm" onClick={() => setSchemeOpen(true)}><Plus className="w-4 h-4 mr-1" /> New</Button>
          </CardHeader>
          <CardContent>
            {gradingSchemes.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No grading schemes yet — a default A+ to F scale is used automatically.</div>
            ) : (
              <div className="divide-y divide-border">
                {gradingSchemes.map((gs: any) => (
                  <div key={gs.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm">{gs.name}</p>
                      <Button variant="ghost" size="sm" onClick={() => deleteScheme(gs.id)}><Trash2 className="w-3.5 h-3.5 text-danger" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(gs.ranges || []).map((r: any, i: number) => (
                        <Badge key={i} variant="neutral">{r.grade}: {r.min}-{r.max}%</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Gradebooks</CardTitle><CardDescription>Per-class result computation</CardDescription></div>
            <Button variant="primary" size="sm" onClick={() => setGbOpen(true)}><Plus className="w-4 h-4 mr-1" /> New</Button>
          </CardHeader>
          <CardContent>
            {gradebooks.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No gradebooks yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {gradebooks.map((gb: any) => (
                  <div key={gb.id} className="flex justify-between items-center py-2.5">
                    <div>
                      <p className="font-medium text-sm">{gb.class?.grade} — {gb.session?.name}</p>
                      <p className="text-xs text-text-secondary">{gb.results?.length || 0} results computed</p>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Badge variant={gb.isPublished ? "success" : "neutral"}>{gb.isPublished ? "Published" : "Draft"}</Badge>
                      <Button variant="outline" size="sm" onClick={() => openCompute(gb)}><ClipboardList className="w-3.5 h-3.5 mr-1" /> Compute</Button>
                      {!gb.isPublished && <Button variant="ghost" size="sm" onClick={() => publish(gb.id)}>Publish</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={schemeOpen} onClose={() => setSchemeOpen(false)} title="Create Grading Scheme" size="lg">
        <form className="space-y-4 pt-4" onSubmit={createScheme}>
          <Input label="Scheme Name" required value={schemeForm.name} onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })} />
          <Input label="Description" value={schemeForm.description} onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })} />
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Grade Bands</label>
              <Button type="button" variant="outline" size="sm" onClick={addRange}><Plus className="w-3.5 h-3.5 mr-1" /> Add Band</Button>
            </div>
            <div className="space-y-2">
              {ranges.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="Min %" type="number" value={r.min} onChange={e => updateRange(i, "min", e.target.value)} className="w-20" />
                  <Input placeholder="Max %" type="number" value={r.max} onChange={e => updateRange(i, "max", e.target.value)} className="w-20" />
                  <Input placeholder="Grade" value={r.grade} onChange={e => updateRange(i, "grade", e.target.value)} className="w-20" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeRange(i)}><Trash2 className="w-3.5 h-3.5 text-danger" /></Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setSchemeOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={gbOpen} onClose={() => setGbOpen(false)} title="Create Gradebook">
        <form className="space-y-4 pt-4" onSubmit={createGradebook}>
          <Select label="Exam Session" required value={gbForm.sessionId} onChange={e => setGbForm({ ...gbForm, sessionId: e.target.value })} options={[opt("Select session...", ""), ...sessionOptions]} />
          <Select label="Class" required value={gbForm.classId} onChange={e => setGbForm({ ...gbForm, classId: e.target.value })} options={[opt("Select class...", ""), ...classOptions]} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setGbOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!computeOpen} onClose={() => setComputeOpen(null)} title={computeOpen ? `Compute Results — ${computeOpen.class?.grade}` : ""} size="lg">
        {computeOpen && (
          <div className="space-y-4">
            <p className="text-xs text-text-secondary">
              Sums evaluated marks across every exam schedule in this session for each enrolled student, computes percentage, assigns
              a letter grade, and ranks the class. Re-running overwrites previous results for this gradebook.
            </p>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select label="Grading Scheme (optional)" value={computeSchemeId} onChange={e => setComputeSchemeId(e.target.value)} options={[opt("Use default A+ to F scale", ""), ...gradingSchemes.map((gs: any) => opt(gs.name, gs.id))]} />
              </div>
              <Button variant="primary" onClick={runCompute}>Run Computation</Button>
            </div>
            {computedResults && (
              <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium">Rank</th>
                      <th className="px-3 py-2 font-medium">Marks</th>
                      <th className="px-3 py-2 font-medium">%</th>
                      <th className="px-3 py-2 font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {computedResults.map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2">{r.rank}</td>
                        <td className="px-3 py-2">{r.totalMarks}</td>
                        <td className="px-3 py-2">{r.percentage.toFixed(2)}%</td>
                        <td className="px-3 py-2"><Badge variant="neutral">{r.grade}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// REPORT CARDS TAB (EMS — computed from Results)
// ==========================================
function ReportCardsTab({ reportCards, students, sessionOptions, fetchAll, toast, api }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentId: "", sessionId: "", remarks: "", attendance: "" });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/ems/report-cards", {
        method: "POST",
        body: JSON.stringify({ ...form, attendance: form.attendance ? Number(form.attendance) : undefined }),
      });
      toast("Success", { description: "Report card generated", type: "success" });
      setOpen(false); setForm({ studentId: "", sessionId: "", remarks: "", attendance: "" }); fetchAll();
    } catch (err: any) { toast("Error", { description: err.message, type: "error" }); }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>EMS Report Cards</CardTitle><CardDescription>Generated from computed gradebook results</CardDescription></div>
          <Button variant="primary" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Generate</Button>
        </CardHeader>
        <CardContent>
          {reportCards.length === 0 ? (
            <div className="p-12 text-center text-text-secondary border-dashed border rounded-lg">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-indigo-500" />
              <h2 className="text-lg font-semibold mb-1">No report cards generated yet</h2>
              <p className="text-sm">Compute results in the Grading & Results tab first, then generate a report card per student here.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Session</th>
                    <th className="px-4 py-3 font-medium">Attendance</th>
                    <th className="px-4 py-3 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportCards.map((rc: any) => (
                    <tr key={rc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-medium">{rc.student?.fullName}</td>
                      <td className="px-4 py-3 text-text-secondary">{rc.session?.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{rc.attendance != null ? `${rc.attendance}%` : "—"}</td>
                      <td className="px-4 py-3 text-text-secondary">{rc.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Generate EMS Report Card">
        <form className="space-y-4 pt-4" onSubmit={create}>
          <Select label="Student" required value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} options={[opt("Select student...", ""), ...students.map((s: any) => opt(s.fullName, s.id))]} />
          <Select label="Exam Session" required value={form.sessionId} onChange={e => setForm({ ...form, sessionId: e.target.value })} options={[opt("Select session...", ""), ...sessionOptions]} />
          <Input label="Attendance % (optional)" type="number" value={form.attendance} onChange={e => setForm({ ...form, attendance: e.target.value })} />
          <div>
            <label className="block text-sm font-medium mb-1">Remarks (optional — auto-filled from computed results if left blank)</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
