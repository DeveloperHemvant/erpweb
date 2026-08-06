"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { ShieldCheck, Trash2, Plus } from "lucide-react";

interface RoleDef {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  status: string;
}

const MODULES = [
  { key: "students", label: "Student Registry" },
  { key: "staff", label: "Staff Management" },
  { key: "masterdata", label: "Master Data Config" },
  { key: "fees", label: "Fees & Ledger" },
  { key: "attendance", label: "Attendance Logs" },
  { key: "reportcards", label: "Report Cards" },
  { key: "roles", label: "Roles & Permissions" },
];
const ACTIONS = ["create", "read", "update", "delete", "export"];

export default function RolesPermissionsPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  // Stateful roles from backend
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // New role dialog state
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);

  // Fetch roles from backend
  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/roles`);
      if (!res.ok) throw new Error("Failed to load roles.");
      const data = await res.json();
      setRoles(data);
      if (data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data[0].id);
      }
    } catch {
      toast("Error", { description: "NestJS roles backend endpoint offline.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const activeRole = roles.find((r) => r.id === selectedRoleId);

  // Update permissions on checkbox click
  const handlePermissionToggle = async (role: RoleDef, permissionKey: string) => {
    let updatedPermissions = [...role.permissions];
    if (updatedPermissions.includes(permissionKey)) {
      updatedPermissions = updatedPermissions.filter((p) => p !== permissionKey);
    } else {
      updatedPermissions.push(permissionKey);
    }

    try {
      const res = await fetch(`${API_URL}/roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: updatedPermissions }),
      });

      if (!res.ok) throw new Error();

      // Update local state
      setRoles((prev) =>
        prev.map((r) => (r.id === role.id ? { ...r, permissions: updatedPermissions } : r))
      );
      toast("Permission Updated", { description: "Synced successfully with PostgreSQL.", type: "success" });
    } catch {
      toast("Sync Failed", { description: "Could not persist permission change.", type: "error" });
    }
  };

  // Create new role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc,
          permissions: newRolePerms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create role.");
      }

      toast("Role Created", { description: `"${newRoleName}" registered successfully.`, type: "success" });
      setIsAddRoleOpen(false);
      fetchRoles();
    } catch (err: any) {
      toast("Error", { description: err.message || "Could not save role.", type: "error" });
    }
  };

  // Delete role
  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const res = await fetch(`${API_URL}/roles/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete role.");
      }

      toast("Role Deleted", { type: "warning" });
      if (selectedRoleId === id) {
        setSelectedRoleId("");
      }
      fetchRoles();
    } catch (err: any) {
      toast("Delete Failed", { description: err.message || "Could not remove role.", type: "error" });
    }
  };

  const toggleNewRolePerm = (perm: string) => {
    setNewRolePerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Access Controls &amp; Role Hierarchy
          </h1>
          <p className="text-sm text-text-secondary">
            Configure security profiles, permission tables, and user levels linked to PostgreSQL tables.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4.5 w-4.5" />}
          onClick={() => {
            setNewRoleName("");
            setNewRoleDesc("");
            setNewRolePerms([]);
            setIsAddRoleOpen(true);
          }}
        >
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Roles list */}
        <aside className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Profiles</CardTitle>
              <CardDescription>Click a profile level to view and configure permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-text-secondary italic">
                  Loading database records...
                </div>
              ) : roles.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-secondary italic">
                  No roles found. Seed database to default.
                </div>
              ) : (
                roles.map((role) => {
                  const isSelected = role.id === selectedRoleId;
                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`flex items-center justify-between p-3.5 rounded-card border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-soft"
                          : "bg-card border-border hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-text-primary">{role.name}</span>
                          <Badge variant={role.status === "Active" ? "success" : "neutral"}>
                            {role.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-normal max-w-[200px]">
                          {role.description || "No description provided."}
                        </p>
                      </div>

                      {role.name !== "Super Admin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role.id);
                          }}
                          className="text-text-secondary hover:text-danger p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Permissions matrix */}
        <div className="lg:col-span-2 space-y-6">
          {activeRole ? (
            <Card>
              <CardHeader>
                <CardTitle>Permissions Matrix - {activeRole.name}</CardTitle>
                <CardDescription>Grant specific functional permissions to the selected security profile level.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource Module</TableHead>
                      {ACTIONS.map(action => (
                        <TableHead key={action} className="text-center capitalize">{action}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map((module) => (
                      <TableRow key={module.key}>
                        <TableCell className="font-semibold text-text-primary">{module.label}</TableCell>
                        {ACTIONS.map(action => {
                          const permKey = `${module.key}:${action}`;
                          return (
                            <TableCell key={action} className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={activeRole.permissions.includes(permKey) || activeRole.permissions.includes("*")}
                                  disabled={activeRole.permissions.includes("*")}
                                  onChange={() => handlePermissionToggle(activeRole, permKey)}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center text-xs text-text-secondary border border-dashed rounded-card bg-slate-50 dark:bg-slate-900/10">
              Select a security role to audit permissions.
            </div>
          )}

          {/* Guidelines */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-card border border-border flex gap-3.5 items-start">
            <ShieldCheck className="h-5 w-5 text-success mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-text-primary">Clearance Level Status Checked</h4>
              <p className="text-xs text-text-secondary leading-relaxed font-medium">
                Permissions are validated globally at the database level. Super Admin roles are automatically granted wildcard `[&quot;*&quot;]` privileges and cannot be unmapped.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE ROLE MODAL */}
      <Modal isOpen={isAddRoleOpen} onClose={() => setIsAddRoleOpen(false)} title="Create Security Role">
        <form onSubmit={handleCreateRole} className="space-y-5">
          <Input
            label="Role Name *"
            placeholder="e.g. Registrar Officer"
            required
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />

          <Input
            label="Role Description"
            placeholder="Brief description of this role's purpose..."
            value={newRoleDesc}
            onChange={(e) => setNewRoleDesc(e.target.value)}
          />

          {/* Perm checkboxes inside modal */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary block">Select Permission Scopes:</label>
            <div className="grid grid-cols-1 gap-2 text-xs p-3 bg-slate-50 dark:bg-slate-800/40 rounded-btn border max-h-64 overflow-y-auto">
              {MODULES.map(m => (
                 <div key={m.key} className="mb-2">
                   <div className="font-bold text-text-primary mb-1">{m.label}</div>
                   <div className="flex flex-wrap gap-3">
                     {ACTIONS.map(a => {
                       const pKey = `${m.key}:${a}`;
                       return (
                         <label key={pKey} className="flex items-center gap-1 cursor-pointer text-text-secondary">
                           <input
                             type="checkbox"
                             checked={newRolePerms.includes(pKey)}
                             onChange={() => toggleNewRolePerm(pKey)}
                             className="rounded border-border text-primary focus:ring-primary/20"
                           />
                           <span className="capitalize">{a}</span>
                         </label>
                       )
                     })}
                   </div>
                 </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Role
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
