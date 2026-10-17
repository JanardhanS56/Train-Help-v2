/**
 * Cinematic 3D Scene Design Tokens mapped to TravelRescue theme specifications.
 * Section 4: Palette specifications for Dark ("blue hour") and Light ("golden morning").
 */

export const SCENE_COLORS = {
  dark: {
    skyTop: "#070B1A",
    skyMid: "#14224A",
    horizonGlow: "#E58A4F",
    fog: "#14224A",
    pageBackground: "#14171A",
    warmLight: "#FFB347",
    fillLight: "#2E3B59",
    farHills: "#1B2748",
    midHills: "#141C36",
    nearHills: "#0C1226",
    nearHillsRim: "#E58A4F",
    ground: "#1A1814",
    ballast: "#252320",
    rails: "#8B95A5",
    sleepers: "#423A32",
    platform: "#24272C",
    canopyRoof: "#181D24",
    canopyPillars: "#2E3640",
    trainNavy: "#1E3A5F",
    creamStripe: "#F3E9D8",
    amberTrim: "#E8A33D",
    trainRoof: "#2D3748",
    windows: "#FFC878",
    windowEmissive: "#FFC878",
    windowEmissiveIntensity: 0.85,
    headlight: "#FFF1CF",
    headlightIntensity: 1.8,
    signalRed: "#E5533D",
    signalGreen: "#3FB58F",
    pole: "#3B4252",
    wire: "#616E85",
    dust: "#FFB347",
    townLights: "#FFCA85",
    foliage: "#121F24",
  },
  light: {
    skyTop: "#BFD3E6",
    skyMid: "#DFE8F2",
    horizonGlow: "#F6C9A0",
    fog: "#FAF7F2",
    pageBackground: "#FAF7F2",
    warmLight: "#FFF1DE",
    fillLight: "#C4D4E8",
    farHills: "#D7D0C8",
    midHills: "#B7B0A6",
    nearHills: "#8E8A80",
    nearHillsRim: "#F6C9A0",
    ground: "#CDBFA6",
    ballast: "#B8ABA0",
    rails: "#94A0B0",
    sleepers: "#7A7065",
    platform: "#DFD9D0",
    canopyRoof: "#4A5568",
    canopyPillars: "#2D3748",
    trainNavy: "#1E3A5F",
    creamStripe: "#F3E9D8",
    amberTrim: "#E8A33D",
    trainRoof: "#CBD5E1",
    windows: "#1E293B",
    windowEmissive: "#000000",
    windowEmissiveIntensity: 0.0,
    headlight: "#FFF8E7",
    headlightIntensity: 0.8,
    signalRed: "#E5533D",
    signalGreen: "#3FB58F",
    pole: "#718096",
    wire: "#A0AEC0",
    dust: "#EDD8B6",
    townLights: "#D4AF37",
    foliage: "#4A6B53",
  },
} as const;

export type SceneMode = "light" | "dark";
export type DemoSceneState = "idle" | "cancelled" | "recovered";
export type QualityTier = "high" | "medium";

export interface SceneMetrics {
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  frameTimeMs: number;
}
