"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EntityHeader, type EntityHeaderProps } from "./EntityHeader";
import { Tabs, type TabOption } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export interface EntityCrossNavLink {
  label: string;
  description?: string;
  href: string;
}

export interface EntityPageShellProps {
  header: EntityHeaderProps;
  tabs: TabOption[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Curated related-entity links (IA §11) — never auto-derived from every FK, hand-picked per entity type. */
  relatedLinks?: EntityCrossNavLink[];
  children: React.ReactNode;
}

/**
 * The canonical shape every Entity 360 page (IA §4) renders through: header,
 * tab strip, tab content, and a cross-navigation rail. Individual 360 pages
 * own their per-tab content (passed as `children`) and don't reimplement this
 * frame — that's the entire point of having one shell.
 */
export function EntityPageShell({ header, tabs, activeTab, onTabChange, relatedLinks, children }: EntityPageShellProps) {
  return (
    <div className="space-y-5">
      <EntityHeader {...header} />

      <div className={relatedLinks && relatedLinks.length > 0 ? "grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start" : ""}>
        <div className="min-w-0 space-y-4">
          <Tabs options={tabs} activeTab={activeTab} onChange={onTabChange} />
          <div>{children}</div>
        </div>

        {relatedLinks && relatedLinks.length > 0 && (
          <aside className="space-y-2.5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary px-1">Related</h2>
            {relatedLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card hoverable className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{link.label}</p>
                      {link.description && (
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{link.description}</p>
                      )}
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                  </div>
                </Card>
              </Link>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
