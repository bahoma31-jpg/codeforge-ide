export default function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full w-full animate-pulse bg-background">
      {/* Tab Bar Skeleton */}
      <div className="flex items-center h-10 px-2 space-x-2 border-b border-border bg-muted/20">
        <div className="flex items-center space-x-2 px-3 py-1.5">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>

      {/* Editor Content Skeleton */}
      <div className="flex-1 p-4 space-y-3">
        {/* Line numbers */}
        <div className="flex space-x-4">
          <div className="w-8 text-right">
            <div className="h-4 w-6 bg-muted/50 rounded ml-auto" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-3/4 bg-muted/50 rounded" />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-8 text-right">
            <div className="h-4 w-6 bg-muted/50 rounded ml-auto" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-1/2 bg-muted/50 rounded" />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-8 text-right">
            <div className="h-4 w-6 bg-muted/50 rounded ml-auto" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-5/6 bg-muted/50 rounded" />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-8 text-right">
            <div className="h-4 w-6 bg-muted/50 rounded ml-auto" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 bg-muted/50 rounded" />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-8 text-right">
            <div className="h-4 w-6 bg-muted/50 rounded ml-auto" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-full bg-muted/50 rounded" />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-8 text-right">
            <div className="h-4 w-6 bg-muted/50 rounded ml-auto" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-3/5 bg-muted/50 rounded" />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-8 text-right">
            <div className="h-4 w-6 bg-muted/50 rounded ml-auto" />
          </div>
          <div className="flex-1 pl-8">
            <div className="h-4 w-4/5 bg-muted/50 rounded" />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-8 text-right">
            <div className="h-4 w-6 bg-muted/50 rounded ml-auto" />
          </div>
          <div className="flex-1 pl-8">
            <div className="h-4 w-2/3 bg-muted/50 rounded" />
          </div>
        </div>
      </div>

      {/* Status Bar Skeleton */}
      <div className="flex items-center justify-between h-6 px-4 text-xs border-t border-border bg-muted/20">
        <div className="flex items-center space-x-4">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
