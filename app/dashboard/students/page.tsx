"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
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

  const totalPages = Math.ceil(totalCount / limit);

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
        <CardHeader>
          <div className="relative">
            <span className="absolute left-3 top-3 text-text-secondary">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Filter by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 rounded-btn bg-slate-50 dark:bg-slate-800 border border-border text-xs outline-none focus:ring-2 focus:ring-primary/20 text-text-primary"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-text-secondary">Loading students...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SIS ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Grade Cohort</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students
                    .filter((s) => s.fullName?.toLowerCase().includes(search.toLowerCase()))
                    .map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-semibold text-primary">{student.admissionNumber}</TableCell>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>
                          {student.enrollments?.[0]?.section?.class?.grade || "Unassigned"}{" "}
                          {student.enrollments?.[0]?.section?.name || ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === "Active" ? "success" : "warning"}>
                            {student.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center p-4">No students found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 border-t pt-4">
                <div className="text-sm text-text-secondary">
                  Showing {Math.min((page - 1) * limit + 1, totalCount)} to {Math.min(page * limit, totalCount)} of {totalCount}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1} 
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page >= totalPages} 
                    onClick={() => setPage(page + 1)}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
