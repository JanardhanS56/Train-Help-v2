// Mock notifications and canned responses for train disruptions.

import type { Notification, ChatMessage, ChatOption } from "@/lib/types";
import { relativeDate } from "@/lib/format";

export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    tripId: "trip-4",
    type: "disruption",
    title: "Train cancelled",
    message: "Karnataka Express 12627 from Bengaluru to New Delhi was cancelled due to emergency track maintenance works.",
    timestamp: relativeDate(0, 8, 30),
    read: false,
  },
  {
    id: "notif-2",
    tripId: "trip-4",
    type: "recovery",
    title: "Alternative trains ready",
    message: "We found 5 alternative trains for Bengaluru–Delhi, including confirmed berths on Rajdhani Express.",
    timestamp: relativeDate(0, 8, 32),
    read: false,
  },
  {
    id: "notif-3",
    tripId: "trip-3",
    type: "disruption",
    title: "Train delayed",
    message: "Gitanjali Express 12859 is running 3h 15m behind schedule due to late running of inbound rake.",
    timestamp: relativeDate(0, 7, 0),
    read: false,
  },
  {
    id: "notif-4",
    tripId: "trip-5",
    type: "recovery",
    title: "Coach & berth confirmed",
    message: "Your replacement ticket on Panchaganga Express is confirmed: Coach B1, Berth 15.",
    timestamp: relativeDate(-1, 14, 0),
    read: true,
  },
  {
    id: "notif-5",
    tripId: "trip-1",
    type: "reminder",
    title: "Journey tomorrow",
    message: "Vande Bharat 20608 to Chennai Central departs tomorrow at 06:00 from Platform 1.",
    timestamp: relativeDate(0, 10, 0),
    read: true,
  },
  {
    id: "notif-6",
    tripId: "trip-2",
    type: "update",
    title: "Platform allocated",
    message: "Hussain Sagar Express 12702 will depart from Platform 4 at Secunderabad Junction.",
    timestamp: relativeDate(0, 6, 0),
    read: false,
  },
];

export interface CannedResponse {
  trigger: string;
  response: string;
  followUpOptions?: ChatOption[];
}

export const cannedResponses: CannedResponse[] = [
  {
    trigger: "what-happened",
    response: "Your train Karnataka Express (12627) from Bengaluru to New Delhi was cancelled today due to emergency track maintenance and interlocking works. A 100% full refund of ₹2,450 will be credited automatically to your original payment method within 5–7 days.",
    followUpOptions: [
      { label: "Show alternatives", value: "show-alternatives" },
      { label: "How refunds work", value: "refund-info" },
    ],
  },
  {
    trigger: "show-alternatives",
    response: "I found 5 alternatives for your route today. Bengaluru Rajdhani Express (22691) is the top match: 18 confirmed AC 3-Tier berths, arriving at 05:55 on day +2, giving you 3 hours before your 09:00 AM Delhi meeting.",
    followUpOptions: [
      { label: "Show fastest option", value: "show-fastest" },
      { label: "Sort by price", value: "sort-price" },
    ],
  },
  {
    trigger: "refund-info",
    response: "When Indian Railways cancels a train, 100% full fare is automatically refunded with zero cancellation charges. For online bookings, the refund will be credited back to your original payment method in 5 to 7 working days.",
    followUpOptions: [
      { label: "Show alternatives", value: "show-alternatives" },
      { label: "What is RAC vs WL?", value: "rac-info" },
    ],
  },
  {
    trigger: "rac-info",
    response: "RAC (Reservation Against Cancellation) guarantees you the right to board with a shared lower berth. Waitlist (WL) tickets do not grant boarding rights if unconfirmed at chart preparation.",
    followUpOptions: [
      { label: "Show alternatives", value: "show-alternatives" },
    ],
  },
  {
    trigger: "sort-price",
    response: "The lowest fare option is Sampark Kranti connecting via Bhopal at ₹980 in Sleeper class (RAC 14). The lowest confirmed AC alternative is Rajdhani Express (22691) at ₹2,840.",
    followUpOptions: [
      { label: "Show alternatives", value: "show-alternatives" },
    ],
  },
  {
    trigger: "show-fastest",
    response: "Bengaluru Rajdhani Express (22691) is the fastest option on this corridor, completing the journey in 33h 55m and reaching Hazrat Nizamuddin at 05:55 AM (+2 days).",
    followUpOptions: [
      { label: "Show alternatives", value: "show-alternatives" },
    ],
  },
  {
    trigger: "change-budget",
    response: "You can adjust your maximum budget in Preferences. Our ranking system immediately recalculates scores and highlights options fitting your new price ceiling.",
  },
  {
    trigger: "help-decide",
    response: "If reaching your morning meeting in Delhi is your top priority, select Bengaluru Rajdhani Express (22691). It arrives at 05:55 AM (+2 days) with 18 confirmed berths.",
    followUpOptions: [
      { label: "Show alternatives", value: "show-alternatives" },
    ],
  },
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: "chat-init",
    role: "assistant",
    content: "Your train Karnataka Express (12627) was cancelled today. I found 5 alternatives; 3 fit your preferences.",
    timestamp: relativeDate(0, 8, 35),
    options: [
      { label: "Show alternatives", value: "show-alternatives" },
      { label: "Change budget", value: "change-budget" },
      { label: "Show fastest option", value: "show-fastest" },
      { label: "Help me decide", value: "help-decide" },
    ],
  },
];
