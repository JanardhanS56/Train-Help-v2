"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Headphones, HelpCircle, ShieldAlert } from "lucide-react";
import { ContactSupportModal } from "@/components/help/contact-support-modal";

const FAQS = [
  {
    id: "faq-1",
    question: "How do refunds work when Indian Railways cancels a train?",
    answer:
      "When a train is officially cancelled by Indian Railways due to track maintenance or weather, a 100% full fare refund is automatically credited back to your original payment method. No cancellation charges or clerkage fees are deducted. You do not need to file a manual TDR if the entire train is cancelled.",
  },
  {
    id: "faq-2",
    question: "What is the difference between RAC and Waitlist (WL)?",
    answer:
      "RAC (Reservation Against Cancellation) guarantees you the right to board the train with a confirmed seat, though you may share a lower side berth with another passenger until further cancellations occur. Waitlist (WL) tickets do not permit boarding on reserved coaches; if your ticket remains WL after chart preparation, you cannot travel and fare is refunded.",
  },
  {
    id: "faq-3",
    question: "How does TravelRescue determine the 'Best Match' train?",
    answer:
      "Our ranking algorithm uses deterministic scoring: 30% budget fit, 30% arrival fit (ensuring you reach your destination comfortably before critical deadlines like meetings), 15% fewer train changes (preferring direct trains), 15% journey duration, and 10% preference alignment (rewarding confirmed berths over RAC/Waitlist and preferred travel class).",
  },
  {
    id: "faq-4",
    question: "Can I choose a different travel class (e.g. 3A instead of 2A or Sleeper)?",
    answer:
      "Yes. In the Alternatives screen or in your Preferences, you can filter by any travel class (SL, 3A, 2A, 1A, CC, EC). Our ranking engine highlights confirmed berths in your preferred class and transparently displays any difference in fare.",
  },
  {
    id: "faq-5",
    question: "Can I board from a nearby railway station?",
    answer:
      "Yes. In your Preferences page, enable 'Include Nearby Stations'. For major metropolitan hubs like Bengaluru (SBC and Yesvantpur YPR) or Delhi (New Delhi NDLS and Hazrat Nizamuddin NZM), the recovery assistant scans trains departing from alternate terminals within the same city.",
  },
  {
    id: "faq-6",
    question: "How quickly is my recovery train confirmed?",
    answer:
      "Once you review the itinerary and tap 'Confirm Recovery', your replacement journey is confirmed instantly. Your new 10-digit PNR and coach/berth details are immediately reflected on your dashboard and trip details page.",
  },
];

export function FaqSection() {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            <span>Help & Frequently Asked Questions</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Guidance on train cancellations, berth types, refunds, and recovery options.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors touch-target shadow-card"
        >
          <Headphones className="w-4 h-4" />
          <span>Contact Support</span>
        </button>
      </div>

      {/* Accordion List */}
      <section aria-labelledby="faq-list-heading" className="bg-surface rounded-xl border border-border p-5 shadow-card">
        <h2 id="faq-list-heading" className="sr-only">
          Frequently Asked Questions
        </h2>
        <Accordion className="w-full">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="py-1">
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline hover:text-primary transition-colors py-3">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Reassurance Callout */}
      <div className="p-4 rounded-xl bg-background border border-border flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-foreground">Need urgent help at the station?</p>
          <p className="text-muted-foreground leading-relaxed">
            Our recovery assistant helps you check verified train availability across Indian Railways routes or track your automatic fare refund.
          </p>
        </div>
      </div>

      <ContactSupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
}
