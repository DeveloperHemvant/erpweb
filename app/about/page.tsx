"use client";

import React from "react";
import { PublicLayout } from "@/layouts/public-layout";

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto py-20 px-6 space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">About Aetheria ERP</h1>
        <p className="text-text-secondary leading-relaxed">
          Aetheria ERP was established with a singular mission: to upgrade legacy school administration software into sleek, modern, web interfaces. We believe that registrars, teachers, and student support teams deserve SaaS tools that are as responsive, accessible, and fast as the industry-standard developer platforms.
        </p>
        <p className="text-text-secondary leading-relaxed">
          Designed by a team of design system architects, Aetheria combines powerful keyboard shortcuts, responsive sidebars, and customizable theme settings to provide the premier digital campus ecosystem.
        </p>
      </div>
    </PublicLayout>
  );
}
