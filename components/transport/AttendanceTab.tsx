"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { Users } from "lucide-react";

interface AttendanceTabProps {
  trips: any[];
  apiUrl: string;
  authHeaders?: HeadersInit;
}

export function AttendanceTab({ trips, apiUrl, authHeaders }: AttendanceTabProps) {
  const { toast } = useToast();
  const [selectedTripId, setSelectedTripId] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  useEffect(() => {
    if (!selectedTripId || !selectedTrip) {
      setAttendance([]);
      setRoster([]);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`${apiUrl}/transport/trips/${selectedTripId}/attendance`, { headers: authHeaders }).then((r) => (r.ok ? r.json() : [])),
      selectedTrip.routeId
        ? fetch(`${apiUrl}/transport/routes/${selectedTrip.routeId}/roster`, { headers: authHeaders }).then((r) => (r.ok ? r.json() : []))
        : Promise.resolve([]),
    ])
      .then(([att, rost]) => {
        setAttendance(att);
        setRoster(rost);
      })
      .finally(() => setLoading(false));
  }, [selectedTripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const markStudent = async (enrollmentId: string, stopId: string | null, status: string) => {
    try {
      const res = await fetch(`${apiUrl}/transport/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ tripId: selectedTripId, enrollmentId, stopId, status, markedBy: "Manual" }),
      });
      if (!res.ok) throw new Error();
      const refreshed = await fetch(`${apiUrl}/transport/trips/${selectedTripId}/attendance`, { headers: authHeaders });
      if (refreshed.ok) setAttendance(await refreshed.json());
      toast("Attendance marked", { type: "success" });
    } catch {
      toast("Failed to mark attendance", { type: "error" });
    }
  };

  const statusFor = (enrollmentId: string) => attendance.find((a) => a.enrollmentId === enrollmentId)?.status;

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Bus Attendance</CardTitle>
          <p className="text-sm text-text-secondary mt-1">Select a trip to view or manually mark boarding/drop-off status.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Trip"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            options={[
              { label: "Select a trip...", value: "" },
              ...trips.map((t) => ({
                label: `${t.route?.routeName || "Unknown Route"} · ${t.vehicle?.vehicleNumber} · ${t.date} (${t.tripType})`,
                value: t.id,
              })),
            ]}
          />

          {!selectedTripId ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Select a trip above to view its roster.</p>
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-sm text-text-secondary">Loading roster...</div>
          ) : roster.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-secondary">No students assigned to this trip&apos;s route.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Stop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Mark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((r) => {
                  const status = statusFor(r.enrollmentId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.enrollment?.student?.fullName}</TableCell>
                      <TableCell>{r.stop?.stopName || "—"}</TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant={status === "Boarded" ? "success" : status === "Absent" ? "danger" : "warning"}>{status}</Badge>
                        ) : (
                          <span className="text-xs text-text-secondary">Not marked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => markStudent(r.enrollmentId, r.stopId, "Boarded")}>Boarded</Button>
                          <Button size="sm" variant="outline" onClick={() => markStudent(r.enrollmentId, r.stopId, "Dropped")}>Dropped</Button>
                          <Button size="sm" variant="outline" onClick={() => markStudent(r.enrollmentId, r.stopId, "Absent")}>Absent</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
