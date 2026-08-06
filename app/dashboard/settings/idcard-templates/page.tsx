"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { User, Save, Plus, Edit2, Trash2, LayoutTemplate, Palette } from "lucide-react";

export default function IdCardTemplatesPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    templateName: "",
    targetRole: "Student",
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    schoolName: "Aetheria Academy"
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/idcards/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch {
      toast("Error", { description: "Failed to fetch templates", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: any) => {
    setActiveTemplate(template);
    setFormData({
      templateName: template.templateName,
      targetRole: template.targetRole,
      primaryColor: template.primaryColor || "#3b82f6",
      secondaryColor: template.secondaryColor || "#1e40af",
      schoolName: template.schoolName || "Aetheria Academy"
    });
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setActiveTemplate(null);
    setFormData({
      templateName: "New Template",
      targetRole: "Student",
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      schoolName: "Aetheria Academy"
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (isSaving) return; // guard against double-submit creating duplicate templates
    setIsSaving(true);
    try {
      const url = activeTemplate
        ? `${API_URL}/idcards/templates/${activeTemplate.id}`
        : `${API_URL}/idcards/templates`;

      const method = activeTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast("Success", { description: "Template saved successfully", type: "success" });
        setIsEditing(false);
        fetchTemplates();
      } else {
        throw new Error();
      }
    } catch {
      toast("Error", { description: "Failed to save template", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this ID card template? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/idcards/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Deleted", { description: "Template removed", type: "success" });
        fetchTemplates();
      } else {
        throw new Error();
      }
    } catch {
      toast("Error", { description: "Failed to delete template", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Templates...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 p-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">ID Card Templates</h1>
          <p className="text-text-secondary mt-1">Design and customize identity cards for students and staff.</p>
        </div>
        {!isEditing && (
          <Button onClick={handleCreateNew} leftIcon={<Plus className="h-4 w-4" />}>
            Create Template
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map(t => (
            <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer border-t-4" style={{ borderTopColor: t.primaryColor }}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <LayoutTemplate className="h-6 w-6" style={{ color: t.primaryColor }} />
                  </div>
                  <Badge variant={t.targetRole === "Staff" ? "warning" : "primary"}>
                    {t.targetRole}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1">{t.templateName}</h3>
                <p className="text-sm text-text-secondary mb-6">{t.schoolName || "Aetheria Academy"}</p>
                
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: t.primaryColor }} />
                  <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: t.secondaryColor }} />
                  <span className="text-xs text-text-muted ml-2">Theme Colors</span>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => handleEdit(t)} leftIcon={<Edit2 className="h-4 w-4" />}>
                    Edit Design
                  </Button>
                  <Button
                    variant="outline"
                    className="text-danger border-danger/30 hover:bg-danger/10"
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
            <div className="col-span-3 text-center py-12 text-text-secondary">
              No templates found. Click &apos;Create Template&apos; to get started.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customization Panel */}
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Template Designer
              </CardTitle>
              <CardDescription>Customize the appearance of your ID cards</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Template Name"
                  value={formData.templateName}
                  onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                  placeholder="e.g. Standard Student ID"
                />
                <Select
                  label="Target Role"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                  options={[
                    { label: "Student", value: "Student" },
                    { label: "Staff", value: "Staff" }
                  ]}
                />
              </div>

              <Input
                label="School/Organization Name"
                value={formData.schoolName}
                onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                placeholder="Aetheria Academy"
              />

              <div className="space-y-3">
                <label className="text-sm font-semibold text-text-primary">Theme Colors</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
                      <input 
                        type="color" 
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      <span className="text-sm font-medium">Primary Color</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
                      <input 
                        type="color" 
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      <span className="text-sm font-medium">Secondary Color</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button variant="primary" onClick={handleSave} leftIcon={<Save className="h-4 w-4" />} className="flex-1" disabled={isSaving} isLoading={isSaving}>
                  {isSaving ? "Saving..." : "Save Template"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Panel */}
          <div className="flex flex-col items-center justify-center p-8 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300">
            <h3 className="text-lg font-bold text-slate-500 mb-8 uppercase tracking-widest">Live Preview</h3>
            
            {/* The ID Card Preview */}
            <div 
              className="relative overflow-hidden shadow-2xl rounded-2xl flex flex-col items-center pt-8 bg-white transition-all duration-300 transform hover:scale-105"
              style={{
                width: '300px', 
                height: '460px',
                backgroundColor: formData.primaryColor,
                color: 'white'
              }}
            >
              {/* Header */}
              <h3 className="font-bold text-2xl mb-8 px-4 text-center leading-tight">
                {formData.schoolName || "School Name"}
              </h3>
              
              {/* Photo Area */}
              <div 
                className="w-32 h-32 rounded-full overflow-hidden border-[6px] shadow-xl mb-6 relative bg-white flex items-center justify-center"
                style={{ borderColor: formData.secondaryColor }}
              >
                <User className="h-12 w-12 text-slate-300" />
              </div>
              
              {/* Details */}
              <h4 className="font-bold text-2xl mb-1 tracking-wide">John Doe</h4>
              <p className="text-sm opacity-90 mb-1 font-medium">{formData.targetRole === "Student" ? "Class 10 - A" : "Mathematics Teacher"}</p>
              <p className="text-xs opacity-70 mb-4">DOB: 15/08/2010</p>

              {/* Footer / Barcode */}
              <div className="w-full bg-white text-black p-5 text-center mt-auto shadow-[0_-10px_20px_rgba(0,0,0,0.1)] rounded-b-2xl">
                <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] mb-1">ID NUMBER</p>
                <p className="font-mono text-lg font-bold tracking-wider" style={{ color: formData.primaryColor }}>
                  {formData.targetRole === "Student" ? "STU-849201" : "EMP-99201"}
                </p>
                
                <div className="mt-3 w-48 h-12 mx-auto rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200" style={{ backgroundColor: '#f8fafc' }}>
                  <span className="text-sm font-mono text-gray-400 font-bold tracking-[4px]">|||| | || || | | ||</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Badge component
function Badge({ children, variant = "primary" }: any) {
  const styles = {
    primary: "bg-blue-100 text-blue-800",
    warning: "bg-amber-100 text-amber-800",
    success: "bg-green-100 text-green-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant as keyof typeof styles] || styles.primary}`}>
      {children}
    </span>
  );
}
