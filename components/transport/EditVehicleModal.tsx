"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any | null;
  apiUrl: string;
  authHeaders?: HeadersInit;
  onSaved: () => void;
}

const emptyForm = {
  insuranceExpiry: "",
  roadTaxExpiry: "",
  permitExpiry: "",
  pollutionCertificate: "",
  fireExtinguisherExpiry: "",
  fitnessCertificate: "",
  status: "Active",
};

export function EditVehicleModal({ isOpen, onClose, vehicle, apiUrl, authHeaders, onSaved }: EditVehicleModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setForm({
        insuranceExpiry: vehicle.insuranceExpiry?.slice(0, 10) || "",
        roadTaxExpiry: vehicle.roadTaxExpiry?.slice(0, 10) || "",
        permitExpiry: vehicle.permitExpiry?.slice(0, 10) || "",
        pollutionCertificate: vehicle.pollutionCertificate?.slice(0, 10) || "",
        fireExtinguisherExpiry: vehicle.fireExtinguisherExpiry?.slice(0, 10) || "",
        fitnessCertificate: vehicle.fitnessCertificate?.slice(0, 10) || "",
        status: vehicle.status || "Active",
      });
    }
  }, [vehicle]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/transport/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast("Vehicle updated", { type: "success" });
      onSaved();
      onClose();
    } catch {
      toast("Failed to update vehicle", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vehicle ? `Edit ${vehicle.vehicleNumber} — Compliance Documents` : "Edit Vehicle"} size="lg">
      {vehicle && (
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <p className="text-xs text-text-secondary">
            Expiry dates drive the fleet&apos;s Safety Compliance figure on the Overview tab — leave blank if a document doesn&apos;t apply yet.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Insurance Expiry" type="date" value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} />
            <Input label="Road Tax Expiry" type="date" value={form.roadTaxExpiry} onChange={(e) => setForm({ ...form, roadTaxExpiry: e.target.value })} />
            <Input label="Permit Expiry" type="date" value={form.permitExpiry} onChange={(e) => setForm({ ...form, permitExpiry: e.target.value })} />
            <Input label="Pollution Certificate Expiry" type="date" value={form.pollutionCertificate} onChange={(e) => setForm({ ...form, pollutionCertificate: e.target.value })} />
            <Input label="Fire Extinguisher Expiry" type="date" value={form.fireExtinguisherExpiry} onChange={(e) => setForm({ ...form, fireExtinguisherExpiry: e.target.value })} />
            <Input label="Fitness Certificate Expiry" type="date" value={form.fitnessCertificate} onChange={(e) => setForm({ ...form, fitnessCertificate: e.target.value })} />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: "Active", value: "Active" },
              { label: "Maintenance", value: "Maintenance" },
              { label: "Accident", value: "Accident" },
              { label: "Retired", value: "Retired" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
