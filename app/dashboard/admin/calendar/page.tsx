"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Pencil,
  Trash2,
  BookOpen,
  Trophy,
  Music,
  Bus,
  Award,
  ImageIcon,
  Medal,
  Presentation,
  MapPin,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const EVENT_TYPE_OPTIONS = [
  { label: "Academic", value: "ACADEMIC" },
  { label: "Sports", value: "SPORTS" },
  { label: "Cultural", value: "CULTURAL" },
  { label: "Trip", value: "TRIP" },
  { label: "Competition", value: "COMPETITION" },
  { label: "Exhibition", value: "EXHIBITION" },
  { label: "Olympiad", value: "OLYMPIAD" },
  { label: "Seminar", value: "SEMINAR" },
  { label: "Tour", value: "TOUR" },
];

const EVENT_TYPE_STYLES: Record<string, { icon: React.ElementType; className: string }> = {
  ACADEMIC: { icon: BookOpen, className: "from-blue-500 to-indigo-600" },
  SPORTS: { icon: Trophy, className: "from-orange-500 to-red-600" },
  CULTURAL: { icon: Music, className: "from-pink-500 to-purple-600" },
  TRIP: { icon: Bus, className: "from-emerald-500 to-teal-600" },
  COMPETITION: { icon: Award, className: "from-amber-500 to-orange-600" },
  EXHIBITION: { icon: ImageIcon, className: "from-cyan-500 to-blue-600" },
  OLYMPIAD: { icon: Medal, className: "from-yellow-500 to-amber-600" },
  SEMINAR: { icon: Presentation, className: "from-slate-500 to-slate-700" },
  TOUR: { icon: MapPin, className: "from-green-500 to-emerald-600" },
};

function EventThumb({ type, imageUrl }: { type: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={`${API_URL}${imageUrl}`}
        alt={type}
        className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0"
      />
    );
  }
  const style = EVENT_TYPE_STYLES[type] || EVENT_TYPE_STYLES.ACADEMIC;
  const Icon = style.icon;
  return (
    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${style.className} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  );
}

