"use client";

import React, { useState } from "react";
import { SettingsLayout } from "@/layouts/settings-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { toast } = useToast();
  
  // Tab states are managed inside SettingsLayout which passes activeTab prop
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Institution Settings
        </h1>
        <p className="text-sm text-text-secondary">
          Manage system parameters, access logs, and user profile notifications.
        </p>
      </div>

      <SettingsLayout>
        {/* Settings sub sections */}
        <SettingsContentWrapper toast={toast} />
      </SettingsLayout>
    </>
  );
}

function SettingsContentWrapper({ activeTab, toast }: { activeTab?: string; toast: any }) {
  const [profileName, setProfileName] = useState("Staff Director");
  const [profileEmail, setProfileEmail] = useState("staff@academy.edu");
  const [smsNotification, setSmsNotification] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Settings Saved", { description: "Your configurations have been synced.", type: "success" });
  };

  if (activeTab === "profile") {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-text-primary">My Profile</h3>
          <p className="text-xs text-text-secondary">Personal account details and signature keys.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
          />
        </div>
        <Button type="submit" variant="primary">
          Save Profile Details
        </Button>
      </form>
    );
  }

  if (activeTab === "notifications") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-text-primary">Notifications</h3>
          <p className="text-xs text-text-secondary">Setup automated alerts, daily roundups, and report triggers.</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-btn border">
            <Switch
              checked={smsNotification}
              onChange={setSmsNotification}
              label="SMS Alerts for Emergency Rollovers"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-btn border">
            <Switch
              checked={emailNotification}
              onChange={setEmailNotification}
              label="Daily Audit Report Summary Email"
            />
          </div>
        </div>
        <Button variant="primary" onClick={() => toast("Notification Rules Saved", { type: "success" })}>
          Save Preferences
        </Button>
      </div>
    );
  }

  if (activeTab === "security") {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-text-primary">Security Settings</h3>
          <p className="text-xs text-text-secondary">Manage password credentials and multi-factor keys.</p>
        </div>
        <div className="space-y-4">
          <Input label="Current Password" type="password" />
          <Input label="New Password" type="password" />
          <Input label="Confirm New Password" type="password" />
        </div>
        <Button type="submit" variant="primary">
          Update Password
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-text-primary">Backup &amp; Storage</h3>
        <p className="text-xs text-text-secondary">Configure database replication and file retention limits.</p>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-btn border border-border text-sm text-text-secondary">
        Daily backups are handled automatically by the system and synced to AWS S3. 
      </div>
    </div>
  );
}
