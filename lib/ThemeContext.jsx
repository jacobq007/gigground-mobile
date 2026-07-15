import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIGHT, DARK } from "./theme";

// App-wide light/dark theme. Screens read the active palette with useC() and
// build their StyleSheet from it (see the makeStyles(C) pattern), so a toggle
// re-themes everything. Preference persists across launches.
const ThemeCtx = createContext({ mode: "light", dark: false, colors: LIGHT, toggle: () => {}, setMode: () => {} });

export const useTheme = () => useContext(ThemeCtx);
export const useC = () => useContext(ThemeCtx).colors;

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("light");

  useEffect(() => {
    (async () => {
      try { const saved = await AsyncStorage.getItem("gg_theme"); if (saved === "dark" || saved === "light") setModeState(saved); } catch {}
    })();
  }, []);

  const setMode = async (m) => {
    setModeState(m);
    try { await AsyncStorage.setItem("gg_theme", m); } catch {}
  };
  const toggle = () => setMode(mode === "dark" ? "light" : "dark");

  const dark = mode === "dark";
  const colors = dark ? DARK : LIGHT;

  return <ThemeCtx.Provider value={{ mode, dark, colors, toggle, setMode }}>{children}</ThemeCtx.Provider>;
}
