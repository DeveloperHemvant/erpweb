"use client";

import React from "react";
import { GraduationCap } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side: Premium Illustration & Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-center justify-center p-12 overflow-hidden">
        {/* Soft, beautiful background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,64,175,0.2),transparent_50%)]" />
        
        {/* Abstract shapes representing Modern Academy */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative z-10 w-full max-w-md flex flex-col justify-between h-full">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-primary rounded-btn flex items-center justify-center text-white shadow-soft">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Aetheria Academy
            </span>
          </div>

          <div className="my-auto space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
              Enterprise Grade Student Information System
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Experience the unified digital campus hub. Designed to streamline academic progress tracking, fee management, classroom attendance, and administrative oversight.
            </p>
            <div className="flex items-center gap-4 p-4 rounded-card bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="h-2 w-2 rounded-full bg-success animate-ping" />
              <p className="text-xs text-slate-300 font-medium">
                Academic Year 2026-27 Dashboard is active and synced.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            &copy; 2026 Aetheria Academy &bull; Powered by Antigravity OS
          </div>
        </div>
      </div>

      {/* Right side: Auth Form Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
