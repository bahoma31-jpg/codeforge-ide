export function EditorSkeleton() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Tab bar skeleton */}
      <div className="h-10 bg-muted border-b flex items-center px-2 space-x-2">
        <div className="h-6 w-24 bg-muted-foreground/20 rounded" />
        <div className="h-6 w-24 bg-muted-foreground/20 rounded" />
        <div className="h-6 w-24 bg-muted-foreground/20 rounded" />
      </div>

      {/* Editor area skeleton */}
      <div className="flex-1 bg-muted/50 p-4 space-y-2">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-4 bg-muted-foreground/20 rounded w-full" />
        <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
        <div className="h-4 bg-muted-foreground/20 rounded w-full" />
        <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
        <div className="h-4 bg-muted-foreground/20 rounded w-4/5" />
        <div className="h-4 bg-muted-foreground/20 rounded w-full" />
        <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
      </div>
    </div>
  );
}
