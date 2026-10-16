/**
 * Scene Design Tokens mapped to TravelRescue theme palette.
 * Light paper: #FAF7F2, Dark background: #14171A
 * Navy primary: #1E3A5F, Warm stripe: #F4EFE6
 * Disruption signal (coral): #C2574A, Success signal (green): #2F7D6B
 */
export const SCENE_COLORS = {
  light: {
    paper: 0xfaf7f2,
    ground: 0xf3efe8,
    hills: 0xe5dfd5,
    hillsDistant: 0xede8e0,
    ballast: 0xddd7cc,
    rails: 0x8a929a,
    sleepers: 0x5a4a3c,
    trainNavy: 0x1e3a5f,
    trainStripe: 0xfdfaf5,
    trainRoof: 0xd2cbbf,
    trainWindows: 0x1a2430,
    canopyRoof: 0x3d4752,
    canopyPillars: 0x2c3540,
    pole: 0x6e7882,
    wire: 0x9aa2ab,
    signalMast: 0x2a3038,
    signalRed: 0xc2574a,
    signalGreen: 0x2f7d6b,
    ambientLight: 0xffffff,
    directionalLight: 0xfffaed,
  },
  dark: {
    paper: 0x14171a,
    ground: 0x191d21,
    hills: 0x22272c,
    hillsDistant: 0x1c2125,
    ballast: 0x282e34,
    rails: 0x5a636c,
    sleepers: 0x3a322b,
    trainNavy: 0x23456e,
    trainStripe: 0xdfe4ea,
    trainRoof: 0x353d45,
    trainWindows: 0x0d1217,
    canopyRoof: 0x2c343d,
    canopyPillars: 0x1a2128,
    pole: 0x48515a,
    wire: 0x606972,
    signalMast: 0x181c20,
    signalRed: 0xe07a6c,
    signalGreen: 0x5db89f,
    ambientLight: 0x90a4ae,
    directionalLight: 0xdfe8f0,
  },
} as const;

export type SceneMode = "light" | "dark";
export type DemoSceneState = "idle" | "cancelled" | "recovered";
