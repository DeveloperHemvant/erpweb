"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, ArrowRight, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export default function StudentPromotionPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [fromSessionId, setFromSessionId] = useState("");
  const [toSessionId, setToSessionId] = useState("");
  const [newSessionName, setNewSessionName] = useState("");
  const [passThreshold, setPassThreshold] = useState("40");

  const [preview, setPreview] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [forcePromote, setForcePromote] = useState<Record<string, boolean>>({});
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    api("/master-data/sessions").then(setSessions).catch(() => toast("Error", { description: "Failed to load sessions", type: "error" }));
  }, []);

  const runPreview = async () => {
    if (!fromSessionId) {
      toast("Select a source session first", { type: "error" });
      return;
    }
    setLoadingPreview(true);
    setResult(null);
    setForcePromote({});
    try {
      const data = await api("/promotions/preview", {
        method: "POST",
        body: JSON.stringify({ fromSessionId, passThreshold: Number(passThreshold) }),
      });
      setPreview(data);
    } catch (err: any) {
      toast("Error", { description: err.message, type: "error" });
    } finally {
      setLoadingPreview(false);
    }
  };

  const totalStudents = preview?.classes.reduce((s: number, c: any) => s + c.totalStudents, 0) ?? 0;
  const totalFailing = preview?.classes.reduce((s: number, c: any) => s + c.failing, 0) ?? 0;
  const forcePromoteIds = Object.entries(forcePromote).filter(([, v]) => v).map(([id]) => id);

  const commit = async () => {
    if (!fromSessionId || (!toSessionId && !newSessionName)) {
      toast("Select or name a target session first", { type: "error" });
      return;
    }
    const confirmed = window.confirm(
      `This will move ${totalStudents} students from "${sessions.find((s) => s.id === fromSessionId)?.name}" into ${toSessionId ? `"${sessions.find((s) => s.id === toSessionId)?.name}"` : `a new session "${newSessionName}"`}. This cannot be undone from this screen. Continue?`
    );
    if (!confirmed) return;

    setCommitting(true);
    try {
      const data = await api("/promotions/commit", {
        method: "POST",
        body: JSON.stringify({
          fromSessionId,
          toSessionId: toSessionId || undefined,
          toSessionName: toSessionId ? undefined : newSessionName,
          passThreshold: Number(passThreshold),
          forcePromoteStudentIds: forcePromoteIds,
        }),
      });
      setResult(data);
      toast("Success", { description: "Promotion completed.", type: "success" });
      setPreview(null);
    } catch (err: any) {
      toast("Error", { description: err.message, type: "error" });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary" /> Student Promotion
        </h1>
        <p className="text-text-secondary mt-1">Move every enrolled student up a grade for a new academic session — preview first, then commit.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Choose Sessions</CardTitle>
          <CardDescription>Pick the session students are promoted from, and the session they move into.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="From Session"
            value={fromSessionId}
            onChange={(e) => setFromSessionId(e.target.value)}
            options={[{ label: "Select session...", value: "" }, ...sessions.map((s) => ({ label: s.name, value: s.id }))]}
          />
          <Select
            label="To Session (existing)"
            value={toSessionId}
            onChange={(e) => { setToSessionId(e.target.value); if (e.target.value) setNewSessionName(""); }}
            options={[{ label: "— or create new below —", value: "" }, ...sessions.filter((s) => s.id !== fromSessionId).map((s) => ({ label: s.name, value: s.id }))]}
          />
          <Input
            label="Or New Session Name"
            placeholder="e.g. 2027-2028"
            value={newSessionName}
            onChange={(e) => { setNewSessionName(e.target.value); if (e.target.value) setToSessionId(""); }}
            disabled={!!toSessionId}
          />
        </CardContent>
        <CardContent className="pt-0 flex items-end gap-4">
          <div className="w-40">
            <Input label="Pass Threshold %" type="number" value={passThreshold} onChange={(e) => setPassThreshold(e.target.value)} />
          </div>
          <Button variant="primary" onClick={runPreview} isLoading={loadingPreview}>
            Preview Promotion
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>2. Review</CardTitle>
              <CardDescription>{totalStudents} students · {totalFailing} below the pass threshold — tick any to force-promote anyway.</CardDescription>
            </div>
            <Button variant="primary" onClick={commit} isLoading={committing}>
              Commit Promotion <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium">Moves To</th>
                    <th className="px-4 py-3 font-medium">Students</th>
                    <th className="px-4 py-3 font-medium">Passing</th>
                    <th className="px-4 py-3 font-medium">Failing</th>
                    <th className="px-4 py-3 font-medium text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.classes.map((c: any) => (
                    <React.Fragment key={c.classId}>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="px-4 py-3 font-medium">{c.grade}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          {c.isFinalGrade ? <Badge variant="info">Graduates</Badge> : c.nextGrade}
                        </td>
                        <td className="px-4 py-3">{c.totalStudents}</td>
                        <td className="px-4 py-3"><Badge variant="success">{c.passing}</Badge></td>
                        <td className="px-4 py-3">{c.failing > 0 ? <Badge variant="danger">{c.failing}</Badge> : <Badge variant="neutral">0</Badge>}</td>
                        <td className="px-4 py-3 text-right">
                          {c.failing > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setExpandedClassId(expandedClassId === c.classId ? null : c.classId)}>
                              {expandedClassId === c.classId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {expandedClassId === c.classId && c.failing > 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-start gap-2 mb-2 text-xs text-text-secondary">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-warning shrink-0" />
                              These students are below the pass threshold and will repeat {c.grade} next session unless force-promoted.
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {c.failingStudents.map((fs: any) => (
                                <label key={fs.studentId} className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 bg-white dark:bg-slate-800 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!forcePromote[fs.studentId]}
                                    onChange={(e) => setForcePromote({ ...forcePromote, [fs.studentId]: e.target.checked })}
                                  />
                                  <span className="flex-1">{fs.fullName}</span>
                                  <span className="text-xs text-text-secondary">{fs.percentage != null ? `${fs.percentage.toFixed(0)}%` : "—"}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success" /> Promotion Complete</CardTitle>
            <CardDescription>{result.toSessionName} is now populated.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-success">{result.promoted}</p>
              <p className="text-xs text-text-secondary mt-1">Promoted</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-warning">{result.repeated}</p>
              <p className="text-xs text-text-secondary mt-1">Repeating</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{result.graduated}</p>
              <p className="text-xs text-text-secondary mt-1">Graduated</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
