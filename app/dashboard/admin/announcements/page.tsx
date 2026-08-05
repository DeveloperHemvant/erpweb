"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { FileUpload } from "@/components/ui/file-upload";
import { Megaphone, Calendar, Trash2 } from "lucide-react";

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL");
  const [eventDate, setEventDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_URL}/communication/announcements`);
      if (res.ok) setAnnouncements(await res.json());
    } catch {
      toast("Failed to load announcements", { type: "error" });
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/communication/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, targetAudience, eventDate })
      });
      if (res.ok) {
        const saved = await res.json();
        if (imageFile) {
          const fd = new FormData();
          fd.append("file", imageFile);
          const imgRes = await fetch(`${API_URL}/communication/announcements/${saved.id}/image`, { method: "POST", body: fd });
          if (!imgRes.ok) toast("Posted, but the image upload failed.", { type: "error" });
        }
        toast("Announcement posted!", { type: "success" });
        setTitle(""); setBody(""); setEventDate(""); setImageFile(null); setUploadKey(k => k + 1);
        fetchAnnouncements();
      } else {
        toast("Failed to post", { type: "error" });
      }
    } catch {
      toast("Error posting announcement", { type: "error" });
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/communication/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Announcement deleted", { type: "success" });
      fetchAnnouncements();
    } catch {
      toast("Failed to delete announcement", { type: "error" });
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Announcements &amp; Communication
          </h1>
          <p className="text-sm text-text-secondary">
            Broadcast messages to the Parent and Student portals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5"/> New Broadcast</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePost} className="space-y-4">
              <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
              <div>
                <label className="block text-sm font-medium mb-1">Message Body</label>
                <Textarea 
                  value={body} 
                  onChange={e => setBody(e.target.value)} 
                  required 
                  rows={4} 
                  className="w-full text-sm" 
                  placeholder="Enter your announcement..."
                />
              </div>
              <Select
                label="Target Audience"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                options={[
                  { label: "Everyone", value: "ALL" },
                  { label: "Parents Only", value: "PARENTS" },
                  { label: "Students Only", value: "STUDENTS" }
                ]}
              />
              <Input
                label="Event Date (Optional)"
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
              />
              <FileUpload
                key={uploadKey}
                label="Banner Image (optional)"
                accept="image/png,image/jpeg,image/webp"
                onFileSelect={setImageFile}
              />
              <Button type="submit" variant="primary" className="w-full" disabled={posting}>
                {posting ? "Posting..." : "Post Announcement"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Broadcasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.map((ann, i) => (
                <div key={i} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800">
                  {ann.imageUrl && (
                    <img
                      src={`${API_URL}${ann.imageUrl}`}
                      alt={ann.title}
                      className="w-full h-32 object-cover rounded-lg mb-3 border border-border"
                    />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{ann.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-text-secondary bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                        Audience: {ann.targetAudience}
                      </span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger" onClick={() => handleDelete(ann.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{ann.body}</p>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Posted: {new Date(ann.createdAt).toLocaleDateString()}</span>
                    {ann.eventDate && (
                      <span className="flex items-center gap-1 text-primary"><Calendar className="w-4 h-4"/> Event: {new Date(ann.eventDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-text-secondary text-sm">No recent announcements.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
