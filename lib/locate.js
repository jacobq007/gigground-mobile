import { Platform } from "react-native";
import * as Location from "expo-location";
import { nearestCity, detectNearestAreaInCity } from "./geo";

// Ask for location permission and resolve the user's coordinates.
// Returns { status, coords }:
//   status: "granted" | "denied" | "unavailable"
//   coords: { lat, lng } | null
export async function requestLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return { status: "denied", coords: null };

    // On web, expo-location can be flaky; fall back to the browser API directly.
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
      const coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 8000, maximumAge: 60000 }
        );
      });
      return coords ? { status: "granted", coords } : { status: "unavailable", coords: null };
    }

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { status: "granted", coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
  } catch {
    return { status: "unavailable", coords: null };
  }
}

// Full detect: permission -> coordinates -> nearest served city + nearest locality in it.
// Returns { status, city, area, coords }. city/area are null when we couldn't locate.
export async function detectHome() {
  const { status, coords } = await requestLocation();
  if (!coords) return { status, city: null, area: null, coords: null };
  const city = nearestCity(coords);
  const area = detectNearestAreaInCity(coords, city);
  return { status, city, area, coords };
}
