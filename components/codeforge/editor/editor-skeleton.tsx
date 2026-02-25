'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Editor Skeleton Component
 * Displayed while Monaco Editor is loading
 */
export function EditorSkeleton() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Tab bar skeleton */}
      <div className="h-10 bg-muted border-b flex items-center px-2 gap-2">
        <Skeleton className="h-6 w-24 rounded" />
        <Skeleton className="h-6 w-24 rounded" />
        <Skeleton className="h-6 w-24 rounded" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      
      {/* Editor area skeleton */}
      <div className="flex-1 bg-muted/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Status bar skeleton */}
      <div className="h-6 bg-muted border-t flex items-center px-2 gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
