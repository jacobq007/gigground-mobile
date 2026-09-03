import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Which Home screen is showing. Two designs ship side by side on purpose:
//
//   "classic" — the original gradient/hero home (components/home/HomeClassic)
//   "shift"   — the shift-board home: committed day, online switch, offer bar
//               (components/home/HomeShift)
//
// Neither is dead code. The classic screen stays wired up so the older design
// can always be switched back on and compared against — flip it in
// Profile → Appearance → Home layout. Preference persists across launches,
// same pattern as gg_theme in ThemeContext.
const KEY = "gg_home_variant";
const VARIANTS = ["classic", "shift"];

const HomeVariantCtx = createContext({ variant: "shift", setVariant: () => {}, toggle: () => {} });

export const useHomeVariant = () => useContext(HomeVariantCtx);

export function HomeVariantProvider({ children }) {
  const [variant, setVariantState] = useState("shift");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (VARIANTS.includes(saved)) setVariantState(saved);
      } catch {}
    })();
  }, []);

  const setVariant = async (v) => {
    if (!VARIANTS.includes(v)) return;
    setVariantState(v);
    try { await AsyncStorage.setItem(KEY, v); } catch {}
  };
  const toggle = () => setVariant(variant === "shift" ? "classic" : "shift");

  return (
    <HomeVariantCtx.Provider value={{ variant, setVariant, toggle }}>
      {children}
    </HomeVariantCtx.Provider>
  );
}
