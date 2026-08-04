"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/components/ui/toast";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  HelpCircle,
  FileText,
  Clock,
  Compass,
  BookOpen,
  MapPin,
  Activity,
  Boxes
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  group?: "core" | "administration" | "operational" | "system";
  reqModule?: string;
}

import { hasModuleAccess, getUserFromStorage } from "@/lib/auth";

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [school, setSchool] = useState("Main HQ Campus");
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const ERP_API_URL = `${API_URL}/erp-core`;
  const MASTER_DATA_API_URL = `${API_URL}/master-data`;

  useEffect(() => {
    setUserProfile(getUserFromStorage());
    setMounted(true);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("activeCampus");
    if (stored) setSchool(stored);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const authHeaders = { Authorization: `Bearer ${token}` };

    fetch(`${MASTER_DATA_API_URL}/campuses`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCampuses(data);
          if (data.length > 0 && !stored) {
            setSchool(data[0].name);
            localStorage.setItem("activeCampus", data[0].name);
            localStorage.setItem("activeCampusId", data[0].id);
          }
        }
      })
      .catch(() => {});

    fetch(`${MASTER_DATA_API_URL}/sessions`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const active = data.find((s) => s.isActive) || data[0];
          if (active) setActiveSession(active.name);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleCampusChange = (name: string) => {
    setSchool(name);
    localStorage.setItem("activeCampus", name);
    const matched = campuses.find((c) => c.name === name);
    if (matched) {
      localStorage.setItem("activeCampusId", matched.id);
    }
    toast(`Switched to ${name}`, { type: "info" });
    window.dispatchEvent(new Event("campusChanged"));
  };

  // Keyboard shortcut listener (Cmd+K or Ctrl+K for global search focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search");
        searchInput?.focus();
        toast("Search Focus Activated", { description: "Use arrow keys to navigate suggestions", type: "info" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toast]);

  const menuItems: SidebarItem[] = [
    // Core — used every day, top of mind
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, group: "core" },
    { name: "My Calendar", href: "/dashboard/calendar", icon: <Calendar className="h-4 w-4" />, group: "core", reqModule: "attendance" },
    { name: "Attendance Desk", href: "/dashboard/admin/attendance", icon: <UserCheck className="h-4 w-4" />, group: "core", reqModule: "attendance" },
    { name: "Student Showcase", href: "/dashboard/students", icon: <Users className="h-4 w-4" />, group: "core", reqModule: "students" },
    { name: "Fees & Finance", href: "/dashboard/fees", icon: <DollarSign className="h-4 w-4" />, group: "core", reqModule: "fees" },

    // Student & Academic Admin — in the order a student actually moves through the year
    { name: "Student Admissions", href: "/dashboard/admin/admissions", icon: <GraduationCap className="h-4 w-4" />, group: "administration", reqModule: "students" },
    { name: "School Calendar (Holidays & Terms)", href: "/dashboard/admin/calendar", icon: <Calendar className="h-4 w-4" />, group: "administration", reqModule: "masterdata" },
    { name: "Timetable Desk", href: "/dashboard/admin/timetable", icon: <Calendar className="h-4 w-4" />, group: "administration", reqModule: "masterdata" },
    { name: "LMS Course Desk", href: "/dashboard/admin/lms", icon: <BookOpen className="h-4 w-4" />, group: "administration", reqModule: "reportcards" },
    { name: "Exams Desk (EMS)", href: "/dashboard/admin/exams", icon: <FileText className="h-4 w-4" />, group: "administration", reqModule: "reportcards" },
    { name: "Report Cards", href: "/dashboard/admin/report-cards", icon: <FileText className="h-4 w-4" />, group: "administration", reqModule: "reportcards" },
    { name: "Student Promotion", href: "/dashboard/admin/promotions", icon: <GraduationCap className="h-4 w-4" />, group: "administration", reqModule: "students" },
    { name: "Admissions Pipeline", href: "/dashboard/admin/admissions-pipeline", icon: <GraduationCap className="h-4 w-4" />, group: "administration", reqModule: "admissionspipeline" },
    { name: "Discipline & Behavior", href: "/dashboard/admin/discipline", icon: <HelpCircle className="h-4 w-4" />, group: "administration", reqModule: "discipline" },

    // Staff & Operations — staff lifecycle, then day-to-day operational desks
    { name: "Staff Onboarding", href: "/dashboard/admin/staff-onboarding", icon: <Users className="h-4 w-4" />, group: "operational", reqModule: "staff" },
    { name: "HR & Payroll", href: "/dashboard/admin/hr", icon: <FileText className="h-4 w-4" />, group: "operational", reqModule: "staff" },
    { name: "Transport", href: "/dashboard/admin/transport", icon: <MapPin className="h-4 w-4" />, group: "operational", reqModule: "masterdata" },
    { name: "Hostel & Mess", href: "/dashboard/admin/hostel", icon: <HelpCircle className="h-4 w-4" />, group: "operational", reqModule: "masterdata" },
    { name: "Health Centre", href: "/dashboard/admin/health-records", icon: <HelpCircle className="h-4 w-4" />, group: "operational", reqModule: "healthrecords" },
    { name: "Library", href: "/dashboard/admin/library", icon: <BookOpen className="h-4 w-4" />, group: "operational", reqModule: "masterdata" },
    { name: "Inventory & Assets", href: "/dashboard/admin/inventory", icon: <Boxes className="h-4 w-4" />, group: "operational", reqModule: "masterdata" },
    { name: "ID Card Templates", href: "/dashboard/settings/idcard-templates", icon: <FileText className="h-4 w-4" />, group: "operational", reqModule: "masterdata" },
    { name: "Certificate Designer", href: "/dashboard/admin/certificates", icon: <FileText className="h-4 w-4" />, group: "operational", reqModule: "masterdata" },
    { name: "Announcements", href: "/dashboard/admin/announcements", icon: <Bell className="h-4 w-4" />, group: "operational", reqModule: "masterdata" },

    // System — configured once, revisited rarely
    { name: "Master Data Config", href: "/dashboard/admin/master-data", icon: <Compass className="h-4 w-4" />, group: "system", reqModule: "masterdata" },
    { name: "Roles & Permissions", href: "/dashboard/admin/roles-permissions", icon: <Settings className="h-4 w-4" />, group: "system", reqModule: "roles" },
    { name: "Bulk Data Import", href: "/dashboard/admin/import", icon: <FileText className="h-4 w-4" />, group: "system", reqModule: "masterdata" },
    { name: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: <Activity className="h-4 w-4" />, group: "system", reqModule: "roles" },
    { name: "Server Monitoring", href: "/dashboard/admin/monitoring", icon: <Activity className="h-4 w-4" />, group: "system", reqModule: "roles" },
    { name: "Background Tasks", href: "/dashboard/admin/jobs", icon: <Clock className="h-4 w-4" />, group: "system", reqModule: "roles" },
    { name: "System Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, group: "system", reqModule: "roles" },
  ];

  const handleLogout = () => {
    toast("Logged out successfully", { description: "Redirecting to landing page...", type: "success" });
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const navLinkClass = (href: string) => {
    const isActive = pathname === href || (pathname.startsWith(href) && href !== "/dashboard");
    return cn(
      "flex items-center gap-3 px-3 py-2 rounded-btn text-sm font-medium transition-all duration-150 cursor-pointer select-none border-l-[3px] border-transparent",
      isActive
        ? "bg-white/10 text-white shadow-soft border-primary"
        : "text-sidebar-fg hover:text-white hover:bg-white/10"
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-fg border-r border-white/10 transition-all duration-300 sticky top-0 h-screen shrink-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 bg-primary rounded-[10px] flex items-center justify-center text-white shrink-0">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
                Aetheria ERP
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-primary/10 cursor-pointer"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "transform rotate-180")} />
          </button>
        </div>

        {/* School Switcher & Academic Year */}
        {!isCollapsed && (
          <div className="p-4 border-b border-white/10 space-y-2">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Campus Switcher</span>
              <select
                value={school}
                onChange={(e) => handleCampusChange(e.target.value)}
                className="w-full bg-white/10 text-xs text-white border border-white/10 rounded-btn p-1.5 outline-none cursor-pointer"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Navigation Grouped */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {/* Core group */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Academic Modules
              </span>
            )}
            {menuItems
              .filter((item) => item.group === "core" && (!item.reqModule || (mounted && hasModuleAccess(item.reqModule))))
              .map((item) => (
                <Link key={item.name} href={item.href} className={navLinkClass(item.href)}>
                  {item.icon}
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
          </div>

          {/* Administration group */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Student & Academic Admin
              </span>
            )}
            {menuItems
              .filter((item) => item.group === "administration" && (!item.reqModule || (mounted && hasModuleAccess(item.reqModule))))
              .map((item) => (
                <Link key={item.name} href={item.href} className={navLinkClass(item.href)}>
                  {item.icon}
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
          </div>

          {/* Operational group */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Staff & Operations
              </span>
            )}
            {menuItems
              .filter((item) => item.group === "operational" && (!item.reqModule || (mounted && hasModuleAccess(item.reqModule))))
              .map((item) => (
                <Link key={item.name} href={item.href} className={navLinkClass(item.href)}>
                  {item.icon}
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
          </div>

          {/* System group */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                System
              </span>
            )}
            {menuItems
              .filter((item) => item.group === "system" && (!item.reqModule || (mounted && hasModuleAccess(item.reqModule))))
              .map((item) => (
                <Link key={item.name} href={item.href} className={navLinkClass(item.href)}>
                  {item.icon}
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-btn text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer select-none"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout</span>}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-15 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 z-20 shadow-[0_8px_24px_rgba(3,22,53,0.06)]">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden text-text-primary p-2 rounded-btn hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <span className="absolute left-3 top-3 text-text-secondary">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="global-search"
                type="text"
                placeholder="Global search... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-12 rounded-btn bg-slate-50/90 dark:bg-slate-800/80 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary shadow-[0_1px_2px_rgba(3,22,53,0.04)]"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-bold bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.5 rounded text-text-secondary">
                &#8984;K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Active Academic Session (read-only — change it from Master Data Config) */}
            {activeSession && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-text-secondary font-medium">Session:</span>
                <span className="bg-slate-50 dark:bg-slate-800 border border-border rounded-btn px-2 py-1 text-xs text-text-primary">
                  {activeSession}
                </span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => {
                const nextTheme = theme === "light" ? "dark" : "light";
                setTheme(nextTheme);
                toast(`Theme set to ${nextTheme}`, { type: "info" });
              }}
              className="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => toast("Notifications", { description: "You have no new alerts", type: "info" })}
              className="relative text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger animate-pulse" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 cursor-pointer focus:outline-none"
              >
                <Avatar fallback={initials(userProfile?.fullName)} className="border-2 border-primary/20" />
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-text-primary">{userProfile?.fullName || "—"}</p>
                  <p className="text-[10px] text-text-secondary">{userProfile?.role || ""}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2.5 w-48 bg-card border border-border rounded-card shadow-premium py-1.5 text-sm z-30">
                  <div className="px-4 py-2 border-b border-border text-xs text-text-secondary">
                    Logged in as <b>{userProfile?.email || userProfile?.username || "—"}</b>
                  </div>
                  <div
                    onClick={() => {
                      router.push("/dashboard/settings");
                      setShowProfileMenu(false);
                    }}
                    className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-text-primary cursor-pointer"
                  >
                    Profile Settings
                  </div>
                  <div
                    onClick={() => {
                      toast("Help Center", { description: "Loading user manual...", type: "info" });
                      setShowProfileMenu(false);
                    }}
                    className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-text-primary cursor-pointer flex items-center gap-2"
                  >
                    <HelpCircle className="h-4 w-4" /> Help Support
                  </div>
                  <div
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-danger border-t border-border mt-1.5 cursor-pointer"
                  >
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 space-y-5 bg-background">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
          <aside className="relative w-64 bg-sidebar text-sidebar-fg flex flex-col p-4 z-50">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
              <span className="font-bold text-white">Aetheria Mobile</span>
              <button onClick={() => setIsMobileOpen(false)} className="text-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileOpen(false);
                  }}
                  className={navLinkClass(item.href)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {mounted && userProfile?.permissions?.includes("*") && (
                    <Badge variant="warning" className="text-[9px] uppercase mt-1">Super Admin</Badge>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
