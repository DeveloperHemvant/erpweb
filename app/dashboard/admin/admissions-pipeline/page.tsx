"use client";

import { useState, useEffect } from "react";
import { UserPlus, Plus, Phone, Mail } from "lucide-react";
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
const SOURCES = ["Walk-in", "Website", "Referral", "Phone", "Social Media", "Other"];
const STAGES = ["New", "Contacted", "Campus Visit Scheduled", "Application Sent", "Converted", "Lost"];

export default function AdmissionsPipelinePage() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ childName: "", gradeInterested: "", parentName: "", phone: "", email: "", source: "Walk-in", notes: "" });

  const [detail, setDetail] = useState<any | null>(null);
  const [followUpText, setFollowUpText] = useState("");

  const fetchAll = async () => {
    try { setInquiries(await api("/admission-inquiries")); } catch (e) { console.error(e); }
  };
  useEffect(() => { fetchAll(); }, []);

  const createInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/admission-inquiries", { method: "POST", body: JSON.stringify({ ...newForm, email: newForm.email || undefined }) });
      toast("Added", { description: "Inquiry logged", type: "success" });
      setNewOpen(false);
      setNewForm({ childName: "", gradeInterested: "", parentName: "", phone: "", email: "", source: "Walk-in", notes: "" });
      fetchAll();
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const openDetail = async (id: string) => {
    try { setDetail(await api(`/admission-inquiries/${id}`)); } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const moveStage = async (status: string) => {
    if (!detail) return;
    try {
      await api(`/admission-inquiries/${detail.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast("Updated", { type: "success" });
      setDetail({ ...detail, status });
      fetchAll();
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const addFollowUp = async () => {
    if (!detail || !followUpText.trim()) return;
    try {
      const f = await api(`/admission-inquiries/${detail.id}/followups`, { method: "POST", body: JSON.stringify({ note: followUpText }) });
      setDetail({ ...detail, followUps: [f, ...(detail.followUps || [])] });
      setFollowUpText("");
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const byStage = (stage: string) => inquiries.filter((i) => i.status === stage);
  const stageVariant = (s: string) => (s === "Converted" ? "success" : s === "Lost" ? "danger" : s === "New" ? "warning" : "neutral");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2"><UserPlus className="w-7 h-7 text-primary" /> Admissions Pipeline</h1>
          <p className="text-text-secondary mt-1">Track prospective families from first inquiry through to admission.</p>
        </div>
        <Button variant="primary" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Inquiry</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAGES.map((stage) => (
          <Card key={stage} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">{stage} <Badge variant={stageVariant(stage)}>{byStage(stage).length}</Badge></CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 pt-0">
              {byStage(stage).map((i: any) => (
                <button key={i.id} onClick={() => openDetail(i.id)} className="w-full text-left border rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <p className="text-xs font-semibold">{i.childName}</p>
                  <p className="text-[11px] text-text-secondary">{i.gradeInterested}</p>
                  <p className="text-[11px] text-text-secondary">{i.parentName}</p>
                </button>
              ))}
              {byStage(stage).length === 0 && <p className="text-[11px] text-text-secondary italic px-1">Empty</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={newOpen} onClose={() => setNewOpen(false)} title="New Admission Inquiry">
        <form className="space-y-4 pt-4" onSubmit={createInquiry}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Child's Name" required value={newForm.childName} onChange={(e) => setNewForm({ ...newForm, childName: e.target.value })} />
            <Input label="Grade Interested" required value={newForm.gradeInterested} onChange={(e) => setNewForm({ ...newForm, gradeInterested: e.target.value })} placeholder="e.g. Grade 6" />
          </div>
          <Input label="Parent Name" required value={newForm.parentName} onChange={(e) => setNewForm({ ...newForm, parentName: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" required value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} />
            <Input label="Email (optional)" type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} />
          </div>
          <Select label="Source" value={newForm.source} onChange={(e) => setNewForm({ ...newForm, source: e.target.value })} options={SOURCES.map((s) => opt(s, s))} />
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Inquiry</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? detail.childName : ""} size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="flex gap-2 items-center">
              <Badge variant={stageVariant(detail.status)}>{detail.status}</Badge>
              <span className="text-sm text-text-secondary">{detail.gradeInterested} · via {detail.source}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-text-secondary uppercase">Parent</p><p className="font-medium">{detail.parentName}</p></div>
              <div className="flex gap-4">
                <p className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" /> {detail.phone}</p>
                {detail.email && <p className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3" /> {detail.email}</p>}
              </div>
            </div>
            {detail.notes && <p className="text-sm text-text-secondary italic">&quot;{detail.notes}&quot;</p>}

            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <Button key={s} variant={detail.status === s ? "primary" : "outline"} size="sm" onClick={() => moveStage(s)} disabled={s === "Converted"}>{s}</Button>
              ))}
            </div>
            {detail.status !== "Converted" && (
              <p className="text-xs text-text-secondary">To convert to an enrolled student, register them via Student Admissions, then link this inquiry from there.</p>
            )}

            <div>
              <h4 className="font-semibold text-sm mb-2">Follow-ups</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {(detail.followUps || []).length === 0 ? (
                  <p className="text-xs text-text-secondary italic">No follow-ups logged yet.</p>
                ) : detail.followUps.map((f: any) => (
                  <div key={f.id} className="border rounded-lg p-3 text-sm bg-slate-50 dark:bg-slate-900">
                    <p>{f.note}</p>
                    <p className="text-xs text-text-secondary mt-1">{f.createdByStaff?.fullName} · {new Date(f.followUpDate).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={followUpText} onChange={(e) => setFollowUpText(e.target.value)} placeholder="Log a call, email, or visit..." />
                <Button variant="outline" onClick={addFollowUp}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
