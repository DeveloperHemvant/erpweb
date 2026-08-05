"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DataGrid } from "@/components/shared/DataGrid";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Bus, Navigation, Users, Plus, ShieldCheck, Map, MapPin, Gauge, Wrench, AlertTriangle, Receipt, Trash, CheckCircle, XCircle } from "lucide-react";
import { EditVehicleModal } from "@/components/transport/EditVehicleModal";
import { AttendanceTab } from "@/components/transport/AttendanceTab";
import { TyresBatteriesTab } from "@/components/transport/TyresBatteriesTab";
import { ExpenseReportView } from "@/components/transport/ExpenseReportView";
import { computeFleetCompliance } from "@/components/transport/compliance";

export default function TransportManagementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: HeadersInit | undefined = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [activeTab, setActiveTab] = useState("overview");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [accidents, setAccidents] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [isVehicleProfileOpen, setIsVehicleProfileOpen] = useState(false);
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [isLogServiceOpen, setIsLogServiceOpen] = useState(false);
  const [isReportIncidentOpen, setIsReportIncidentOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAssignStudentOpen, setIsAssignStudentOpen] = useState(false);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [isStartTripOpen, setIsStartTripOpen] = useState(false);

  // Profile State
  const [vehicleProfile, setVehicleProfile] = useState<any>(null);

  // Forms
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: "", vehicleType: "School Bus", seatingCapacity: 40, fuelType: "Diesel", status: "Active",
    insuranceExpiry: "", roadTaxExpiry: "", permitExpiry: "", pollutionCertificate: "", fireExtinguisherExpiry: "", fitnessCertificate: "",
  });
  const [fuelForm, setFuelForm] = useState({ vehicleId: "", fuelType: "Diesel", litres: "", ratePerLitre: "", totalCost: "", currentOdometer: "", date: new Date().toISOString().slice(0, 10) });
  const [serviceForm, setServiceForm] = useState({ vehicleId: "", serviceType: "Preventive", odometerReading: "", totalCost: "", serviceDate: new Date().toISOString().slice(0, 10) });
  const [incidentForm, setIncidentForm] = useState({ kind: "Breakdown" as "Breakdown" | "Accident", vehicleId: "", date: new Date().toISOString().slice(0, 10), time: "09:00", location: "", description: "", severity: "Minor" });
  const [expenseForm, setExpenseForm] = useState({ vehicleId: "", category: "Toll", amount: "", paymentMode: "Cash", date: new Date().toISOString().slice(0, 10) });
  const [startTripForm, setStartTripForm] = useState({ routeId: "", tripType: "Morning", date: new Date().toISOString().slice(0, 10) });
  const [routeForm, setRouteForm] = useState<{
    routeName: string;
    distance: number | string;
    estimatedTime: string;
    vehicleId: string;
    stops: { stopName: string; orderIndex: number }[];
  }>({ routeName: "", distance: 0, estimatedTime: "", vehicleId: "", stops: [] });
  
  // Selection
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [assignStaffForm, setAssignStaffForm] = useState({ staffId: "", shift: "Driver - Morning" });
  const [assignStudentForm, setAssignStudentForm] = useState({ enrollmentId: "", stopData: "", morningPickup: true, afternoonDrop: true });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, rRes, sRes, stuRes, tripRes, fuelRes, srvRes, incRes, accRes, expRes] = await Promise.all([
        fetch(`${API_URL}/transport/vehicles`, { headers: authHeaders }),
        fetch(`${API_URL}/transport/routes`, { headers: authHeaders }),
        fetch(`${API_URL}/staff`, { headers: authHeaders }),
        fetch(`${API_URL}/erp-core/students`, { headers: authHeaders }),
        fetch(`${API_URL}/transport/trips`, { headers: authHeaders }),
        fetch(`${API_URL}/transport/fuel`, { headers: authHeaders }),
        fetch(`${API_URL}/transport/services`, { headers: authHeaders }),
        fetch(`${API_URL}/transport/breakdowns`, { headers: authHeaders }),
        fetch(`${API_URL}/transport/accidents`, { headers: authHeaders }),
        fetch(`${API_URL}/transport/expenses`, { headers: authHeaders })
      ]);
      if (vRes.ok) setVehicles(await vRes.json());
      if (rRes.ok) setRoutes(await rRes.json());
      if (sRes.ok) setStaffList((await sRes.json()).data || []);
      if (stuRes.ok) setStudents((await stuRes.json()).data || []);
      if (tripRes.ok) setTrips(await tripRes.json());
      if (fuelRes.ok) setFuelLogs(await fuelRes.json());
      if (srvRes.ok) setServices(await srvRes.json());
      if (incRes.ok) setIncidents(await incRes.json());
      if (accRes.ok) setAccidents(await accRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
    } catch (e) {
      console.error(e);
      toast("Error", { description: "Failed to load data", type: "error" });
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/transport/vehicles`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ ...vehicleForm, seatingCapacity: parseInt(vehicleForm.seatingCapacity as any) })
      });
      if (res.ok) {
        toast("Success", { description: "Vehicle added successfully", type: "success" });
        setIsAddVehicleOpen(false);
        fetchData();
      }
    } catch {
      toast("Error", { description: "Failed to add vehicle", type: "error" });
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        routeName: routeForm.routeName,
        distance: parseFloat(routeForm.distance as any),
        estimatedTime: routeForm.estimatedTime,
        vehicleId: routeForm.vehicleId || null,
        stops: { create: routeForm.stops }
      };
      
      const res = await fetch(`${API_URL}/transport/routes`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast("Success", { description: "Route created successfully", type: "success" });
        setIsAddRouteOpen(false);
        setRouteForm({ routeName: "", distance: 0, estimatedTime: "", vehicleId: "", stops: [] });
        fetchData();
      } else {
        toast("Error", { description: "Failed to add route", type: "error" });
      }
    } catch {
      toast("Error", { description: "Failed to add route", type: "error" });
    }
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/transport/vehicles/${selectedVehicleId}/staff`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(assignStaffForm)
      });
      if (res.ok) {
        toast("Success", { description: "Crew assigned successfully", type: "success" });
        setIsAssignStaffOpen(false);
        fetchData();
      } else {
        toast("Error", { description: "Failed to assign crew", type: "error" });
      }
    } catch {
      toast("Error", { description: "Failed to assign crew", type: "error" });
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStudentForm.stopData || !assignStudentForm.enrollmentId) return;
    
    try {
      const stopInfo = JSON.parse(assignStudentForm.stopData);
      const res = await fetch(`${API_URL}/transport/student-assignments`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          enrollmentId: assignStudentForm.enrollmentId,
          routeId: stopInfo.routeId,
          stopId: stopInfo.stopId,
          morningPickup: assignStudentForm.morningPickup,
          afternoonDrop: assignStudentForm.afternoonDrop
        })
      });
      if (res.ok) {
        toast("Success", { description: "Student assigned successfully", type: "success" });
        setIsAssignStudentOpen(false);
        fetchData();
      } else {
        toast("Error", { description: "Failed to assign student", type: "error" });
      }
    } catch {
      toast("Error", { description: "Failed to assign student", type: "error" });
    }
  };

  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/transport/fuel`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          ...fuelForm,
          litres: parseFloat(fuelForm.litres),
          ratePerLitre: parseFloat(fuelForm.ratePerLitre),
          totalCost: parseFloat(fuelForm.totalCost),
          currentOdometer: parseFloat(fuelForm.currentOdometer),
        }),
      });
      if (!res.ok) throw new Error();
      toast("Fuel logged — pending manager approval", { type: "success" });
      setIsAddFuelOpen(false);
      fetchData();
    } catch {
      toast("Error", { description: "Failed to log fuel", type: "error" });
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/transport/services`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          ...serviceForm,
          odometerReading: parseFloat(serviceForm.odometerReading),
          totalCost: serviceForm.totalCost ? parseFloat(serviceForm.totalCost) : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast("Service logged", { type: "success" });
      setIsLogServiceOpen(false);
      fetchData();
    } catch {
      toast("Error", { description: "Failed to log service", type: "error" });
    }
  };

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { kind, ...body } = incidentForm;
      const endpoint = kind === "Breakdown" ? "breakdowns" : "accidents";
      const res = await fetch(`${API_URL}/transport/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast("Incident reported", { type: "success" });
      setIsReportIncidentOpen(false);
      fetchData();
    } catch {
      toast("Error", { description: "Failed to report incident", type: "error" });
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/transport/expenses`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) }),
      });
      if (!res.ok) throw new Error();
      toast("Expense recorded — pending manager approval", { type: "success" });
      setIsAddExpenseOpen(false);
      fetchData();
    } catch {
      toast("Error", { description: "Failed to record expense", type: "error" });
    }
  };

  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const route = routes.find((r) => r.id === startTripForm.routeId);
    if (!route?.vehicleId) {
      toast("Error", { description: "Selected route has no vehicle assigned.", type: "error" });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/transport/trips`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ routeId: startTripForm.routeId, vehicleId: route.vehicleId, tripType: startTripForm.tripType, date: startTripForm.date, status: "In Progress" }),
      });
      if (!res.ok) throw new Error();
      toast("Trip started", { type: "success" });
      setIsStartTripOpen(false);
      fetchData();
    } catch {
      toast("Error", { description: "Failed to start trip", type: "error" });
    }
  };

  const handleResolveFuel = async (id: string, status: "Approved" | "Rejected") => {
    try {
      const res = await fetch(`${API_URL}/transport/fuel/${id}/resolve`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(status === "Approved" ? "Fuel log approved" : "Fuel log rejected", { type: status === "Approved" ? "success" : "warning" });
      fetchData();
    } catch {
      toast("Error", { description: "Failed to resolve fuel log", type: "error" });
    }
  };

  const handleResolveExpense = async (id: string, status: "Approved" | "Rejected") => {
    try {
      const res = await fetch(`${API_URL}/transport/expenses/${id}/resolve`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(status === "Approved" ? "Expense approved" : "Expense rejected", { type: status === "Approved" ? "success" : "warning" });
      fetchData();
    } catch {
      toast("Error", { description: "Failed to resolve expense", type: "error" });
    }
  };

  const handleAcknowledgeIncident = async (id: string, kind: "Breakdown" | "Accident") => {
    try {
      const endpoint = kind === "Breakdown" ? "breakdowns" : "accidents";
      const res = await fetch(`${API_URL}/transport/${endpoint}/${id}/acknowledge`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      toast("Incident acknowledged", { type: "success" });
      fetchData();
    } catch {
      toast("Error", { description: "Failed to acknowledge incident", type: "error" });
    }
  };

  const fleetCompliance = computeFleetCompliance(vehicles);

  return (
    <>
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Transport Command Center</h1>
          <p className="text-sm text-text-secondary mt-1">Manage fleet, optimize routes, and coordinate staff assignments.</p>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "overview", label: "Dashboard Overview", icon: <Gauge className="w-4 h-4"/> },
          { id: "fleet", label: "Fleet Management", icon: <Bus className="w-4 h-4"/> },
          { id: "routes", label: "Route Management", icon: <Navigation className="w-4 h-4"/> },
          { id: "trips", label: "Trips & GPS", icon: <Map className="w-4 h-4"/> },
          { id: "attendance", label: "Bus Attendance", icon: <Users className="w-4 h-4"/> },
          { id: "fuel", label: "Fuel Logs", icon: <ShieldCheck className="w-4 h-4"/> },
          { id: "maintenance", label: "Maintenance", icon: <Wrench className="w-4 h-4"/> },
          { id: "incidents", label: "Incidents", icon: <AlertTriangle className="w-4 h-4"/> },
          { id: "expenses", label: "Expenses", icon: <Receipt className="w-4 h-4"/> },
        ]}
      />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Total Fleet</p>
                  <h3 className="text-3xl font-bold mt-1 text-primary">{vehicles.length}</h3>
                </div>
                <div className="p-3 bg-primary/20 rounded-full text-primary">
                  <Bus className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Active Routes</p>
                  <h3 className="text-3xl font-bold mt-1">{routes.length}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                  <Map className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Total Stops</p>
                  <h3 className="text-3xl font-bold mt-1">{routes.reduce((acc, r) => acc + (r.stops?.length || 0), 0)}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Document Compliance</p>
                  <h3 className={`text-3xl font-bold mt-1 ${fleetCompliance.compliancePercent === null ? "text-text-secondary" : fleetCompliance.compliancePercent >= 90 ? "text-success" : "text-warning"}`}>
                    {fleetCompliance.compliancePercent !== null ? `${fleetCompliance.compliancePercent}%` : "—"}
                  </h3>
                  {fleetCompliance.missingDataCount > 0 && (
                    <p className="text-xs text-text-secondary mt-1">{fleetCompliance.missingDataCount} vehicle(s) missing document data</p>
                  )}
                </div>
                <div className="p-3 bg-success/20 rounded-full text-success">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "fleet" && (
        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fleet Roster</CardTitle>
                <p className="text-sm text-text-secondary mt-1">Manage vehicles, insurance, and capacity.</p>
              </div>
              <Button variant="primary" onClick={() => setIsAddVehicleOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Register Vehicle
              </Button>
            </CardHeader>
            <CardContent>
              <DataGrid
                columns={[
                  { key: "vehicleNumber", header: "Vehicle Reg. No", render: (v: any) => <span className="font-semibold">{v.vehicleNumber}</span> },
                  { key: "vehicleType", header: "Type" },
                  { key: "fuelType", header: "Fuel" },
                  { key: "seatingCapacity", header: "Capacity", render: (v: any) => `${v.seatingCapacity} Seats` },
                  { key: "status", header: "Status", render: (v: any) => <Badge variant={v.status === "Active" ? "success" : "neutral"}>{v.status}</Badge> },
                  {
                    key: "staff",
                    header: "Assigned Staff",
                    render: (v: any) => (
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mr-1">
                          {v.staff?.map((s: any) => (
                            <div key={s.id} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-white flex items-center justify-center text-xs font-bold text-primary transition-transform hover:scale-105" title={`${s.staff?.fullName} - ${s.shift}`}>
                              {s.staff?.fullName?.charAt(0) || "S"}
                            </div>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedVehicleId(v.id); setIsAssignStaffOpen(true); }}>Assign Crew</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingVehicle(v); setIsEditVehicleOpen(true); }}>Edit</Button>
                        <Button size="sm" variant="primary" onClick={async () => {
                          try {
                            const res = await fetch(`${API_URL}/transport/vehicles/${v.id}/profile`, { headers: authHeaders });
                            if (res.ok) {
                              setVehicleProfile(await res.json());
                              setIsVehicleProfileOpen(true);
                            }
                          } catch (e) {
                            toast("Error", { description: "Failed to load profile", type: "error" });
                          }
                        }}>View Profile</Button>
                      </div>
                    ),
                  },
                ]}
                rows={vehicles}
                rowKey={(v: any) => v.id}
                onRowClick={(v: any) => router.push(`/vehicles/${v.id}`)}
                emptyMessage="No vehicles registered yet."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "routes" && (
        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Route Map</CardTitle>
                <p className="text-sm text-text-secondary mt-1">Configure transit routes and waypoints.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAssignStudentOpen(true)}>
                  <Users className="w-4 h-4 mr-2" /> Assign Students
                </Button>
                <Button variant="primary" onClick={() => setIsAddRouteOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create Route
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routes.length === 0 ? (
                  <div className="p-8 text-center text-text-secondary border border-dashed rounded-lg">No routes configured yet.</div>
                ) : (
                  routes.map(r => (
                    <div key={r.id} className="border border-border rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50 transition-colors hover:border-primary/30 hover:bg-primary/5 shadow-[0_2px_8px_rgba(3,22,53,0.04)]">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-primary">{r.routeName}</h3>
                          <p className="text-sm text-text-secondary">{r.distance || 0} KM • {r.estimatedTime || "TBD"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={`/routes/${r.id}`} className="text-xs font-semibold text-primary hover:underline">
                            View full profile →
                          </a>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedRouteId(r.id); setIsAddStopOpen(true); }}>Add Stop</Button>
                        </div>
                      </div>
                      
                      {/* Visual Stop Timeline */}
                      <div className="relative pl-4 border-l-2 border-primary/30 space-y-4 mt-6 ml-2">
                        {r.stops?.map((stop: any, idx: number) => (
                          <div key={stop.id} className="relative">
                            <div className="absolute w-3 h-3 bg-primary rounded-full -left-[22px] top-1.5 ring-4 ring-white dark:ring-slate-900" />
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-md border shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
                              <p className="font-semibold text-sm">{stop.stopName}</p>
                              <p className="text-xs text-text-secondary mt-1">ETA: {stop.arrivalTime || "TBD"} • Index: {stop.orderIndex}</p>
                            </div>
                          </div>
                        ))}
                        {(!r.stops || r.stops.length === 0) && (
                          <p className="text-sm text-slate-400 italic">No stops added yet.</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "trips" && (
        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Trips & GPS Tracking</CardTitle>
                <p className="text-sm text-text-secondary mt-1">Monitor active bus trips and location logs.</p>
              </div>
              <Button variant="primary" onClick={() => setIsStartTripOpen(true)}>
                <Map className="w-4 h-4 mr-2" /> Start Trip
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trips.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-text-secondary border border-dashed rounded-lg">No trips recorded yet.</div>
                ) : (
                  trips.map(t => (
                    <div key={t.id} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-primary">{t.route?.routeName || "Unknown Route"}</h4>
                          <p className="text-sm">{t.vehicle?.vehicleNumber} • {t.tripType}</p>
                        </div>
                        <Badge variant={t.status === "In Progress" ? "warning" : t.status === "Completed" ? "success" : "neutral"}>
                          {t.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-text-secondary space-y-1 mt-4">
                        <p>Date: {t.date}</p>
                        <p>Driver: {t.driver?.fullName || "Unassigned"}</p>
                        <p>Latest Log: {t.logs?.[0]?.status || "No logs yet"} at {t.logs?.[0]?.timestamp ? new Date(t.logs[0].timestamp).toLocaleTimeString() : "N/A"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "attendance" && (
        <AttendanceTab trips={trips} apiUrl={API_URL} authHeaders={authHeaders} />
      )}

      {activeTab === "fuel" && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fuel Management</CardTitle>
                <p className="text-sm text-text-secondary mt-1">Track fleet fuel consumption and costs.</p>
              </div>
              <Button variant="primary" onClick={() => setIsAddFuelOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Log Fuel
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Fuel Station</TableHead>
                    <TableHead>Litres</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Mileage (km/l)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-6 text-text-secondary">No fuel logs recorded.</TableCell></TableRow>
                  ) : (
                    fuelLogs.map(f => (
                      <TableRow key={f.id}>
                        <TableCell>{f.date}</TableCell>
                        <TableCell className="font-medium">{f.vehicle?.vehicleNumber}</TableCell>
                        <TableCell>{f.fuelStation || "-"}</TableCell>
                        <TableCell>{f.litres} L</TableCell>
                        <TableCell>₹{f.totalCost}</TableCell>
                        <TableCell>
                          {f.mileage ? (
                            <Badge variant={f.mileage > 5 ? "success" : "warning"}>{f.mileage.toFixed(2)}</Badge>
                          ) : (
                            <span className="text-xs text-text-secondary">Need 2 logs</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={f.status === "Approved" ? "success" : f.status === "Rejected" ? "danger" : "warning"}>{f.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {f.status === "Pending" && (
                            <div className="flex justify-end gap-1.5">
                              <Button size="sm" variant="outline" onClick={() => handleResolveFuel(f.id, "Approved")}><CheckCircle className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="outline" onClick={() => handleResolveFuel(f.id, "Rejected")}><XCircle className="w-3.5 h-3.5" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {fuelLogs.length > 0 && (
                <p className="text-sm font-semibold text-text-secondary mt-3 text-right">
                  Total: ₹{fuelLogs.reduce((sum, f) => sum + Number(f.totalCost), 0).toLocaleString("en-IN")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fleet Maintenance & Servicing</CardTitle>
                <p className="text-sm text-text-secondary mt-1">Track vehicle repairs, service dates, and maintenance costs.</p>
              </div>
              <Button variant="primary" onClick={() => setIsLogServiceOpen(true)}>
                <Wrench className="w-4 h-4 mr-2" /> Log Service
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-text-secondary">No service logs found.</TableCell></TableRow>
                  ) : (
                    services.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.serviceDate}</TableCell>
                        <TableCell className="font-medium">{s.vehicle?.vehicleNumber}</TableCell>
                        <TableCell>{s.serviceType}</TableCell>
                        <TableCell>₹{s.totalCost}</TableCell>
                        <TableCell><Badge variant="success">{s.status}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <TyresBatteriesTab vehicles={vehicles} apiUrl={API_URL} authHeaders={authHeaders} />
        </div>
      )}

      {activeTab === "incidents" && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Incidents & Breakdowns</CardTitle>
                <p className="text-sm text-text-secondary mt-1">Monitor on-road emergencies and accident reports.</p>
              </div>
              <Button variant="danger" onClick={() => setIsReportIncidentOpen(true)}>
                <AlertTriangle className="w-4 h-4 mr-2" /> Report Incident
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.length === 0 && accidents.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-6 text-text-secondary">No incidents reported. (Safe!)</TableCell></TableRow>
                  ) : (
                    [
                      ...incidents.map((i) => ({ ...i, kind: "Breakdown" as const })),
                      ...accidents.map((a) => ({ ...a, kind: "Accident" as const })),
                    ]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((i) => (
                        <TableRow key={`${i.kind}-${i.id}`}>
                          <TableCell><Badge variant={i.kind === "Accident" ? "danger" : "warning"}>{i.kind}</Badge></TableCell>
                          <TableCell>{i.date}</TableCell>
                          <TableCell className="font-medium">{i.vehicle?.vehicleNumber}</TableCell>
                          <TableCell>{i.driver?.fullName || "N/A"}</TableCell>
                          <TableCell>{i.description}</TableCell>
                          <TableCell><Badge variant={i.status === "Resolved" || i.status === "Closed" ? "success" : i.status === "Acknowledged" ? "neutral" : "warning"}>{i.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            {(i.status === "Reported" || i.status === "Under Investigation") && (
                              <Button size="sm" variant="outline" onClick={() => handleAcknowledgeIncident(i.id, i.kind)}>Acknowledge</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Operating Expenses</CardTitle>
                <p className="text-sm text-text-secondary mt-1">Track tolls, parking, fines, and vendor payments.</p>
              </div>
              <Button variant="primary" onClick={() => setIsAddExpenseOpen(true)}>
                <Receipt className="w-4 h-4 mr-2" /> Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-text-secondary">No expenses recorded.</TableCell></TableRow>
                  ) : (
                    expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell>{e.date}</TableCell>
                        <TableCell>{e.category}</TableCell>
                        <TableCell className="font-medium">₹{e.amount}</TableCell>
                        <TableCell>{e.paymentMode}</TableCell>
                        <TableCell>
                          <Badge variant={e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "warning"}>{e.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {e.status === "Pending" && (
                            <div className="flex justify-end gap-1.5">
                              <Button size="sm" variant="outline" onClick={() => handleResolveExpense(e.id, "Approved")}><CheckCircle className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="outline" onClick={() => handleResolveExpense(e.id, "Rejected")}><XCircle className="w-3.5 h-3.5" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {expenses.length > 0 && (
                <p className="text-sm font-semibold text-text-secondary mt-3 text-right">
                  Total: ₹{expenses.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString("en-IN")}
                </p>
              )}
            </CardContent>
          </Card>

          <ExpenseReportView apiUrl={API_URL} authHeaders={authHeaders} />
        </div>
      )}

      {/* MODALS */}
      <Modal isOpen={isAddVehicleOpen} onClose={() => setIsAddVehicleOpen(false)} title="Register New Vehicle">
        <form onSubmit={handleAddVehicle} className="space-y-4 pt-4">
          <Input label="Registration Number" value={vehicleForm.vehicleNumber} onChange={e => setVehicleForm({...vehicleForm, vehicleNumber: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={vehicleForm.vehicleType} onChange={e => setVehicleForm({...vehicleForm, vehicleType: e.target.value})} options={[{label: "School Bus", value: "School Bus"}, {label: "Mini Bus", value: "Mini Bus"}, {label: "Van", value: "Van"}]} />
            <Input label="Capacity" type="number" value={vehicleForm.seatingCapacity} onChange={e => setVehicleForm({...vehicleForm, seatingCapacity: parseInt(e.target.value)})} required />
          </div>
          <Select label="Fuel Type" value={vehicleForm.fuelType} onChange={e => setVehicleForm({...vehicleForm, fuelType: e.target.value})} options={[{label: "Diesel", value: "Diesel"}, {label: "Petrol", value: "Petrol"}, {label: "CNG", value: "CNG"}, {label: "EV", value: "EV"}]} />

          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Compliance Documents (optional — can also be added later via Edit)</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Insurance Expiry" type="date" value={vehicleForm.insuranceExpiry} onChange={e => setVehicleForm({...vehicleForm, insuranceExpiry: e.target.value})} />
              <Input label="Road Tax Expiry" type="date" value={vehicleForm.roadTaxExpiry} onChange={e => setVehicleForm({...vehicleForm, roadTaxExpiry: e.target.value})} />
              <Input label="Permit Expiry" type="date" value={vehicleForm.permitExpiry} onChange={e => setVehicleForm({...vehicleForm, permitExpiry: e.target.value})} />
              <Input label="Pollution Cert. Expiry" type="date" value={vehicleForm.pollutionCertificate} onChange={e => setVehicleForm({...vehicleForm, pollutionCertificate: e.target.value})} />
              <Input label="Fire Extinguisher Expiry" type="date" value={vehicleForm.fireExtinguisherExpiry} onChange={e => setVehicleForm({...vehicleForm, fireExtinguisherExpiry: e.target.value})} />
              <Input label="Fitness Cert. Expiry" type="date" value={vehicleForm.fitnessCertificate} onChange={e => setVehicleForm({...vehicleForm, fitnessCertificate: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Register Vehicle</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isAddRouteOpen} onClose={() => setIsAddRouteOpen(false)} title="Create New Route">
        <form onSubmit={handleAddRoute} className="space-y-4 pt-4">
          <Input label="Route Name" value={routeForm.routeName} onChange={e => setRouteForm({...routeForm, routeName: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Distance (KM)" type="number" step="0.1" value={routeForm.distance} onChange={e => setRouteForm({...routeForm, distance: e.target.value})} />
            <Input label="Est. Time (e.g. 55 Mins)" value={routeForm.estimatedTime} onChange={e => setRouteForm({...routeForm, estimatedTime: e.target.value})} />
          </div>
          
          <Select
            label="Assign Vehicle"
            value={routeForm.vehicleId}
            onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })}
            options={[
              { value: "", label: "No Vehicle Assigned" },
              ...vehicles.map(v => ({ value: v.id, label: `${v.vehicleNumber} (${v.vehicleType})` }))
            ]}
          />
          
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm">Route Stops</h4>
              <div className="space-x-2">
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  const newStops = [];
                  for(let i=0; i<5; i++) newStops.push({ stopName: "", orderIndex: routeForm.stops.length + i + 1 });
                  setRouteForm({ ...routeForm, stops: [...routeForm.stops, ...newStops] });
                }}>
                  + Add 5 Stops
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setRouteForm({ ...routeForm, stops: [...routeForm.stops, { stopName: "", orderIndex: routeForm.stops.length + 1 }] })}>
                  + Add Stop
                </Button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {routeForm.stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                  <div className="flex-1">
                    <Input placeholder="Stop Name" value={stop.stopName} onChange={e => {
                      const newStops = [...routeForm.stops];
                      newStops[idx].stopName = e.target.value;
                      setRouteForm({...routeForm, stops: newStops});
                    }} required />
                  </div>
                  <Button type="button" size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 px-2" onClick={() => {
                    const newStops = routeForm.stops.filter((_, i) => i !== idx).map((s, i) => ({ ...s, orderIndex: i + 1 }));
                    setRouteForm({...routeForm, stops: newStops});
                  }}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {routeForm.stops.length === 0 && (
                <p className="text-xs text-text-secondary text-center py-4">No stops added. Add stops to build your route.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Create Route & Stops</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isAssignStaffOpen} onClose={() => setIsAssignStaffOpen(false)} title="Assign Crew to Vehicle">
        <form onSubmit={handleAssignStaff} className="space-y-4 pt-4">
          <Select 
            label="Staff Member" 
            value={assignStaffForm.staffId} 
            onChange={e => setAssignStaffForm({...assignStaffForm, staffId: e.target.value})} 
            options={[{ label: "Select Staff", value: "" }, ...staffList.map(s => ({ label: `${s.fullName} (${s.role})`, value: s.id }))]} 
            required 
          />
          <Select 
            label="Shift & Role" 
            value={assignStaffForm.shift} 
            onChange={e => setAssignStaffForm({...assignStaffForm, shift: e.target.value})} 
            options={[
              {label: "Driver - Morning", value: "Driver - Morning"}, 
              {label: "Driver - Afternoon", value: "Driver - Afternoon"}, 
              {label: "Driver - Full Day", value: "Driver - Full Day"},
              {label: "Conductor - Morning", value: "Conductor - Morning"}, 
              {label: "Conductor - Afternoon", value: "Conductor - Afternoon"},
              {label: "Conductor - Full Day", value: "Conductor - Full Day"}
            ]} 
            required 
          />
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Assign Crew</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isVehicleProfileOpen} onClose={() => setIsVehicleProfileOpen(false)} title="Vehicle Profile">
        {vehicleProfile && (
          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">{vehicleProfile.vehicleNumber}</h2>
                <p className="text-text-secondary">{vehicleProfile.vehicleType} • {vehicleProfile.seatingCapacity} Seats • {vehicleProfile.fuelType}</p>
              </div>
              <Badge variant={vehicleProfile.status === "Active" ? "success" : "neutral"}>{vehicleProfile.status}</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-text-secondary">Total Students</p>
                  <p className="text-lg font-bold">{vehicleProfile.totalStudents}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <Navigation className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-text-secondary">Assigned Routes</p>
                  <p className="text-lg font-bold">{vehicleProfile.assignedRoutes?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <Bus className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-text-secondary">Total Trips</p>
                  <p className="text-lg font-bold">{vehicleProfile.trips?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <Wrench className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-text-secondary">Service Logs</p>
                  <p className="text-lg font-bold">{vehicleProfile.services?.length || 0}</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Assigned Staff</h3>
              {vehicleProfile.staff?.length > 0 ? (
                <div className="space-y-2">
                  {vehicleProfile.staff.map((s: any) => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                      <p className="font-medium">{s.staff?.fullName}</p>
                      <Badge variant="neutral">{s.shift}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No staff assigned to this vehicle.</p>
              )}
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Recent Fuel Logs</h3>
              {vehicleProfile.fuelLogs?.length > 0 ? (
                <div className="space-y-2">
                  {vehicleProfile.fuelLogs.map((f: any) => (
                    <div key={f.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm">
                      <p>{f.date}</p>
                      <p>{f.litres} L</p>
                      <p className="font-medium">₹{f.totalCost}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No fuel logs found.</p>
              )}
            </div>
            
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddFuelOpen} onClose={() => setIsAddFuelOpen(false)} title="Log Fuel">
        <form className="space-y-4 pt-4" onSubmit={handleAddFuel}>
          <Select label="Select Vehicle" value={fuelForm.vehicleId} onChange={e => setFuelForm({ ...fuelForm, vehicleId: e.target.value })} options={[{ label: "Select vehicle", value: "" }, ...vehicles.map(v => ({ label: v.vehicleNumber, value: v.id }))]} required />
          <Select label="Fuel Type" value={fuelForm.fuelType} onChange={e => setFuelForm({ ...fuelForm, fuelType: e.target.value })} options={[{ label: "Diesel", value: "Diesel" }, { label: "Petrol", value: "Petrol" }, { label: "CNG", value: "CNG" }]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Litres" type="number" step="0.1" value={fuelForm.litres} onChange={e => setFuelForm({ ...fuelForm, litres: e.target.value })} required />
            <Input label="Rate per Litre (₹)" type="number" step="0.01" value={fuelForm.ratePerLitre} onChange={e => setFuelForm({ ...fuelForm, ratePerLitre: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Cost (₹)" type="number" value={fuelForm.totalCost} onChange={e => setFuelForm({ ...fuelForm, totalCost: e.target.value })} required />
            <Input label="Current Odometer" type="number" value={fuelForm.currentOdometer} onChange={e => setFuelForm({ ...fuelForm, currentOdometer: e.target.value })} required />
          </div>
          <Input label="Date" type="date" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} required />
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Submit</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isLogServiceOpen} onClose={() => setIsLogServiceOpen(false)} title="Log Maintenance Service">
        <form className="space-y-4 pt-4" onSubmit={handleAddService}>
          <Select label="Select Vehicle" value={serviceForm.vehicleId} onChange={e => setServiceForm({ ...serviceForm, vehicleId: e.target.value })} options={[{ label: "Select vehicle", value: "" }, ...vehicles.map(v => ({ label: v.vehicleNumber, value: v.id }))]} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Service Type" value={serviceForm.serviceType} onChange={e => setServiceForm({ ...serviceForm, serviceType: e.target.value })} options={[{ label: "Preventive", value: "Preventive" }, { label: "Repair", value: "Repair" }, { label: "Ad-hoc", value: "Ad-hoc" }]} />
            <Input label="Total Cost (₹)" type="number" value={serviceForm.totalCost} onChange={e => setServiceForm({ ...serviceForm, totalCost: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Odometer Reading" type="number" value={serviceForm.odometerReading} onChange={e => setServiceForm({ ...serviceForm, odometerReading: e.target.value })} required />
            <Input label="Date" type="date" value={serviceForm.serviceDate} onChange={e => setServiceForm({ ...serviceForm, serviceDate: e.target.value })} required />
          </div>
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Submit</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isReportIncidentOpen} onClose={() => setIsReportIncidentOpen(false)} title="Report Incident">
        <form className="space-y-4 pt-4" onSubmit={handleAddIncident}>
          <Select label="Type" value={incidentForm.kind} onChange={e => setIncidentForm({ ...incidentForm, kind: e.target.value as "Breakdown" | "Accident" })} options={[{ label: "Breakdown", value: "Breakdown" }, { label: "Accident", value: "Accident" }]} />
          <Select label="Select Vehicle" value={incidentForm.vehicleId} onChange={e => setIncidentForm({ ...incidentForm, vehicleId: e.target.value })} options={[{ label: "Select vehicle", value: "" }, ...vehicles.map(v => ({ label: v.vehicleNumber, value: v.id }))]} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={incidentForm.date} onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })} required />
            <Input label="Time" type="time" value={incidentForm.time} onChange={e => setIncidentForm({ ...incidentForm, time: e.target.value })} required />
          </div>
          <Input label="Location" value={incidentForm.location} onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })} />
          {incidentForm.kind === "Accident" && (
            <Select label="Severity" value={incidentForm.severity} onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })} options={[{ label: "Minor", value: "Minor" }, { label: "Major", value: "Major" }, { label: "Fatal", value: "Fatal" }]} />
          )}
          <Input label="Description" value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} required />
          <div className="flex justify-end pt-4"><Button type="submit" variant="danger">Report</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Add Expense">
        <form className="space-y-4 pt-4" onSubmit={handleAddExpense}>
          <Select label="Vehicle (optional)" value={expenseForm.vehicleId} onChange={e => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })} options={[{ label: "School-wide (no vehicle)", value: "" }, ...vehicles.map(v => ({ label: v.vehicleNumber, value: v.id }))]} />
          <Select label="Category" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} options={["Fuel", "Maintenance", "Toll", "Parking", "Fine", "Salary", "Insurance", "Taxes", "Other"].map(v => ({ label: v, value: v }))} />
          <Select label="Payment Mode" value={expenseForm.paymentMode} onChange={e => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })} options={[{ label: "Cash", value: "Cash" }, { label: "Card", value: "Card" }, { label: "UPI", value: "UPI" }, { label: "Bank Transfer", value: "Bank Transfer" }]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (₹)" type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
            <Input label="Date" type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
          </div>
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Submit</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isStartTripOpen} onClose={() => setIsStartTripOpen(false)} title="Start Trip">
        <form className="space-y-4 pt-4" onSubmit={handleStartTrip}>
          <Select
            label="Route"
            value={startTripForm.routeId}
            onChange={e => setStartTripForm({ ...startTripForm, routeId: e.target.value })}
            options={[{ label: "Select route", value: "" }, ...routes.filter(r => r.vehicleId).map(r => ({ label: `${r.routeName} (${r.vehicle?.vehicleNumber})`, value: r.id }))]}
            required
          />
          <Select label="Trip Type" value={startTripForm.tripType} onChange={e => setStartTripForm({ ...startTripForm, tripType: e.target.value })} options={[{ label: "Morning", value: "Morning" }, { label: "Afternoon", value: "Afternoon" }, { label: "Special", value: "Special" }]} />
          <Input label="Date" type="date" value={startTripForm.date} onChange={e => setStartTripForm({ ...startTripForm, date: e.target.value })} required />
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Start Trip</Button></div>
        </form>
      </Modal>

      <EditVehicleModal isOpen={isEditVehicleOpen} onClose={() => setIsEditVehicleOpen(false)} vehicle={editingVehicle} apiUrl={API_URL} authHeaders={authHeaders} onSaved={fetchData} />

      <Modal isOpen={isAssignStudentOpen} onClose={() => setIsAssignStudentOpen(false)} title="Assign Student to Route Stop">
        <form className="space-y-4 pt-4" onSubmit={handleAssignStudent}>
          <Select 
            label="Select Student" 
            value={assignStudentForm.enrollmentId}
            onChange={e => setAssignStudentForm({...assignStudentForm, enrollmentId: e.target.value})}
            options={[{label: "Select Student", value: ""}, ...students.filter(s => s.enrollments?.length > 0).map(s => ({ 
              label: `${s.fullName} (${s.admissionNumber})`, 
              value: s.enrollments[0].id 
            }))]} 
            required
          />
          <Select 
            label="Select Route & Stop" 
            value={assignStudentForm.stopData}
            onChange={e => setAssignStudentForm({...assignStudentForm, stopData: e.target.value})}
            options={[{label: "Select Stop", value: ""}, ...routes.flatMap(r => r.stops?.map((s: any) => ({ 
              label: `${r.routeName} - ${s.stopName}`, 
              value: JSON.stringify({ routeId: r.id, stopId: s.id }) 
            })) || [])]} 
            required
          />
          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={assignStudentForm.morningPickup} onChange={e => setAssignStudentForm({...assignStudentForm, morningPickup: e.target.checked})} /> Morning Pickup
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={assignStudentForm.afternoonDrop} onChange={e => setAssignStudentForm({...assignStudentForm, afternoonDrop: e.target.checked})} /> Afternoon Drop
            </label>
          </div>
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Assign</Button></div>
        </form>
      </Modal>
    </>
  );
}
