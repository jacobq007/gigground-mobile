// ── GIGGROUND MOBILE — DESIGN TOKENS ──────────────────────────────────────────
// 3-role color system inherited from the web redesign:
//   navy   = structure        indigo = interactive/brand       green = MONEY ONLY

export const C = {
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
};

export const F = {
  reg:  "DMSans_400Regular",
  med:  "DMSans_500Medium",
  bold: "DMSans_700Bold",
};

// Format a number as rupee money string
export const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
