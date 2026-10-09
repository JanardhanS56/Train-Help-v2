"use client";

import { useRouter } from "next/navigation";
import {
  CheckCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Info,
  ArrowRight,
} from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { formatRelativeTime } from "@/lib/format";
import type { Notification, NotificationType } from "@/lib/types";

const NOTIF_ICONS: Record<NotificationType, typeof AlertTriangle> = {
  disruption: AlertTriangle,
  recovery: RefreshCw,
  update: Info,
  reminder: Clock,
};

const NOTIF_COLORS: Record<NotificationType, { text: string; bg: string; border: string }> = {
  disruption: { text: "text-disruption", bg: "bg-disruption/10", border: "border-disruption/30" },
  recovery: { text: "text-success", bg: "bg-success/10", border: "border-success/30" },
  update: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  reminder: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
};

export function NotificationsView() {
  const router = useRouter();
  const { state, unreadCount } = useApp();
  const dispatch = useAppDispatch();

  function handleNotificationClick(notif: Notification) {
    if (!notif.read) {
      dispatch({ type: "MARK_NOTIFICATION_READ", notificationId: notif.id });
    }

    if (notif.type === "disruption" || notif.type === "recovery") {
      router.push(`/recovery/${notif.tripId}`);
    } else {
      router.push(`/trips/${notif.tripId}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Updates on train disruptions, ticket recovery, and journey milestones.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" })}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-primary hover:bg-background transition-colors touch-target shadow-card"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3" role="feed" aria-label="Notifications list">
        {state.notifications.map((notif) => {
          const Icon = NOTIF_ICONS[notif.type];
          const colors = NOTIF_COLORS[notif.type];

          return (
            <article
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-card flex items-start gap-3.5 ${
                notif.read
                  ? "bg-surface border-border opacity-85 hover:border-muted-foreground/30"
                  : "bg-surface border-primary/40 ring-1 ring-primary/10"
              }`}
            >
              {/* Type Icon */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}
                aria-hidden="true"
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold text-foreground">
                      {notif.title}
                    </h2>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary" aria-label="Unread" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(notif.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {notif.message}
                </p>

                <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <span>View details</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
