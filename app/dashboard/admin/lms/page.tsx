"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, Layers, Plus, Search, FileText, Video, Link as LinkIcon, 
  MoreVertical, Edit, Trash2, CheckCircle, ChevronDown, ChevronRight, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LMSPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("courses");
  const [courses, setCourses] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  
  // Modals
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isUploadResourceOpen, setIsUploadResourceOpen] = useState(false);
  
  // Forms
  const [courseForm, setCourseForm] = useState({ title: "", description: "", status: "Draft" });
  const [resourceForm, setResourceForm] = useState({ title: "", type: "PDF", url: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, rRes] = await Promise.all([
        fetch(`${API_URL}/lms/courses`),
        fetch(`${API_URL}/lms/resources`)
      ]);
      if (cRes.ok) setCourses(await cRes.json());
      if (rRes.ok) setResources(await rRes.json());
    } catch (e) {
      console.error("Failed to fetch LMS data", e);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/lms/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm)
      });
      if (res.ok) {
        toast("Course Created", { type: "success" });
        setIsAddCourseOpen(false);
        fetchData();
      }
    } catch (e) {
      toast("Error creating course", { type: "error" });
    }
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/lms/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceForm)
      });
      if (res.ok) {
        toast("Resource Uploaded", { type: "success" });
        setIsUploadResourceOpen(false);
        fetchData();
      }
    } catch (e) {
      toast("Error uploading resource", { type: "error" });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Learning Management System</h1>
          <p className="text-text-secondary mt-1">Manage courses, digital library, and student learning paths.</p>
        </div>
      </div>

        <Tabs 
          activeTab={activeTab} 
          onChange={setActiveTab}
          options={[
            { id: "courses", label: "Course Builder" },
            { id: "library", label: "Digital Library" },
            { id: "assignments", label: "Assignments (Phase 2)" },
            { id: "live-classes", label: "Live Classes (Phase 3)" },
            { id: "ai-copilot", label: "AI Copilot" },
            { id: "students", label: "Student Progress" }
          ]}
        />

        {activeTab === "courses" && (
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Courses</CardTitle>
                  <CardDescription>Design and manage course curriculum</CardDescription>
                </div>
                <Button onClick={() => setIsAddCourseOpen(true)} variant="primary">
                  <Plus className="w-4 h-4 mr-2" /> Create Course
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.length === 0 ? (
                    <div className="col-span-full p-8 text-center border border-dashed rounded-lg text-text-secondary">
                      No courses created yet.
                    </div>
                  ) : (
                    courses.map(course => (
                      <div key={course.id} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{course.title}</h3>
                            <Badge variant={course.status === "Published" ? "success" : "neutral"}>{course.status}</Badge>
                          </div>
                          <p className="text-sm text-text-secondary line-clamp-2 mb-4">{course.description || "No description provided."}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">Manage Content</Button>
                          <Button variant="outline" size="icon"><Edit className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "library" && (
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Content Library</CardTitle>
                  <CardDescription>Central repository for all digital learning materials</CardDescription>
                </div>
                <Button onClick={() => setIsUploadResourceOpen(true)} variant="primary">
                  <Upload className="w-4 h-4 mr-2" /> Upload Resource
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">
                      No resources uploaded yet.
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                          <tr>
                            <th className="px-4 py-3 font-medium">Resource Name</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">URL</th>
                            <th className="px-4 py-3 font-medium">Date Uploaded</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {resources.map(res => (
                            <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                              <td className="px-4 py-3 font-medium">{res.title}</td>
                              <td className="px-4 py-3">
                                <Badge variant="neutral">{res.type}</Badge>
                              </td>
                              <td className="px-4 py-3 text-text-secondary truncate max-w-[200px]">{res.url}</td>
                              <td className="px-4 py-3 text-text-secondary">{new Date(res.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm">View</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Engine</CardTitle>
                <CardDescription>Manage assignments, quizzes, and grading</CardDescription>
              </CardHeader>
              <CardContent className="p-12 text-center text-text-secondary border-dashed border-t rounded-b-xl">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Assignments & Quizzes</h2>
                <p>Phase 2 implementation in progress. You will be able to create auto-graded quizzes and interactive assignments here.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "live-classes" && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Classrooms</CardTitle>
                <CardDescription>Schedule and manage virtual classrooms</CardDescription>
              </CardHeader>
              <CardContent className="p-12 text-center text-text-secondary border-dashed border-t rounded-b-xl">
                <Video className="w-12 h-12 mx-auto mb-4 text-blue-500 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Virtual Classrooms</h2>
                <p>Phase 3 implementation in progress. Zoom, Google Meet, and Jitsi integrations will appear here.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "ai-copilot" && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Teacher Copilot</CardTitle>
                <CardDescription>Generate lesson plans and quizzes with AI</CardDescription>
              </CardHeader>
              <CardContent className="p-12 text-center text-text-secondary border-dashed border-t rounded-b-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <span className="text-4xl mb-4 block">🤖</span>
                <h2 className="text-xl font-semibold mb-2 text-indigo-700 dark:text-indigo-400">AI Teaching Assistant</h2>
                <p>Generate detailed lesson plans, comprehensive rubrics, and dynamic quizzes with a single click.</p>
                <Button className="mt-6" variant="outline">Try AI Lesson Generator</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "students" && (
          <div className="mt-6">
            <Card>
              <CardContent className="p-12 text-center text-text-secondary border-dashed border-2 rounded-xl">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Student Analytics Module</h2>
                <p>This section will visualize student progress across active courses.</p>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Add Course Modal */}
      <Modal isOpen={isAddCourseOpen} onClose={() => setIsAddCourseOpen(false)} title="Create New Course">
        <form onSubmit={handleCreateCourse} className="space-y-4 pt-4">
          <Input 
            label="Course Title" 
            value={courseForm.title} 
            onChange={e => setCourseForm({...courseForm, title: e.target.value})} 
            required 
          />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={courseForm.description}
              onChange={e => setCourseForm({...courseForm, description: e.target.value})}
            />
          </div>
          <Select 
            label="Status" 
            value={courseForm.status} 
            onChange={e => setCourseForm({...courseForm, status: e.target.value})}
            options={[
              { label: "Draft", value: "Draft" },
              { label: "Published", value: "Published" }
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddCourseOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Course</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Resource Modal */}
      <Modal isOpen={isUploadResourceOpen} onClose={() => setIsUploadResourceOpen(false)} title="Upload Digital Resource">
        <form onSubmit={handleUploadResource} className="space-y-4 pt-4">
          <Input 
            label="Resource Title" 
            value={resourceForm.title} 
            onChange={e => setResourceForm({...resourceForm, title: e.target.value})} 
            required 
          />
          <Select 
            label="Resource Type" 
            value={resourceForm.type} 
            onChange={e => setResourceForm({...resourceForm, type: e.target.value})}
            options={[
              { label: "PDF Document", value: "PDF" },
              { label: "Video Link", value: "VIDEO" },
              { label: "External Link", value: "LINK" }
            ]}
          />
          <Input 
            label="File URL / Link" 
            value={resourceForm.url} 
            onChange={e => setResourceForm({...resourceForm, url: e.target.value})} 
            required 
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsUploadResourceOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Upload Resource</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
