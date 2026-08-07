"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Save, Plus, Trash2 } from "lucide-react";

export default function CertificateMakerPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<any>(null);

  // Issue Certificate
  const [issueQuery, setIssueQuery] = useState("");
  const [issueResults, setIssueResults] = useState<any[]>([]);
  const [issueStudent, setIssueStudent] = useState<any | null>(null);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueType, setIssueType] = useState("MERIT");
  const [issuedCertificates, setIssuedCertificates] = useState<any[]>([]);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/templates`);
      if (res.ok) setTemplates(await res.json());
    } catch {
      toast("Error", { description: "Failed to fetch templates", type: "error" });
    }
  };

  const handleCreateNew = () => {
    setActiveTemplate({
      name: "New Template",
      type: "CERTIFICATE",
      targetAudience: "STUDENT",
      designJson: {
        backgroundUrl: "https://via.placeholder.com/240x380?text=Background",
        fields: [
          { key: "[FULL_NAME]", x: 20, y: 150, fontSize: 16, color: "#000", fontWeight: "bold" },
          { key: "[ROLE]", x: 20, y: 180, fontSize: 14, color: "#555" },
          { key: "[PHOTO]", x: 80, y: 30, width: 80, height: 100 }
        ]
      }
    });
  };

  const handleSave = async () => {
    try {
      const method = activeTemplate.id ? "PATCH" : "POST";
      const url = activeTemplate.id ? `${API_URL}/templates/${activeTemplate.id}` : `${API_URL}/templates`;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeTemplate)
      });
      if (res.ok) {
        toast("Success", { description: "Template saved successfully", type: "success" });
        fetchTemplates();
        if (!activeTemplate.id) {
          setActiveTemplate(await res.json());
        }
      }
    } catch {
      toast("Error", { description: "Failed to save template", type: "error" });
    }
  };

  const searchStudentsForIssue = async (q: string) => {
    setIssueQuery(q);
    if (q.trim().length < 2) { setIssueResults([]); return; }
    try {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const all = await res.json();
        setIssueResults(all.filter((r: any) => r.entityType === "student"));
      }
    } catch {
      // silent -- search-as-you-type shouldn't toast on every keystroke failure
    }
  };

  const fetchIssuedCertificates = async (templateId: string) => {
    try {
      const res = await fetch(`${API_URL}/templates/${templateId}/certificates`);
      if (res.ok) setIssuedCertificates(await res.json());
    } catch {
      // non-fatal, list just stays empty
    }
  };

  const handleIssueCertificate = async () => {
    if (!activeTemplate?.id || !issueStudent || !issueTitle.trim()) {
      toast("Validation", { description: "Select a student and enter a title.", type: "error" });
      return;
    }
    setIssuing(true);
    try {
      const res = await fetch(`${API_URL}/templates/${activeTemplate.id}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: issueStudent.id, type: issueType, title: issueTitle.trim() }),
      });
      if (res.ok) {
        toast("Success", { description: `Certificate issued to ${issueStudent.title}.`, type: "success" });
        setIssueStudent(null);
        setIssueQuery("");
        setIssueResults([]);
        setIssueTitle("");
        fetchIssuedCertificates(activeTemplate.id);
      } else {
        const body = await res.json().catch(() => ({}));
        toast("Error", { description: body.message || "Failed to issue certificate.", type: "error" });
      }
    } catch {
      toast("Error", { description: "Failed to issue certificate.", type: "error" });
    } finally {
      setIssuing(false);
    }
  };

  const addField = () => {
    const newField = { key: "[NEW_FIELD]", x: 50, y: 50, fontSize: 12, color: "#000" };
    setActiveTemplate({
      ...activeTemplate,
      designJson: { ...activeTemplate.designJson, fields: [...(activeTemplate.designJson.fields || []), newField] }
    });
  };

  const updateField = (idx: number, key: string, val: any) => {
    const newFields = [...activeTemplate.designJson.fields];
    newFields[idx][key] = val;
    setActiveTemplate({
      ...activeTemplate,
      designJson: { ...activeTemplate.designJson, fields: newFields }
    });
  };

  const removeField = (idx: number) => {
    const newFields = [...activeTemplate.designJson.fields];
    newFields.splice(idx, 1);
    setActiveTemplate({
      ...activeTemplate,
      designJson: { ...activeTemplate.designJson, fields: newFields }
    });
  };

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    // Use setPointerCapture to keep tracking even if mouse leaves the element slightly
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingIdx(idx);
    
    // Calculate the offset of where we clicked inside the draggable element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null) return;
    e.preventDefault();
    
    // Canvas element
    const canvas = e.currentTarget.getBoundingClientRect();
    
    // newX = pointer position - canvas left - offset inside element
    const newX = Math.round(e.clientX - canvas.left - dragOffset.x);
    const newY = Math.round(e.clientY - canvas.top - dragOffset.y);
    
    updateField(draggingIdx, 'x', newX);
    updateField(draggingIdx, 'y', newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingIdx !== null) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingIdx(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-text-secondary">
        <span className="font-semibold text-text-primary">Free-form document designer.</span> Use this for printable certificates (bonafide, transfer, etc.) with custom field placement.
        For the Student/Staff ID cards actually issued in the system, use{" "}
        <a href="/dashboard/settings/idcard-templates" className="text-primary underline underline-offset-2">ID Card Templates</a> instead.
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Certificate Designer</h1>
          <p className="text-sm text-text-secondary">Design dynamic layouts for printable certificates and documents.</p>
        </div>
        <Button onClick={handleCreateNew} leftIcon={<Plus className="h-4 w-4" />}>Create Template</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Saved Templates</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {templates.length === 0 && <p className="text-xs text-text-secondary">No templates found.</p>}
              {templates.map(t => (
                <div 
                  key={t.id} 
                  className={`p-3 rounded-card border cursor-pointer transition-colors ${activeTemplate?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-slate-50'}`}
                  onClick={() => {
                    setActiveTemplate(t);
                    setIssueStudent(null);
                    setIssueQuery("");
                    setIssueResults([]);
                    setIssueTitle("");
                    setIssuedCertificates([]);
                    if (t.type === "CERTIFICATE") fetchIssuedCertificates(t.id);
                  }}
                >
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-text-secondary">{t.type} - {t.targetAudience}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {activeTemplate ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle>Template Editor</CardTitle>
                <Button size="sm" onClick={handleSave} leftIcon={<Save className="h-4 w-4" />}>Save Template</Button>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Configuration Panel */}
                <div className="space-y-4">
                  <Input label="Template Name" value={activeTemplate.name} onChange={(e) => setActiveTemplate({...activeTemplate, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <Select 
                      label="Template Type" 
                      value={activeTemplate.type} 
                      onChange={(e) => setActiveTemplate({...activeTemplate, type: e.target.value})}
                      options={[{label:"ID Card", value:"ID_CARD"}, {label:"Certificate", value:"CERTIFICATE"}]}
                    />
                    <Select 
                      label="Target Audience" 
                      value={activeTemplate.targetAudience} 
                      onChange={(e) => setActiveTemplate({...activeTemplate, targetAudience: e.target.value})}
                      options={[{label:"Staff", value:"STAFF"}, {label:"Student", value:"STUDENT"}]}
                    />
                  </div>
                  
                  <Input 
                    label="Background Image URL" 
                    value={activeTemplate.designJson.backgroundUrl || ""} 
                    onChange={(e) => setActiveTemplate({...activeTemplate, designJson: {...activeTemplate.designJson, backgroundUrl: e.target.value}})} 
                  />

                  <div className="mt-8 border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-sm">Dynamic Fields</h4>
                      <Button size="sm" variant="outline" onClick={addField}>+ Add Field</Button>
                    </div>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                      {(activeTemplate.designJson.fields || []).map((f: any, idx: number) => (
                        <div key={idx} className="p-4 border border-border rounded-lg bg-white shadow-sm space-y-3 relative group">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="absolute top-2 right-2 h-7 w-7 p-0 text-danger opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => removeField(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <div className="w-[85%]">
                            <Input label="Variable / Key" value={f.key} onChange={(e) => updateField(idx, 'key', e.target.value)} placeholder="e.g. [FULL_NAME]" />
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Input label="X Pos (px)" type="number" value={f.x} onChange={(e) => updateField(idx, 'x', Number(e.target.value))} />
                            <Input label="Y Pos (px)" type="number" value={f.y} onChange={(e) => updateField(idx, 'y', Number(e.target.value))} />
                            {f.key !== "[PHOTO]" ? (
                              <>
                                <Input label="Size (px)" type="number" value={f.fontSize || 12} onChange={(e) => updateField(idx, 'fontSize', Number(e.target.value))} />
                                <Input label="Color" value={f.color || "#000000"} onChange={(e) => updateField(idx, 'color', e.target.value)} />
                                <Select 
                                  label="Font Weight" 
                                  value={f.fontWeight || "normal"} 
                                  onChange={(e) => updateField(idx, 'fontWeight', e.target.value)}
                                  options={[{label:"Normal", value:"normal"}, {label:"Bold", value:"bold"}, {label:"Bolder", value:"bolder"}]}
                                />
                              </>
                            ) : (
                              <>
                                <Input label="Width (px)" type="number" value={f.width || 80} onChange={(e) => updateField(idx, 'width', Number(e.target.value))} />
                                <Input label="Height (px)" type="number" value={f.height || 100} onChange={(e) => updateField(idx, 'height', Number(e.target.value))} />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Preview Panel */}
                <div className="flex items-start justify-center bg-slate-100 rounded-card border overflow-auto p-4 min-h-[400px]">
                  <div 
                    className="relative bg-white shadow-xl border border-slate-300 flex-shrink-0 select-none"
                    style={{
                      width: activeTemplate.type === 'ID_CARD' ? '240px' : '600px',
                      height: activeTemplate.type === 'ID_CARD' ? '380px' : '400px',
                      backgroundImage: `url(${activeTemplate.designJson.backgroundUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {(activeTemplate.designJson.fields || []).map((f: any, idx: number) => (
                      f.key === "[PHOTO]" ? (
                        <div 
                          key={idx}
                          onPointerDown={(e) => handlePointerDown(e, idx)}
                          className={`absolute border flex items-center justify-center text-[10px] font-medium cursor-move transition-colors
                            ${draggingIdx === idx ? 'border-primary bg-primary/20 shadow-md ring-2 ring-primary/50' : 'border-dashed border-primary bg-primary/10 text-primary hover:bg-primary/20'}`}
                          style={{ left: f.x, top: f.y, width: f.width || 80, height: f.height || 100 }}
                        >
                          [PHOTO SPACE]
                        </div>
                      ) : (
                        <div
                          key={idx}
                          onPointerDown={(e) => handlePointerDown(e, idx)}
                          className={`absolute border px-1 whitespace-nowrap cursor-move transition-colors
                            ${draggingIdx === idx ? 'border-primary shadow-md bg-white/50 ring-2 ring-primary/50' : 'border-dashed border-primary/30 hover:border-primary'}`}
                          style={{
                            left: f.x, top: f.y,
                            fontSize: f.fontSize || 12,
                            color: f.color || "#000",
                            fontWeight: f.fontWeight || "normal"
                          }}
                        >
                          {f.key}
                        </div>
                      )
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-text-secondary border rounded-card bg-slate-50">
              Select a template to edit or create a new one.
            </div>
          )}

          {activeTemplate?.id && activeTemplate.type === "CERTIFICATE" && (
            <Card className="mt-6">
              <CardHeader><CardTitle>Issue Certificate</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      label="Student"
                      placeholder="Search by name or admission number..."
                      value={issueStudent ? issueStudent.title : issueQuery}
                      onChange={(e) => { setIssueStudent(null); searchStudentsForIssue(e.target.value); }}
                    />
                    {issueResults.length > 0 && !issueStudent && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-border rounded-card shadow-lg max-h-48 overflow-y-auto">
                        {issueResults.map((s) => (
                          <div
                            key={s.id}
                            className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                            onClick={() => { setIssueStudent(s); setIssueResults([]); }}
                          >
                            {s.title}
                            {s.subtitle ? <span className="text-text-secondary"> — {s.subtitle}</span> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Select
                    label="Type"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    options={[
                      { label: "Merit", value: "MERIT" },
                      { label: "Participation", value: "PARTICIPATION" },
                      { label: "Completion", value: "COMPLETION" },
                    ]}
                  />
                </div>
                <Input label="Certificate Title" placeholder="e.g. Merit Certificate" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} />
                <Button onClick={handleIssueCertificate} disabled={issuing || !issueStudent || !issueTitle.trim()}>
                  {issuing ? "Issuing..." : "Issue Certificate"}
                </Button>

                {issuedCertificates.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">Issued from this template</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {issuedCertificates.map((c) => (
                        <div key={c.id} className="flex justify-between text-sm px-3 py-2 rounded-card border border-border">
                          <span>{c.title} <span className="text-text-secondary">({c.type})</span></span>
                          <span className="text-text-secondary">{new Date(c.issueDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
