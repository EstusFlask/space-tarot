// Lightweight wrapper around the Web Vibration API for tactile feedback on touch
// devices. Android Chrome supports navigator.vibrate; iOS Safari does NOT implement
// the Vibration API, so on iPhone/iPad these calls are silently no-ops.
function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(pattern: number | number[]): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when called outside a user gesture — ignore.
  }
}

// Named feedback presets so call sites read intent, not magic numbers.
export const haptics = {
  // A single faint "click" emitted as each card passes under the finger while swiping.
  tick: () => vibrate(6),
  // Confirming a tap / arming a card.
  select: () => vibrate(12),
  // Returning a drawn card to the fan.
  remove: () => vibrate(16),
  // The whole spread is filled — a short celebratory triple pulse.
  complete: () => vibrate([14, 30, 20]),
};
