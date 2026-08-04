"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

interface TyresBatteriesTabProps {
  vehicles: any[];
  apiUrl: string;
  authHeaders?: HeadersInit;
}

const emptyTyreForm = { vehicleId: "", tyreNumber: "", type: "Front Left", installedDate: "", installedOdo: "" };
const emptyBatteryForm = { vehicleId: "", batteryNumber: "", brand: "", capacity: "", installedDate: "" };

export function TyresBatteriesTab({ vehicles, apiUrl, authHeaders }: TyresBatteriesTabProps) {
  const { toast } = useToast();
  const [tyres, setTyres] = useState<any[]>([]);
  const [batteries, setBatteries] = useState<any[]>([]);
  const [isAddTyreOpen, setIsAddTyreOpen] = useState(false);
  const [isAddBatteryOpen, setIsAddBatteryOpen] = useState(false);
  const [tyreForm, setTyreForm] = useState(emptyTyreForm);
  const [batteryForm, setBatteryForm] = useState(emptyBatteryForm);

  const load = async () => {
    const [tRes, bRes] = await Promise.all([
      fetch(`${apiUrl}/transport/tyres`, { headers: authHeaders }),
      fetch(`${apiUrl}/transport/batteries`, { headers: authHeaders }),
    ]);
    if (tRes.ok) setTyres(await tRes.json());
    if (bRes.ok) setBatteries(await bRes.json());
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submitTyre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/transport/tyres`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ ...tyreForm, installedOdo: parseFloat(tyreForm.installedOdo) }),
      });
      if (!res.ok) throw new Error();
      toast("Tyre added", { type: "success" });
      setIsAddTyreOpen(false);
      setTyreForm(emptyTyreForm);
      load();
    } catch {
      toast("Failed to add tyre", { type: "error" });
    }
  };

  const submitBattery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/transport/batteries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(batteryForm),
      });
      if (!res.ok) throw new Error();
      toast("Battery added", { type: "success" });
      setIsAddBatteryOpen(false);
      setBatteryForm(emptyBatteryForm);
      load();
    } catch {
      toast("Failed to add battery", { type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tyres</CardTitle>
            <p className="text-sm text-text-secondary mt-1">Track tyre lifecycle per vehicle.</p>
          </div>
          <Button variant="outline" onClick={() => setIsAddTyreOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Tyre</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Tyre No.</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Installed</TableHead>
                <TableHead>Tread Depth</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tyres.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-text-secondary">No tyres logged.</TableCell></TableRow>
              ) : (
                tyres.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.vehicle?.vehicleNumber}</TableCell>
                    <TableCell>{t.tyreNumber}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{t.installedDate}</TableCell>
                    <TableCell>{t.treadDepth != null ? `${t.treadDepth} mm` : "—"}</TableCell>
                    <TableCell><Badge variant={t.status === "In Use" ? "success" : "neutral"}>{t.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Batteries</CardTitle>
            <p className="text-sm text-text-secondary mt-1">Track battery lifecycle per vehicle.</p>
          </div>
          <Button variant="outline" onClick={() => setIsAddBatteryOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Battery</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Battery No.</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Installed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batteries.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-text-secondary">No batteries logged.</TableCell></TableRow>
              ) : (
                batteries.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.vehicle?.vehicleNumber}</TableCell>
                    <TableCell>{b.batteryNumber}</TableCell>
                    <TableCell>{b.brand || "—"}</TableCell>
                    <TableCell>{b.capacity || "—"}</TableCell>
                    <TableCell>{b.installedDate}</TableCell>
                    <TableCell><Badge variant={b.status === "In Use" ? "success" : "neutral"}>{b.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={isAddTyreOpen} onClose={() => setIsAddTyreOpen(false)} title="Add Tyre">
        <form onSubmit={submitTyre} className="space-y-4 pt-4">
          <Select label="Vehicle" value={tyreForm.vehicleId} onChange={(e) => setTyreForm({ ...tyreForm, vehicleId: e.target.value })} options={[{ label: "Select vehicle", value: "" }, ...vehicles.map((v) => ({ label: v.vehicleNumber, value: v.id }))]} required />
          <Input label="Tyre Number" value={tyreForm.tyreNumber} onChange={(e) => setTyreForm({ ...tyreForm, tyreNumber: e.target.value })} required />
          <Select
            label="Position"
            value={tyreForm.type}
            onChange={(e) => setTyreForm({ ...tyreForm, type: e.target.value })}
            options={["Front Left", "Front Right", "Rear Left Outer", "Rear Left Inner", "Rear Right Outer", "Rear Right Inner", "Spare"].map((v) => ({ label: v, value: v }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Installed Date" type="date" value={tyreForm.installedDate} onChange={(e) => setTyreForm({ ...tyreForm, installedDate: e.target.value })} required />
            <Input label="Odometer at Install" type="number" value={tyreForm.installedOdo} onChange={(e) => setTyreForm({ ...tyreForm, installedOdo: e.target.value })} required />
          </div>
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Add Tyre</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isAddBatteryOpen} onClose={() => setIsAddBatteryOpen(false)} title="Add Battery">
        <form onSubmit={submitBattery} className="space-y-4 pt-4">
          <Select label="Vehicle" value={batteryForm.vehicleId} onChange={(e) => setBatteryForm({ ...batteryForm, vehicleId: e.target.value })} options={[{ label: "Select vehicle", value: "" }, ...vehicles.map((v) => ({ label: v.vehicleNumber, value: v.id }))]} required />
          <Input label="Battery Number" value={batteryForm.batteryNumber} onChange={(e) => setBatteryForm({ ...batteryForm, batteryNumber: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Brand" value={batteryForm.brand} onChange={(e) => setBatteryForm({ ...batteryForm, brand: e.target.value })} />
            <Input label="Capacity (e.g. 150Ah)" value={batteryForm.capacity} onChange={(e) => setBatteryForm({ ...batteryForm, capacity: e.target.value })} />
          </div>
          <Input label="Installed Date" type="date" value={batteryForm.installedDate} onChange={(e) => setBatteryForm({ ...batteryForm, installedDate: e.target.value })} required />
          <div className="flex justify-end pt-4"><Button type="submit" variant="primary">Add Battery</Button></div>
        </form>
      </Modal>
    </div>
  );
}
