"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Wand2,
  Clock,
  User,
  BookOpen,
  ArrowRight,
  Loader2,
  CheckCircle,
  UserSearch,
  X
} from "lucide-react";

interface PeriodSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

interface Allocation {
  id: string;
  staffId: string;
  sectionId: string | null;
  subjectId: string | null;
  status: string;
  staff?: { id: string; fullName: string };
  subject?: { id: string; name: string };
}

interface TimetableCell {
  periodId: string;
  assignmentId: string;
  subjectId: string | null;
  subject: string;
  teacher: string;
  room: string;
}

export default function TimetablePage() {
  const { toast } = useToast();

  // 1. Multiple Timetables State
  const [activeTimetableId, setActiveTimetableId] = useState("");
  const [timetables, setTimetables] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const res = await fetch(`${API_URL}/erp-core/timetables`);
        const data = await res.json();
        setTimetables(data);
        if (data.length > 0) {
          setActiveTimetableId(data[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch timetables", e);
      }
    };
    fetchTimetables();
  }, [API_URL]);

  // 2. Period Slots State
  const [periods, setPeriods] = useState<PeriodSlot[]>([]);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({ name: "", startTime: "", endTime: "", isBreak: false });
  const [activeSessionId, setActiveSessionId] = useState("");

  const fetchPeriods = async () => {
    try {
      const pRes = await fetch(`${API_URL}/erp-core/timetable-slots`);
      if (pRes.ok) {
        setPeriods(await pRes.json());
      }
      const sRes = await fetch(`${API_URL}/master-data/sessions`);
      if (sRes.ok) {
        const sData = await sRes.json();
        const active = sData.find((s: any) => s.isActive);
        setActiveSessionId(active ? active.id : sData[0]?.id || "");
      }
    } catch (e) {
      console.error("Failed to load periods", e);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [API_URL]);

  // 3. Teacher Allocations (drives the manual assignment dropdown)
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const res = await fetch(`${API_URL}/master-data/allocations`);
        if (res.ok) setAllocations(await res.json());
      } catch (e) {
        console.error("Failed to load teacher allocations", e);
      }
    };
    fetchAllocations();
  }, [API_URL]);

  // 4. Grid Class Schedule State
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [classOptions, setClassOptions] = useState<{ label: string; value: string }[]>([]);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Grid Data Store: Day -> SlotId -> Assignment
  const [scheduleGrid, setScheduleGrid] = useState<Record<string, Record<string, TimetableCell>>>({});

  // Fetch classes & sections for dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${API_URL}/master-data/classes`);
        if (!res.ok) return;
        const data = await res.json();

        const options: { label: string; value: string }[] = [];
        data.forEach((c: any) => {
          c.sections?.forEach((s: any) => {
            options.push({
              label: `Grade ${c.grade} - ${s.name}`,
              value: s.id
            });
          });
        });

        setClassOptions(options);
        if (options.length > 0) {
          setSelectedSectionId(options[0].value);
        }
      } catch (e) {
        console.error("Failed to load classes", e);
      }
    };
    fetchClasses();
  }, [API_URL]);

  const fetchGridPeriods = async () => {
    try {
      const res = await fetch(`${API_URL}/erp-core/timetable-periods`);
      if (!res.ok) return;
      const data = await res.json();

      const newGrid: Record<string, Record<string, TimetableCell>> = {};
      days.forEach(d => newGrid[d] = {});

      data.forEach((p: any) => {
        if (p.timetableId === activeTimetableId && p.sectionId === selectedSectionId) {
          const slot = periods.find(sp => sp.startTime === p.startTime);
          if (slot && newGrid[p.dayOfWeek]) {
            newGrid[p.dayOfWeek][slot.id] = {
              periodId: p.id,
              assignmentId: p.assignmentId,
              subjectId: p.subjectId,
              subject: p.subject?.name || "Class Teacher",
              teacher: p.assignment?.staff?.fullName || "Unassigned",
              room: p.room || "",
            };
          }
        }
      });

      setScheduleGrid(newGrid);
    } catch (e) {
      console.error("Failed to load grid periods", e);
    }
  };

  useEffect(() => {
    if (activeTimetableId && periods.length > 0 && selectedSectionId) {
      fetchGridPeriods();
    }
  }, [activeTimetableId, selectedSectionId, API_URL, periods]);

  // 5. Auto Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // 6. Grid Cell Editor Modal States
  const [isEditCellOpen, setIsEditCellOpen] = useState(false);
  const [editingCellCoords, setEditingCellCoords] = useState<{ day: string; slotId: string } | null>(null);
  const [editAssignmentId, setEditAssignmentId] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [isSavingCell, setIsSavingCell] = useState(false);

  // 7. Substitute Finder Modal States
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subSuggestions, setSubSuggestions] = useState<any[]>([]);
  const [subContext, setSubContext] = useState<{ day: string; subject: string } | null>(null);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

  const selectedSectionLabel = classOptions.find(o => o.value === selectedSectionId)?.label || "";

  // Handler functions
  const handleAddNewTimetable = async () => {
    const name = prompt("Enter Timetable Name:");
    if (!name || !activeSessionId) return;
    try {
      const res = await fetch(`${API_URL}/erp-core/timetables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sessionId: activeSessionId })
      });
      if (res.ok) {
        const newT = await res.json();
        setTimetables((prev) => [newT, ...prev]);
        setActiveTimetableId(newT.id);
        toast("Timetable Created", { description: `"${name}" added as a draft.`, type: "success" });
      }
    } catch {
      toast("Error", { description: "Failed to create timetable.", type: "error" });
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/erp-core/timetable-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...slotForm, sessionId: activeSessionId })
      });
      if (res.ok) {
        toast("Slot Type Added", { type: "success" });
        setIsSlotModalOpen(false);
        setSlotForm({ name: "", startTime: "", endTime: "", isBreak: false });
        fetchPeriods();
      }
    } catch {
      toast("Error", { type: "error" });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`${API_URL}/erp-core/timetable-slots/${slotId}`, { method: "DELETE" });
      if (res.ok) {
        setPeriods((prev) => prev.filter((item) => item.id !== slotId));
        toast("Slot Deleted", { type: "warning" });
      } else {
        toast("Error", { description: "Failed to delete slot.", type: "error" });
      }
    } catch {
      toast("Error", { description: "Failed to delete slot.", type: "error" });
    }
  };

  const handleOpenCellEdit = (day: string, slotId: string) => {
    const current = scheduleGrid[day]?.[slotId];
    setEditingCellCoords({ day, slotId });
    setEditAssignmentId(current?.assignmentId || "");
    setEditRoom(current?.room || selectedSectionLabel);
    setIsEditCellOpen(true);
  };

  const handleSaveCellAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCellCoords || !activeTimetableId) return;

    const { day, slotId } = editingCellCoords;
    const slot = periods.find((p) => p.id === slotId);
    if (!slot) return;

    if (!editAssignmentId) {
      toast("Validation Error", { description: "Select a teacher assignment.", type: "error" });
      return;
    }
    if (!editRoom.trim()) {
      toast("Validation Error", { description: "Enter a room.", type: "error" });
      return;
    }

    const chosen = allocations.find((a) => a.id === editAssignmentId);
    if (!chosen || !chosen.subjectId) {
      toast("Validation Error", { description: "This assignment has no subject linked; pick another.", type: "error" });
      return;
    }

    setIsSavingCell(true);
    try {
      const res = await fetch(`${API_URL}/erp-core/timetable-periods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timetableId: activeTimetableId,
          sectionId: selectedSectionId,
          subjectId: chosen.subjectId,
          assignmentId: chosen.id,
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: editRoom.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast("Assignment Failed", {
          description: err.message || "This teacher may already be booked during this period.",
          type: "error",
        });
        return;
      }

      const newPeriod = await res.json();

      // Only remove the previous assignment for this cell after the new one is confirmed,
      // so a failed save never leaves the cell empty.
      const existingCell = scheduleGrid[day]?.[slotId];
      if (existingCell?.periodId) {
        await fetch(`${API_URL}/erp-core/timetable-periods/${existingCell.periodId}`, { method: "DELETE" });
      }

      setScheduleGrid((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [slotId]: {
            periodId: newPeriod.id,
            assignmentId: newPeriod.assignmentId,
            subjectId: newPeriod.subjectId,
            subject: newPeriod.subject?.name || chosen.subject?.name || "Class Teacher",
            teacher: newPeriod.assignment?.staff?.fullName || chosen.staff?.fullName || "Unassigned",
            room: newPeriod.room,
          },
        },
      }));

      setIsEditCellOpen(false);
      toast("Schedule Updated", { description: `Assigned ${chosen.subject?.name || "Class Teacher"} to ${day}.`, type: "success" });
    } catch {
      toast("Error", { description: "Network error while saving the assignment.", type: "error" });
    } finally {
      setIsSavingCell(false);
    }
  };

  const handleClearCellAssignment = async () => {
    if (!editingCellCoords) return;
    const { day, slotId } = editingCellCoords;
    const existingCell = scheduleGrid[day]?.[slotId];
    if (!existingCell?.periodId) {
      setIsEditCellOpen(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/erp-core/timetable-periods/${existingCell.periodId}`, { method: "DELETE" });
      if (res.ok) {
        setScheduleGrid((prev) => {
          const dayCopy = { ...prev[day] };
          delete dayCopy[slotId];
          return { ...prev, [day]: dayCopy };
        });
        toast("Assignment Cleared", { type: "warning" });
      } else {
        toast("Error", { description: "Failed to clear this assignment.", type: "error" });
      }
    } catch {
      toast("Error", { description: "Failed to clear this assignment.", type: "error" });
    }
    setIsEditCellOpen(false);
  };

  const handleFindSubstitute = async (day: string, slot: PeriodSlot, cell: TimetableCell) => {
    if (!cell.subjectId) {
      toast("Not Available", { description: "Substitute lookup needs a subject-linked period.", type: "info" });
      return;
    }

    setIsSubModalOpen(true);
    setIsLoadingSubs(true);
    setSubContext({ day, subject: cell.subject });
    setSubSuggestions([]);

    try {
      const params = new URLSearchParams({
        dayOfWeek: day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectId: cell.subjectId,
      });
      const res = await fetch(`${API_URL}/erp-core/substitutes?${params.toString()}`);
      if (res.ok) {
        setSubSuggestions(await res.json());
      } else {
        toast("Error", { description: "Failed to fetch substitute suggestions.", type: "error" });
      }
    } catch {
      toast("Error", { description: "Failed to fetch substitute suggestions.", type: "error" });
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const handleSeedSlots = async () => {
    if (!activeSessionId) return;
    try {
      const res = await fetch(`${API_URL}/erp-core/timetable-slots/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId })
      });
      if (res.ok) {
        toast("Slots Seeded", { description: "Default periods and breaks populated.", type: "success" });
        fetchPeriods();
      }
    } catch {
      toast("Error", { description: "Failed to seed slots.", type: "error" });
    }
  };

  const triggerAutoGenerator = async () => {
    if (!activeTimetableId) {
      toast("Error", { description: "Select or create a timetable first.", type: "error" });
      return;
    }
    setIsGenerating(true);
    setGenProgress(20);

    try {
      const res = await fetch(`${API_URL}/erp-core/timetables/${activeTimetableId}/auto-generate`, {
        method: "POST"
      });
      setGenProgress(80);
      if (res.ok) {
        toast("Timetable Auto-Generated", { description: "Conflict checks completed successfully.", type: "success" });
        // Re-fetch periods to refresh grid
        fetchGridPeriods();
      } else {
        toast("Generation Failed", { description: "Failed to generate timetable.", type: "error" });
      }
    } catch (e) {
      toast("Error", { type: "error" });
    }
    setGenProgress(100);
    setTimeout(() => {
      setIsGenerating(false);
      setGenProgress(0);
    }, 500);
  };

  const sectionAssignmentOptions = allocations
    .filter((a) => a.sectionId === selectedSectionId && a.subjectId && a.status !== "Inactive")
    .map((a) => ({
      label: `${a.subject?.name || "Subject"} - ${a.staff?.fullName || "Unknown"}`,
      value: a.id,
    }));

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Time &amp; Lecture Scheduler
          </h1>
          <p className="text-sm text-text-secondary">
            Manage period durations, configure activities, and execute conflict-free scheduling runs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<Wand2 className="h-4.5 w-4.5" />} onClick={handleSeedSlots}>
            Seed Default Slots
          </Button>
          <Button variant="outline" leftIcon={<Plus className="h-4.5 w-4.5" />} onClick={() => setIsSlotModalOpen(true)}>
            Add Slot Type
          </Button>
          <Button variant="outline" leftIcon={<Wand2 className="h-4.5 w-4.5" />} onClick={triggerAutoGenerator} disabled={isGenerating}>
            {isGenerating ? "Running Auto-Schedule..." : "Auto-Generate Timetable"}
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4.5 w-4.5" />} onClick={handleAddNewTimetable}>
            Create Timetable
          </Button>
        </div>
      </div>

      {/* Auto Generation Progress Banner */}
      {isGenerating && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-card space-y-2">
          <div className="flex justify-between text-xs font-semibold text-primary">
            <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing teacher workloads and subject mappings...</span>
            <span>{genProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-200" style={{ width: `${genProgress}%` }} />
          </div>
        </div>
      )}

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Left Control Column */}
        <aside className="xl:col-span-1 space-y-4">

          {/* Active Timetable Manager */}
          <Card>
            <CardHeader>
              <CardTitle>Timetable Version</CardTitle>
              <CardDescription>Select active calendar rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {timetables.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTimetableId(t.id);
                    toast(`Loaded ${t.name}`, { type: "info" });
                  }}
                  className={`p-2.5 rounded-btn border text-left cursor-pointer transition-colors flex justify-between items-center ${activeTimetableId === t.id
                      ? "bg-primary/5 border-primary"
                      : "bg-card border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-text-primary">{t.name}</p>
                    <p className="text-[10px] text-text-secondary">ID: {t.id}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant={t.status === "Active" ? "success" : "neutral"}>
                      {t.status}
                    </Badge>
                    {t.status !== "Active" && activeTimetableId === t.id && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const res = await fetch(`${API_URL}/erp-core/timetables/${t.id}/activate`, { method: "PATCH" });
                          if (res.ok) {
                            setTimetables(timetables.map(x => ({ ...x, status: x.id === t.id ? "Active" : "Draft" })));
                            toast("Timetable Activated", { type: "success" });
                          }
                        }}
                        className="text-[9px] text-primary hover:underline font-medium"
                      >
                        Set Active
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Period Config Editor */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <div>
                <CardTitle>Daily Slot Setup</CardTitle>
                <CardDescription>Set durations &amp; breaks.</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsSlotModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {periods.map((p) => (
                <div key={p.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-border rounded-btn flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-text-primary">{p.name}</p>
                    <p className="text-[10px] text-text-secondary flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {p.startTime} - {p.endTime}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSlot(p.id)}
                    className="text-text-secondary hover:text-danger p-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Right Timetable Visualizer Grid Column */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Visual Schedule Grid</CardTitle>
                <CardDescription>Click inside a cell to assign or reassign a teacher; hover an assigned cell to find a substitute.</CardDescription>
              </div>
              <Select
                label="Class &amp; Section Selector"
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  const label = classOptions.find(o => o.value === e.target.value)?.label;
                  toast(`Viewing ${label}`, { type: "info" });
                }}
                options={classOptions}
              />
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-border rounded-card border-collapse overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-border">
                    <th className="p-2.5 font-semibold text-text-secondary border-r border-border w-24">Day</th>
                    {periods.map((p) => (
                      <th key={p.id} className="p-2.5 font-semibold text-text-secondary text-center min-w-[120px] border-r last:border-0 border-border">
                        <div>{p.name}</div>
                        <div className="text-[9px] font-normal text-text-secondary mt-0.5">{p.startTime} - {p.endTime}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="p-2.5 font-bold text-text-primary border-r border-border bg-slate-50/20 dark:bg-slate-800/10">{day}</td>
                      {periods.map((p) => {
                        const cell = scheduleGrid[day]?.[p.id];
                        if (p.isBreak) {
                          return (
                            <td key={p.id} className="p-2.5 text-center bg-slate-100/50 dark:bg-slate-900/40 text-text-secondary italic font-medium border-r last:border-0 border-border select-none">
                              {p.name}
                            </td>
                          );
                        }
                        return (
                          <td
                            key={p.id}
                            onClick={() => handleOpenCellEdit(day, p.id)}
                            className="p-2.5 text-center border-r last:border-0 border-border cursor-pointer hover:bg-primary/5 transition-colors group relative"
                          >
                            {cell ? (
                              <div className="space-y-1">
                                <p className="font-semibold text-primary">{cell.subject}</p>
                                <p className="text-[10px] text-text-secondary flex items-center justify-center gap-1">
                                  <User className="h-2.5 w-2.5" /> {cell.teacher}
                                </p>
                                {cell.room && (
                                  <p className="text-[9px] text-text-secondary/70">{cell.room}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">Unassigned</span>
                            )}
                            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {cell && (
                                <button
                                  title="Find substitute"
                                  onClick={(e) => { e.stopPropagation(); handleFindSubstitute(day, p, cell); }}
                                  className="text-text-secondary hover:text-primary"
                                >
                                  <UserSearch className="h-3 w-3" />
                                </button>
                              )}
                              <Edit2 className="h-3 w-3 text-text-secondary" />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grid Cell Editor Modal */}
      <Modal isOpen={isEditCellOpen} onClose={() => setIsEditCellOpen(false)} title={`Reassign Allocation: ${editingCellCoords?.day}`}>
        <form onSubmit={handleSaveCellAssignment} className="space-y-5">
          <Select
            label="Teacher Assignment"
            value={editAssignmentId}
            onChange={(e) => setEditAssignmentId(e.target.value)}
            options={sectionAssignmentOptions.length > 0 ? sectionAssignmentOptions : [{ label: "No assignments for this section", value: "" }]}
          />
          <Input
            label="Room"
            placeholder="Room 102"
            required
            value={editRoom}
            onChange={(e) => setEditRoom(e.target.value)}
          />

          <div className="flex justify-between gap-3 pt-4 border-t border-border mt-4">
            {editingCellCoords && scheduleGrid[editingCellCoords.day]?.[editingCellCoords.slotId] ? (
              <Button type="button" variant="ghost" className="text-danger" onClick={handleClearCellAssignment}>
                Clear Assignment
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditCellOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSavingCell}>
                {isSavingCell ? "Saving..." : "Apply Assignment"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Substitute Suggestions Modal */}
      <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title={`Substitutes for ${subContext?.subject || ""} (${subContext?.day || ""})`}>
        <div className="space-y-3">
          {isLoadingSubs ? (
            <div className="flex items-center justify-center gap-2 py-6 text-text-secondary text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching available teachers...
            </div>
          ) : subSuggestions.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">No free teachers found for this subject and time slot.</p>
          ) : (
            <div className="space-y-2">
              {subSuggestions.map((s: any) => (
                <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-border rounded-btn flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-text-secondary" />
                  <span className="text-sm font-medium text-text-primary">{s.fullName}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setIsSubModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isSlotModalOpen} onClose={() => setIsSlotModalOpen(false)} title="Add Timetable Slot">
        <form onSubmit={handleAddSlot} className="space-y-4">
          <Input label="Slot Name (e.g. Period 1, Assembly)" required value={slotForm.name} onChange={(e) => setSlotForm({...slotForm, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time (e.g. 08:00 AM)" required value={slotForm.startTime} onChange={(e) => setSlotForm({...slotForm, startTime: e.target.value})} />
            <Input label="End Time (e.g. 08:50 AM)" required value={slotForm.endTime} onChange={(e) => setSlotForm({...slotForm, endTime: e.target.value})} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isBreak" checked={slotForm.isBreak} onChange={(e) => setSlotForm({...slotForm, isBreak: e.target.checked})} className="rounded border-gray-300 text-primary focus:ring-primary" />
            <label htmlFor="isBreak" className="text-sm text-text-primary cursor-pointer">Mark as a Break or Recess</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsSlotModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Slot</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
