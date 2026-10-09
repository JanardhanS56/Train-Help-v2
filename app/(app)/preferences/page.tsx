import type { Metadata } from "next";
import { PreferencesForm } from "@/components/preferences/preferences-form";

export const metadata: Metadata = {
  title: "Preferences — TravelRescue",
  description:
    "Set your travel preferences: train classes, budget, changes, and arrival constraints.",
};

export default function PreferencesPage() {
  return <PreferencesForm />;
}
