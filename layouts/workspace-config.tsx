// The 7 target workspaces (docs/ENTERPRISE_IA.md §2), replacing the old flat
// core/administration/operational/system grouping. Every item here is one of
// the same 31 destinations the sidebar always had — this is a regrouping by
// job-to-be-done, not a route change. A new backend module is never
// automatically a new workspace (IA §2's governance rule) — it goes into
// whichever workspace's job it serves, or is an explicit product decision.

import React from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  MessageSquare,
  Settings,
  Calendar,
  UserCheck,
  BookOpen,
  FileText,
  MapPin,
  HelpCircle,
  Boxes,
  Bell,
  Compass,
  Activity,
  Clock,
} from "lucide-react";

export interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  reqModule?: string;
}

export type WorkspaceKey =
  | "command-center"
  | "people"
  | "academics"
  | "finance"
  | "campus-operations"
  | "communication"
  | "command-control";

export interface Workspace {
  key: WorkspaceKey;
  label: string;
  icon: React.ReactNode;
  /** Command & Control is admin-only by nature of its items' reqModules — no separate gate needed. */
  items: SidebarItem[];
}

export const workspaces: Workspace[] = [
  {
    key: "command-center",
    label: "Command Center",
    icon: <LayoutDashboard className="h-4 w-4" />,
    items: [
      { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    key: "people",
    label: "People",
    icon: <Users className="h-4 w-4" />,
    items: [
      { name: "Student Showcase", href: "/dashboard/students", icon: <Users className="h-4 w-4" />, reqModule: "students" },
      { name: "Student Admissions", href: "/dashboard/admin/admissions", icon: <GraduationCap className="h-4 w-4" />, reqModule: "students" },
      { name: "Student Promotion", href: "/dashboard/admin/promotions", icon: <GraduationCap className="h-4 w-4" />, reqModule: "students" },
      { name: "Admissions Pipeline", href: "/dashboard/admin/admissions-pipeline", icon: <GraduationCap className="h-4 w-4" />, reqModule: "admissionspipeline" },
      { name: "Staff Onboarding", href: "/dashboard/admin/staff-onboarding", icon: <Users className="h-4 w-4" />, reqModule: "staff" },
      { name: "HR & Payroll", href: "/dashboard/admin/hr", icon: <FileText className="h-4 w-4" />, reqModule: "staff" },
    ],
  },
  {
    key: "academics",
    label: "Academics",
    icon: <GraduationCap className="h-4 w-4" />,
    items: [
      { name: "My Calendar", href: "/dashboard/calendar", icon: <Calendar className="h-4 w-4" />, reqModule: "attendance" },
      { name: "Attendance Desk", href: "/dashboard/admin/attendance", icon: <UserCheck className="h-4 w-4" />, reqModule: "attendance" },
      { name: "School Calendar (Holidays & Terms)", href: "/dashboard/admin/calendar", icon: <Calendar className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Timetable Desk", href: "/dashboard/admin/timetable", icon: <Calendar className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "LMS Course Desk", href: "/dashboard/admin/lms", icon: <BookOpen className="h-4 w-4" />, reqModule: "reportcards" },
      { name: "Exams Desk (EMS)", href: "/dashboard/admin/exams", icon: <FileText className="h-4 w-4" />, reqModule: "reportcards" },
      { name: "Report Cards", href: "/dashboard/admin/report-cards", icon: <FileText className="h-4 w-4" />, reqModule: "reportcards" },
      { name: "Co-Curricular & Activities", href: "/dashboard/admin/activities", icon: <Activity className="h-4 w-4" />, reqModule: "masterdata" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    icon: <DollarSign className="h-4 w-4" />,
    items: [
      { name: "Fees & Finance", href: "/dashboard/fees", icon: <DollarSign className="h-4 w-4" />, reqModule: "fees" },
    ],
  },
  {
    key: "campus-operations",
    label: "Campus Operations",
    icon: <Building2 className="h-4 w-4" />,
    items: [
      { name: "Transport", href: "/dashboard/admin/transport", icon: <MapPin className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Hostel & Mess", href: "/dashboard/admin/hostel", icon: <HelpCircle className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Health Centre", href: "/dashboard/admin/health-records", icon: <HelpCircle className="h-4 w-4" />, reqModule: "healthrecords" },
      { name: "Library", href: "/dashboard/admin/library", icon: <BookOpen className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Inventory & Assets", href: "/dashboard/admin/inventory", icon: <Boxes className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Discipline & Behavior", href: "/dashboard/admin/discipline", icon: <HelpCircle className="h-4 w-4" />, reqModule: "discipline" },
    ],
  },
  {
    key: "communication",
    label: "Communication",
    icon: <MessageSquare className="h-4 w-4" />,
    items: [
      { name: "Announcements", href: "/dashboard/admin/announcements", icon: <Bell className="h-4 w-4" />, reqModule: "masterdata" },
    ],
  },
  {
    key: "command-control",
    label: "Command & Control",
    icon: <Settings className="h-4 w-4" />,
    items: [
      { name: "ID Card Templates", href: "/dashboard/settings/idcard-templates", icon: <FileText className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Certificate Designer", href: "/dashboard/admin/certificates", icon: <FileText className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Master Data Config", href: "/dashboard/admin/master-data", icon: <Compass className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Roles & Permissions", href: "/dashboard/admin/roles-permissions", icon: <Settings className="h-4 w-4" />, reqModule: "roles" },
      { name: "Bulk Data Import", href: "/dashboard/admin/import", icon: <FileText className="h-4 w-4" />, reqModule: "masterdata" },
      { name: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: <Activity className="h-4 w-4" />, reqModule: "roles" },
      { name: "Server Monitoring", href: "/dashboard/admin/monitoring", icon: <Activity className="h-4 w-4" />, reqModule: "roles" },
      { name: "Background Tasks", href: "/dashboard/admin/jobs", icon: <Clock className="h-4 w-4" />, reqModule: "roles" },
      { name: "System Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, reqModule: "roles" },
    ],
  },
];

/** Centralizes the permission-filter that used to be duplicated 4x in the sidebar render. */
export function visibleItems(items: SidebarItem[], mounted: boolean, hasModuleAccess: (m: string) => boolean): SidebarItem[] {
  return items.filter((item) => !item.reqModule || (mounted && hasModuleAccess(item.reqModule)));
}

/**
 * Reverse lookup: which reqModule (if any) does a given /dashboard/* pathname need.
 * Longest-href-prefix wins, so a dynamic child route (e.g. .../admissions/[id]) inherits
 * its parent list page's requirement. Routes not present in this nav config (e.g. the
 * Command Center root, or an orphan page) return undefined — deliberately NOT gated here,
 * since guessing a requirement for an unlisted route risks locking out a legitimate page.
 */
export function getRequiredModuleForPath(pathname: string): string | undefined {
  let bestHref = "";
  let bestModule: string | undefined;
  for (const ws of workspaces) {
    for (const item of ws.items) {
      if (!item.reqModule) continue;
      const matches = pathname === item.href || pathname.startsWith(item.href + "/");
      if (matches && item.href.length > bestHref.length) {
        bestHref = item.href;
        bestModule = item.reqModule;
      }
    }
  }
  return bestModule;
}
