'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Terminal Skeleton Component
 * Displayed while xterm.js Terminal is loading
 */
export function TerminalSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Terminal tabs skeleton */}
      <div className="h-10 bg-muted border-b flex items-center px-2 gap-2 animate-pulse">
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>

      {/* Terminal content skeleton */}
      <div className="flex-1 bg-[#1e1e1e] dark:bg-[#0a0a0a] p-4 space-y-3 animate-pulse font-mono text-sm">
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 rounded-full bg-green-500/30" />
          <Skeleton className="h-4 w-32 bg-muted-foreground/20" />
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-500/50">$</span>
          <Skeleton className="h-4 w-48 bg-muted-foreground/20" />
        </div>
        <Skeleton className="h-4 w-64 bg-muted-foreground/10" />
        <Skeleton className="h-4 w-56 bg-muted-foreground/10" />
        <Skeleton className="h-4 w-40 bg-muted-foreground/10" />
        <div className="flex items-start gap-2 mt-4">
          <span className="text-green-500/50">$</span>
          <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
        </div>
        <Skeleton className="h-4 w-72 bg-muted-foreground/10" />
        <Skeleton className="h-4 w-64 bg-muted-foreground/10" />
        <div className="flex items-start gap-2 mt-4">
          <span className="text-green-500/50">$</span>
          <div className="w-2 h-4 bg-white/80 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
