import React from "react";
import { cn } from "../lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "shimmer rounded-lg",
        className,
      )}
    />
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 w-full shimmer rounded-lg" />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
