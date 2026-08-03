"use client";

import React from "react";
import { PublicLayout } from "@/layouts/public-layout";

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto py-20 px-6 space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">Privacy Policy</h1>
        <p className="text-text-secondary leading-relaxed">
          At Aetheria Academy, we prioritize the confidentiality and safety of student records. All demographic profiles, fee invoices, grades, and calendar agendas are encrypted in transit and at rest.
        </p>
        <p className="text-text-secondary leading-relaxed">
          We strictly adhere to FERPA, GDPR, and global student data privacy regulations. No records or tracking cookies are shared with advertisers or third party brokers.
        </p>
      </div>
    </PublicLayout>
  );
}
