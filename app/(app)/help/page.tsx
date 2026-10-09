import type { Metadata } from "next";
import { FaqSection } from "@/components/help/faq-section";

export const metadata: Metadata = {
  title: "Help & FAQs — TravelRescue",
  description:
    "Get help with train disruptions, Indian Railways passenger rules, refunds, and rebooking alternatives.",
};

export default function HelpPage() {
  return <FaqSection />;
}
