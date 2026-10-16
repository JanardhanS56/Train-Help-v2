/**
 * lib/journeys/classes.ts
 * Determines available travel classes for a train based on train type and composition.
 */

import type { TravelClass } from "./types";

export interface ClassesOfferedResult {
  classes: TravelClass[];
  source: "official" | "derived";
}

/**
 * Derives realistic accommodation classes offered by Indian Railways train types.
 */
export function classesOffered(train: {
  train_type: string;
  amenities?: Record<string, boolean>;
}): ClassesOfferedResult {
  const type = (train.train_type || "").toLowerCase();

  // Premium overnight AC trains
  if (type.includes("rajdhani") || type.includes("tejas")) {
    return {
      classes: ["1A", "2A", "3A", "3E"],
      source: "derived",
    };
  }

  // Day express / chair car trains
  if (type.includes("shatabdi") || type.includes("vande bharat")) {
    return {
      classes: ["EC", "CC"],
      source: "derived",
    };
  }

  // Non-stop / point-to-point AC & Non-AC
  if (type.includes("duronto")) {
    return {
      classes: ["1A", "2A", "3A", "SL"],
      source: "derived",
    };
  }

  // Low-cost AC
  if (type.includes("garib rath")) {
    return {
      classes: ["3A", "CC"],
      source: "derived",
    };
  }

  // Intercity / Jan Shatabdi
  if (type.includes("jan shatabdi")) {
    return {
      classes: ["CC", "2S"],
      source: "derived",
    };
  }

  // All-AC 3-Tier Humsafar
  if (type.includes("humsafar")) {
    return {
      classes: ["3A", "3E"],
      source: "derived",
    };
  }

  // Standard Superfast / Mail / Express
  return {
    classes: ["2A", "3A", "SL", "2S"],
    source: "derived",
  };
}
