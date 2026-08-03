"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PublicLayout } from "@/layouts/public-layout";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  UserCheck
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 md:px-12 bg-white dark:bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(2,132,199,0.06),transparent_55%)]" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
            Next-Gen School ERP v2.0 Platform
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] max-w-4xl mx-auto">
            Design-First Administrative Platform for Modern Academies
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Beautiful dashboard structures, clean tabular data, high performance analytics cards, and customizable user forms built for enterprise universities and multi-campus schools.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/login")}
              rightIcon={<ArrowRight className="h-5 w-5" />}
              className="w-full sm:w-auto"
            >
              Sign In to Dashboard
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/dashboard/playground")}
              className="w-full sm:w-auto"
            >
              Explore Components
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 md:px-12 bg-slate-50 dark:bg-slate-900/40 border-t border-border">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">
              Built for Scale, Designed for Simplicity
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm">
              Say goodbye to messy clunky interfaces. Enjoy a sleek workspace inspired by the modern SaaS stack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-card border border-border space-y-4 hover:shadow-soft transition-all">
              <div className="h-12 w-12 rounded-btn bg-primary/10 flex items-center justify-center text-primary">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Unified Dashboard</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Aggregated views for attendance, monthly dues, scheduled events, and academic calendars in real-time.
              </p>
            </div>

            <div className="bg-card p-8 rounded-card border border-border space-y-4 hover:shadow-soft transition-all">
              <div className="h-12 w-12 rounded-btn bg-success/10 flex items-center justify-center text-success">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Clean Record Management</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Sort, filter, search, and manage students records without pagination lag or confusing parameters.
              </p>
            </div>

            <div className="bg-card p-8 rounded-card border border-border space-y-4 hover:shadow-soft transition-all">
              <div className="h-12 w-12 rounded-btn bg-info/10 flex items-center justify-center text-info">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Financial Reporting</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Beautiful fee collection records, pending invoice lists, and charts indicating academic fiscal health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Quote Section */}
      <section className="py-20 px-6 md:px-12 bg-white dark:bg-slate-950 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-lg font-medium text-text-primary italic leading-relaxed">
            &ldquo;Aetheria ERP completely transformed how our administrative staff registers new enrollments and processes quarterly fees. The interface is clean, keyboard friendly, and requires zero manual training.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">Dr. Eleanor Vance</p>
              <p className="text-xs text-text-secondary">Dean of Academics, Crestview International</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
