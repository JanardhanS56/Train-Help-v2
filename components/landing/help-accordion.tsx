"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, HelpCircle } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-irctc",
    question: "Is this connected to Indian Railways or IRCTC?",
    answer:
      "No. TravelRescue is an independent technology prototype demonstrating resilient passenger recovery interfaces. It uses verified timetables and deterministic algorithms to showcase how disruption rerouting can be automated without direct booking system dependency.",
  },
  {
    id: "faq-storage",
    question: "Is my data stored?",
    answer:
      "Session preferences, active demo states, and cookie consents are stored locally on your device (via localStorage). TravelRescue does not retain payment credentials, credit card details, UPI PINs, or passenger identification records on remote servers.",
  },
  {
    id: "faq-ranking",
    question: "How are trains ranked?",
    answer:
      "Our deterministic comparator first filters schedules by your maximum budget threshold. Within eligible services, it strictly prioritises confirmed berths (CNF) over RAC and Waitlist (WL), followed by earliest arrival time at the destination, and finally lowest ticket fare.",
  },
  {
    id: "faq-waitlist",
    question: "What do RAC and waitlist mean?",
    answer:
      "RAC (Reservation Against Cancellation) guarantees travel on the rake with a shared side-lower berth allocation. Waitlist (WL) tickets provide no guaranteed berth, and passengers cannot board reserved coaches unless their status clears prior to railway chart preparation.",
  },
  {
    id: "faq-refund",
    question: "Will I really get a refund?",
    answer:
      "In the live railway ecosystem, when a train is officially cancelled by Indian Railways, full refunds are issued automatically through the original booking channel. In this prototype, refund tracking is illustrative and demonstrates how reconciliation progress is presented to travellers.",
  },
];

export function HelpAccordion() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    "faq-irctc": true, // Default first item open for accessibility discovery
  });

  const toggle = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section
      id="help"
      aria-labelledby="heading-help"
      className="py-20 px-4 md:px-6 max-w-[860px] mx-auto space-y-10 scroll-mt-20"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>HELP & CLARIFICATIONS</span>
        </div>
        <h2
          id="heading-help"
          className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight"
        >
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Clear, honest answers regarding data handling, ranking methodology,
          and prototype scope.
        </p>
      </div>

      {/* 5 Native Button Accordion Items */}
      <div className="divide-y divide-hairline border-y border-hairline">
        {FAQS.map((faq) => {
          const isOpen = Boolean(openIds[faq.id]);
          const buttonId = `btn-${faq.id}`;
          const regionId = `region-${faq.id}`;

          return (
            <div key={faq.id} className="py-4">
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={regionId}
                  onClick={() => toggle(faq.id)}
                  className="w-full flex items-center justify-between text-left gap-4 group focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 cursor-pointer"
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
              </h3>

              {isOpen && (
                <div
                  id={regionId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="pt-3 pb-1 text-xs text-muted-foreground leading-relaxed transition-all"
                >
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Link to existing Help destination */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          Need detailed passenger guidelines?
        </span>
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <span>See all help & FAQs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
