"use client";

import React, { useState } from "react";
import { User, Bell, Shield, HelpCircle, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTab {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [activeSubTab, setActiveSubTab] = useState("profile");

  const tabs: SettingsTab[] = [
    { id: "profile", name: "My Profile", icon: <User className="h-4 w-4" /> },
    { id: "notifications", name: "Notification Preferences", icon: <Bell className="h-4 w-4" /> },
    { id: "security", name: "Access & Security", icon: <Shield className="h-4 w-4" /> },
    { id: "storage", name: "Backup & Storage", icon: <HardDrive className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Settings Navigation Column */}
      <aside className="w-full lg:w-64 shrink-0 bg-card rounded-card border border-border p-4 space-y-1 shadow-soft">
        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
          Control Center
        </h2>
        {tabs.map((tab) => {
          const isActive = tab.id === activeSubTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-btn transition-colors cursor-pointer text-left",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800/40"
              )}
            >
              {tab.icon}
              {tab.name}
            </button>
          );
        })}
      </aside>

      {/* Settings Content Pane */}
      <div className="flex-1 w-full bg-card rounded-card border border-border p-6 md:p-8 shadow-soft">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // @ts-ignore
            return React.cloneElement(child, { activeTab: activeSubTab });
          }
          return child;
        })}
      </div>
    </div>
  );
}
