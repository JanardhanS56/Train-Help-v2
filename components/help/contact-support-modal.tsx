"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, Headphones, Send } from "lucide-react";

interface ContactSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactSupportModal({ open, onOpenChange }: ContactSupportModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("Vikram Patel");
  const [pnr, setPnr] = useState("4829104829");
  const [contact, setContact] = useState("+91 98765 43210");
  const [category, setCategory] = useState("Train cancelled");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setMessage("");
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-surface p-6 rounded-xl border border-border shadow-card">
        {submitted ? (
          <div className="py-6 text-center space-y-4 animate-in fade-in-50 duration-200">
            <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-foreground">
                Request Received
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Case reference: <span className="font-mono font-bold text-foreground">#TR-88492</span>
              </DialogDescription>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed max-w-xs mx-auto">
              A dedicated recovery specialist is reviewing your 10-digit PNR <strong>{pnr}</strong> and will connect via SMS and phone within 5 minutes.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target shadow-card"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader className="gap-1 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <Headphones className="w-5 h-5" />
                <DialogTitle className="text-lg font-bold text-foreground">
                  Contact Recovery Support
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Direct assistance for urgent domestic train disruptions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-foreground block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">10-Digit PNR</label>
                  <input
                    type="text"
                    required
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-foreground focus:ring-1 focus:ring-primary outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Phone or Email</label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="Train cancelled">Train cancelled</option>
                  <option value="Train delayed">Train delayed</option>
                  <option value="Berth / Coach query">Berth / Coach query</option>
                  <option value="Refund inquiry">Refund inquiry</option>
                  <option value="Other">Other emergency assistance</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Additional details (optional)</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Need to reach Delhi for 9 AM meeting..."
                  className="w-full rounded-lg border border-border bg-background p-2 text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background transition-colors touch-target"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors touch-target shadow-card flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
