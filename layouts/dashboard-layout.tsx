"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/components/ui/toast";
import {
  GraduationCap,
  ChevronLeft,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  HelpCircle,
  Bell,
  Search,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { workspaces, visibleItems, getRequiredModuleForPath } from "./workspace-config";
import { Omnibox, type OmniboxGroup } from "@/components/shared/Omnibox";

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const MASTER_DATA_API_URL = `${API_URL}/master-data`;

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, readStatus: true } : n));
        toast("Notification Read", { type: "success" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setUserProfile(getUserFromStorage());
    setMounted(true);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Page-level access guard — mirrors the sidebar's own visibility filter so a
  // page hidden from the sidebar can't still be opened by direct URL.
  const requiredModule = getRequiredModuleForPath(pathname);
  const isAccessDenied = mounted && !!requiredModule && !hasModuleAccess(requiredModule);

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
  const [omniboxOpen, setOmniboxOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOmniboxOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Command Palette (IA §7) — real federated search results (Phase 7), debounced,
  // merged into the Omnibox alongside the existing client-side navigation group.
  const [recordResults, setRecordResults] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    if (!omniboxOpen || searchQuery.trim().length < 2) {
      setRecordResults([]);
      return;
    }
    const token = localStorage.getItem("token");
    const controller = new AbortController();
    setRecordsLoading(true);
    const debounce = setTimeout(() => {
      fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((rows) => setRecordResults(Array.isArray(rows) ? rows : []))
        .catch(() => {})
        .finally(() => setRecordsLoading(false));
    }, 250);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [searchQuery, omniboxOpen]);

  // Every workspace item this user can currently access, flattened once — the
  // Omnibox's navigation results source until Phase 7's federated search index exists.
  const accessibleWorkspaceItems = workspaces.map((ws) => ({
    workspace: ws,
    items: visibleItems(ws.items, mounted, hasModuleAccess),
  }));

  const navigateGroups: OmniboxGroup[] = accessibleWorkspaceItems
    .map(({ workspace, items }) => ({
      group: workspace.label,
      items: items
        .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((item) => ({ id: item.href, label: item.name, href: item.href, icon: item.icon })),
    }))
    .filter((g) => g.items.length > 0);

  const recordsGroup: OmniboxGroup = {
    group: "Records",
    items: recordResults.map((r) => ({ id: r.id, label: r.title, description: r.subtitle, href: r.href })),
  };

  const omniboxGroups: OmniboxGroup[] = recordsGroup.items.length > 0 ? [recordsGroup, ...navigateGroups] : navigateGroups;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeCampus");
    localStorage.removeItem("activeCampusId");
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
          "hidden md:flex flex-col bg-sidebar text-sidebar-fg border-r border-white/10 transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] sticky top-0 h-screen shrink-0",
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

        {/* Workspace Rail (IA §2/§14) — one group per workspace, filter logic centralized once */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {accessibleWorkspaceItems.map(({ workspace, items }) =>
            items.length === 0 ? null : (
              <div key={workspace.key} className="space-y-1">
                {!isCollapsed && (
                  <Link
                    href={`/workspace/${workspace.key}`}
                    className="px-3.5 text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wider flex items-center gap-1.5 mb-2 transition-colors"
                  >
                    {workspace.icon}
                    {workspace.label}
                  </Link>
                )}
                {items.map((item) => (
                  <Link key={item.name} href={item.href} className={navLinkClass(item.href)}>
                    {item.icon}
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                ))}
              </div>
            )
          )}
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

            {/* Global Search — opens the Omnibox (IA §6/§7), replacing the old non-functional input */}
            <button
              onClick={() => setOmniboxOpen(true)}
              className="relative hidden sm:flex items-center w-64 md:w-80 h-10 pl-9 pr-12 rounded-btn bg-slate-50/90 dark:bg-slate-800/80 border border-border text-sm text-text-secondary shadow-[0_1px_2px_rgba(3,22,53,0.04)] cursor-pointer hover:border-primary/40 transition-colors"
            >
              <span className="absolute left-3 text-text-secondary">
                <Search className="h-4 w-4" />
              </span>
              <span className="truncate">Global search... (Ctrl+K)</span>
              <span className="absolute right-3 text-[10px] font-bold bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.5 rounded text-text-secondary">
                &#8984;K
              </span>
            </button>
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
            <div className="relative">
              <button
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="relative text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors focus:outline-none"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.filter(n => !n.readStatus).length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger animate-pulse" />
                )}
              </button>

              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2.5 w-80 bg-card border border-border rounded-card shadow-premium py-2 text-sm z-30 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-border font-bold text-text-primary flex justify-between items-center">
                    <span>Notifications</span>
                    {notifications.filter(n => !n.readStatus).length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-danger/10 text-danger rounded-full">
                        {notifications.filter(n => !n.readStatus).length} new
                      </span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-text-secondary text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.readStatus) handleMarkNotificationRead(n.id);
                          }}
                          className={cn(
                            "px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors text-left",
                            !n.readStatus && "bg-primary/5 dark:bg-primary/10"
                          )}
                        >
                          <div className="font-semibold text-xs text-text-primary flex justify-between items-center">
                            <span>{n.title}</span>
                            {!n.readStatus && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <div className="text-xs text-text-secondary mt-1">{n.body}</div>
                          <div className="text-[10px] text-text-secondary mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

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
          {isAccessDenied ? (
            <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
              <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
                <ShieldAlert className="h-7 w-7 text-danger" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Access Denied</h2>
                <p className="text-sm text-text-secondary mt-1 max-w-sm">
                  You don&apos;t have permission to view this page. If you believe this is a mistake, contact your administrator.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          ) : (
            children
          )}
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
            <div className="space-y-4 overflow-y-auto">
              {accessibleWorkspaceItems.map(({ workspace, items }) =>
                items.length === 0 ? null : (
                  <div key={workspace.key} className="space-y-1">
                    <Link
                      href={`/workspace/${workspace.key}`}
                      onClick={() => setIsMobileOpen(false)}
                      className="px-3.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-1"
                    >
                      {workspace.icon}
                      {workspace.label}
                    </Link>
                    {items.map((item) => (
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
                )
              )}
            </div>
          </aside>
        </div>
      )}

      <Omnibox
        open={omniboxOpen}
        onOpenChange={setOmniboxOpen}
        value={searchQuery}
        onChange={setSearchQuery}
        groups={omniboxGroups}
        loading={recordsLoading}
      />
    </div>
  );
}
