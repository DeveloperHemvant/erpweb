"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/portal/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-text-primary">
      <header className="w-full h-16 bg-white dark:bg-slate-800 border-b flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="font-bold tracking-tight text-lg">Aetheria Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="relative h-10 w-10 rounded-full p-0">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-3 w-3 bg-error rounded-full border-2 border-white dark:border-slate-800"></span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={handleLogout} title="Sign Out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
