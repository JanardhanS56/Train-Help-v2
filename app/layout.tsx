import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/app-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelRescue — Something went wrong. We've got this.",
  description:
    "When your train gets delayed or cancelled, TravelRescue ranks the best alternative railway schedules and gets you back on track in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProvider>
          <TooltipProvider delay={400}>
            {children}
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
