// ── PAY RANGE FORMATTING ──────────────────────────────────────────────────────
// payMin/payMax are stored and passed as separate numeric fields everywhere
// (post state, gig object, create payload). Range text is built here, only at
// render time, from those two numbers — nothing upstream ever concatenates or
// interpolates them into a string, so there's no "₹150-450" → NaN class of bug.
import { money } from "./theme";

export const unitSuffix = (unit) => (unit === "hr" ? "/hr" : unit === "day" ? "/day" : unit === "month" ? "/mo" : "");

export function formatPayRange(payMin, payMax, unit) {
  const suffix = unitSuffix(unit);
  if (payMax == null || payMax === payMin) return `${money(payMin)}${suffix}`;
  return `${money(payMin)} – ${money(payMax)}${suffix}`;
}
