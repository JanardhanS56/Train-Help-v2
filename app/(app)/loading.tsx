import { Loader2, Train } from "lucide-react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full space-y-6 animate-pulse py-4 max-w-4xl"
    >
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted/70 rounded-md" />
        <div className="h-8 w-64 bg-muted/90 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-muted/60 rounded-md" />
      </div>

      {/* Railway Disruption Banner Skeleton */}
      <div className="p-6 rounded-xl border border-border/60 bg-surface/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Train className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-muted/80 rounded" />
              <div className="h-3 w-28 bg-muted/60 rounded" />
            </div>
          </div>
          <div className="h-6 w-24 bg-muted/70 rounded-full" />
        </div>

        <div className="h-24 bg-muted/30 rounded-lg border border-dashed border-border/60 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Synchronizing live railway manifest and berth quotas...</span>
        </div>
      </div>

      {/* Alternative Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-border/50 bg-surface/40 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-muted/80 rounded" />
              <div className="h-4 w-16 bg-muted/60 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted/50 rounded" />
              <div className="h-3 w-4/5 bg-muted/50 rounded" />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <div className="h-6 w-20 bg-muted/70 rounded" />
              <div className="h-8 w-24 bg-muted/80 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
