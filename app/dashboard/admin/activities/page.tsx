"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { SearchSelect, SearchSelectOption } from "@/components/ui/search-select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { Trophy, Plus, Home, Pencil } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACHIEVEMENT_TYPES = ["ACADEMIC", "SPORTS", "MUSIC", "DANCE", "DEBATE", "OLYMPIAD"];
const ACHIEVEMENT_AWARDS = ["MEDAL", "TROPHY", "CERTIFICATE", "SCHOLARSHIP"];
const DUTY_TYPES = ["EXAM", "ASSEMBLY", "PTM", "SPORTS", "GATE", "BUS"];

// Extracts { data: [...] } or a flat array — this codebase's list endpoints
// use both shapes (paginated staff/students vs. plain activities lists).
function unwrapList(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

export default function ActivitiesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("assemblies");

  const [campuses, setCampuses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [duties, setDuties] = useState<any[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<SearchSelectOption | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  const [isAssemblyModalOpen, setIsAssemblyModalOpen] = useState(false);
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isHouseModalOpen, setIsHouseModalOpen] = useState(false);
  const [pointsHouse, setPointsHouse] = useState<any | null>(null);
  const [savingAchievement, setSavingAchievement] = useState(false);

  const [isEditHouseModalOpen, setIsEditHouseModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<any | null>(null);
  const [editCaptain, setEditCaptain] = useState<SearchSelectOption | null>(null);
  const [editViceCaptain, setEditViceCaptain] = useState<SearchSelectOption | null>(null);
  const [savingHouse, setSavingHouse] = useState(false);

  useEffect(() => {
    fetchLookups();
    fetchAssemblies();
    fetchHouses();
    fetchDuties();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchAchievements(selectedStudent.id);
      fetchStudentProfile(selectedStudent.id);
    } else {
      setAchievements([]);
      setSelectedStudentProfile(null);
    }
  }, [selectedStudent]);

  const fetchLookups = async () => {
    try {
      const [campRes, classRes, staffRes] = await Promise.all([
        fetch(`${API_URL}/master-data/campuses`),
        fetch(`${API_URL}/master-data/classes`),
        fetch(`${API_URL}/staff`),
      ]);
      if (campRes.ok) setCampuses(unwrapList(await campRes.json()));
      if (staffRes.ok) setStaffList(unwrapList(await staffRes.json()));
      if (classRes.ok) {
        const classes = unwrapList(await classRes.json());
        const flat = classes.flatMap((c: any) =>
          (c.sections || []).map((s: any) => ({ id: s.id, label: `${c.name} - ${s.name}` }))
        );
        setSections(flat);
      }
    } catch (e) {
      console.error("Error fetching activity lookups:", e);
    }
  };

  const fetchAssemblies = async () => {
    try {
      const res = await fetch(`${API_URL}/activities/assembly`);
      if (res.ok) setAssemblies(unwrapList(await res.json()));
    } catch {}
  };

  const fetchHouses = async () => {
    try {
      const res = await fetch(`${API_URL}/activities/houses/standings`);
      if (res.ok) setHouses(unwrapList(await res.json()));
    } catch {}
  };

  const fetchDuties = async () => {
    try {
      const res = await fetch(`${API_URL}/activities/duties`);
      if (res.ok) setDuties(unwrapList(await res.json()));
    } catch {}
  };

  const fetchAchievements = async (studentId: string) => {
    try {
      const res = await fetch(`${API_URL}/activities/students/${studentId}/achievements`);
      if (res.ok) setAchievements(unwrapList(await res.json()));
    } catch {}
  };

  const fetchStudentProfile = async (studentId: string) => {
    try {
      const res = await fetch(`${API_URL}/erp-core/students/${studentId}/profile`);
      if (res.ok) setSelectedStudentProfile(await res.json());
    } catch {}
  };

  const handleCreateHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    try {
      const res = await fetch(`${API_URL}/activities/houses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create house");
      }
      toast("House created", { type: "success" });
      setIsHouseModalOpen(false);
      fetchHouses();
    } catch (err: any) {
      toast(err.message || "Failed to create house", { type: "error" });
    }
  };

  const openEditHouse = (h: any) => {
    setEditingHouse(h);
    setEditCaptain(h.captain ? { id: h.captain.id, title: h.captain.fullName } : null);
    setEditViceCaptain(h.viceCaptain ? { id: h.viceCaptain.id, title: h.viceCaptain.fullName } : null);
    setIsEditHouseModalOpen(true);
  };

  const closeEditHouse = () => {
    setIsEditHouseModalOpen(false);
    setEditingHouse(null);
    setEditCaptain(null);
    setEditViceCaptain(null);
  };

  const handleUpdateHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHouse) return;
    const form = e.target as any;
    setSavingHouse(true);
    try {
      const res = await fetch(`${API_URL}/activities/houses/${editingHouse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.value,
          captainId: editCaptain?.id,
          viceCaptainId: editViceCaptain?.id,
          teacherInchargeId: form.teacherInchargeId.value || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update house");
      }
      toast("House updated", { type: "success" });
      closeEditHouse();
      fetchHouses();
    } catch (err: any) {
      toast(err.message || "Failed to update house", { type: "error" });
    } finally {
      setSavingHouse(false);
    }
  };

  const handleLogAssembly = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const notes = form.notes.value?.trim();
    try {
      const res = await fetch(`${API_URL}/activities/assembly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date.value,
          campusId: form.campusId.value,
          theme: form.theme.value,
          performingSectionId: form.performingSectionId.value,
          supervisingStaffId: form.supervisingStaffId.value,
          venue: form.venue.value,
          activities: notes ? [{ type: "SPEECH", details: notes }] : [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(Array.isArray(err.message) ? err.message.join(", ") : err.message || "Failed to log assembly");
      }
      toast("Assembly logged", { type: "success" });
      setIsAssemblyModalOpen(false);
      fetchAssemblies();
    } catch (err: any) {
      toast(err.message || "Failed to log assembly", { type: "error" });
    }
  };

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    try {
      const res = await fetch(`${API_URL}/activities/houses/${pointsHouse.id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: Number(form.points.value), reason: form.reason.value || undefined }),
      });
      if (!res.ok) throw new Error("Failed to award points");
      toast(`Points awarded to ${pointsHouse.name}`, { type: "success" });
      setIsPointsModalOpen(false);
      setPointsHouse(null);
      fetchHouses();
    } catch {
      toast("Failed to award points", { type: "error" });
    }
  };

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const form = e.target as any;
    setSavingAchievement(true);
    try {
      const res = await fetch(`${API_URL}/activities/achievements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          type: form.type.value,
          title: form.title.value,
          award: form.award.value,
        }),
      });
      if (!res.ok) throw new Error("Failed to record achievement");
      toast("Achievement recorded", { type: "success" });
      form.reset();
      fetchAchievements(selectedStudent.id);
    } catch {
      toast("Failed to record achievement", { type: "error" });
    } finally {
      setSavingAchievement(false);
    }
  };

  const handleAssignDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    try {
      const res = await fetch(`${API_URL}/activities/duties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: form.staffId.value,
          dutyType: form.dutyType.value,
          date: form.date.value,
          notes: form.notes.value || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to assign duty");
      toast("Duty assigned", { type: "success" });
      setIsDutyModalOpen(false);
      fetchDuties();
    } catch {
      toast("Failed to assign duty", { type: "error" });
    }
  };

  const tabs = [
    { id: "assemblies", label: "Morning Assemblies" },
    { id: "houses", label: "House Points" },
    { id: "achievements", label: "Achievements" },
    { id: "duties", label: "Staff Duties" },
  ];

  const staffLabel = (s: any) => s.fullName || s.name || s.email;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Co-Curricular & Activities</h1>
        <p className="text-text-secondary">Morning assemblies, house points, student achievements, and staff duty rosters.</p>
      </div>

      <Tabs options={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "assemblies" && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-between">
            <h3 className="text-xl font-semibold">Morning Assembly Log</h3>
            <Button variant="primary" onClick={() => setIsAssemblyModalOpen(true)}>Log Assembly</Button>
          </div>
          <div className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Campus</th>
                  <th className="px-4 py-3">Theme</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Supervising Staff</th>
                </tr>
              </thead>
              <tbody>
                {assemblies.length > 0 ? (
                  assemblies.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{a.campus?.name || "-"}</td>
                      <td className="px-4 py-3">{a.theme}</td>
                      <td className="px-4 py-3">{a.venue}</td>
                      <td className="px-4 py-3">{a.supervisingStaff?.fullName || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-text-secondary">No assemblies logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "houses" && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">House Standings</h3>
            <Button variant="outline" size="sm" onClick={() => setIsHouseModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> New House
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {houses.length > 0 ? (
              houses.map((h, i) => (
                <div key={h.id} className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-500" /> {h.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {h._count?.members ?? 0} members · Captain: {h.captain?.fullName || "-"} · Vice: {h.viceCaptain?.fullName || "-"} · Teacher: {h.teacherIncharge?.fullName || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">{h.points}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditHouse(h)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setPointsHouse(h); setIsPointsModalOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" /> Points
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-text-secondary text-sm">No school houses configured yet. Click "New House" to create the first one.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-semibold">Student Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm p-4 space-y-4 md:col-span-1">
              <SearchSelect
                label="Select Student"
                entityType="student"
                placeholder="Search by name or admission no..."
                value={selectedStudent}
                onChange={setSelectedStudent}
              />
              {selectedStudent && selectedStudentProfile && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary -mt-2">
                  <Home className="w-3.5 h-3.5" />
                  House: <span className="font-semibold text-text-primary">{selectedStudentProfile.house?.name || "Unassigned"}</span>
                </div>
              )}
              {selectedStudent && (
                <form className="space-y-3 pt-2 border-t border-border" onSubmit={handleAddAchievement}>
                  <p className="text-xs font-semibold text-text-secondary">Record New Achievement</p>
                  <Select label="Type" name="type" options={ACHIEVEMENT_TYPES.map((t) => ({ label: t, value: t }))} required />
                  <Input label="Title" name="title" placeholder="e.g. Inter-School Chess Championship" required />
                  <Select label="Award" name="award" options={ACHIEVEMENT_AWARDS.map((a) => ({ label: a, value: a }))} required />
                  <Button type="submit" variant="primary" className="w-full" disabled={savingAchievement}>
                    {savingAchievement ? "Saving..." : "Add Achievement"}
                  </Button>
                </form>
              )}
            </div>
            <div className="md:col-span-2 space-y-3">
              {!selectedStudent && (
                <p className="text-text-secondary text-sm">Search for a student to view or record their achievements.</p>
              )}
              {selectedStudent && achievements.length === 0 && (
                <p className="text-text-secondary text-sm">No achievements recorded for this student yet.</p>
              )}
              {achievements.map((ach) => (
                <div key={ach.id} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{ach.title}</p>
                    <p className="text-xs text-text-secondary">{ach.type} · Issued by {ach.issuedBy?.fullName || "-"}</p>
                  </div>
                  <span className="px-2 py-1 bg-amber-500/10 text-amber-600 rounded-md text-xs font-semibold">{ach.award}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "duties" && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-between">
            <h3 className="text-xl font-semibold">Staff Duty Roster</h3>
            <Button variant="primary" onClick={() => setIsDutyModalOpen(true)}>Assign Duty</Button>
          </div>
          <div className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Duty Type</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {duties.length > 0 ? (
                  duties.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium">{new Date(d.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{d.staff?.fullName || "-"}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-md text-xs">{d.dutyType}</span></td>
                      <td className="px-4 py-3 text-text-secondary">{d.notes || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-text-secondary">No duties assigned yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Assembly Modal */}
      <Modal isOpen={isAssemblyModalOpen} onClose={() => setIsAssemblyModalOpen(false)} title="Log Morning Assembly">
        <form className="space-y-4 pt-4" onSubmit={handleLogAssembly}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" name="date" type="date" required />
            <Select label="Campus" name="campusId" options={campuses.map((c) => ({ label: c.name, value: c.id }))} required />
          </div>
          <Input label="Theme" name="theme" placeholder="e.g. Honesty" required />
          <Select label="Performing Section" name="performingSectionId" options={sections.map((s) => ({ label: s.label, value: s.id }))} required />
          <Select label="Supervising Staff" name="supervisingStaffId" options={staffList.map((s) => ({ label: staffLabel(s), value: s.id }))} required />
          <Input label="Venue" name="venue" placeholder="e.g. Auditorium" required />
          <Textarea name="notes" rows={2} placeholder="Optional notes about the assembly (speech topic, performers, etc.)" />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAssemblyModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </Modal>

      {/* New House Modal */}
      <Modal isOpen={isHouseModalOpen} onClose={() => setIsHouseModalOpen(false)} title="Create School House">
        <form className="space-y-4 pt-4" onSubmit={handleCreateHouse}>
          <Input label="House Name" name="name" placeholder="e.g. Aravalli" required />
          <p className="text-xs text-text-secondary">Captain, vice-captain, and teacher-in-charge can be set later from the standings list.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsHouseModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Edit House Modal */}
      <Modal isOpen={isEditHouseModalOpen} onClose={closeEditHouse} title={`Edit House — ${editingHouse?.name || ""}`}>
        <form className="space-y-4 pt-4" onSubmit={handleUpdateHouse}>
          <Input label="House Name" name="name" defaultValue={editingHouse?.name} required />
          <SearchSelect label="Captain" entityType="student" placeholder="Search students..." value={editCaptain} onChange={setEditCaptain} />
          <SearchSelect label="Vice-Captain" entityType="student" placeholder="Search students..." value={editViceCaptain} onChange={setEditViceCaptain} />
          <Select
            label="Teacher-in-Charge"
            name="teacherInchargeId"
            defaultValue={editingHouse?.teacherInchargeId || ""}
            options={[{ label: "None", value: "" }, ...staffList.map((s) => ({ label: staffLabel(s), value: s.id }))]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={closeEditHouse}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingHouse}>{savingHouse ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </Modal>

      {/* Award Points Modal */}
      <Modal isOpen={isPointsModalOpen} onClose={() => setIsPointsModalOpen(false)} title={`Award Points — ${pointsHouse?.name || ""}`}>
        <form className="space-y-4 pt-4" onSubmit={handleAwardPoints}>
          <Input label="Points" name="points" type="number" placeholder="e.g. 10 (use negative to deduct)" required />
          <Input label="Reason (optional)" name="reason" placeholder="e.g. Inter-house quiz winner" />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPointsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Award</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Duty Modal */}
      <Modal isOpen={isDutyModalOpen} onClose={() => setIsDutyModalOpen(false)} title="Assign Staff Duty">
        <form className="space-y-4 pt-4" onSubmit={handleAssignDuty}>
          <Select label="Staff" name="staffId" options={staffList.map((s) => ({ label: staffLabel(s), value: s.id }))} required />
          <Select label="Duty Type" name="dutyType" options={DUTY_TYPES.map((t) => ({ label: t, value: t }))} required />
          <Input label="Date" name="date" type="date" required />
          <Input label="Notes (optional)" name="notes" placeholder="e.g. Main gate, morning shift" />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDutyModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
