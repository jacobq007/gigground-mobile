import { createContext, useContext, useState } from "react";

// Shared Home intent: "working" (find gigs) vs "hiring" (post gigs).
// Lives above the tab navigator so both the Home screen and the bottom
// nav bar (which relabels/recolors per mode) read the same value.
const ModeCtx = createContext(null);
export const useMode = () => useContext(ModeCtx);

export function ModeProvider({ children }) {
  const [mode, setMode] = useState("working");
  return <ModeCtx.Provider value={{ mode, setMode }}>{children}</ModeCtx.Provider>;
}
