"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AcademicCalendarPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("terms");

  // Data
  const [sessions, setSessions] = useState<any[]>([]);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessRes, termRes, holRes, workRes, eventRes, bookRes] = await Promise.all([
        fetch(`${API_URL}/master-data/sessions`),
        fetch(`${API_URL}/acms/terms`),
        fetch(`${API_URL}/acms/holidays`),
        fetch(`${API_URL}/acms/working-days`),
        fetch(`${API_URL}/acms/events`),
        fetch(`${API_URL}/acms/bookings`)
      ]);
      
      if (sessRes.ok) setSessions(await sessRes.json());
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
            <Button variant="primary" onClick={() => setIsEventModalOpen(true)}>Add Event</Button>
          </div>
          <div className="bg-white dark:bg-dark-paper border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Event Title</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Organizer</th>
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map(ev => (
                    <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium">{ev.title}</td>
                      <td className="px-4 py-3 text-xs">{new Date(ev.startDate).toLocaleDateString()} - {new Date(ev.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-md text-xs">{ev.type}</span></td>
                      <td className="px-4 py-3">{ev.organizer || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">No events scheduled.</td>
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

      {/* Add Event Modal */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Add School Event">
        <form className="space-y-4 pt-4" onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as any;
          await fetch(`${API_URL}/acms/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: form.sessionId.value,
              title: form.title.value,
              type: form.type.value,
              startDate: form.startDate.value,
              endDate: form.endDate.value,
              organizer: form.organizer.value,
            })
          });
          toast("Success", { description: "Event added", type: "success" });
          setIsEventModalOpen(false);
          fetchData();
        }}>
          <Select label="Academic Session" name="sessionId" options={sessions.map(s => ({ label: s.name, value: s.id }))} required />
          <Input label="Event Title" name="title" placeholder="e.g. Annual Sports Day" required />
          <Select 
            label="Event Type" 
            name="type"
            options={[{label: "Academic", value: "ACADEMIC"}, {label: "Sports", value: "SPORTS"}, {label: "Cultural", value: "CULTURAL"}, {label: "Trip", value: "TRIP"}]} 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" name="startDate" type="date" required />
            <Input label="End Date" name="endDate" type="date" required />
          </div>
          <Input label="Organizer Name" name="organizer" placeholder="e.g. Mr. Smith" />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Event</Button>
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
