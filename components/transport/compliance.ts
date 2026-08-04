export interface VehicleComplianceDoc {
  label: string;
  date?: string | null;
}

// The six document-expiry fields that matter for road-legal / safety compliance.
export function vehicleDocFields(v: any): VehicleComplianceDoc[] {
  return [
    { label: "Insurance", date: v.insuranceExpiry },
    { label: "Road Tax", date: v.roadTaxExpiry },
    { label: "Permit", date: v.permitExpiry },
    { label: "Pollution Certificate", date: v.pollutionCertificate },
    { label: "Fire Extinguisher", date: v.fireExtinguisherExpiry },
    { label: "Fitness Certificate", date: v.fitnessCertificate },
  ];
}

export function isExpired(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export interface FleetCompliance {
  compliantCount: number;
  totalWithData: number;
  missingDataCount: number;
  compliancePercent: number | null;
}

// Only vehicles with at least one document date entered count toward the
// percentage — a vehicle with no data yet isn't "non-compliant", it's unknown,
// and shouldn't silently drag the number down.
export function computeFleetCompliance(vehicles: any[]): FleetCompliance {
  let compliantCount = 0;
  let totalWithData = 0;
  let missingDataCount = 0;

  for (const v of vehicles) {
    const docs = vehicleDocFields(v);
    const hasAnyData = docs.some((d) => !!d.date);
    if (!hasAnyData) {
      missingDataCount++;
      continue;
    }
    totalWithData++;
    const hasExpired = docs.some((d) => isExpired(d.date));
    if (!hasExpired) compliantCount++;
  }

  return {
    compliantCount,
    totalWithData,
    missingDataCount,
    compliancePercent: totalWithData > 0 ? Math.round((compliantCount / totalWithData) * 100) : null,
  };
}
