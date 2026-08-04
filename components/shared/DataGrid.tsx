"use client";

import React from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DataGridColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataGridProps<T> {
  columns: DataGridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string) => void;

  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;

  /** Bulk/toolbar actions (Appendix A.1) — rendered to the right of search. */
  toolbarActions?: React.ReactNode;
}

/**
 * The shared list pattern every module today reimplements its own pagination
 * state for (Appendix A.1). Wraps the existing Table primitive — never
 * duplicates its markup.
 */
export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = "No records found.",
  onRowClick,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  sortKey,
  sortDirection = "asc",
  onSortChange,
  page,
  pageSize,
  totalCount,
  onPageChange,
  toolbarActions,
}: DataGridProps<T>) {
  const showToolbar = onSearchChange !== undefined || toolbarActions !== undefined;
  const totalPages = totalCount !== undefined && pageSize ? Math.max(1, Math.ceil(totalCount / pageSize)) : undefined;

  return (
    <div className="space-y-3">
      {showToolbar && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {onSearchChange !== undefined && (
            <div className="w-full sm:w-72">
              <Input
                leftIcon={<Search className="h-4 w-4" />}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {toolbarActions && <div className="flex items-center gap-2">{toolbarActions}</div>}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent cursor-default">
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <TableHead
                  key={col.key}
                  className={cn(col.sortable && "cursor-pointer select-none", col.className)}
                  onClick={col.sortable ? () => onSortChange?.(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && isSorted && (
                      sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                Loading...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-text-secondary">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {page !== undefined && totalPages !== undefined && onPageChange && (
        <div className="flex items-center justify-between text-xs text-text-secondary px-1">
          <span>
            {totalCount === 0
              ? "0 results"
              : `${(page - 1) * (pageSize ?? 0) + 1}–${Math.min(page * (pageSize ?? 0), totalCount ?? 0)} of ${totalCount}`}
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-1">Page {page} of {totalPages}</span>
            <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
