"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

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
const CATEGORIES = ["Bullying", "Disruption", "Academic Dishonesty", "Property Damage", "Attendance", "Other"];
const SEVERITIES = ["Minor", "Moderate", "Major"];
const ACTIONS = ["Verbal Warning", "Written Warning", "Detention", "Suspension", "Parent Meeting", "Counseling Referral"];
const STATUSES = ["Open", "Resolved", "Escalated"];

export default function DisciplinePage() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ studentId: "", category: "Disruption", severity: "Minor", description: "", actionTaken: "Verbal Warning", notifyParent: true });

  const [detail, setDetail] = useState<any | null>(null);
  const [noteText, setNoteText] = useState("");

  const fetchAll = async () => {
    try {
      const [inc, stu] = await Promise.all([api("/discipline/incidents"), api("/erp-core/students")]);
      setIncidents(inc);
      setStudents(stu.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAll(); }, []);

  const createIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { studentId, ...rest } = newForm;
      await api(`/discipline/students/${studentId}/incidents`, { method: "POST", body: JSON.stringify(rest) });
      toast("Recorded", { description: "Discipline incident logged", type: "success" });
      setNewOpen(false);
      setNewForm({ studentId: "", category: "Disruption", severity: "Minor", description: "", actionTaken: "Verbal Warning", notifyParent: true });
      fetchAll();
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const openDetail = async (studentId: string, incidentId: string) => {
    try {
      const full = await api(`/discipline/students/${studentId}/incidents`);
      setDetail(full.find((i: any) => i.id === incidentId));
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const updateStatus = async (status: string) => {
    if (!detail) return;
    try {
      await api(`/discipline/incidents/${detail.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast("Updated", { type: "success" });
      setDetail({ ...detail, status });
      fetchAll();
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const addNote = async () => {
    if (!detail || !noteText.trim()) return;
    try {
      const note = await api(`/discipline/incidents/${detail.id}/notes`, { method: "POST", body: JSON.stringify({ note: noteText }) });
      setDetail({ ...detail, counselingNotes: [...(detail.counselingNotes || []), note] });
      setNoteText("");
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const filtered = statusFilter ? incidents.filter((i) => i.status === statusFilter) : incidents;
  const studentOptions = students.map((s) => opt(`${s.fullName} (${s.admissionNumber})`, s.id));

  const severityVariant = (s: string) => (s === "Major" ? "danger" : s === "Moderate" ? "warning" : "neutral");
  const statusVariant = (s: string) => (s === "Escalated" ? "danger" : s === "Resolved" ? "success" : "warning");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2"><ShieldAlert className="w-7 h-7 text-warning" /> Discipline &amp; Behavior</h1>
          <p className="text-text-secondary mt-1">Incident log, follow-up actions, and confidential counseling notes.</p>
        </div>
        <Button variant="primary" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-2" /> Log Incident</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Incidents</CardTitle><CardDescription>{filtered.length} of {incidents.length} shown</CardDescription></div>
          <div className="w-48"><Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[opt("All statuses", ""), ...STATUSES.map((s) => opt(s, s))]} /></div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">No incidents.</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((i: any) => (
                    <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-medium">{i.student?.fullName}</td>
                      <td className="px-4 py-3 text-text-secondary">{i.category}</td>
                      <td className="px-4 py-3"><Badge variant={severityVariant(i.severity)}>{i.severity}</Badge></td>
                      <td className="px-4 py-3 text-text-secondary">{new Date(i.incidentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Badge variant={statusVariant(i.status)}>{i.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => openDetail(i.studentId, i.id)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={newOpen} onClose={() => setNewOpen(false)} title="Log Discipline Incident">
        <form className="space-y-4 pt-4" onSubmit={createIncident}>
          <Select label="Student" required value={newForm.studentId} onChange={(e) => setNewForm({ ...newForm, studentId: e.target.value })} options={[opt("Select student...", ""), ...studentOptions]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value })} options={CATEGORIES.map((c) => opt(c, c))} />
            <Select label="Severity" value={newForm.severity} onChange={(e) => setNewForm({ ...newForm, severity: e.target.value })} options={SEVERITIES.map((s) => opt(s, s))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required rows={3} value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} />
          </div>
          <Select label="Action Taken" value={newForm.actionTaken} onChange={(e) => setNewForm({ ...newForm, actionTaken: e.target.value })} options={ACTIONS.map((a) => opt(a, a))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={newForm.notifyParent} onChange={(e) => setNewForm({ ...newForm, notifyParent: e.target.checked })} />
            Notify parent
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Log Incident</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.student?.fullName} — ${detail.category}` : ""} size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="flex gap-2">
              <Badge variant={severityVariant(detail.severity)}>{detail.severity}</Badge>
              <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
            </div>
            <p className="text-sm">{detail.description}</p>
            <p className="text-xs text-text-secondary">Reported by {detail.reportedByStaff?.fullName} on {new Date(detail.incidentDate).toLocaleString()}</p>

            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <Button key={s} variant={detail.status === s ? "primary" : "outline"} size="sm" onClick={() => updateStatus(s)}>{s}</Button>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Confidential Counseling Notes</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {(detail.counselingNotes || []).length === 0 ? (
                  <p className="text-xs text-text-secondary italic">No notes yet.</p>
                ) : detail.counselingNotes.map((n: any) => (
                  <div key={n.id} className="border rounded-lg p-3 text-sm bg-slate-50 dark:bg-slate-900">
                    <p>{n.note}</p>
                    <p className="text-xs text-text-secondary mt-1">{n.createdByStaff?.fullName} · {new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a counseling note..." />
                <Button variant="outline" onClick={addNote}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
