"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { DataGrid, type DataGridColumn } from "@/components/shared/DataGrid";

interface StudentRow {
  id: string;
  admissionNumber: string;
  fullName: string;
  status: string;
  enrollments?: { section?: { name?: string; class?: { grade?: string } } }[];
  house?: { name?: string } | null;
}

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchStudents(page);
  }, [page]);

  const fetchStudents = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/erp-core/students?page=${pageNum}&limit=${limit}`);
      const json = await res.json();
      setStudents(json.data || []);
      setTotalCount(json.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<StudentRow>[] = [
    { key: "admissionNumber", header: "SIS ID", render: (s) => <span className="font-semibold text-primary">{s.admissionNumber}</span> },
    { key: "fullName", header: "Full Name" },
    {
      key: "grade",
      header: "Grade Cohort",
      render: (s) => `${s.enrollments?.[0]?.section?.class?.grade || "Unassigned"} ${s.enrollments?.[0]?.section?.name || ""}`,
    },
    { key: "house", header: "House", render: (s) => s.house?.name || "—" },
    {
      key: "status",
      header: "Status",
      render: (s) => <Badge variant={s.status === "Active" ? "success" : "warning"}>{s.status}</Badge>,
    },
  ];

  const filtered = students.filter((s) => s.fullName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Student Registry</h1>
          <p className="text-sm text-text-secondary">View and query student registration files.</p>
        </div>
        <Button variant="primary" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => router.push("/dashboard/admin/admissions")}>
          Register Student
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataGrid
            columns={columns}
            rows={filtered}
            rowKey={(s) => s.id}
            loading={loading}
            emptyMessage="No students found."
            onRowClick={(s) => router.push(`/students/${s.id}`)}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Filter by name..."
            page={page}
            pageSize={limit}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </>
  );
}
