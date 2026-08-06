"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { BookOpen, BookUp, RefreshCcw, Search, X } from "lucide-react";

interface LocalSearchSelectProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
}

function LocalSearchSelect({ label, placeholder = "Type to search...", value, onChange, options, required }: LocalSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);
  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(query.toLowerCase()) ||
      o.value.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && <label className="block text-xs font-medium text-text-secondary mb-1 ml-1">{label}</label>}

      {selectedOpt ? (
        <div className="w-full h-10 px-3.5 rounded-input border border-slate-300/80 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/80 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary truncate">{selectedOpt.label}</span>
          <button type="button" onClick={() => { onChange(""); setQuery(""); }} className="text-text-secondary hover:text-text-primary ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full h-10 pl-3.5 pr-9 rounded-input border border-slate-300/80 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/80 text-text-primary text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
            required={required && !value}
          />
          <div className="absolute right-3 text-text-secondary pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
        </div>
      )}

      {open && !value && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-border rounded-lg shadow-premium">
          {filteredOptions.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-3">No matches.</p>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <span className="block text-sm font-medium text-text-primary truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function LibraryAdminPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [activeTab, setActiveTab] = useState("inventory");
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  
  // Forms
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Fiction");
  const [totalCopies, setTotalCopies] = useState("");

  const [issueBookId, setIssueBookId] = useState("");
  const [issueEnrollmentId, setIssueEnrollmentId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [returnIssueId, setReturnIssueId] = useState("");

  // Reservations
  const [reserveBookId, setReserveBookId] = useState("");
  const [reserveEnrollmentId, setReserveEnrollmentId] = useState("");

  useEffect(() => {
    fetchBooks();
    fetchStudents();
    fetchReservations();
    fetchFines();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/library/books`);
      if (res.ok) setBooks(await res.json());
    } catch {
      toast("Error", { description: "Failed to load books", type: "error" });
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/erp-core/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      }
    } catch {
      console.error("Failed to load students");
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch(`${API_URL}/library/reservations`);
      if (res.ok) setReservations(await res.json());
    } catch {
      toast("Error", { description: "Failed to load reservations", type: "error" });
    }
  };

  const fetchFines = async () => {
    try {
      const res = await fetch(`${API_URL}/library/fines?status=Unpaid`);
      if (res.ok) setFines(await res.json());
    } catch {
      toast("Error", { description: "Failed to load fines", type: "error" });
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/library/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn,
          title,
          author,
          category,
          totalCopies: parseInt(totalCopies),
          available: parseInt(totalCopies)
        })
      });
      if (res.ok) {
        toast("Success", { description: "Book cataloged", type: "success" });
        setIsbn(""); setTitle(""); setAuthor(""); setTotalCopies("");
        fetchBooks();
      }
    } catch {
      toast("Error", { description: "Failed to add book", type: "error" });
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/library/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: issueBookId, enrollmentId: issueEnrollmentId, dueDate })
      });
      if (res.ok) {
        toast("Success", { description: "Book issued", type: "success" });
        fetchBooks();
      } else {
        const err = await res.json();
        toast("Error", { description: err.message || "Failed to issue", type: "error" });
      }
    } catch {
      toast("Error", { description: "Network error", type: "error" });
    }
  };

  const handleReturnBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real flow, you'd list active issues and have a 'Return' button next to them.
      // Here we just use a direct input for the Issue ID for MVP demonstration.
      const res = await fetch(`${API_URL}/library/issues/${returnIssueId}/return`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast("Success", { description: "Book returned", type: "success" });
        setReturnIssueId("");
        fetchBooks();
        fetchReservations();
        fetchFines();
      } else {
        const err = await res.json();
        toast("Error", { description: err.message || "Failed to return", type: "error" });
      }
    } catch {
      toast("Error", { description: "Network error", type: "error" });
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/library/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: reserveBookId, enrollmentId: reserveEnrollmentId }),
      });
      if (res.ok) {
        toast("Success", { description: "Reservation created.", type: "success" });
        setReserveBookId("");
        setReserveEnrollmentId("");
        fetchReservations();
      } else {
        const err = await res.json();
        toast("Error", { description: err.message || "Failed to reserve", type: "error" });
      }
    } catch {
      toast("Error", { description: "Network error", type: "error" });
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Cancel this reservation?")) return;
    try {
      const res = await fetch(`${API_URL}/library/reservations/${reservationId}/cancel`, { method: "PATCH" });
      if (res.ok) {
        toast("Canceled", { type: "warning" });
        fetchReservations();
      }
    } catch {
      toast("Error", { description: "Failed to cancel reservation", type: "error" });
    }
  };

  const handleFineUpdate = async (fineId: string, status: "Paid" | "Waived") => {
    try {
      const res = await fetch(`${API_URL}/library/fines/${fineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast("Updated", { description: `Fine marked ${status}.`, type: "success" });
        fetchFines();
      }
    } catch {
      toast("Error", { description: "Failed to update fine", type: "error" });
    }
  };

  // Helper arrays for selects
  const bookOptions = books.filter(b => b.available > 0).map(b => ({ label: `${b.title} (Avail: ${b.available})`, value: b.id }));
  const studentOptions = students.map(s => ({ label: s.fullName, value: s.enrollments?.[0]?.id || s.id }));
  const allBookOptions = books.map(b => ({ label: `${b.title} (Avail: ${b.available})`, value: b.id }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Library Management</h1>
        <p className="text-sm text-text-secondary">Catalog books, issue them to students, and manage returns.</p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "inventory", label: "Book Inventory", icon: <BookOpen className="w-4 h-4"/> },
          { id: "issue", label: "Issue Book", icon: <BookUp className="w-4 h-4"/> },
          { id: "returns", label: "Returns", icon: <RefreshCcw className="w-4 h-4"/> }
          ,{ id: "reservations", label: "Reservations", icon: <BookOpen className="w-4 h-4"/> },
          { id: "fines", label: "Fines", icon: <RefreshCcw className="w-4 h-4"/> },
        ]}
      />

      {activeTab === "inventory" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader><CardTitle>Add New Book</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddBook} className="space-y-4">
                <Input label="ISBN" value={isbn} onChange={e => setIsbn(e.target.value)} required />
                <Input label="Book Title" value={title} onChange={e => setTitle(e.target.value)} required />
                <Input label="Author" value={author} onChange={e => setAuthor(e.target.value)} required />
                <Select label="Category" value={category} onChange={e => setCategory(e.target.value)} options={[
                  { label: "Fiction", value: "Fiction" },
                  { label: "Non-Fiction", value: "Non-Fiction" },
                  { label: "Science", value: "Science" },
                  { label: "History", value: "History" }
                ]} />
                <Input label="Total Copies" type="number" value={totalCopies} onChange={e => setTotalCopies(e.target.value)} required />
                <Button type="submit" className="w-full">Catalog Book</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Current Inventory</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {books.map(b => (
                  <li key={b.id} className="p-3 border rounded-xl text-sm flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <div>
                      <strong className="block">{b.title}</strong>
                      <span className="text-xs text-text-secondary">By {b.author} | {b.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-semibold">{b.available} / {b.totalCopies}</span>
                      <span className="text-xs text-text-secondary">Available</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "issue" && (
        <Card className="mt-6 max-w-2xl mx-auto">
          <CardHeader><CardTitle>Issue a Book</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleIssueBook} className="space-y-4">
              <LocalSearchSelect label="Select Student *" value={issueEnrollmentId} onChange={setIssueEnrollmentId} options={studentOptions} required />
              <LocalSearchSelect label="Select Book *" value={issueBookId} onChange={setIssueBookId} options={bookOptions} required />
              <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              <Button type="submit" className="w-full">Issue Book</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "returns" && (
        <Card className="mt-6 max-w-2xl mx-auto border-primary border-2">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2"><RefreshCcw className="w-5 h-5"/> Process Return</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary mb-4">
              Enter the unique Issue ID associated with the borrowed book to process its return and update inventory.
            </p>
            <form onSubmit={handleReturnBook} className="space-y-4">
              <Input label="Issue Record ID (UUID)" value={returnIssueId} onChange={e => setReturnIssueId(e.target.value)} required />
              <Button type="submit" variant="primary" className="w-full">Mark as Returned</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "reservations" && (
        <div className="grid grid-cols-1 lg:grid-cols-[460px,1fr] gap-6 mt-6">
          <Card>
            <CardHeader><CardTitle>Create Reservation</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateReservation} className="space-y-4">
                <LocalSearchSelect label="Select Book *" value={reserveBookId} onChange={setReserveBookId} options={allBookOptions} required />
                <LocalSearchSelect label="Select Student (enrollment) *" value={reserveEnrollmentId} onChange={setReserveEnrollmentId} options={studentOptions} required />
                <Button type="submit" className="w-full">Reserve</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Reservation Queue</CardTitle></CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-sm text-text-secondary">No reservations.</p>
              ) : (
                <ul className="space-y-3">
                  {reservations.map((r) => (
                    <li key={r.id} className="p-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-text-primary">{r.bookTitle || "Book"}</div>
                          <div className="text-xs text-text-secondary mt-1">
                            {r.studentName || "Student"} · Status: {r.status}
                          </div>
                          {r.expiresAt && <div className="text-xs text-text-secondary mt-2">Expires: {new Date(r.expiresAt).toLocaleDateString()}</div>}
                        </div>
                        {r.status === "Reserved" && (
                          <Button size="sm" variant="danger" onClick={() => handleCancelReservation(r.id)}>Cancel</Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "fines" && (
        <div className="mt-6">
          <Card>
            <CardHeader><CardTitle>Unpaid Fines</CardTitle></CardHeader>
            <CardContent>
              {fines.length === 0 ? (
                <p className="text-sm text-text-secondary">No unpaid fines.</p>
              ) : (
                <ul className="space-y-3">
                  {fines.map((f) => (
                    <li key={f.id} className="p-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-text-primary">{f.issue?.book?.title || "Book"}</div>
                          <div className="text-xs text-text-secondary mt-1">
                            {f.issue?.enrollment?.student?.fullName || "Student"} · Amount: ₹{Number(f.amount).toFixed(0)} · {f.status}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleFineUpdate(f.id, "Paid")}>Mark Paid</Button>
                          <Button size="sm" variant="danger" onClick={() => handleFineUpdate(f.id, "Waived")}>Waive</Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
