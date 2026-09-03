import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { loadHomeZone, saveHomeZone, loadHomeCity, saveHomeCity, clearHome } from "./geo";
import { detectHome } from "./locate";
import { useAuth } from "./AuthContext";

const LocCtx = createContext(null);
export const useLocation = () => useContext(LocCtx);

// Where we place someone when GPS is denied or they're outside our footprint.
export const FALLBACK_CITY = "Ahmedabad";

// NOTE: the feed always defaults to the Home Zone and resets to it on every app
// restart. The Home Zone is confirmed once at onboarding; the switch-zone banner
// lets a user browse another zone for the current session only.
//
// Location is detected on every launch (see the effect below): we resolve the
// nearest served city first, then the nearest locality in it, then the handful
// of places closest by. That drives the onboarding prefill and the "you seem to
// be in X" banner — it never silently overwrites a Home Zone the user has set.
export function LocationProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [homeCity, setHomeCityState] = useState(null);
  const [homeZone, setHomeZoneState] = useState(null);
  const [feedZone, setFeedZone] = useState(null); // session-only, resets on restart

  // Live detection, refreshed each launch.
  const [detectedCity, setDetectedCity] = useState(null);
  const [detectedZone, setDetectedZone] = useState(null);
  const [nearbyZones, setNearbyZones] = useState([]); // [{ name, km }] closest first
  const [coords, setCoords] = useState(null);
  const [locStatus, setLocStatus] = useState(null); // "granted" | "denied" | "unavailable"
  const [locating, setLocating] = useState(true);

  // Stored home loads first so the feed paints without waiting on GPS.
  useEffect(() => {
    (async () => {
      const [hz, hc] = await Promise.all([loadHomeZone(), loadHomeCity()]);
      setHomeZoneState(hz);
      setHomeCityState(hc);
      setFeedZone(hz); // feed defaults to home zone each launch
    })();
  }, []);

  // Ask where we actually are. Runs once per launch, in parallel with the above.
  const refreshLocation = useCallback(async () => {
    setLocating(true);
    const { status, city, area, nearby, coords: c } = await detectHome();
    setLocStatus(status);
    setCoords(c);
    setDetectedCity(city);
    setDetectedZone(area);
    setNearbyZones(nearby || []);
    setLocating(false);
    return { status, city, area, nearby, coords: c };
  }, []);

  useEffect(() => { refreshLocation(); }, [refreshLocation]);

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

  // ── Forget the Home Zone when the account goes ──────────────────────────────
  // Watched here rather than bolted onto the sign-out button, because the zone
  // outliving the session is what silently skipped onboarding: app/index.jsx
  // routes on `homeZone`, so a stored zone sends the next person who logs in
  // straight past the location step and into someone else's neighbourhood.
  //
  // It has to be a TRANSITION, not simply "no user" — `user` is null on every
  // cold start until AuthProvider has finished reading the session, and clearing
  // on that would wipe the zone of anyone still signed in.
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (user) { wasSignedIn.current = true; return; }
    if (!wasSignedIn.current) return;
    wasSignedIn.current = false;
    clearHome();
    setHomeZoneState(null);
    setHomeCityState(null);
    setFeedZone(null);
  }, [user, authLoading]);

  // switch the feed for THIS session only (banner tap)
  const switchFeedZone = (zone) => setFeedZone(zone);
  // reset feed back to home zone
  const resetFeedZone = () => setFeedZone(homeZone);

  // The city the app should speak in: where they are now, else their home, else
  // the fallback. Screens use this instead of hardcoding a city name.
  const activeCity = detectedCity || homeCity || FALLBACK_CITY;

  // Only nudge someone to switch zones when they're still inside their home
  // city — never when they're travelling.
  const showSwitchBanner =
    !!detectedZone && !!feedZone && detectedZone !== feedZone && detectedCity === homeCity;

  return (
    <LocCtx.Provider value={{
      homeCity, homeZone, feedZone, activeCity,
      detectedCity, detectedZone, nearbyZones, coords, locStatus, locating,
      showSwitchBanner, setHome, setHomeZone, switchFeedZone, resetFeedZone, refreshLocation,
    }}>
      {children}
    </LocCtx.Provider>
  );
}
