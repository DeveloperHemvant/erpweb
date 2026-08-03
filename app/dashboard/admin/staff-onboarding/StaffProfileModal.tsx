"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/components/ui/toast";
import { User, FileText, Image as ImageIcon, IdCard, Download } from "lucide-react";

export function StaffProfileModal({ isOpen, onClose, staffId, API_URL, onUpdated }: any) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any>(null);
  
  // Credentials Update State
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  // For ID Cards
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [renderedIdCard, setRenderedIdCard] = useState<any>(null);

  useEffect(() => {
    if (isOpen && staffId) {
      fetchStaff();
      fetchTemplates();
    }
  }, [isOpen, staffId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/staff/${staffId}`);
      if (res.ok) {
        setStaff(await res.json());
      }
    } catch (e) {
      toast("Error", { description: "Could not load profile", type: "error" });
    }
    setLoading(false);
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/idcards/staff/${staffId}`);
      if (res.ok) {
        const data = await res.json();
        setRenderedIdCard(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBasicInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: staff.gender,
          education: staff.education,
          experience: staff.experience,
        })
      });
      if (res.ok) {
        toast("Success", { description: "Profile updated", type: "success" });
        onUpdated();
      }
    } catch (e) {
      toast("Error", { description: "Failed to update profile", type: "error" });
    }
  };

  const handleUpdateCredentials = async () => {
    if (!newEmail && !newPassword) return;
    setIsUpdatingCredentials(true);
    try {
      const res = await fetch(`${API_URL}/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail || undefined,
          passwordHash: newPassword || undefined,
        })
      });
      if (res.ok) {
        toast("Success", { description: "Credentials updated successfully", type: "success" });
        setNewEmail("");
        setNewPassword("");
        fetchStaff();
      } else {
        toast("Error", { description: "Failed to update credentials", type: "error" });
      }
    } catch (e) {
      toast("Error", { description: "Network error", type: "error" });
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/staff/${staffId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        // Now update staff profile with new URL
        await fetch(`${API_URL}/staff/${staffId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: url })
        });
        toast("Success", { description: "Photo uploaded", type: "success" });
        fetchStaff();
        onUpdated();
      }
    } catch (e) {
      toast("Error", { description: "Failed to upload photo", type: "error" });
    }
  };

  const renderIdCard = async () => {
    if (!selectedTemplateId) return;
    try {
      const res = await fetch(`${API_URL}/templates/render?templateId=${selectedTemplateId}&targetId=${staffId}`);
      if (res.ok) {
        setRenderedIdCard(await res.json());
      }
    } catch (e) {
      toast("Error", { description: "Failed to render ID card", type: "error" });
    }
  };

  useEffect(() => {
    if (activeTab === "idcard" && selectedTemplateId) {
      renderIdCard();
    }
  }, [activeTab, selectedTemplateId]);

  if (!staff && loading) {
    return <Modal isOpen={isOpen} onClose={onClose} title="Staff Profile"><div className="p-8 text-center">Loading...</div></Modal>;
  }
  if (!staff) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Profile: ${staff.fullName}`} size="lg">
      <div className="flex gap-6 p-4">
        {/* Sidebar */}
        <div className="w-1/4 shrink-0 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full border border-border bg-slate-100 flex items-center justify-center overflow-hidden mb-4">
            {staff.photoUrl ? (
              <img src={staff.photoUrl} alt="Staff" className="w-full h-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-slate-300" />
            )}
          </div>
          <h3 className="font-semibold text-center">{staff.fullName}</h3>
          <p className="text-xs text-text-secondary text-center">{staff.role?.name}</p>
          <div className="w-full mt-6">
            <Tabs
              activeTab={activeTab}
              onChange={setActiveTab}
              orientation="vertical"
              options={[
                { id: "basic", label: "Basic Info", icon: <User className="h-4 w-4" /> },
                { id: "photo", label: "Photo", icon: <ImageIcon className="h-4 w-4" /> },
                { id: "docs", label: "Documents", icon: <FileText className="h-4 w-4" /> },
                { id: "idcard", label: "ID Card", icon: <IdCard className="h-4 w-4" /> },
              ]}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-[400px] border-l border-border pl-6">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h4 className="text-lg font-semibold text-primary">Basic Information</h4>
                <p className="text-sm text-text-secondary">Update the staff member's core HR details and demographic data.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input label="Full Name" value={staff.fullName} disabled />
                  <Select 
                    label="Gender" 
                    value={staff.gender || ""} 
                    onChange={(e) => setStaff({...staff, gender: e.target.value})}
                    options={[{label: "Select Gender", value: ""}, {label: "Male", value: "Male"}, {label: "Female", value: "Female"}, {label: "Other", value: "Other"}]}
                  />
                </div>
                
                <div className="space-y-4">
                  <Input label="Highest Education" value={staff.education || ""} onChange={(e) => setStaff({...staff, education: e.target.value})} placeholder="e.g. M.Sc. Biology" />
                  <Input label="Years of Experience" type="number" value={staff.experience || ""} onChange={(e) => setStaff({...staff, experience: e.target.value})} placeholder="e.g. 5" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button onClick={handleUpdateBasicInfo} size="lg" className="w-full md:w-auto">Save Changes</Button>
              </div>

              {staff.role?.name === "Teacher" && staff.details?.subjectExpertise && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-sm font-semibold text-primary mb-3">Teacher Qualifications</h4>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border">
                    <p className="text-sm mb-2"><span className="font-semibold text-text-secondary">Subject Expertise:</span> {staff.details.subjectExpertise.length > 0 ? staff.details.subjectExpertise.join(", ") : "None"}</p>
                    <p className="text-sm"><span className="font-semibold text-text-secondary">Class Range:</span> {staff.details.classRange?.length > 0 ? staff.details.classRange.join(", ") : "None"}</p>
                  </div>
                </div>
              )}

              {/* Portal Credentials Section */}
              <div className="mt-8 border-t pt-6">
                <h4 className="font-semibold text-base mb-4 text-primary">Portal Access Credentials</h4>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Current Email: <span className="font-normal text-text-secondary">{staff.email}</span></p>
                    <p className="text-xs text-text-secondary">Updating credentials will instantly modify the staff member's login access.</p>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-text-secondary font-medium mb-1 block">New Email / Username</label>
                      <Input 
                        placeholder="Enter new email..." 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-text-secondary font-medium mb-1 block">New Password</label>
                      <Input 
                        type="password"
                        placeholder="Enter new password..." 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="primary" 
                      disabled={isUpdatingCredentials || (!newEmail && !newPassword)}
                      onClick={handleUpdateCredentials}
                    >
                      Update Access
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "photo" && (
            <div className="space-y-4">
              <h4 className="font-semibold border-b pb-2">Profile Photo</h4>
              <p className="text-sm text-text-secondary">Upload a square photo (ideally 400x400px) for the staff profile and ID card.</p>
              <FileUpload
                label="Upload Photo"
                accept="image/*"
                onFileSelect={(file: File) => handleUploadPhoto(file)}
              />
            </div>
          )}

          {activeTab === "docs" && (
            <div className="space-y-4">
              <h4 className="font-semibold border-b pb-2">HR Documents</h4>
              <p className="text-sm text-text-secondary mb-4">Upload resumes, certificates, and ID proofs.</p>
              <FileUpload label="Upload Document" accept=".pdf" />
              <div className="mt-6 border rounded-card bg-slate-50 p-8 text-center text-xs text-text-secondary">
                No documents uploaded yet.
              </div>
            </div>
          )}

          {activeTab === "idcard" && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-semibold">Digital ID Card</h4>
              </div>

              {renderedIdCard ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <div 
                    className="relative overflow-hidden shadow-lg border rounded-lg flex flex-col items-center pt-6"
                    style={{
                      width: '240px', 
                      height: '380px',
                      backgroundColor: renderedIdCard.template.primaryColor,
                      color: 'white'
                    }}
                  >
                    <h3 className="font-bold text-lg mb-4">{renderedIdCard.template.schoolName}</h3>
                    
                    <div className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white shadow mb-3">
                      <img src={renderedIdCard.staff.photoUrl || "https://i.pravatar.cc/300"} alt="Photo" className="w-full h-full object-cover" />
                    </div>
                    
                    <h4 className="font-bold text-lg mb-1">{renderedIdCard.staff.fullName}</h4>
                    <p className="text-xs opacity-90 mb-4">{renderedIdCard.staff.role?.name}</p>

                    <div className="w-full bg-white text-black p-4 text-center mt-auto">
                      <p className="text-[10px] font-bold text-gray-400">ID NUMBER</p>
                      <p className="font-mono text-sm">{renderedIdCard.idNumber}</p>
                      
                      <div className="mt-3 w-32 h-8 bg-gray-200 mx-auto rounded flex items-center justify-center">
                        <span className="text-xs font-mono text-gray-500">|||| | || || | | ||</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="mt-6" variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                    Download Print File
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-text-secondary">
                  No ID Card generated for this staff member yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
