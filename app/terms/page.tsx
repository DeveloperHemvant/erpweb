"use client";

import React from "react";
import { PublicLayout } from "@/layouts/public-layout";

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto py-20 px-6 space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">Terms of Service</h1>
        <p className="text-text-secondary leading-relaxed">
          By utilizing Aetheria ERP, school staff, teachers, parents, and administrative operators agree to follow local academic usage policies. Access keys and login credentials must not be shared.
        </p>
        <p className="text-text-secondary leading-relaxed">
          Unauthorized screen scraping or penetration testing on school assets is strictly prohibited. Users found violating these provisions will face immediate session termination.
        </p>
      </div>
    </PublicLayout>
  );
}
