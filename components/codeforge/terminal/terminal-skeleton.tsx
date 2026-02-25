export default function TerminalSkeleton() {
  return (
    <div className="flex flex-col h-full w-full animate-pulse bg-background">
      {/* Terminal Tab Bar Skeleton */}
      <div className="flex items-center h-9 px-2 space-x-2 border-b border-border bg-muted/20">
        <div className="flex items-center space-x-2 px-2 py-1.5">
          <div className="h-3 w-3 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </div>

      {/* Terminal Content Skeleton */}
      <div className="flex-1 p-3 space-y-2 font-mono text-sm">
        {/* Prompt lines */}
        <div className="flex items-center space-x-2">
          <div className="h-4 w-6 bg-muted/70 rounded" />
          <div className="h-4 w-32 bg-muted/50 rounded" />
        </div>

        <div className="flex items-center space-x-2">
          <div className="h-4 w-full bg-muted/30 rounded" />
        </div>

        <div className="flex items-center space-x-2">
          <div className="h-4 w-3/4 bg-muted/30 rounded" />
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <div className="h-4 w-6 bg-muted/70 rounded" />
          <div className="h-4 w-40 bg-muted/50 rounded" />
        </div>

        <div className="flex items-center space-x-2">
          <div className="h-4 w-2/3 bg-muted/30 rounded" />
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <div className="h-4 w-6 bg-muted/70 rounded" />
          <div className="h-4 w-24 bg-muted/50 rounded" />
          <div className="h-4 w-2 bg-muted/70 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
