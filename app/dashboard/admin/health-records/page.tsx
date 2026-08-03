"use client";

import { useState, useEffect } from "react";
import { HeartPulse, Plus, Search, Syringe, Clock } from "lucide-react";
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

const ACTION_OPTIONS = ["Observed and Released", "Sent Home", "Referred to Doctor", "Hospitalized"];

export default function HealthRecordsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("today");

  const [students, setStudents] = useState<any[]>([]);
  const [todayVisits, setTodayVisits] = useState<any[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({ reason: "", symptoms: "", temperature: "", treatmentGiven: "", actionTaken: "Observed and Released", notifyParent: true });
  const [vaccineOpen, setVaccineOpen] = useState(false);
  const [vaccineForm, setVaccineForm] = useState({ vaccineName: "", doseNumber: "1", dateAdministered: "", nextDueDate: "", administeredBy: "" });

  const fetchStudents = async () => {
    try {
      const res = await api("/erp-core/students");
      setStudents(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchToday = async () => {
    try { setTodayVisits(await api("/health-records/visits/today")); } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStudents(); fetchToday(); }, []);

  const loadStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);
    if (!studentId) { setProfile(null); setVisits([]); setVaccinations([]); return; }
    try {
      const [p, v, vac] = await Promise.all([
        api(`/health-records/students/${studentId}/profile`),
        api(`/health-records/students/${studentId}/visits`),
        api(`/health-records/students/${studentId}/vaccinations`),
      ]);
      setProfile(p);
      setVisits(v);
      setVaccinations(vac);
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const openProfileEditor = () => {
    setProfileForm(profile || {});
    setProfileOpen(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/health-records/students/${selectedStudentId}/profile`, { method: "POST", body: JSON.stringify(profileForm) });
      toast("Saved", { description: "Health profile updated", type: "success" });
      setProfileOpen(false);
      loadStudent(selectedStudentId);
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const logVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/health-records/students/${selectedStudentId}/visits`, {
        method: "POST",
        body: JSON.stringify({ ...visitForm, temperature: visitForm.temperature ? Number(visitForm.temperature) : undefined }),
      });
      toast("Logged", { description: "Health centre visit recorded", type: "success" });
      setVisitOpen(false);
      setVisitForm({ reason: "", symptoms: "", temperature: "", treatmentGiven: "", actionTaken: "Observed and Released", notifyParent: true });
      loadStudent(selectedStudentId);
      fetchToday();
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const addVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/health-records/students/${selectedStudentId}/vaccinations`, { method: "POST", body: JSON.stringify(vaccineForm) });
      toast("Added", { description: "Vaccination record added", type: "success" });
      setVaccineOpen(false);
      setVaccineForm({ vaccineName: "", doseNumber: "1", dateAdministered: "", nextDueDate: "", administeredBy: "" });
      loadStudent(selectedStudentId);
    } catch (e: any) { toast("Error", { description: e.message, type: "error" }); }
  };

  const studentOptions = students.map((s) => opt(`${s.fullName} (${s.admissionNumber})`, s.id));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2"><HeartPulse className="w-7 h-7 text-danger" /> Health Centre</h1>
        <p className="text-text-secondary mt-1">Student medical profiles, nurse visit log, and vaccination records.</p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "today", label: "Today's Visits", icon: <Clock className="w-4 h-4" /> },
          { id: "student", label: "Student Record", icon: <Search className="w-4 h-4" /> },
        ]}
      />

      {activeTab === "today" && (
        <Card>
          <CardHeader><CardTitle>Today&apos;s Health Centre Visits</CardTitle><CardDescription>{todayVisits.length} visit(s) logged today</CardDescription></CardHeader>
          <CardContent>
            {todayVisits.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">No visits logged today.</div>
            ) : (
              <div className="divide-y divide-border">
                {todayVisits.map((v: any) => (
                  <div key={v.id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-medium text-sm">{v.student?.fullName}</p>
                      <p className="text-xs text-text-secondary">{v.reason} · by {v.loggedByStaff?.fullName}</p>
                    </div>
                    <Badge variant={v.actionTaken === "Hospitalized" ? "danger" : v.actionTaken === "Referred to Doctor" ? "warning" : "neutral"}>{v.actionTaken}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "student" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Select label="Select Student" value={selectedStudentId} onChange={(e) => loadStudent(e.target.value)} options={[opt("Select a student...", ""), ...studentOptions]} />
            </CardContent>
          </Card>

          {selectedStudentId && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>Medical Profile</CardTitle><CardDescription>Blood group, allergies, emergency contacts</CardDescription></div>
                  <Button variant="outline" size="sm" onClick={openProfileEditor}>{profile ? "Edit" : "Create"} Profile</Button>
                </CardHeader>
                <CardContent>
                  {!profile ? (
                    <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No health profile on file yet.</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-xs text-text-secondary uppercase">Blood Group</p><p className="font-medium">{profile.bloodGroup || "—"}</p></div>
                      <div><p className="text-xs text-text-secondary uppercase">Allergies</p><p className="font-medium">{profile.allergies || "None recorded"}</p></div>
                      <div><p className="text-xs text-text-secondary uppercase">Chronic Conditions</p><p className="font-medium">{profile.chronicConditions || "None recorded"}</p></div>
                      <div><p className="text-xs text-text-secondary uppercase">Current Medications</p><p className="font-medium">{profile.currentMedications || "None"}</p></div>
                      <div><p className="text-xs text-text-secondary uppercase">Emergency Contact</p><p className="font-medium">{profile.emergencyContactName} · {profile.emergencyContactPhone}</p></div>
                      <div><p className="text-xs text-text-secondary uppercase">Family Doctor</p><p className="font-medium">{profile.familyDoctorName || "—"} · {profile.familyDoctorPhone || ""}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>Visit History</CardTitle><CardDescription>{visits.length} visit(s) on record</CardDescription></div>
                  <Button variant="primary" size="sm" onClick={() => setVisitOpen(true)}><Plus className="w-4 h-4 mr-1" /> Log Visit</Button>
                </CardHeader>
                <CardContent>
                  {visits.length === 0 ? (
                    <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No visits recorded.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {visits.map((v: any) => (
                        <div key={v.id} className="py-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{v.reason}</p>
                              <p className="text-xs text-text-secondary">{new Date(v.visitDate).toLocaleString()} · logged by {v.loggedByStaff?.fullName}</p>
                              {v.treatmentGiven && <p className="text-xs text-text-secondary mt-1">Treatment: {v.treatmentGiven}</p>}
                            </div>
                            <Badge variant={v.actionTaken === "Hospitalized" ? "danger" : v.actionTaken === "Referred to Doctor" ? "warning" : "neutral"}>{v.actionTaken}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle className="flex items-center gap-2"><Syringe className="w-4 h-4" /> Vaccinations</CardTitle><CardDescription>{vaccinations.length} record(s)</CardDescription></div>
                  <Button variant="outline" size="sm" onClick={() => setVaccineOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Record</Button>
                </CardHeader>
                <CardContent>
                  {vaccinations.length === 0 ? (
                    <div className="p-6 text-center border border-dashed rounded-lg text-text-secondary text-sm">No vaccinations on record.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {vaccinations.map((v: any) => (
                        <div key={v.id} className="flex justify-between items-center py-2.5">
                          <div>
                            <p className="font-medium text-sm">{v.vaccineName} <span className="text-text-secondary text-xs">Dose {v.doseNumber}</span></p>
                            <p className="text-xs text-text-secondary">Administered {new Date(v.dateAdministered).toLocaleDateString()}{v.nextDueDate ? ` · Next due ${new Date(v.nextDueDate).toLocaleDateString()}` : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="Health Profile" size="lg">
        <form className="space-y-4 pt-4" onSubmit={saveProfile}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Blood Group" value={profileForm.bloodGroup || ""} onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })} />
            <Input label="Insurance Provider" value={profileForm.insuranceProvider || ""} onChange={(e) => setProfileForm({ ...profileForm, insuranceProvider: e.target.value })} />
          </div>
          <Input label="Allergies" value={profileForm.allergies || ""} onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })} />
          <Input label="Chronic Conditions" value={profileForm.chronicConditions || ""} onChange={(e) => setProfileForm({ ...profileForm, chronicConditions: e.target.value })} />
          <Input label="Current Medications" value={profileForm.currentMedications || ""} onChange={(e) => setProfileForm({ ...profileForm, currentMedications: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency Contact Name" value={profileForm.emergencyContactName || ""} onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })} />
            <Input label="Emergency Contact Phone" value={profileForm.emergencyContactPhone || ""} onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Family Doctor Name" value={profileForm.familyDoctorName || ""} onChange={(e) => setProfileForm({ ...profileForm, familyDoctorName: e.target.value })} />
            <Input label="Family Doctor Phone" value={profileForm.familyDoctorPhone || ""} onChange={(e) => setProfileForm({ ...profileForm, familyDoctorPhone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={visitOpen} onClose={() => setVisitOpen(false)} title="Log Health Centre Visit">
        <form className="space-y-4 pt-4" onSubmit={logVisit}>
          <Input label="Reason" required value={visitForm.reason} onChange={(e) => setVisitForm({ ...visitForm, reason: e.target.value })} />
          <Input label="Symptoms" value={visitForm.symptoms} onChange={(e) => setVisitForm({ ...visitForm, symptoms: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Temperature (°F)" type="number" step="0.1" value={visitForm.temperature} onChange={(e) => setVisitForm({ ...visitForm, temperature: e.target.value })} />
            <Select label="Action Taken" value={visitForm.actionTaken} onChange={(e) => setVisitForm({ ...visitForm, actionTaken: e.target.value })} options={ACTION_OPTIONS.map((a) => opt(a, a))} />
          </div>
          <Input label="Treatment Given" value={visitForm.treatmentGiven} onChange={(e) => setVisitForm({ ...visitForm, treatmentGiven: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visitForm.notifyParent} onChange={(e) => setVisitForm({ ...visitForm, notifyParent: e.target.checked })} />
            Notify parent
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setVisitOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Log Visit</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={vaccineOpen} onClose={() => setVaccineOpen(false)} title="Add Vaccination Record">
        <form className="space-y-4 pt-4" onSubmit={addVaccination}>
          <Input label="Vaccine Name" required value={vaccineForm.vaccineName} onChange={(e) => setVaccineForm({ ...vaccineForm, vaccineName: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Dose Number" type="number" value={vaccineForm.doseNumber} onChange={(e) => setVaccineForm({ ...vaccineForm, doseNumber: e.target.value })} />
            <Input label="Administered By" value={vaccineForm.administeredBy} onChange={(e) => setVaccineForm({ ...vaccineForm, administeredBy: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date Administered" type="date" required value={vaccineForm.dateAdministered} onChange={(e) => setVaccineForm({ ...vaccineForm, dateAdministered: e.target.value })} />
            <Input label="Next Due Date" type="date" value={vaccineForm.nextDueDate} onChange={(e) => setVaccineForm({ ...vaccineForm, nextDueDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setVaccineOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
