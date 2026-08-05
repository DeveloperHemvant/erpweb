"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { workspaces } from "@/layouts/workspace-config";
import { ArrowLeft } from "lucide-react";

/**
 * /workspace/{workspace} landing pages (IA §9's grammar) — additive routes
 * standing alongside the existing /dashboard/admin/* tool pages, not
 * replacing them. Per IA §9's own sequencing note, old module URLs get
 * redirected to these only "after the new destinations are proven out" —
 * that redirect step is intentionally deferred, not done in this pass.
 */
export default function WorkspaceLandingPage() {
  const params = useParams<{ workspace: string }>();
  const router = useRouter();
  const workspace = workspaces.find((w) => w.key === params?.workspace);

  if (!workspace) {
    return (
      <div className="p-10 text-center text-text-secondary">
        Unknown workspace.
        <div className="mt-3">
          <a href="/dashboard"><Button variant="outline" size="sm">Back to Dashboard</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2.5">
          <span className="text-primary">{workspace.icon}</span>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{workspace.label}</h1>
        </div>
      </div>

      {workspace.items.length === 0 ? (
        <p className="text-sm text-text-secondary">No tools available in this workspace for your role.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspace.items.map((item) => (
            <Card key={item.href} hoverable className="p-4 cursor-pointer" onClick={() => router.push(item.href)}>
              <div className="flex items-center gap-3">
                <span className="text-primary shrink-0">{item.icon}</span>
                <span className="text-sm font-semibold text-text-primary">{item.name}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