export default function AcademicCalendarPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("terms");

  // Data
  const [sessions, setSessions] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [workingDays, setWorkingDays] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Modals
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Event add/edit
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventModalKey, setEventModalKey] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessRes, campRes, termRes, holRes, workRes, eventRes, bookRes] = await Promise.all([
        fetch(`${API_URL}/master-data/sessions`),
        fetch(`${API_URL}/master-data/campuses`),
        fetch(`${API_URL}/acms/terms`),
        fetch(`${API_URL}/acms/holidays`),
        fetch(`${API_URL}/acms/working-days`),
        fetch(`${API_URL}/acms/events`),
        fetch(`${API_URL}/acms/bookings`)
      ]);

      if (sessRes.ok) setSessions(await sessRes.json());
      if (campRes.ok) setCampuses(await campRes.json());
      if (termRes.ok) setTerms(await termRes.json());
      if (holRes.ok) setHolidays(await holRes.json());
      if (workRes.ok) setWorkingDays(await workRes.json());
      if (eventRes.ok) setEvents(await eventRes.json());
      if (bookRes.ok) setBookings(await bookRes.json());
    } catch (e) {
      console.error("Error fetching ACMS data:", e);
    }
  };

  const tabs = [
    { id: "terms", label: "Academic Terms" },
    { id: "holidays", label: "Holidays" },
    { id: "working", label: "Working Days" },
    { id: "events", label: "School Events" },
    { id: "resources", label: "Resource Bookings" },
  ];

  const openAddEvent = () => {
    setEditingEvent(null);
    setEventImageFile(null);
    setEventModalKey(k => k + 1);
    setIsEventModalOpen(true);
  };

  const openEditEvent = (ev: any) => {
    setEditingEvent(ev);
    setEventImageFile(null);
    setEventModalKey(k => k + 1);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
    setEventImageFile(null);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    setSavingEvent(true);
    try {
      const payload: Record<string, any> = {
        sessionId: form.sessionId.value,
        campusId: form.campusId.value || undefined,
        title: form.title.value,
        type: form.type.value,
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        organizer: form.organizer.value || undefined,
      };

      const isEdit = !!editingEvent;
      const res = await fetch(`${API_URL}/acms/events${isEdit ? `/${editingEvent.id}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save event");
      }
      const saved = await res.json();

      if (eventImageFile) {
        const fd = new FormData();
        fd.append("file", eventImageFile);
        const imgRes = await fetch(`${API_URL}/acms/events/${saved.id}/image`, { method: "POST", body: fd });
        if (!imgRes.ok) {
          toast("Event saved, but the image upload failed.", { type: "error" });
        }
      }

      toast(isEdit ? "Event updated" : "Event added", { type: "success" });
      closeEventModal();
      fetchData();
    } catch (err: any) {
      toast(Array.isArray(err.message) ? err.message.join(", ") : (err.message || "Failed to save event"), { type: "error" });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/acms/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      toast("Event deleted", { type: "success" });
      fetchData();
    } catch {
      toast("Failed to delete event", { type: "error" });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Academic Calendar</h1>
          <p className="text-text-secondary">Manage terms, holidays, events, and resources.</p>
        </div>
      </div>

      <Tabs options={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "terms" && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-between">
            <h3 className="text-xl font-semibold">Terms & Semesters</h3>
            <Button variant="primary" onClick={() => setIsTermModalOpen(true)}>Add Term</Button>
          </div>
          <div className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Term Name</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                </tr>
              </thead>
              <tbody>
                {terms.length > 0 ? (
                  terms.map(term => (
                    <tr key={term.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium">{term.session?.name || "Unknown"}</td>
                      <td className="px-4 py-3">{term.name}</td>
                      <td className="px-4 py-3">{new Date(term.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{new Date(term.endDate).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">No terms configured yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "holidays" && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-between">
            <h3 className="text-xl font-semibold">Holiday Master</h3>
            <Button variant="primary" onClick={() => setIsHolidayModalOpen(true)}>Add Holiday</Button>
          </div>
          <div className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Holiday Name</th>
                  <th className="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length > 0 ? (
                  holidays.map(h => (
                    <tr key={h.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{h.name}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">{h.type}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-text-secondary">No holidays defined yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "events" && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-between">
            <h3 className="text-xl font-semibold">School Events</h3>
            <Button variant="primary" onClick={openAddEvent}>Add Event</Button>
          </div>
          <div className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Campus</th>
                  <th className="px-4 py-3">Organizer</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map(ev => (
                    <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <EventThumb type={ev.type} imageUrl={ev.imageUrl} />
                          <span className="font-medium">{ev.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{new Date(ev.startDate).toLocaleDateString()} - {new Date(ev.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-md text-xs">{ev.type}</span></td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{ev.campus?.name || "All Campuses"}</td>
                      <td className="px-4 py-3">{ev.organizer || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditEvent(ev)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger" onClick={() => handleDeleteEvent(ev.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-text-secondary">No events scheduled.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "resources" && (
        <div className="space-y-4 pt-4">
          <div className="flex justify-between">
            <h3 className="text-xl font-semibold">Resource Bookings</h3>
            <Button variant="primary" onClick={() => setIsBookingModalOpen(true)}>Book Resource</Button>
          </div>
          <div className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Booked By</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Date/Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map(bk => (
                    <tr key={bk.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium">{bk.resourceName}</td>
                      <td className="px-4 py-3">{bk.bookedBy}</td>
                      <td className="px-4 py-3">{bk.purpose}</td>
                      <td className="px-4 py-3 text-xs">{new Date(bk.startDate).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-green-500/10 text-green-600 rounded-md text-xs">{bk.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-text-secondary">No resources currently booked.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "working" && (
        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-semibold">Working Days Configuration</h3>
          <p className="text-sm text-text-secondary">Configure default working days for calculating attendance and schedules.</p>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg">
            <p className="text-sm text-text-secondary text-center">Working days configuration component will be rendered here.</p>
          </div>
        </div>
      )}

      {/* Add Term Modal */}
      <Modal isOpen={isTermModalOpen} onClose={() => setIsTermModalOpen(false)} title="Add Academic Term">
        <form className="space-y-4 pt-4" onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as any;
          await fetch(`${API_URL}/acms/terms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: form.sessionId.value,
              name: form.termName.value,
              startDate: form.startDate.value,
              endDate: form.endDate.value,
            })
          });
          toast("Success", { description: "Term added", type: "success" });
          setIsTermModalOpen(false);
          fetchData();
        }}>
          <Select
            label="Academic Session"
            name="sessionId"
            options={sessions.map(s => ({ label: s.name, value: s.id }))}
            required
          />
          <Input label="Term Name" name="termName" placeholder="e.g. Semester 1" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" name="startDate" type="date" required />
            <Input label="End Date" name="endDate" type="date" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsTermModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Term</Button>
          </div>
        </form>
      </Modal>

      {/* Add Holiday Modal */}
      <Modal isOpen={isHolidayModalOpen} onClose={() => setIsHolidayModalOpen(false)} title="Add Holiday">
        <form className="space-y-4 pt-4" onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as any;
          await fetch(`${API_URL}/acms/holidays`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.holidayName.value,
              date: form.date.value,
              type: form.type.value,
            })
          });
          toast("Success", { description: "Holiday added", type: "success" });
          setIsHolidayModalOpen(false);
          fetchData();
        }}>
          <Input label="Holiday Name" name="holidayName" placeholder="e.g. Christmas" required />
          <Input label="Date" name="date" type="date" required />
          <Select
            label="Holiday Type"
            name="type"
            options={[{label: "National", value: "NATIONAL"}, {label: "Regional", value: "REGIONAL"}, {label: "School", value: "SCHOOL"}]}
            required
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsHolidayModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Holiday</Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Event Modal */}
      <Modal isOpen={isEventModalOpen} onClose={closeEventModal} title={editingEvent ? "Edit School Event" : "Add School Event"}>
        <form className="space-y-4 pt-4" onSubmit={handleSaveEvent}>
          <Select
            label="Academic Session"
            name="sessionId"
            defaultValue={editingEvent?.sessionId}
            options={sessions.map(s => ({ label: s.name, value: s.id }))}
            required
          />
          <Select
            label="Campus (optional — leave blank for all campuses)"
            name="campusId"
            defaultValue={editingEvent?.campusId || ""}
            options={[{ label: "All Campuses", value: "" }, ...campuses.map((c: any) => ({ label: c.name, value: c.id }))]}
          />
          <Input label="Event Title" name="title" defaultValue={editingEvent?.title} placeholder="e.g. Annual Sports Day" required />
          <Select
            label="Event Type"
            name="type"
            defaultValue={editingEvent?.type}
            options={EVENT_TYPE_OPTIONS}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              defaultValue={editingEvent ? new Date(editingEvent.startDate).toISOString().slice(0, 10) : undefined}
              required
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              defaultValue={editingEvent ? new Date(editingEvent.endDate).toISOString().slice(0, 10) : undefined}
              required
            />
          </div>
          <Input label="Organizer Name" name="organizer" defaultValue={editingEvent?.organizer} placeholder="e.g. Mr. Smith" />

          <FileUpload
            key={eventModalKey}
            label="Event Banner Image (optional)"
            accept="image/png,image/jpeg,image/webp"
            onFileSelect={setEventImageFile}
          />
          {editingEvent?.imageUrl && !eventImageFile && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <img src={`${API_URL}${editingEvent.imageUrl}`} alt="Current banner" className="w-10 h-10 rounded-md object-cover border border-border" />
              Current banner — selecting a new file above will replace it.
            </div>
          )}
          {!editingEvent?.imageUrl && !eventImageFile && (
            <p className="text-xs text-text-secondary">No image? A default icon banner based on the event type is shown instead.</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={closeEventModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingEvent}>
              {savingEvent ? "Saving..." : editingEvent ? "Save Changes" : "Save Event"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Resource Booking Modal */}
      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Book Resource">
        <form className="space-y-4 pt-4" onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as any;
          try {
            const res = await fetch(`${API_URL}/acms/bookings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resourceName: form.resourceName.value,
                bookedBy: form.bookedBy.value,
                purpose: form.purpose.value,
                startDate: form.startDate.value,
                endDate: form.endDate.value,
              })
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.message || "Failed to book");
            }
            toast("Success", { description: "Resource booked successfully", type: "success" });
            setIsBookingModalOpen(false);
            fetchData();
          } catch (err: any) {
            toast("Booking Failed", { description: err.message, type: "error" });
          }
        }}>
          <Select
            label="Resource"
            name="resourceName"
            options={[{label: "Main Auditorium", value: "Main Auditorium"}, {label: "Chemistry Lab", value: "Chemistry Lab"}, {label: "Sports Ground", value: "Sports Ground"}]}
            required
          />
          <Input label="Booked By" name="bookedBy" placeholder="Your Name/ID" required />
          <Input label="Purpose" name="purpose" placeholder="e.g. Rehearsals" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date/Time" name="startDate" type="datetime-local" required />
            <Input label="End Date/Time" name="endDate" type="datetime-local" required />
          </div>
          <p className="text-xs text-text-secondary mt-2 border-l-2 pl-2 border-primary">Conflict detection is enabled. You will be prevented from booking if the resource is already taken during this time.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
