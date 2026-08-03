"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Search, ShieldAlert, Clock, Terminal } from "lucide-react";

interface AuditLogDef {
  id: string;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  performedBy: string;
  role: string;
  details: any;
  ipAddress: string | null;
  timestamp: string;
}

export default function AuditLogsPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [logs, setLogs] = useState<AuditLogDef[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/audit-logs`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || json || []);
      }
    } catch {
      toast("Sync Offline", { description: "NestJS APIs offline.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.role && log.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            System Security &amp; Audit Logs
          </h1>
          <p className="text-sm text-text-secondary">
            Trace transactions, audit client requests, verify IP addresses, and inspect database state changes.
          </p>
        </div>
      </div>

      {/* Grid Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle>Database Audit Logs</CardTitle>
            <CardDescription>Security registry tracking write operations, users, and dual JSONB value diffs.</CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search table, action, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-btn pl-9 pr-4 py-1.5 text-xs text-text-primary outline-none focus:border-primary transition-colors"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-secondary italic">
              Loading security audit trail from PostgreSQL...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary italic">
              No audit logs recorded in system ledger.
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      >
                        <TableCell className="font-semibold text-text-secondary text-[10px] whitespace-nowrap">
                          <Clock className="h-3 w-3 inline mr-1 text-slate-400" />
                          {new Date(log.timestamp).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="font-medium text-text-primary">{log.role || "SYSTEM"}</TableCell>
                        <TableCell>
                          <Badge variant={log.action.includes("CREATE") || log.action === "LOGIN" ? "success" : log.action.includes("DELETE") ? "danger" : "warning"}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.module}</TableCell>
                        <TableCell className="font-mono text-[10px] text-text-secondary">{log.entityType} {log.entityId?.slice(0, 8)}...</TableCell>
                        <TableCell className="flex items-center gap-1.5 text-text-secondary text-xs">
                          <Terminal className="h-3 w-3 text-slate-400" /> {log.ipAddress || 'Unknown'}
                        </TableCell>
                      </TableRow>
                      {expandedLogId === log.id && (
                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                          <TableCell colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <div className="text-xs font-semibold text-text-secondary mb-2">Details Payload</div>
                                  <pre className="text-[10px] bg-slate-100 dark:bg-slate-900 p-2 rounded-md font-mono overflow-auto max-h-40 border border-border">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-xs text-text-secondary">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredLogs.length)} of {filteredLogs.length} audit entries
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs border rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-text-primary"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs border rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-text-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
