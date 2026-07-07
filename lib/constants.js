// ── GIGGROUND MOBILE — CONSTANTS ──────────────────────────────────────────────

export const ACCENT = "#4338CA";
export const GMAPS_KEY = "AIzaSyDxw0pfLXpn90N1XAlmcV3iGo4Q_NnHHFg";

export const CITIES = ["Chennai", "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Kolkata"];

export const BIZ_CATEGORIES = [
  "Food & Restaurant", "Photography & Media", "Music & Events",
  "Logistics & Delivery", "Beauty & Wellness", "Retail", "Other",
];

// timing buckets used by the jobs filter
export const TIMINGS = ["Today", "This week", "Flexible"];

// job kind → minimum allowed starting pay (₹). Placeholder values, edit freely.
export const MIN_PAY = {
  errand: 150,
  delivery: 200,
  default: 150,
};
export const JOB_KINDS = [
  { key: "errand", label: "Errand" },
  { key: "delivery", label: "Delivery" },
  { key: "other", label: "Other" },
];

// placeholder moderation list — matched case-insensitively against title/description
export const BANNED_KEYWORDS = ["scam", "no pay", "unpaid", "mlm", "pyramid scheme"];
