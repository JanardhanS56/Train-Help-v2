"use client";

import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { formatRelativeTime } from "@/lib/format";
import type { Notification } from "@/lib/types";

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
      {/* Header in Display Font */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <h1 className="text-[28px] font-display text-foreground tracking-tight leading-tight">
            Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time Indian Railways disruption and booking recovery alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" })}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List: Clean rows with unread dot, not cards */}
      <div className="bg-surface rounded-xl border border-border divide-y divide-hairline" role="feed" aria-label="Notifications list">
        {state.notifications.map((notif) => {
          return (
            <article
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 transition-colors cursor-pointer flex items-start gap-3 hover:bg-background/80 ${
                notif.read ? "opacity-75" : "bg-surface"
              }`}
            >
              {/* Unread indicator dot */}
              <div className="pt-1.5 w-2.5 shrink-0 flex items-center justify-center">
                {!notif.read ? (
                  <span className="w-2 h-2 rounded-full bg-primary" aria-label="Unread notification" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-hairline" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-xs font-medium text-foreground">
                    {notif.title}
                  </h2>
                  <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(notif.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {notif.message}
                </p>

                <p className="text-[11px] text-primary pt-0.5 font-medium hover:underline inline-block">
                  View journey details →
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
