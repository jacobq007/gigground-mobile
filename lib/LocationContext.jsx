import { createContext, useContext, useEffect, useState } from "react";
import { loadHomeZone, saveHomeZone, loadHomeCity, saveHomeCity } from "./geo";

const LocCtx = createContext(null);
export const useLocation = () => useContext(LocCtx);

// NOTE: the feed always defaults to the Home Zone and resets to it on every app
// restart. Location is captured once at onboarding (city + zone); the switch-zone
// banner still lets a user browse another zone for the current session only.
const MOCK_DETECTED_ZONE = "T Nagar";

export function LocationProvider({ children }) {
  const [homeCity, setHomeCityState] = useState(null);
  const [homeZone, setHomeZoneState] = useState(null);
  const [feedZone, setFeedZone] = useState(null); // session-only, resets on restart
  const [detectedZone] = useState(MOCK_DETECTED_ZONE);

  useEffect(() => {
    (async () => {
      const [hz, hc] = await Promise.all([loadHomeZone(), loadHomeCity()]);
      setHomeZoneState(hz);
      setHomeCityState(hc);
      setFeedZone(hz); // feed defaults to home zone each launch
    })();
  }, []);

  // Set the full home location — city + zone — captured at onboarding.
  const setHome = async (city, zone) => {
    await Promise.all([saveHomeCity(city), saveHomeZone(zone)]);
    setHomeCityState(city);
    setHomeZoneState(zone);
    setFeedZone(zone);
  };

  // Back-compat: set just the zone (keeps the existing city).
  const setHomeZone = async (zone) => {
    await saveHomeZone(zone);
    setHomeZoneState(zone);
    setFeedZone(zone);
  };

  // switch the feed for THIS session only (banner tap)
  const switchFeedZone = (zone) => setFeedZone(zone);
  // reset feed back to home zone
  const resetFeedZone = () => setFeedZone(homeZone);

  // Only surface the switch banner when the mock-detected zone belongs to the
  // user's home city (Chennai) — never nudge someone in another city.
  const showSwitchBanner = homeCity === "Chennai" && !!detectedZone && !!feedZone && detectedZone !== feedZone;

  return (
    <LocCtx.Provider value={{ homeCity, homeZone, feedZone, detectedZone, showSwitchBanner, setHome, setHomeZone, switchFeedZone, resetFeedZone }}>
      {children}
    </LocCtx.Provider>
  );
}
