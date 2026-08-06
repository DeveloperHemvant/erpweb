"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Activity, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function BackgroundJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs/recent`);
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch {
      toast("Offline", { description: "Failed to connect to job queue API", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}/retry`, { method: "POST" });
      if (res.ok) {
        toast("Job requeued", { type: "success" });
        fetchJobs();
      } else {
        const err = await res.json().catch(() => ({}));
        toast("Could not retry job", { description: err.message, type: "error" });
      }
    } catch {
      toast("Action failed", { type: "error" });
    } finally {
      setRetryingId(null);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Poll every 3 seconds to show live progress
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && jobs.length === 0) {
    return <div className="p-8">Loading background jobs...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Background Tasks (BullMQ)</h1>
          <p className="text-sm text-text-secondary">Monitor the live progress of asynchronous heavy tasks running on Redis.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary bg-card px-4 py-2 border rounded-full">
          <Activity className="h-4 w-4 animate-pulse text-primary" /> Live Updates (3s)
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Queue Execution</CardTitle>
          <CardDescription>Tasks processed by Redis</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary italic">
              No recent jobs in the queue.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Status / Progress</TableHead>
                  <TableHead>Queued At</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.id}</TableCell>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>
                      {job.status === 'failed' ? (
                        <div className="flex items-center gap-2 text-error" title={job.failedReason || undefined}>
                          <XCircle className="h-4 w-4" /> <span className="text-xs font-semibold">Failed{job.failedReason ? `: ${job.failedReason}` : ""}</span>
                        </div>
                      ) : job.status === 'completed' || job.progress === 100 ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-4 w-4" /> <span className="text-xs font-semibold">Completed</span>
                        </div>
                      ) : job.status === 'active' || (typeof job.progress === 'number' && job.progress > 0) ? (
                        <div className="space-y-1 w-full max-w-[200px]">
                          <div className="flex items-center justify-between text-xs text-primary font-semibold">
                            <span>Processing...</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                         <div className="flex items-center gap-2 text-warning">
                          <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-xs font-semibold">Waiting in Queue</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(job.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {job.status === 'failed' && (
                        <Button size="sm" variant="outline" disabled={retryingId === job.id} onClick={() => handleRetry(job.id)}>
                          {retryingId === job.id ? "Retrying..." : "Retry"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
