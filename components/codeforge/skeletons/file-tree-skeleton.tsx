'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * File Tree Skeleton Component
 * Displayed while file system is loading
 */
export function FileTreeSkeleton() {
  return (
    <div className="p-4 space-y-2 animate-pulse">
      {/* Folder items */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-2 p-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
          {/* Nested items */}
          {i === 2 && (
            <div className="ml-6 space-y-1">
              <div className="flex items-center gap-2 p-1">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-2 p-1">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
