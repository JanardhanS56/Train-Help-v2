/**
 * Pure state transition function for landing navigation scroll visibility.
 * Implements section 2 & 3 rules with zero DOM dependencies.
 */

export interface NavScrollState {
  scrollVisible: boolean;
  lastY: number;
  acc: number;
  dir: number; // 1 = down, -1 = up, 0 = neutral
}

export interface NavScrollOptions {
  maxY: number;
}

export const INITIAL_NAV_SCROLL_STATE: NavScrollState = {
  scrollVisible: true,
  lastY: 0,
  acc: 0,
  dir: 0,
};

/**
 * Calculates next navigation state given current state and raw scroll position.
 *
 * Rules:
 * - y clamped between 0 and maxY (ignores iOS overscroll bounce at both ends)
 * - If page is shorter than innerHeight + 80 (maxY < 80), never hide
 * - If y < 80: visible, reset acc and dir
 * - If |delta| < 1px: ignore
 * - If direction changed: reset acc to 0 before adding delta
 * - Down (dir === 1): hide once acc >= 12
 * - Up (dir === -1): show once -acc >= 8 (acc <= -8)
 */
export function nextNavState(
  state: NavScrollState,
  rawY: number,
  options: NavScrollOptions
): NavScrollState {
  const { maxY } = options;
  const clampedMax = Math.max(0, maxY);
  const y = Math.max(0, Math.min(rawY, clampedMax));

  // If page is shorter than innerHeight + 80, never hide
  if (clampedMax < 80) {
    return {
      scrollVisible: true,
      lastY: y,
      acc: 0,
      dir: 0,
    };
  }

  // y below 80: visible; reset acc
  if (y < 80) {
    return {
      scrollVisible: true,
      lastY: y,
      acc: 0,
      dir: 0,
    };
  }

  const delta = y - state.lastY;

  // Ignore |delta| under 1px
  if (Math.abs(delta) < 1) {
    return {
      ...state,
      lastY: y,
    };
  }

  const newDir = delta > 0 ? 1 : -1;
  // If direction changed, reset acc to 0
  const baseAcc = state.dir !== 0 && state.dir !== newDir ? 0 : state.acc;
  const newAcc = baseAcc + delta;

  let newVisible = state.scrollVisible;
  if (newDir === 1) {
    // Down: hide once acc >= 12
    if (newAcc >= 12) {
      newVisible = false;
    }
  } else {
    // Up: show once -acc >= 8 (acc <= -8)
    if (newAcc <= -8) {
      newVisible = true;
    }
  }

  return {
    scrollVisible: newVisible,
    lastY: y,
    acc: newAcc,
    dir: newDir,
  };
}
