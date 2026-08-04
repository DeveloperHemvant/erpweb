"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ExpenseReportViewProps {
  apiUrl: string;
  authHeaders?: HeadersInit;
}

export function ExpenseReportView({ apiUrl, authHeaders }: ExpenseReportViewProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`${apiUrl}/transport/expenses?${params.toString()}`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : []))
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, [from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const byCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const byVehicle = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      const label = e.vehicle?.vehicleNumber || "School-wide (no vehicle)";
      totals[label] = (totals[label] || 0) + Number(e.amount);
    }
    return Object.entries(totals)
      .map(([vehicle, amount]) => ({ vehicle, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const grandTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const vehicleCount = new Set(expenses.map((e) => e.vehicleId).filter(Boolean)).size;
  const avgPerVehicle = vehicleCount > 0 ? grandTotal / vehicleCount : 0;
  const topCategories = byCategory.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where the Money Goes</CardTitle>
        <p className="text-sm text-text-secondary mt-1">Breakdown of operating expenses by category and vehicle.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-text-secondary">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-secondary">No expenses in this range.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-btn bg-slate-50 dark:bg-slate-800 text-center">
                <p className="text-sm text-text-secondary">Total Spend</p>
                <p className="text-xl font-bold text-primary">₹{grandTotal.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-4 border rounded-btn bg-slate-50 dark:bg-slate-800 text-center">
                <p className="text-sm text-text-secondary">Avg. per Vehicle</p>
                <p className="text-xl font-bold">₹{Math.round(avgPerVehicle).toLocaleString("en-IN")}</p>
              </div>
              <div className="p-4 border rounded-btn bg-slate-50 dark:bg-slate-800 text-center">
                <p className="text-sm text-text-secondary">Top Category</p>
                <p className="text-xl font-bold">{topCategories[0]?.category || "—"}</p>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="amount" name="Amount" fill="#4C7A6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold mb-2">By Category</h4>
                <Table>
                  <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {byCategory.map((c) => (
                      <TableRow key={c.category}>
                        <TableCell>{c.category}</TableCell>
                        <TableCell className="text-right font-medium">₹{c.amount.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h4 className="text-sm font-bold mb-2">By Vehicle</h4>
                <Table>
                  <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {byVehicle.map((v) => (
                      <TableRow key={v.vehicle}>
                        <TableCell>{v.vehicle}</TableCell>
                        <TableCell className="text-right font-medium">₹{v.amount.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
