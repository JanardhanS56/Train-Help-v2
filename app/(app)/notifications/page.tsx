import type { Metadata } from "next";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata: Metadata = {
  title: "Notifications — TravelRescue",
  description: "Stay updated on train disruptions, recovery options, and journey reminders.",
};

export default function NotificationsPage() {
  return <NotificationsView />;
}
