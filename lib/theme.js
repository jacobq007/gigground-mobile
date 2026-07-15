// ── GIGGROUND MOBILE — DESIGN TOKENS ──────────────────────────────────────────
// 3-role color system inherited from the web redesign:
//   navy   = structure        indigo = interactive/brand       green = MONEY ONLY

export const LIGHT = {
  // Structure
  navy:     "#1C1E26",
  // Interactive / brand
  indigo:   "#4338CA",
  indigoSoft:"#4338CA15",
  // Money — used ONLY on pay / earnings amounts
  green:    "#15803D",
  greenSoft:"#F0FDF4",
  // Neutrals (light mode)
  bg:       "#FAFAF9",
  surface:  "#FFFFFF",
  surface2: "#F4F3F0",
  border:   "#E5E7EB",
  hairline: "#F1F0EE",
  text:     "#111827",
  text2:    "#6B7280",
  text3:    "#9CA3AF",
  // Status
  red:      "#ef4444",
  redSoft:  "#fef2f2",
  amber:    "#f59e0b",
  dark:     false,
};

// Dark palette — deliberately tuned (not a naive invert): warm-neutral darks,
// a lifted indigo that stays legible on dark grounds, brighter money-green.
export const DARK = {
  navy:     "#0C0D11",
  indigo:   "#6D6AF0",
  indigoSoft:"#6D6AF026",
  green:    "#4ADE80",
  greenSoft:"#10281C",
  bg:       "#0B0B0F",
  surface:  "#16171D",
  surface2: "#1E2029",
  border:   "#2A2C36",
  hairline: "#22242C",
  text:     "#F2F2F5",
  text2:    "#A7AAB4",
  text3:    "#71747E",
  red:      "#f87171",
  redSoft:  "#2A1416",
  amber:    "#fbbf24",
  dark:     true,
};

// `C` stays a live export used by any not-yet-themed style as a light fallback.
// Themed screens read the active palette via useC() (lib/ThemeContext).
export const C = LIGHT;

export const F = {
  reg:  "DMSans_400Regular",
  med:  "DMSans_500Medium",
  bold: "DMSans_700Bold",
};

// Plus Jakarta Sans — used by the V2 Indigo home screen redesign
export const FJ = {
  reg:   "PlusJakartaSans_400Regular",
  med:   "PlusJakartaSans_500Medium",
  sbold: "PlusJakartaSans_600SemiBold",
  bold:  "PlusJakartaSans_700Bold",
  xbold: "PlusJakartaSans_800ExtraBold",
};

// Space Grotesk — large numeric figures on the home redesign (₹ amounts, counts, stats)
export const FS = {
  med:   "SpaceGrotesk_500Medium",
  sbold: "SpaceGrotesk_600SemiBold",
  bold:  "SpaceGrotesk_700Bold",
};

// Format a number as rupee money string
export const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
