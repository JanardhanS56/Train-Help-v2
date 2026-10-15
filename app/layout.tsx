import type { Metadata } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/app-context";
import { AuthProvider } from "@/context/auth-context";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal", "italic"],
  display: "swap",
  fallback: ["Fraunces", "Georgia", "serif"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelRescue — Your journey, back on track",
  description:
    "When your train gets delayed or cancelled, TravelRescue ranks the best alternative railway schedules and gets you back on track in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans bg-background text-foreground">
        <AuthProvider>
          <AppProvider>
            <TooltipProvider delay={400}>
              {children}
              <CookieConsentBanner />
            </TooltipProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
