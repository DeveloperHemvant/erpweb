"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar Header */}
      <header className="h-16 border-b border-border bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="h-9 w-9 bg-primary rounded-btn flex items-center justify-center text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-text-primary">
            Aetheria Academy
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
          <span onClick={() => router.push("/about")} className="hover:text-primary cursor-pointer transition-colors">About</span>
          <span onClick={() => router.push("/contact")} className="hover:text-primary cursor-pointer transition-colors">Contact</span>
          <span onClick={() => router.push("/privacy")} className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
          <span onClick={() => router.push("/terms")} className="hover:text-primary cursor-pointer transition-colors">Terms</span>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => router.push("/dashboard/playground")}>
            View Demo
          </Button>
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white dark:bg-slate-900 py-8 px-6 md:px-12 text-center text-xs text-text-secondary">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 Aetheria Academy ERP Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <span onClick={() => router.push("/privacy")} className="hover:underline cursor-pointer">Privacy Policy</span>
            <span>&bull;</span>
            <span onClick={() => router.push("/terms")} className="hover:underline cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
