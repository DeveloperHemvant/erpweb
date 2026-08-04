"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SessionDef {
  id: string;
  name: string;
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>("students");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: HeadersInit | undefined = token ? { Authorization: `Bearer ${token}` } : undefined;

  // Imports target the school's active campus and a chosen academic session — both
  // are real, selected context, not placeholder data (previously hardcoded UUIDs here).
  const [campusId, setCampusId] = useState<string>("");
  const [sessions, setSessions] = useState<SessionDef[]>([]);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const storedCampusId = typeof window !== "undefined" ? localStorage.getItem("activeCampusId") : null;
    setCampusId(storedCampusId || "");

    fetch(`${API_URL}/master-data/sessions`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSessions(list);
        if (list.length > 0) setSessionId(list[0].id);
      })
      .catch(() => toast("Failed to load academic sessions", { type: "error" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const downloadSample = () => {
    const samples: Record<string, string> = {
      classes: "grade,section\n10,A\n10,B\n11,Science",
      staff: "email,fullName,role\njohn.doe@example.com,John Doe,Teacher\nadmin@example.com,Admin User,Admin",
      students: "admissionNumber,fullName,grade,section,gender,guardianName,phone,parentEmail\nSTU001,Alice Smith,10,A,Female,Bob Smith,9876543210,bob@example.com"
    };
    
    const content = samples[type] || "";
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sample_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) {
      toast("Error", { description: "Please select a file first", type: "error" });
      return;
    }
    if (!campusId) {
      toast("No campus selected", { description: "Select a campus from the top bar before importing.", type: "error" });
      return;
    }
    if (!sessionId) {
      toast("No academic session selected", { description: "Choose which session these records belong to.", type: "error" });
      return;
    }

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("campusId", campusId);
    formData.append("sessionId", sessionId);

    try {
      const response = await fetch(`${API_URL}/import/csv`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload");

      setResult(data);
      toast("Success", { description: `Imported ${data.processed} records successfully.`, type: "success" });
    } catch (error: any) {
      toast("Import Failed", { description: error.message, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Bulk Data Import</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Select Import Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 rounded-md border border-border bg-background"
            >
              <option value="classes">Classes & Sections</option>
              <option value="staff">Staff & Teachers</option>
              <option value="students">Students & Parents</option>
            </select>

            {type !== "staff" && (
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Academic Session</label>
                <select
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full p-2 rounded-md border border-border bg-background"
                >
                  {sessions.length === 0 && <option value="">No sessions found</option>}
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {!campusId && (
              <div className="flex items-center gap-2 text-xs text-error bg-error/10 border border-error/20 rounded-md p-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> No campus selected — pick one from the top bar before importing.
              </div>
            )}

            <div className="text-sm text-text-secondary">
              <p>Required CSV Columns:</p>
              {type === 'classes' && <code className="block p-2 mt-2 bg-background rounded border">grade, section</code>}
              {type === 'staff' && <code className="block p-2 mt-2 bg-background rounded border">email, fullName, role</code>}
              {type === 'students' && <code className="block p-2 mt-2 bg-background rounded border">admissionNumber, fullName, grade, section, parentEmail, guardianName</code>}
            </div>

            <Button variant="outline" className="w-full mt-4" onClick={downloadSample}>
              <Download className="w-4 h-4 mr-2" /> Download Sample CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-12 bg-background/50">
              <Upload className="w-12 h-12 text-text-secondary mb-4" />
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                id="file-upload" 
                onChange={handleFileChange}
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Choose File
              </label>
              {file && (
                <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
                  <FileText className="w-4 h-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="w-full md:w-auto"
              >
                {isUploading ? "Processing..." : "Start Import"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card className="mt-8 border-success/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-background rounded-lg border">
                <div className="text-2xl font-bold">{result.totalRows}</div>
                <div className="text-sm text-text-secondary">Total Rows</div>
              </div>
              <div className="p-4 bg-success/10 rounded-lg border border-success/20 text-success">
                <div className="text-2xl font-bold">{result.processed}</div>
                <div className="text-sm">Successfully Processed</div>
              </div>
              <div className="p-4 bg-error/10 rounded-lg border border-error/20 text-error">
                <div className="text-2xl font-bold">{result.failed}</div>
                <div className="text-sm">Failed</div>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-error">
                  <AlertCircle className="w-4 h-4" /> Error Log
                </h4>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-text-secondary">
                      <tr>
                        <th className="px-4 py-2">Row</th>
                        <th className="px-4 py-2">Error Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-4 py-2 font-mono">{err.row}</td>
                          <td className="px-4 py-2 text-error">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
