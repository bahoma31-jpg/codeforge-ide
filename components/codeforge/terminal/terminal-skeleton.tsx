export function TerminalSkeleton() {
  return (
    <div className="h-full bg-muted animate-pulse p-4 space-y-2">
      <div className="h-4 bg-muted-foreground/20 rounded w-32" />
      <div className="h-4 bg-muted-foreground/20 rounded w-48" />
      <div className="h-4 bg-muted-foreground/20 rounded w-64" />
      <div className="h-4 bg-muted-foreground/20 rounded w-40" />
    </div>
  );
}
