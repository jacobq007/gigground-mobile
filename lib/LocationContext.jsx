import { createContext, useContext, useEffect, useState } from "react";
import { loadHomeZone, saveHomeZone } from "./geo";

const LocCtx = createContext(null);
export const useLocation = () => useContext(LocCtx);

// NOTE: real GPS is intentionally NOT used. We simulate a "detected zone" so the
// switch-zone banner is demoable. Decision: GPS detects but never auto-switches;
// the feed always defaults to Home Zone and resets to it on every app restart.
const MOCK_DETECTED_ZONE = "T Nagar";

export function LocationProvider({ children }) {
  const [homeZone, setHomeZoneState] = useState(null);
  const [feedZone, setFeedZone] = useState(null); // session-only, resets on restart
  const [detectedZone] = useState(MOCK_DETECTED_ZONE);

  useEffect(() => {
    (async () => {
      const hz = await loadHomeZone();
      setHomeZoneState(hz);
      setFeedZone(hz); // feed defaults to home zone each launch
    })();
  }, []);

  const setHomeZone = async (zone) => {
    await saveHomeZone(zone);
    setHomeZoneState(zone);
    setFeedZone(zone);
  };

  // switch the feed for THIS session only (banner tap)
  const switchFeedZone = (zone) => setFeedZone(zone);
  // reset feed back to home zone
  const resetFeedZone = () => setFeedZone(homeZone);

  const showSwitchBanner = !!detectedZone && !!feedZone && detectedZone !== feedZone;

  return (
    <LocCtx.Provider value={{ homeZone, feedZone, detectedZone, showSwitchBanner, setHomeZone, switchFeedZone, resetFeedZone }}>
      {children}
    </LocCtx.Provider>
  );
}
