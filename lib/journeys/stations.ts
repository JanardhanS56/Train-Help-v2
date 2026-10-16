/**
 * lib/journeys/stations.ts
 * Station clustering and nearby terminal expansion for Indian Railway hubs.
 *
 * Rule: Stations serving the same metropolitan terminal cluster (within 15–25 km radius
 * or common suburban transit interchange) are grouped together when the passenger enables
 * "Include nearby stations" in their preferences or search dialog.
 */

// Major Indian Railway metropolitan terminal clusters
export const NEARBY_STATION_CLUSTERS: Record<string, string[]> = {
  // Bengaluru Area
  SBC: ["SBC", "YPR", "BNC", "SMVB", "KJM", "BYPL", "WFD"],
  YPR: ["YPR", "SBC", "BNC", "SMVB", "KJM", "BYPL"],
  BNC: ["BNC", "SBC", "YPR", "SMVB", "KJM"],
  SMVB: ["SMVB", "SBC", "YPR", "BNC", "KJM"],
  KJM: ["KJM", "SMVB", "BNC", "SBC", "WFD"],

  // Delhi NCR Area
  NDLS: ["NDLS", "NZM", "DLI", "ANVT", "DEE", "GZB"],
  NZM: ["NZM", "NDLS", "DLI", "ANVT", "DEE", "GZB"],
  DLI: ["DLI", "NDLS", "NZM", "ANVT", "DEE"],
  ANVT: ["ANVT", "NDLS", "NZM", "DLI", "GZB"],
  DEE: ["DEE", "NDLS", "DLI", "NZM"],
  GZB: ["GZB", "ANVT", "NDLS", "DLI", "NZM"],

  // Mumbai Metropolitan Area
  CSMT: ["CSMT", "BCT", "MMCT", "BDTS", "LTT", "DR", "TNA", "KYN"],
  MMCT: ["MMCT", "CSMT", "BDTS", "BCT", "DR", "LTT"],
  BDTS: ["BDTS", "MMCT", "CSMT", "BCT", "DR", "LTT"],
  LTT: ["LTT", "CSMT", "BDTS", "DR", "TNA", "KYN"],
  DR: ["DR", "CSMT", "MMCT", "BDTS", "LTT"],
  TNA: ["TNA", "LTT", "KYN", "CSMT", "DR"],
  KYN: ["KYN", "TNA", "LTT", "CSMT"],

  // Chennai Area
  MAS: ["MAS", "MS", "TBM", "PER"],
  MS: ["MS", "MAS", "TBM", "PER"],
  TBM: ["TBM", "MS", "MAS"],
  PER: ["PER", "MAS", "MS"],

  // Kolkata Area
  HWH: ["HWH", "SDAH", "KOAA", "SHM"],
  SDAH: ["SDAH", "HWH", "KOAA", "SHM"],
  KOAA: ["KOAA", "HWH", "SDAH", "SHM"],
  SHM: ["SHM", "HWH", "SDAH"],

  // Hyderabad / Secunderabad Area
  SC: ["SC", "HYB", "KCG", "LPI"],
  HYB: ["HYB", "SC", "KCG", "LPI"],
  KCG: ["KCG", "SC", "HYB", "LPI"],
  LPI: ["LPI", "SC", "HYB"],

  // Lucknow Area
  LKO: ["LKO", "LJN", "BNZ", "ASH"],
  LJN: ["LJN", "LKO", "BNZ", "ASH"],

  // Kanpur Area
  CNB: ["CNB", "CPA"],
  CPA: ["CPA", "CNB"],

  // Varanasi Area
  BSB: ["BSB", "DDU", "BSBS"],
  DDU: ["DDU", "BSB", "BSBS"],
  BSBS: ["BSBS", "BSB", "DDU"],

  // Ahmedabad Area
  ADI: ["ADI", "SBT", "MAN"],
  SBT: ["SBT", "ADI"],

  // Pune Area
  PUNE: ["PUNE", "SVJR", "HDPS"],
  SVJR: ["SVJR", "PUNE"],
};

/**
 * Expands a station code to include nearby co-located railway stations.
 * Always includes the primary station code first.
 */
export function expandNearby(stationCode: string): string[] {
  const upper = (stationCode || "").trim().toUpperCase();
  const cluster = NEARBY_STATION_CLUSTERS[upper];
  if (cluster && cluster.length > 0) {
    // Ensure primary code is first, followed by unique nearby codes
    const result = [upper, ...cluster.filter((c) => c !== upper)];
    return Array.from(new Set(result));
  }
  return [upper];
}
