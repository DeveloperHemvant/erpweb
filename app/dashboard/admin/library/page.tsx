"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { BookOpen, BookUp, RefreshCcw } from "lucide-react";

export default function LibraryAdminPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [activeTab, setActiveTab] = useState("inventory");
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
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

  useEffect(() => {
    fetchBooks();
    fetchStudents();
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
      } else {
        const err = await res.json();
        toast("Error", { description: err.message || "Failed to return", type: "error" });
      }
    } catch {
      toast("Error", { description: "Network error", type: "error" });
    }
  };

  // Helper arrays for selects
  const bookOptions = books.filter(b => b.available > 0).map(b => ({ label: `${b.title} (Avail: ${b.available})`, value: b.id }));
  const studentOptions = students.map(s => ({ label: s.fullName, value: s.enrollments?.[0]?.id || s.id }));

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
              <Select label="Select Student" value={issueEnrollmentId} onChange={e => setIssueEnrollmentId(e.target.value)} options={[{label: "Select...", value: ""}, ...studentOptions]} required />
              <Select label="Select Book" value={issueBookId} onChange={e => setIssueBookId(e.target.value)} options={[{label: "Select...", value: ""}, ...bookOptions]} required />
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
    </>
  );
}
