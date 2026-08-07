"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Heatmap, HeatmapCell } from "@/components/ui/heatmap";
import { DashboardWidgetShell } from "@/components/shared/DashboardWidgetShell";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  Users,
  GraduationCap,
  Wallet,
  Bus,
  DoorOpen,
  Clock,
  ArrowRight,
  FileCheck2,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useToast } from "@/components/ui/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Widget note: campus scoping is not yet enforced end-to-end (the backend's
// tenant middleware keys off a header neither client sends, and the JWT
// carries no campusId) — no campus switcher renders here until that's fixed.
// See RC1_IMPLEMENTATION_PLAN.md, Campus Isolation Layer.

interface DashboardSummary {
  attendanceRate: number;
  studentsPresent: number;
  studentsAbsent: number;
  staffAttendanceRate: number;
  staffPresent: number;
  staffAbsent: number;
  lateEntries: number;
  currentVisitors: number;
  pendingVisitorApprovals: number;
  todaysRevenue: number;
  busesRunning: number;
  busesTotal: number;
  transportBreakdownsOpen: number;
  pendingLeaveApprovals: number;
  pendingFeeApprovals: number;
  pendingAdmissions: number;
  disciplineOpenCases: number;
  totalRevenue: number;
  totalOutstanding: number;
  staffCount: number;
  studentCount: number;
}

interface HealthScore {
  score: number;
  maxPossibleScore: number;
  coverage: { measurable: number; total: number; label: string };
  categories: Record<string, number | null>;
  weights: Record<string, number>;
}

interface AuditLogRow {
  id: string;
  action: string;
  module: string;
  entityType: string | null;
  performedBy: string;
  timestamp: string;
}

interface FinanceSummary {
  totalInvoiced: number;
  totalCollected: number;
  collectionRate: number;
  totalOutstanding: number;
  overdueAmount: number;
  todaysCollection: number;
  refundsApprovedCount: number;
  refundsApprovedAmount: number;
  activeScholarshipsDiscounts: number | null;
}

interface CollectionTrend {
  months: { month: string; collected: number }[];
}

interface OutstandingByGroup {
  name: string;
  outstanding: number;
}

interface OutstandingBreakdown {
  dueToday: number;
  dueThisWeek: number;
  overdue: number;
  byClass: OutstandingByGroup[];
  bySection: OutstandingByGroup[];
}

interface PaymentModeBreakdown {
  modes: { mode: string; count: number; amount: number }[];
}

interface RefundBucket {
  count: number;
  amount: number;
}

interface RefundDashboard {
  pending: RefundBucket;
  approved: RefundBucket;
  rejected: RefundBucket;
}

interface RecentTransactions {
  payments: { id: string; studentName: string; amount: number; mode: string; date: string }[];
  invoices: { id: string; studentName: string; amount: number; status: string; dueDate: string }[];
  refunds: { id: string; studentName: string; amount: number; status: string; requestedAt: string }[];
}

interface DashboardTrends {
  revenueByClass: { name: string; collected: number; outstanding: number }[];
  attendanceTrend: { date: string; rate: number }[];
}

interface ExamCompletion {
  totalGradebooks: number;
  publishedGradebooks: number;
  completionRate: number;
}

interface TeacherWorkload {
  teachers: { staffId: string; staffName: string; assignmentCount: number; hoursPerWeek: number }[];
}

interface PromotionReadiness {
  available: boolean;
  sessionName: string | null;
  passThreshold: number | null;
  totalStudents: number;
  passing: number;
  failing: number;
  readinessRate: number;
  byClass: { grade: string; totalStudents: number; passing: number; failing: number }[];
}

interface FleetStatus {
  tripsToday: { status: string; count: number }[];
  vehiclesByStatus: { status: string; count: number }[];
  openBreakdowns: number;
}

interface FuelUsage {
  totalLitres: number;
  totalCost: number;
  avgMileage: number | null;
  logCount: number;
}

interface LibraryReport {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  currentlyIssued: number;
  overdueCount: number;
  unpaidFinesTotal: number;
  unpaidFinesCount: number;
}

interface DisciplineBreakdown {
  openCount: number;
  bySeverity: { label: string; count: number }[];
  byCategory: { label: string; count: number }[];
  recent: { id: string; studentName: string; category: string; severity: string; status: string; incidentDate: string }[];
}

interface HostelOccupancy {
  totalCapacity: number;
  totalOccupied: number;
  occupancyRate: number;
  byHostel: { name: string; capacity: number; occupied: number; occupancyRate: number }[];
}

interface GatePasses {
  issuedToday: number;
  currentlyOut: number;
}

interface MedicalRoom {
  visitsToday: number;
  recent: { id: string; studentName: string; reason: string; actionTaken: string; visitDate: string }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  academics: "Academics",
  attendance: "Attendance",
  finance: "Finance",
  transport: "Transport",
  discipline: "Discipline",
  parentEngagement: "Parent Engagement",
  infrastructure: "Infrastructure",
};

function healthScoreVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function activityIcon(action: string) {
  if (action?.includes("DELETE")) return <AlertCircle className="h-4 w-4 text-danger" />;
  if (action?.includes("CREATE")) return <FileCheck2 className="h-4 w-4 text-success" />;
  return <ShieldAlert className="h-4 w-4 text-primary" />;
}

