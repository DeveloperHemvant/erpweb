"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Bus, Navigation, Users, Plus, ShieldCheck, Map, MapPin, Gauge, Wrench, AlertTriangle, Receipt, Trash } from "lucide-react";

export default function TransportManagementPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [activeTab, setActiveTab] = useState("overview");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
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

  // Profile State
  const [vehicleProfile, setVehicleProfile] = useState<any>(null);

  // Forms
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: "", vehicleType: "School Bus", seatingCapacity: 40, fuelType: "Diesel", status: "Active"
  });
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
      const [vRes, rRes, sRes, stuRes, tripRes, fuelRes, srvRes, incRes, expRes] = await Promise.all([
        fetch(`${API_URL}/transport/vehicles`),
        fetch(`${API_URL}/transport/routes`),
        fetch(`${API_URL}/staff`),
        fetch(`${API_URL}/erp-core/students`),
        fetch(`${API_URL}/transport/trips`),
        fetch(`${API_URL}/transport/fuel`),
        fetch(`${API_URL}/transport/services`),
        fetch(`${API_URL}/transport/breakdowns`),
        fetch(`${API_URL}/transport/expenses`)
      ]);
      if (vRes.ok) setVehicles(await vRes.json());
      if (rRes.ok) setRoutes(await rRes.json());
      if (sRes.ok) setStaffList((await sRes.json()).data || []);
      if (stuRes.ok) setStudents((await stuRes.json()).data || []);
      if (tripRes.ok) setTrips(await tripRes.json());
      if (fuelRes.ok) setFuelLogs(await fuelRes.json());
      if (srvRes.ok) setServices(await srvRes.json());
      if (incRes.ok) setIncidents(await incRes.json());
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
        method: "POST", headers: { "Content-Type": "application/json" },
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
        method: "POST", headers: { "Content-Type": "application/json" },
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
        method: "POST", headers: { "Content-Type": "application/json" },
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
        method: "POST", headers: { "Content-Type": "application/json" },
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

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
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
                  <p className="text-sm font-medium text-text-secondary">Safety Compliance</p>
                  <h3 className="text-3xl font-bold mt-1 text-success">98%</h3>
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
        <div className="mt-6 space-y-6">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Reg. No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fuel</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-text-secondary">No vehicles registered yet.</TableCell></TableRow>
                  ) : (
                    vehicles.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-semibold">{v.vehicleNumber}</TableCell>
                        <TableCell>{v.vehicleType}</TableCell>
                        <TableCell>{v.fuelType}</TableCell>
                        <TableCell>{v.seatingCapacity} Seats</TableCell>
                        <TableCell>
                          <Badge variant={v.status === "Active" ? "success" : "neutral"}>{v.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 mr-2">
                                {v.staff?.map((s: any) => (
                                  <div key={s.id} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-white flex items-center justify-center text-xs font-bold text-primary" title={`${s.staff?.fullName} - ${s.shift}`}>
                                    {s.staff?.fullName?.charAt(0) || "S"}
                                  </div>
                                ))}
                            </div>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedVehicleId(v.id); setIsAssignStaffOpen(true); }}>Assign Crew</Button>
                            
                            <Button size="sm" variant="primary" onClick={async () => {
                              try {
                                const res = await fetch(`${API_URL}/transport/vehicles/${v.id}/profile`);
                                if (res.ok) {
                                  setVehicleProfile(await res.json());
                                  setIsVehicleProfileOpen(true);
                                }
                              } catch (e) {
                                toast("Error", { description: "Failed to load profile", type: "error" });
                              }
                            }}>View Profile</Button>
                          </div>
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

      {activeTab === "routes" && (
        <div className="mt-6 space-y-6">
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
                    <div key={r.id} className="border border-border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-primary">{r.routeName}</h3>
                          <p className="text-sm text-text-secondary">{r.distance || 0} KM • {r.estimatedTime || "TBD"}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedRouteId(r.id); setIsAddStopOpen(true); }}>Add Stop</Button>
                      </div>
                      
                      {/* Visual Stop Timeline */}
                      <div className="relative pl-4 border-l-2 border-primary/30 space-y-4 mt-6 ml-2">
                        {r.stops?.map((stop: any, idx: number) => (
                          <div key={stop.id} className="relative">
                            <div className="absolute w-3 h-3 bg-primary rounded-full -left-[22px] top-1.5 ring-4 ring-white dark:ring-slate-900" />
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-md border shadow-sm">
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
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Trips & GPS Tracking</CardTitle>
                <p className="text-sm text-text-secondary mt-1">Monitor active bus trips and location logs.</p>
              </div>
              <Button variant="primary">
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
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Bus Attendance</CardTitle>
              <p className="text-sm text-text-secondary mt-1">Verify students boarding and dropping off.</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <Users className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Scanner Ready</h3>
                <p className="text-sm text-slate-500 max-w-md text-center mt-2">
                  Waiting for RFID/NFC scans from the bus terminal. To manually mark attendance, select an active trip.
                </p>
                <Button variant="outline" className="mt-6">Select Trip to Manual Mark</Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-text-secondary">No fuel logs recorded.</TableCell></TableRow>
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-text-secondary">No incidents reported. (Safe!)</TableCell></TableRow>
                  ) : (
                    incidents.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>{i.date}</TableCell>
                        <TableCell className="font-medium">{i.vehicle?.vehicleNumber}</TableCell>
                        <TableCell>{i.driver?.fullName || "N/A"}</TableCell>
                        <TableCell>{i.description}</TableCell>
                        <TableCell><Badge variant="warning">{i.status}</Badge></TableCell>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-text-secondary">No expenses recorded.</TableCell></TableRow>
                  ) : (
                    expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell>{e.date}</TableCell>
                        <TableCell>{e.category}</TableCell>
                        <TableCell className="font-medium">₹{e.amount}</TableCell>
                        <TableCell>{e.paymentMode}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
        <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); toast("Success", { description: "Fuel Logged", type: "success" }); setIsAddFuelOpen(false); }}>
          <Select label="Select Vehicle" options={vehicles.map(v => ({ label: v.vehicleNumber, value: v.id }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Litres" type="number" step="0.1" required />
            <Input label="Total Cost (₹)" type="number" required />
          </div>
          <Input label="Date" type="date" required />
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Submit</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isLogServiceOpen} onClose={() => setIsLogServiceOpen(false)} title="Log Maintenance Service">
        <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); toast("Success", { description: "Service Logged", type: "success" }); setIsLogServiceOpen(false); }}>
          <Select label="Select Vehicle" options={vehicles.map(v => ({ label: v.vehicleNumber, value: v.id }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Service Type" options={[{label:"Preventive", value:"Preventive"}, {label:"Repair", value:"Repair"}]} />
            <Input label="Total Cost (₹)" type="number" required />
          </div>
          <Input label="Date" type="date" required />
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Submit</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isReportIncidentOpen} onClose={() => setIsReportIncidentOpen(false)} title="Report Incident/Breakdown">
        <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); toast("Success", { description: "Incident Reported", type: "success" }); setIsReportIncidentOpen(false); }}>
          <Select label="Select Vehicle" options={vehicles.map(v => ({ label: v.vehicleNumber, value: v.id }))} />
          <Input label="Date" type="date" required />
          <Input label="Description" required />
          <div className="flex justify-end pt-4"><Button type="submit" variant="danger">Report</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Add Expense">
        <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); toast("Success", { description: "Expense Added", type: "success" }); setIsAddExpenseOpen(false); }}>
          <Select label="Category" options={[{label:"Toll", value:"Toll"}, {label:"Fine", value:"Fine"}, {label:"Other", value:"Other"}]} />
          <Input label="Amount (₹)" type="number" required />
          <Input label="Date" type="date" required />
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Submit</Button></div>
        </form>
      </Modal>

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
