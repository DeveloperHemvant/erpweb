"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Package, RefreshCcw, Shield, Store, Toolbox } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function InventoryAdminPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("assets");
  const [campusId, setCampusId] = useState<string>("");

  const [categories, setCategories] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);

  // Category form
  const [categoryName, setCategoryName] = useState("");

  // Asset form
  const [assetCategoryId, setAssetCategoryId] = useState("");
  const [assetCampusId, setAssetCampusId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetQuantity, setAssetQuantity] = useState("");
  const [assetStatus, setAssetStatus] = useState("Active");

  // Requisition form
  const [reqCampusId, setReqCampusId] = useState("");
  const [reqItemName, setReqItemName] = useState("");
  const [reqQuantity, setReqQuantity] = useState("");
  const [reqEstimatedCost, setReqEstimatedCost] = useState("");
  const [reqPurpose, setReqPurpose] = useState("");
  const [reqStatus, setReqStatus] = useState("Pending");

  const [loading, setLoading] = useState(true);

  const campusOptions = useMemo(() => {
    // Some pages use campus switcher name; here we use the ID if available.
    // Inventory endpoints accept campusId query; if not set, list is not filtered.
    return assetCampusId ? [{ label: "Active campus", value: assetCampusId }] : [];
  }, [assetCampusId]);

  async function apiJson(path: string, init?: RequestInit) {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const message = await res.text().catch(() => "");
      throw new Error(message || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async function loadData() {
    setLoading(true);
    try {
      const storedCampusId = typeof window !== "undefined" ? localStorage.getItem("activeCampusId") : null;
      const storedCampus = storedCampusId || "";
      setCampusId(storedCampus);
      setAssetCampusId(storedCampus);
      setReqCampusId(storedCampus);

      const qs = storedCampus ? `?campusId=${encodeURIComponent(storedCampus)}` : "";

      const [catRes, assetsRes, reqRes] = await Promise.all([
        apiJson(`/inventory/categories`),
        apiJson(`/inventory/assets${qs}`),
        apiJson(`/inventory/requisitions${qs}`),
      ]);

      setCategories(catRes || []);
      setAssets(assetsRes || []);
      setRequisitions(reqRes || []);
    } catch (err: any) {
      toast("Error", { description: err?.message || "Failed to load inventory data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When categories arrive, preselect first category for the asset form.
    if (!assetCategoryId && categories.length > 0) setAssetCategoryId(categories[0].id);
  }, [categories, assetCategoryId]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.name, value: c.id })),
    [categories]
  );

  const assetStatusOptions = useMemo(
    () => [
      { label: "Active", value: "Active" },
      { label: "Damaged", value: "Damaged" },
      { label: "Discarded", value: "Discarded" },
    ],
    []
  );

  const requisitionStatusOptions = useMemo(
    () => [
      { label: "Pending", value: "Pending" },
      { label: "Approved", value: "Approved" },
      { label: "Ordered", value: "Ordered" },
      { label: "Received", value: "Received" },
      { label: "Rejected", value: "Rejected" },
    ],
    []
  );

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiJson(`/inventory/categories`, {
        method: "POST",
        body: JSON.stringify({ name: categoryName, status: "Active" }),
      });
      setCategoryName("");
      await loadData();
      toast("Success", { description: "Category created.", type: "success" });
    } catch (err: any) {
      toast("Error", { description: err?.message || "Failed to create category.", type: "error" });
    }
  }

  async function addAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!assetCampusId) return toast("Select campus first", { type: "warning" });
    try {
      await apiJson(`/inventory/assets`, {
        method: "POST",
        body: JSON.stringify({
          categoryId: assetCategoryId,
          campusId: assetCampusId,
          name: assetName,
          quantity: Number(assetQuantity),
          status: assetStatus,
        }),
      });
      setAssetName("");
      setAssetQuantity("");
      setAssetStatus("Active");
      await loadData();
      toast("Success", { description: "Asset added.", type: "success" });
    } catch (err: any) {
      toast("Error", { description: err?.message || "Failed to add asset.", type: "error" });
    }
  }

  async function addRequisition(e: React.FormEvent) {
    e.preventDefault();
    if (!reqCampusId) return toast("Select campus first", { type: "warning" });
    try {
      await apiJson(`/inventory/requisitions`, {
        method: "POST",
        body: JSON.stringify({
          campusId: reqCampusId,
          itemName: reqItemName,
          quantity: Number(reqQuantity),
          estimatedCost: reqEstimatedCost ? Number(reqEstimatedCost) : undefined,
          purpose: reqPurpose || undefined,
          status: reqStatus,
        }),
      });
      setReqItemName("");
      setReqQuantity("");
      setReqEstimatedCost("");
      setReqPurpose("");
      setReqStatus("Pending");
      await loadData();
      toast("Success", { description: "Requisition created.", type: "success" });
    } catch (err: any) {
      toast("Error", { description: err?.message || "Failed to create requisition.", type: "error" });
    }
  }

  async function updateRequisitionStatus(id: string, status: string) {
    try {
      await apiJson(`/inventory/requisitions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadData();
      toast("Updated", { description: `Requisition set to ${status}.`, type: "success" });
    } catch (err: any) {
      toast("Error", { description: err?.message || "Failed to update requisition.", type: "error" });
    }
  }

  async function updateAssetStatus(id: string, status: string) {
    try {
      await apiJson(`/inventory/assets/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadData();
      toast("Updated", { description: `Asset set to ${status}.`, type: "success" });
    } catch (err: any) {
      toast("Error", { description: err?.message || "Failed to update asset.", type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Loading inventory…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Inventory & Assets</h1>
        <p className="text-sm text-text-secondary">Manage assets and purchase requisitions for one school.</p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "assets", label: "Assets", icon: <Store className="w-4 h-4" /> },
          { id: "categories", label: "Categories", icon: <Toolbox className="w-4 h-4" /> },
          { id: "requisitions", label: "Requisitions", icon: <RefreshCcw className="w-4 h-4" /> },
        ]}
      />

      {activeTab === "categories" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Add Asset Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={addCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input label="Category Name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
              <Button type="submit">Create</Button>
            </form>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Existing Categories</h3>
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li key={c.id} className="p-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60">
                    <strong>{c.name}</strong>
                  </li>
                ))}
              </ul>
              {categories.length === 0 && <p className="text-sm text-text-secondary">No categories yet.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "assets" && (
        <div className="grid grid-cols-1 xl:grid-cols-[460px,1fr] gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addAsset} className="space-y-4">
                <Select
                  label="Category"
                  value={assetCategoryId}
                  onChange={(e) => setAssetCategoryId(e.target.value)}
                  options={categoryOptions}
                  required
                />
                <Select
                  label="Campus"
                  value={assetCampusId}
                  onChange={(e) => setAssetCampusId(e.target.value)}
                  options={campusOptions.length ? campusOptions : [{ label: "Set active campus from sidebar switcher", value: "" }]}
                />
                <Input label="Asset Name" value={assetName} onChange={(e) => setAssetName(e.target.value)} required />
                <Input label="Quantity" type="number" value={assetQuantity} onChange={(e) => setAssetQuantity(e.target.value)} required />
                <Select
                  label="Status"
                  value={assetStatus}
                  onChange={(e) => setAssetStatus(e.target.value)}
                  options={assetStatusOptions}
                />
                <Button type="submit" className="w-full">Add Asset</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-sm text-text-secondary">No assets found for this campus.</p>
              ) : (
                <ul className="space-y-3">
                  {assets.map((a) => (
                    <li key={a.id} className="p-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-text-primary">{a.name}</div>
                          <div className="text-xs text-text-secondary mt-1">
                            {a.category?.name || "Category"} · Qty: {a.quantity} · {a.campus?.name || "Campus"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            label=""
                            value={a.status || "Active"}
                            onChange={(e) => updateAssetStatus(a.id, e.target.value)}
                            options={assetStatusOptions}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "requisitions" && (
        <div className="grid grid-cols-1 xl:grid-cols-[520px,1fr] gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Purchase Requisition</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addRequisition} className="space-y-4">
                <Input label="Campus ID (from switcher)" value={reqCampusId} onChange={(e) => setReqCampusId(e.target.value)} disabled />
                <Input label="Item Name" value={reqItemName} onChange={(e) => setReqItemName(e.target.value)} required />
                <Input label="Quantity" type="number" value={reqQuantity} onChange={(e) => setReqQuantity(e.target.value)} required />
                <Input label="Estimated Cost (optional)" type="number" value={reqEstimatedCost} onChange={(e) => setReqEstimatedCost(e.target.value)} />
                <Input label="Purpose (optional)" value={reqPurpose} onChange={(e) => setReqPurpose(e.target.value)} />
                <Select
                  label="Status"
                  value={reqStatus}
                  onChange={(e) => setReqStatus(e.target.value)}
                  options={requisitionStatusOptions}
                />
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              {requisitions.length === 0 ? (
                <p className="text-sm text-text-secondary">No requisitions found.</p>
              ) : (
                <ul className="space-y-3">
                  {requisitions.map((r) => (
                    <li key={r.id} className="p-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-text-primary">{r.itemName}</div>
                          <div className="text-xs text-text-secondary mt-1">
                            Qty: {r.quantity} · Status: {r.status} · Campus: {r.campus?.name || "—"}
                          </div>
                          {r.purpose && <div className="text-xs text-text-secondary mt-2">{r.purpose}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateRequisitionStatus(r.id, "Approved")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => updateRequisitionStatus(r.id, "Rejected")}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

