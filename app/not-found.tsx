import Link from "next/link";
import { Compass, LayoutDashboard, ArrowLeft, Train } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-surface shadow-xl space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7 stroke-[1.75] animate-spin [animation-duration:8s]" />
        </div>

        <div className="space-y-2">
          <span className="micro-label font-mono uppercase text-primary">
            Station Not Found · 404
          </span>
          <h1 className="text-2xl font-display font-medium text-foreground tracking-tight">
            Platform doesn’t exist
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The timetable, route or train link you navigated to could not be found on the Indian Railways line.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-10 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open Dashboard</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto h-10 px-5 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home Page</span>
          </Link>
        </div>

        <div className="border-t border-hairline pt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Train className="w-3.5 h-3.5 text-primary" />
          <span>TravelRescue Automated Recovery Engine</span>
        </div>
      </div>
    </div>
  );
}
