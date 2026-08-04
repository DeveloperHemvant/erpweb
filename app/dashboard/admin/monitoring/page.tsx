"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Server, Cpu, Database, Activity, MemoryStick, Clock, ListChecks } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function SystemMonitoringPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchMetrics = async () => {
    try {
      const [metricsRes, queueRes] = await Promise.all([
        fetch(`${API_URL}/monitoring/system-metrics`),
        fetch(`${API_URL}/monitoring/queue-status`),
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (queueRes.ok) setQueueStatus(await queueRes.json());
    } catch {
      toast("Offline", { description: "Failed to connect to monitoring API", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Poll every 2 seconds for a highly dynamic feel
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  if (loading && !metrics) {
    return <div className="p-8">Loading system telemetry...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">System Monitoring</h1>
          <p className="text-sm text-text-secondary">Real-time health and telemetry metrics for the OS and Database.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary bg-card px-4 py-2 border rounded-full">
          <Activity className="h-4 w-4 animate-pulse text-primary" /> Live Updates (2s)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* DB Status */}
        <Card className={metrics?.database?.status === 'healthy' ? "border-success/30" : "border-error/30"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PostgreSQL Health</CardTitle>
            <Database className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics?.database?.status === 'healthy' ? 'text-success' : 'text-error'}`}>
              {metrics?.database?.status?.toUpperCase()}
            </div>
            <p className="text-xs text-text-secondary">Ping: {metrics?.database?.pingMs}ms</p>
          </CardContent>
        </Card>

        {/* Server Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Clock className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(metrics?.os?.uptime || 0)}</div>
            <p className="text-xs text-text-secondary">Platform: {metrics?.os?.platform} {metrics?.os?.release}</p>
          </CardContent>
        </Card>

        {/* CPU Load */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU Utilization</CardTitle>
            <Cpu className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cpu?.utilizationPercent}%</div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(metrics?.cpu?.utilizationPercent, 100)}%` }}></div>
            </div>
            <p className="text-xs text-text-secondary mt-2">{metrics?.cpu?.cores} Cores</p>
          </CardContent>
        </Card>

        {/* Memory Load */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">RAM Utilization</CardTitle>
            <MemoryStick className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.memory?.utilizationPercent}%</div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(metrics?.memory?.utilizationPercent, 100)}%` }}></div>
            </div>
            <p className="text-xs text-text-secondary mt-2">{formatBytes(metrics?.memory?.used)} / {formatBytes(metrics?.memory?.total)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Job Queue Status</CardTitle>
            <CardDescription>Background fee-generation queue (BullMQ) — see Background Tasks for job-level retry.</CardDescription>
          </div>
          <ListChecks className="h-4 w-4 text-text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Waiting", value: queueStatus?.counts?.waiting, color: "text-warning" },
              { label: "Active", value: queueStatus?.counts?.active, color: "text-primary" },
              { label: "Completed", value: queueStatus?.counts?.completed, color: "text-success" },
              { label: "Failed", value: queueStatus?.counts?.failed, color: "text-error" },
              { label: "Delayed", value: queueStatus?.counts?.delayed, color: "text-text-secondary" },
              { label: "Error Rate", value: queueStatus ? `${queueStatus.errorRatePercent}%` : undefined, color: queueStatus?.errorRatePercent > 10 ? "text-error" : "text-text-primary" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg border bg-background/50 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value ?? "—"}</div>
                <div className="text-[11px] text-text-secondary mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Node.js Process Metrics</CardTitle>
            <CardDescription>Memory allocated directly to the V8 engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Heap Used</span>
                <span>{formatBytes(metrics?.process?.heapUsed)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-warning h-2 rounded-full" style={{ width: `${(metrics?.process?.heapUsed / metrics?.process?.heapTotal) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Heap Total</span>
                <span>{formatBytes(metrics?.process?.heapTotal)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-primary/50 h-2 rounded-full w-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>RSS (Resident Set Size)</span>
                <span>{formatBytes(metrics?.process?.rss)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b pb-2">
                  <span className="text-text-secondary">Node Version</span>
                  <span className="font-mono">{metrics?.os?.nodeVersion || 'v20.x'}</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-text-secondary">Last Sync</span>
                  <span className="font-mono">{new Date(metrics?.timestamp).toLocaleString()}</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-text-secondary">Status</span>
                  <span className={`font-semibold ${metrics?.status === 'OK' ? 'text-success' : 'text-error'}`}>{metrics?.status}</span>
                </li>
             </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