export default function DashboardHome() {
  const { toast } = useToast();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: HeadersInit | undefined = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [health, setHealth] = useState<HealthScore | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [activity, setActivity] = useState<AuditLogRow[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [finSummary, setFinSummary] = useState<FinanceSummary | null>(null);
  const [finSummaryLoading, setFinSummaryLoading] = useState(true);
  const [finSummaryError, setFinSummaryError] = useState<string | null>(null);

  const [trend, setTrend] = useState<CollectionTrend | null>(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState<string | null>(null);

  const [outstanding, setOutstanding] = useState<OutstandingBreakdown | null>(null);
  const [outstandingLoading, setOutstandingLoading] = useState(true);
  const [outstandingError, setOutstandingError] = useState<string | null>(null);

  const [paymentModes, setPaymentModes] = useState<PaymentModeBreakdown | null>(null);
  const [paymentModesLoading, setPaymentModesLoading] = useState(true);
  const [paymentModesError, setPaymentModesError] = useState<string | null>(null);

  const [refunds, setRefunds] = useState<RefundDashboard | null>(null);
  const [refundsLoading, setRefundsLoading] = useState(true);
  const [refundsError, setRefundsError] = useState<string | null>(null);

  const [recentTx, setRecentTx] = useState<RecentTransactions | null>(null);
  const [recentTxLoading, setRecentTxLoading] = useState(true);
  const [recentTxError, setRecentTxError] = useState<string | null>(null);

  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const [examCompletion, setExamCompletion] = useState<ExamCompletion | null>(null);
  const [examCompletionLoading, setExamCompletionLoading] = useState(true);
  const [examCompletionError, setExamCompletionError] = useState<string | null>(null);

  const [teacherWorkload, setTeacherWorkload] = useState<TeacherWorkload | null>(null);
  const [teacherWorkloadLoading, setTeacherWorkloadLoading] = useState(true);
  const [teacherWorkloadError, setTeacherWorkloadError] = useState<string | null>(null);

  // Promotion Readiness is a whole-population computation (~1.3s even after
  // fixing a real N+1 in the backend) — loaded on demand only, never
  // eagerly on page mount. See KPI_DEFINITIONS.md §3.
  const [promotion, setPromotion] = useState<PromotionReadiness | null>(null);
  const [promotionRequested, setPromotionRequested] = useState(false);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState<string | null>(null);

  const [fleetStatus, setFleetStatus] = useState<FleetStatus | null>(null);
  const [fleetStatusLoading, setFleetStatusLoading] = useState(true);
  const [fleetStatusError, setFleetStatusError] = useState<string | null>(null);

  const [fuelUsage, setFuelUsage] = useState<FuelUsage | null>(null);
  const [fuelUsageLoading, setFuelUsageLoading] = useState(true);
  const [fuelUsageError, setFuelUsageError] = useState<string | null>(null);

  const [libraryReport, setLibraryReport] = useState<LibraryReport | null>(null);
  const [libraryReportLoading, setLibraryReportLoading] = useState(true);
  const [libraryReportError, setLibraryReportError] = useState<string | null>(null);

  const [discipline, setDiscipline] = useState<DisciplineBreakdown | null>(null);
  const [disciplineLoading, setDisciplineLoading] = useState(true);
  const [disciplineError, setDisciplineError] = useState<string | null>(null);

  const [hostelOccupancy, setHostelOccupancy] = useState<HostelOccupancy | null>(null);
  const [hostelOccupancyLoading, setHostelOccupancyLoading] = useState(true);
  const [hostelOccupancyError, setHostelOccupancyError] = useState<string | null>(null);

  const [gatePasses, setGatePasses] = useState<GatePasses | null>(null);
  const [gatePassesLoading, setGatePassesLoading] = useState(true);
  const [gatePassesError, setGatePassesError] = useState<string | null>(null);

  const [medicalRoom, setMedicalRoom] = useState<MedicalRoom | null>(null);
  const [medicalRoomLoading, setMedicalRoomLoading] = useState(true);
  const [medicalRoomError, setMedicalRoomError] = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    setSummaryLoading(true);
    setSummaryError(null);
    fetch(`${API_URL}/analytics/dashboard/summary`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setSummary)
      .catch(() => {
        setSummaryError("Failed to load");
        toast("Failed to load dashboard summary", { type: "error" });
      })
      .finally(() => setSummaryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHealth = useCallback(() => {
    setHealthLoading(true);
    setHealthError(null);
    fetch(`${API_URL}/analytics/dashboard/health-score`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setHealth)
      .catch(() => {
        setHealthError("Failed to load");
        toast("Failed to load Operational Health Score", { type: "error" });
      })
      .finally(() => setHealthLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActivity = useCallback(() => {
    setActivityLoading(true);
    setActivityError(null);
    fetch(`${API_URL}/audit-logs?pageSize=8`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then((json) => setActivity(json?.data || []))
      .catch(() => setActivityError("Failed to load"))
      .finally(() => setActivityLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFinSummary = useCallback(() => {
    setFinSummaryLoading(true);
    setFinSummaryError(null);
    fetch(`${API_URL}/analytics/dashboard/finance/summary`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setFinSummary)
      .catch(() => {
        setFinSummaryError("Failed to load");
        toast("Failed to load Finance Summary", { type: "error" });
      })
      .finally(() => setFinSummaryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrend = useCallback(() => {
    setTrendLoading(true);
    setTrendError(null);
    fetch(`${API_URL}/analytics/dashboard/finance/collection-trend`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setTrend)
      .catch(() => setTrendError("Failed to load"))
      .finally(() => setTrendLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOutstanding = useCallback(() => {
    setOutstandingLoading(true);
    setOutstandingError(null);
    fetch(`${API_URL}/analytics/dashboard/finance/outstanding`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setOutstanding)
      .catch(() => setOutstandingError("Failed to load"))
      .finally(() => setOutstandingLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPaymentModes = useCallback(() => {
    setPaymentModesLoading(true);
    setPaymentModesError(null);
    fetch(`${API_URL}/analytics/dashboard/finance/payment-breakdown`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setPaymentModes)
      .catch(() => setPaymentModesError("Failed to load"))
      .finally(() => setPaymentModesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRefunds = useCallback(() => {
    setRefundsLoading(true);
    setRefundsError(null);
    fetch(`${API_URL}/analytics/dashboard/finance/refunds`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setRefunds)
      .catch(() => setRefundsError("Failed to load"))
      .finally(() => setRefundsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecentTx = useCallback(() => {
    setRecentTxLoading(true);
    setRecentTxError(null);
    fetch(`${API_URL}/analytics/dashboard/finance/recent-transactions`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setRecentTx)
      .catch(() => setRecentTxError("Failed to load"))
      .finally(() => setRecentTxLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrends = useCallback(() => {
    setTrendsLoading(true);
    setTrendsError(null);
    fetch(`${API_URL}/analytics/dashboard/trends`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setTrends)
      .catch(() => setTrendsError("Failed to load"))
      .finally(() => setTrendsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExamCompletion = useCallback(() => {
    setExamCompletionLoading(true);
    setExamCompletionError(null);
    fetch(`${API_URL}/analytics/dashboard/academic/exam-completion`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setExamCompletion)
      .catch(() => setExamCompletionError("Failed to load"))
      .finally(() => setExamCompletionLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTeacherWorkload = useCallback(() => {
    setTeacherWorkloadLoading(true);
    setTeacherWorkloadError(null);
    fetch(`${API_URL}/analytics/dashboard/academic/teacher-workload`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setTeacherWorkload)
      .catch(() => setTeacherWorkloadError("Failed to load"))
      .finally(() => setTeacherWorkloadLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPromotionReadiness = useCallback(() => {
    setPromotionRequested(true);
    setPromotionLoading(true);
    setPromotionError(null);
    fetch(`${API_URL}/analytics/dashboard/academic/promotion-readiness`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setPromotion)
      .catch(() => setPromotionError("Failed to load"))
      .finally(() => setPromotionLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFleetStatus = useCallback(() => {
    setFleetStatusLoading(true);
    setFleetStatusError(null);
    fetch(`${API_URL}/analytics/dashboard/operations/fleet-status`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setFleetStatus)
      .catch(() => setFleetStatusError("Failed to load"))
      .finally(() => setFleetStatusLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFuelUsage = useCallback(() => {
    setFuelUsageLoading(true);
    setFuelUsageError(null);
    fetch(`${API_URL}/analytics/dashboard/operations/fuel-usage`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setFuelUsage)
      .catch(() => setFuelUsageError("Failed to load"))
      .finally(() => setFuelUsageLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLibraryReport = useCallback(() => {
    setLibraryReportLoading(true);
    setLibraryReportError(null);
    fetch(`${API_URL}/library/reports`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setLibraryReport)
      .catch(() => setLibraryReportError("Failed to load"))
      .finally(() => setLibraryReportLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDiscipline = useCallback(() => {
    setDisciplineLoading(true);
    setDisciplineError(null);
    fetch(`${API_URL}/analytics/dashboard/operations/discipline`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setDiscipline)
      .catch(() => setDisciplineError("Failed to load"))
      .finally(() => setDisciplineLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHostelOccupancy = useCallback(() => {
    setHostelOccupancyLoading(true);
    setHostelOccupancyError(null);
    fetch(`${API_URL}/analytics/dashboard/operations/hostel-occupancy`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setHostelOccupancy)
      .catch(() => setHostelOccupancyError("Failed to load"))
      .finally(() => setHostelOccupancyLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGatePasses = useCallback(() => {
    setGatePassesLoading(true);
    setGatePassesError(null);
    fetch(`${API_URL}/analytics/dashboard/operations/gate-passes`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setGatePasses)
      .catch(() => setGatePassesError("Failed to load"))
      .finally(() => setGatePassesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMedicalRoom = useCallback(() => {
    setMedicalRoomLoading(true);
    setMedicalRoomError(null);
    fetch(`${API_URL}/analytics/dashboard/operations/medical-room`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then(setMedicalRoom)
      .catch(() => setMedicalRoomError("Failed to load"))
      .finally(() => setMedicalRoomLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSummary();
    loadHealth();
    loadActivity();
    loadFinSummary();
    loadTrend();
    loadOutstanding();
    loadPaymentModes();
    loadRefunds();
    loadRecentTx();
    loadTrends();
    loadExamCompletion();
    loadTeacherWorkload();
    // loadPromotionReadiness is intentionally NOT called here — see its declaration.
    loadFleetStatus();
    loadFuelUsage();
    loadLibraryReport();
    loadDiscipline();
    loadHostelOccupancy();
    loadGatePasses();
    loadMedicalRoom();
  }, [
    loadSummary,
    loadHealth,
    loadActivity,
    loadFinSummary,
    loadTrend,
    loadOutstanding,
    loadPaymentModes,
    loadRefunds,
    loadRecentTx,
    loadTrends,
    loadExamCompletion,
    loadTeacherWorkload,
    loadFleetStatus,
    loadFuelUsage,
    loadLibraryReport,
    loadDiscipline,
    loadHostelOccupancy,
    loadGatePasses,
    loadMedicalRoom,
  ]);

  const formatCurrency = (n: number) =>
    `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const criticalItems: string[] = [];
  if (summary && summary.transportBreakdownsOpen > 0) {
    criticalItems.push(
      `${summary.transportBreakdownsOpen} transport breakdown${summary.transportBreakdownsOpen > 1 ? "s" : ""} open`
    );
  }
  if (summary && summary.disciplineOpenCases > 5) {
    criticalItems.push(`${summary.disciplineOpenCases} open discipline cases`);
  }

  const actionCenterItems = summary
    ? [
        { label: "Pending Leave Approvals", count: summary.pendingLeaveApprovals, href: "/dashboard/admin/hr" },
        { label: "Pending Fee Approvals", count: summary.pendingFeeApprovals, href: "/dashboard/fees" },
        { label: "Pending Admissions", count: summary.pendingAdmissions, href: "/dashboard/admin/admissions-pipeline" },
        { label: "Transport Breakdowns", count: summary.transportBreakdownsOpen, href: "/dashboard/admin/transport" },
        // No web admin screen exists yet for visitor approvals (mobile-only reception desk) — shown, not linked.
        { label: "Pending Visitor Approvals", count: summary.pendingVisitorApprovals, href: null },
      ]
    : [];

  const timelineItems: TimelineItem[] = activity.map((log) => ({
    id: log.id,
    title: `${log.action} · ${log.module}`,
    description: `by ${log.performedBy}`,
    time: timeAgo(log.timestamp),
    icon: activityIcon(log.action),
  }));

  const collectionRateVariant = (rate: number): "success" | "warning" | "danger" =>
    rate >= 95 ? "success" : rate >= 85 ? "warning" : "danger";

  // Share-of-total per mode — a neutral distribution, not a good/bad signal,
  // so every cell is forced to "neutral" rather than Heatmap's default
  // value-based Green/Amber/Red derivation (which would wrongly imply a
  // lower-share payment mode is "unhealthy").
  const paymentModeCells: HeatmapCell[] = paymentModes
    ? (() => {
        const total = paymentModes.modes.reduce((s, m) => s + m.amount, 0);
        return paymentModes.modes.map((m) => ({
          id: m.mode,
          label: m.mode,
          value: total > 0 ? Math.round((m.amount / total) * 100) : 0,
          variant: "neutral" as const,
          tooltip: `${m.count} transactions · ${formatCurrency(m.amount)}`,
        }));
      })()
    : [];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Command Center</h1>
          <p className="text-sm text-text-secondary">Executive Summary — real-time, current campus.</p>
        </div>
        <Badge variant="success" className="h-6">System Live</Badge>
      </div>

      {criticalItems.length > 0 && (
        <AlertBanner
          variant="warning"
          title="Needs attention"
          items={criticalItems}
        />
      )}

      {/* Executive Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidgetShell loading={summaryLoading} error={summaryError} onRetry={loadSummary}>
          <MetricCard
            title="Student Attendance"
            value={summary ? `${summary.attendanceRate}%` : "—"}
            description={summary ? `${summary.studentsPresent} present today` : undefined}
            icon={<GraduationCap className="h-5 w-5 text-primary" />}
          />
        </DashboardWidgetShell>
        <DashboardWidgetShell loading={summaryLoading} error={summaryError} onRetry={loadSummary}>
          <MetricCard
            title="Staff Attendance"
            value={summary ? `${summary.staffAttendanceRate}%` : "—"}
            description={summary ? `${summary.staffPresent} present today` : undefined}
            icon={<Users className="h-5 w-5 text-success" />}
          />
        </DashboardWidgetShell>
        <DashboardWidgetShell loading={summaryLoading} error={summaryError} onRetry={loadSummary}>
          <MetricCard
            title="Today's Revenue"
            value={summary ? formatCurrency(summary.todaysRevenue) : "—"}
            description="Payments received today"
            icon={<Wallet className="h-5 w-5 text-success" />}
          />
        </DashboardWidgetShell>
        <DashboardWidgetShell loading={summaryLoading} error={summaryError} onRetry={loadSummary}>
          <MetricCard
            title="Outstanding Fees"
            value={summary ? formatCurrency(summary.totalOutstanding) : "—"}
            description="Unpaid across all invoices"
            icon={<Wallet className="h-5 w-5 text-danger" />}
          />
        </DashboardWidgetShell>
        <DashboardWidgetShell loading={summaryLoading} error={summaryError} onRetry={loadSummary}>
          <MetricCard
            title="Buses Running"
            value={summary ? `${summary.busesRunning}/${summary.busesTotal}` : "—"}
            description="Active trips right now"
            icon={<Bus className="h-5 w-5 text-primary" />}
          />
        </DashboardWidgetShell>
        <DashboardWidgetShell loading={summaryLoading} error={summaryError} onRetry={loadSummary}>
          <MetricCard
            title="Visitors On Campus"
            value={summary ? `${summary.currentVisitors}` : "—"}
            description={summary ? `${summary.pendingVisitorApprovals} pending approval` : undefined}
            icon={<DoorOpen className="h-5 w-5 text-info" />}
          />
        </DashboardWidgetShell>
        <DashboardWidgetShell loading={summaryLoading} error={summaryError} onRetry={loadSummary}>
          <MetricCard
            title="Late Entries"
            value={summary ? `${summary.lateEntries}` : "—"}
            description="Students, today"
            icon={<Clock className="h-5 w-5 text-warning" />}
          />
        </DashboardWidgetShell>
        <DashboardWidgetShell loading={summaryLoading} error={summaryError} onRetry={loadSummary}>
          <MetricCard
            title="Active Staff"
            value={summary ? summary.staffCount.toLocaleString() : "—"}
            description={summary ? `${summary.studentCount.toLocaleString()} students enrolled` : undefined}
            icon={<Users className="h-5 w-5 text-info" />}
          />
        </DashboardWidgetShell>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Operational Health Score */}
        <Card>
          <CardHeader>
            <CardTitle>Operational Health</CardTitle>
            <CardDescription>
              {health ? health.coverage.label : "Loading coverage…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardWidgetShell loading={healthLoading} error={healthError} onRetry={loadHealth} minHeight={180}>
              {health && (
                <div className="flex flex-col items-center gap-4">
                  <ProgressRing
                    value={health.score}
                    size={110}
                    variant={healthScoreVariant(health.score)}
                    sublabel={`of ${health.maxPossibleScore} possible`}
                  />
                  <div className="w-full space-y-1.5">
                    {Object.entries(health.categories).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{CATEGORY_LABELS[key] ?? key}</span>
                        {val == null ? (
                          <span className="text-text-secondary italic">Not yet scored</span>
                        ) : (
                          <StatusPill
                            status={val >= 80 ? "approved" : val >= 50 ? "pending" : "rejected"}
                            label={`${val}%`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DashboardWidgetShell>
          </CardContent>
        </Card>

        {/* Action Center */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Action Center</CardTitle>
            <CardDescription>Only items that need a decision.</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardWidgetShell
              loading={summaryLoading}
              error={summaryError}
              onRetry={loadSummary}
              isEmpty={!summaryLoading && actionCenterItems.every((i) => i.count === 0)}
              emptyMessage="Nothing pending — you're caught up."
            >
              <div className="divide-y divide-border/60">
                {actionCenterItems
                  .filter((i) => i.count > 0)
                  .map((item) => {
                    const row = (
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-sm font-medium text-text-primary">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.count > 0 ? "warning" : "neutral"}>{item.count}</Badge>
                          {item.href && <ChevronRight className="h-4 w-4 text-text-secondary" />}
                        </div>
                      </div>
                    );
                    return item.href ? (
                      <Link key={item.label} href={item.href} className="block hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-1 px-1 rounded transition-colors">
                        {row}
                      </Link>
                    ) : (
                      <div key={item.label}>{row}</div>
                    );
                  })}
              </div>
            </DashboardWidgetShell>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary mb-3">Financial Health</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <DashboardWidgetShell loading={finSummaryLoading} error={finSummaryError} onRetry={loadFinSummary}>
            <MetricCard
              title="Total Invoiced"
              value={finSummary ? formatCurrency(finSummary.totalInvoiced) : "—"}
              description="All invoices, all-time"
              icon={<Wallet className="h-5 w-5 text-primary" />}
            />
          </DashboardWidgetShell>
          <DashboardWidgetShell loading={finSummaryLoading} error={finSummaryError} onRetry={loadFinSummary}>
            <MetricCard
              title="Collection Rate"
              value={finSummary ? `${finSummary.collectionRate}%` : "—"}
              description={finSummary ? formatCurrency(finSummary.totalCollected) + " collected" : undefined}
              icon={<TrendingUp className="h-5 w-5 text-success" />}
            />
          </DashboardWidgetShell>
          <DashboardWidgetShell loading={finSummaryLoading} error={finSummaryError} onRetry={loadFinSummary}>
            <MetricCard
              title="Overdue Amount"
              value={finSummary ? formatCurrency(finSummary.overdueAmount) : "—"}
              description="Past due date, unpaid"
              icon={<Wallet className="h-5 w-5 text-danger" />}
            />
          </DashboardWidgetShell>
          <DashboardWidgetShell loading={finSummaryLoading} error={finSummaryError} onRetry={loadFinSummary}>
            <MetricCard
              title="Today's Collection"
              value={finSummary ? formatCurrency(finSummary.todaysCollection) : "—"}
              description="Payments received today"
              icon={<Wallet className="h-5 w-5 text-success" />}
            />
          </DashboardWidgetShell>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Collection Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Collection Trend</CardTitle>
              <CardDescription>
                {trend && trend.months.length > 0
                  ? `${trend.months.length} month${trend.months.length > 1 ? "s" : ""} of real payment data — no projections.`
                  : "Monthly collections."}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <DashboardWidgetShell
                loading={trendLoading}
                error={trendError}
                onRetry={loadTrend}
                isEmpty={!trendLoading && !!trend && trend.months.length === 0}
                emptyMessage="No payment history yet."
                minHeight={220}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend?.months || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} />
                    <Tooltip
                      formatter={(v) => (typeof v === "number" ? formatCurrency(v) : v)}
                      contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke="#4C7A6B" fill="rgba(76,122,107,0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </DashboardWidgetShell>
            </CardContent>
          </Card>

          {/* Refund Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Refunds</CardTitle>
              <CardDescription>Requested → Approved/Rejected (the only 3 states tracked).</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell loading={refundsLoading} error={refundsError} onRetry={loadRefunds} minHeight={140}>
                {refunds && (
                  <div className="space-y-3">
                    {([
                      ["Pending", refunds.pending, "pending"],
                      ["Approved", refunds.approved, "approved"],
                      ["Rejected", refunds.rejected, "rejected"],
                    ] as const).map(([label, bucket, status]) => (
                      <div key={label} className="flex items-center justify-between">
                        <StatusPill status={status} label={label} />
                        <span className="text-sm font-semibold text-text-primary">
                          {bucket.count} · {formatCurrency(bucket.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Outstanding Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Fees</CardTitle>
              <CardDescription>Due Today / This Week / Overdue, and by class.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell loading={outstandingLoading} error={outstandingError} onRetry={loadOutstanding} minHeight={180}>
                {outstanding && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-warning">{formatCurrency(outstanding.dueToday)}</p>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">Due Today</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-warning">{formatCurrency(outstanding.dueThisWeek)}</p>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">Due This Week</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-danger">{formatCurrency(outstanding.overdue)}</p>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">Overdue</p>
                      </div>
                    </div>
                    {outstanding.byClass.length > 0 && (
                      <div className="divide-y divide-border/60">
                        {outstanding.byClass.map((c) => (
                          <div key={c.name} className="flex items-center justify-between py-1.5 text-sm">
                            <span className="text-text-secondary">{c.name}</span>
                            <span className="font-medium text-text-primary">{formatCurrency(c.outstanding)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>

          {/* Payment Mode Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Mode Breakdown</CardTitle>
              <CardDescription>Share of collections by actual payment mode.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell
                loading={paymentModesLoading}
                error={paymentModesError}
                onRetry={loadPaymentModes}
                isEmpty={!paymentModesLoading && paymentModeCells.length === 0}
                minHeight={140}
              >
                <Heatmap cells={paymentModeCells} minCellWidth={80} />
              </DashboardWidgetShell>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payments, invoices, and refunds.</CardDescription>
            </div>
            <Link href="/dashboard/fees">
              <span className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline cursor-pointer">
                Open Finance Module <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </CardHeader>
          <CardContent>
            <DashboardWidgetShell loading={recentTxLoading} error={recentTxError} onRetry={loadRecentTx} minHeight={160}>
              {recentTx && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-2">Payments</p>
                    <div className="space-y-2">
                      {recentTx.payments.length === 0 && <p className="text-xs text-text-secondary italic">None yet.</p>}
                      {recentTx.payments.map((p) => (
                        <div key={p.id} className="text-xs flex justify-between">
                          <span className="text-text-primary truncate pr-2">{p.studentName}</span>
                          <span className="text-text-secondary whitespace-nowrap">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-2">Invoices</p>
                    <div className="space-y-2">
                      {recentTx.invoices.length === 0 && <p className="text-xs text-text-secondary italic">None yet.</p>}
                      {recentTx.invoices.map((i) => (
                        <div key={i.id} className="text-xs flex justify-between">
                          <span className="text-text-primary truncate pr-2">{i.studentName}</span>
                          <StatusPill status={i.status === "Paid" ? "approved" : i.status === "Overdue" ? "rejected" : "pending"} label={i.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-2">Refunds</p>
                    <div className="space-y-2">
                      {recentTx.refunds.length === 0 && <p className="text-xs text-text-secondary italic">None yet.</p>}
                      {recentTx.refunds.map((r) => (
                        <div key={r.id} className="text-xs flex justify-between">
                          <span className="text-text-primary truncate pr-2">{r.studentName}</span>
                          <span className="text-text-secondary whitespace-nowrap">{formatCurrency(r.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DashboardWidgetShell>
          </CardContent>
        </Card>
      </div>

      {/* Academic Health */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary mb-3">Academic Health</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Attendance Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Daily student present rate, last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <DashboardWidgetShell
                loading={trendsLoading}
                error={trendsError}
                onRetry={loadTrends}
                isEmpty={!trendsLoading && !!trends && trends.attendanceTrend.every((d) => d.rate === 0)}
                emptyMessage="No attendance marked yet this week."
                minHeight={220}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends?.attendanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                    <Bar dataKey="rate" name="Present %" fill="#C99A3E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </DashboardWidgetShell>
            </CardContent>
          </Card>

          {/* Exam Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Completion</CardTitle>
              <CardDescription>Gradebooks published, active exam session.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <DashboardWidgetShell loading={examCompletionLoading} error={examCompletionError} onRetry={loadExamCompletion} minHeight={160}>
                {examCompletion && (
                  <ProgressRing
                    value={examCompletion.completionRate}
                    size={110}
                    variant={examCompletion.completionRate >= 90 ? "success" : examCompletion.completionRate >= 75 ? "warning" : "danger"}
                    sublabel={`${examCompletion.publishedGradebooks} of ${examCompletion.totalGradebooks} published`}
                  />
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Teacher Workload */}
          <Card>
            <CardHeader>
              <CardTitle>Teacher Workload</CardTitle>
              <CardDescription>Top 10 by weekly hours, active session.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell
                loading={teacherWorkloadLoading}
                error={teacherWorkloadError}
                onRetry={loadTeacherWorkload}
                isEmpty={!teacherWorkloadLoading && !!teacherWorkload && teacherWorkload.teachers.length === 0}
                minHeight={160}
              >
                <div className="divide-y divide-border/60">
                  {teacherWorkload?.teachers.map((t) => (
                    <div key={t.staffId} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                        <span className="text-text-primary truncate">{t.staffName}</span>
                      </div>
                      <span className="text-text-secondary whitespace-nowrap">
                        {t.hoursPerWeek}h/wk · {t.assignmentCount} assignments
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardWidgetShell>
            </CardContent>
          </Card>

          {/* Promotion Readiness — lazy-loaded */}
          <Card>
            <CardHeader>
              <CardTitle>Promotion Readiness</CardTitle>
              <CardDescription>
                {promotion?.available
                  ? `${promotion.sessionName} · pass threshold ${promotion.passThreshold}%`
                  : "Whole-school computation — loads on demand."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!promotionRequested ? (
                <div className="flex flex-col items-center justify-center gap-3 py-6">
                  <Award className="h-6 w-6 text-text-secondary" />
                  <button
                    type="button"
                    onClick={loadPromotionReadiness}
                    className="text-sm font-semibold text-primary underline underline-offset-2 hover:no-underline"
                  >
                    Load Promotion Readiness
                  </button>
                </div>
              ) : (
                <DashboardWidgetShell
                  loading={promotionLoading}
                  error={promotionError}
                  onRetry={loadPromotionReadiness}
                  isEmpty={!promotionLoading && !!promotion && !promotion.available}
                  emptyMessage="No active academic session — nothing to compute."
                  minHeight={160}
                >
                  {promotion && promotion.available && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <ProgressRing
                          value={promotion.readinessRate}
                          size={80}
                          strokeWidth={7}
                          variant={promotion.readinessRate >= 90 ? "success" : promotion.readinessRate >= 75 ? "warning" : "danger"}
                        />
                        <div className="text-right text-sm">
                          <p className="text-text-primary font-semibold">{promotion.passing} of {promotion.totalStudents} passing</p>
                          <p className="text-text-secondary">{promotion.failing} below threshold</p>
                        </div>
                      </div>
                      <div className="divide-y divide-border/60 max-h-40 overflow-y-auto">
                        {promotion.byClass.filter((c) => c.failing > 0).map((c) => (
                          <div key={c.grade} className="flex items-center justify-between py-1.5 text-xs">
                            <span className="text-text-secondary">{c.grade}</span>
                            <span className="text-danger font-medium">{c.failing} below threshold</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </DashboardWidgetShell>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operations */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary mb-3">Operations</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Fleet Status */}
          <Card>
            <CardHeader>
              <CardTitle>Fleet Status</CardTitle>
              <CardDescription>Trip status today — no live map (GPS is a manual ping, not a hardware feed).</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell loading={fleetStatusLoading} error={fleetStatusError} onRetry={loadFleetStatus} minHeight={140}>
                {fleetStatus && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {fleetStatus.tripsToday.length === 0 ? (
                        <span className="text-xs text-text-secondary italic">No trips today.</span>
                      ) : (
                        fleetStatus.tripsToday.map((t) => (
                          <Badge key={t.status} variant={t.status === "In Progress" ? "success" : t.status === "Cancelled" ? "danger" : "neutral"}>
                            {t.status}: {t.count}
                          </Badge>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {fleetStatus.vehiclesByStatus.map((v) => (
                        <Badge key={v.status} variant={v.status === "Active" ? "success" : v.status === "Maintenance" ? "warning" : "danger"}>
                          {v.status}: {v.count}
                        </Badge>
                      ))}
                    </div>
                    {fleetStatus.openBreakdowns > 0 && (
                      <p className="text-xs text-danger font-medium flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {fleetStatus.openBreakdowns} open breakdown{fleetStatus.openBreakdowns > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>

          {/* Fuel Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Fuel Usage</CardTitle>
              <CardDescription>Last 30 days, approved logs only.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell
                loading={fuelUsageLoading}
                error={fuelUsageError}
                onRetry={loadFuelUsage}
                isEmpty={!fuelUsageLoading && !!fuelUsage && fuelUsage.logCount === 0}
                emptyMessage="No approved fuel logs in the last 30 days."
                minHeight={140}
              >
                {fuelUsage && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-text-primary">{fuelUsage.totalLitres.toLocaleString("en-IN")}L</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Total Litres</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-primary">{formatCurrency(fuelUsage.totalCost)}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Total Cost</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-primary">{fuelUsage.avgMileage != null ? `${fuelUsage.avgMileage} km/L` : "—"}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Avg Mileage</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-primary">{fuelUsage.logCount}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Logs</p>
                    </div>
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>

          {/* Library Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Library Activity</CardTitle>
              <CardDescription>Reused directly from the existing library report — already complete.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell loading={libraryReportLoading} error={libraryReportError} onRetry={loadLibraryReport} minHeight={140}>
                {libraryReport && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-text-primary">{libraryReport.currentlyIssued}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Currently Issued</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-danger">{libraryReport.overdueCount}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Overdue</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-primary">{libraryReport.availableCopies}/{libraryReport.totalCopies}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Copies Available</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-warning">{formatCurrency(libraryReport.unpaidFinesTotal)}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Unpaid Fines</p>
                    </div>
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Discipline Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Discipline</CardTitle>
              <CardDescription>{discipline ? `${discipline.openCount} open case${discipline.openCount === 1 ? "" : "s"}` : "Open cases by severity/category."}</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell loading={disciplineLoading} error={disciplineError} onRetry={loadDiscipline} minHeight={160}>
                {discipline && (
                  <div className="space-y-3">
                    {discipline.bySeverity.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {discipline.bySeverity.map((s) => (
                          <Badge key={s.label} variant={s.label === "Major" ? "danger" : s.label === "Moderate" ? "warning" : "neutral"}>
                            {s.label}: {s.count}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="divide-y divide-border/60">
                      {discipline.recent.map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-1.5 text-xs">
                          <span className="text-text-primary truncate pr-2">{r.studentName} · {r.category}</span>
                          <StatusPill status={r.status === "Open" ? "pending" : r.status === "Resolved" ? "approved" : "warning"} label={r.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>

          {/* Hostel Occupancy */}
          <Card>
            <CardHeader>
              <CardTitle>Hostel Occupancy</CardTitle>
              <CardDescription>Fleet-wide and per hostel.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell loading={hostelOccupancyLoading} error={hostelOccupancyError} onRetry={loadHostelOccupancy} minHeight={160}>
                {hostelOccupancy && (
                  <div className="flex items-center gap-4">
                    <ProgressRing
                      value={hostelOccupancy.occupancyRate}
                      size={80}
                      strokeWidth={7}
                      variant={hostelOccupancy.occupancyRate > 100 ? "danger" : hostelOccupancy.occupancyRate >= 85 ? "success" : "warning"}
                      // Explicit label — the true value, even past 100%. The ring
                      // itself visually clamps at 100%, but the number must not:
                      // over-allocation is real, verified operational data, not
                      // a display bug to quietly round away.
                      label={`${hostelOccupancy.occupancyRate}%`}
                    />
                    <div className="flex-1 divide-y divide-border/60">
                      {hostelOccupancy.byHostel.map((h) => (
                        <div key={h.name} className="flex items-center justify-between py-1.5 text-xs">
                          <span className="text-text-secondary">{h.name}</span>
                          <span className={h.occupancyRate > 100 ? "text-danger font-semibold" : "text-text-primary font-medium"}>
                            {h.occupied}/{h.capacity} ({h.occupancyRate}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gate Passes */}
          <Card>
            <CardHeader>
              <CardTitle>Gate Passes</CardTitle>
              <CardDescription>Every pass is issued already-approved — no pending queue exists.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell loading={gatePassesLoading} error={gatePassesError} onRetry={loadGatePasses} minHeight={100}>
                {gatePasses && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{gatePasses.issuedToday}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Issued Today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">{gatePasses.currentlyOut}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wide">Currently Out</p>
                    </div>
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>

          {/* Medical Room */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Room</CardTitle>
              <CardDescription>No severity field exists — shown as real visit records only.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardWidgetShell loading={medicalRoomLoading} error={medicalRoomError} onRetry={loadMedicalRoom} minHeight={140}>
                {medicalRoom && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text-primary">{medicalRoom.visitsToday} visits today</p>
                    <div className="divide-y divide-border/60">
                      {medicalRoom.recent.map((v) => (
                        <div key={v.id} className="flex items-center justify-between py-1.5 text-xs">
                          <span className="text-text-primary truncate pr-2">{v.studentName} · {v.reason}</span>
                          <span className="text-text-secondary whitespace-nowrap">{v.actionTaken}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DashboardWidgetShell>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>Latest entries from the system audit trail.</CardDescription>
          </div>
          <Link href="/dashboard/admin/audit-logs">
            <span className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline cursor-pointer">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </CardHeader>
        <CardContent>
          <DashboardWidgetShell loading={activityLoading} error={activityError} onRetry={loadActivity} isEmpty={!activityLoading && timelineItems.length === 0}>
            <Timeline items={timelineItems} />
          </DashboardWidgetShell>
        </CardContent>
      </Card>
    </>
  );
}
