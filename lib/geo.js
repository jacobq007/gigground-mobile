// ── GEO UTILITIES (ported from web src/utils/geo.js) ──────────────────────────
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AREA_COORDS = {
  "T Nagar":       [13.0418, 80.2341],
  "Anna Nagar":    [13.0900, 80.2107],
  "Velachery":     [12.9816, 80.2209],
  "Adyar":         [12.9890, 80.2560],
  "Mylapore":      [13.0340, 80.2680],
  "Tambaram":      [12.9249, 80.1000],
  "Guindy":        [13.0067, 80.2206],
  "Nungambakkam":  [13.0569, 80.2425],
  "Egmore":        [13.0732, 80.2609],
  "Indiranagar":   [13.0050, 80.2540],
  "Porur":         [13.0374, 80.1568],
  "Ambattur":      [13.1143, 80.1548],
  "Chromepet":     [12.9516, 80.1462],
  "Pallavaram":    [12.9675, 80.1491],
  "Sholinganallur":[12.8996, 80.2272],
  "OMR":           [12.9010, 80.2280],
  "ECR":           [12.8500, 80.2400],
  "Perambur":      [13.1122, 80.2340],
  "Royapettah":    [13.0535, 80.2625],
  "Kilpauk":       [13.0807, 80.2412],
};

export const CHENNAI_AREAS = [
  ["Adyar", 12.9890, 80.2560], ["Alwarpet", 13.0350, 80.2560], ["Ambattur", 13.1143, 80.1548],
  ["Anna Nagar", 13.0900, 80.2107], ["Arumbakkam", 13.0700, 80.2100], ["Ashok Nagar", 13.0300, 80.2100],
  ["Besant Nagar", 13.0000, 80.2700], ["Chromepet", 12.9516, 80.1462], ["Chetpet", 13.0700, 80.2500],
  ["Egmore", 13.0732, 80.2609], ["Gopalapuram", 13.0400, 80.2500], ["Guindy", 13.0067, 80.2206],
  ["Kilpauk", 13.0807, 80.2412], ["Kodambakkam", 13.0500, 80.2300], ["KK Nagar", 13.0400, 80.2000],
  ["Kotturpuram", 13.0200, 80.2500], ["Madipakkam", 12.9500, 80.2000], ["Medavakkam", 12.9200, 80.2000],
  ["Mogappair", 13.0900, 80.1700], ["Mylapore", 13.0340, 80.2680], ["Nanganallur", 12.9800, 80.1900],
  ["Nungambakkam", 13.0569, 80.2425], ["OMR", 12.9010, 80.2280], ["Pallavaram", 12.9675, 80.1491],
  ["Pallikaranai", 12.9300, 80.2100], ["Perambur", 13.1122, 80.2340], ["Perungudi", 12.9500, 80.2400],
  ["Porur", 13.0374, 80.1568], ["Purasaiwakkam", 13.0870, 80.2500], ["Royapettah", 13.0535, 80.2625],
  ["Saidapet", 13.0200, 80.2200], ["Sholinganallur", 12.8996, 80.2272], ["Tambaram", 12.9249, 80.1000],
  ["Teynampet", 13.0400, 80.2500], ["Thiruvanmiyur", 12.9800, 80.2600], ["T Nagar", 13.0418, 80.2341],
  ["Vadapalani", 13.0500, 80.2100], ["Valasaravakkam", 13.0400, 80.1800], ["Velachery", 12.9816, 80.2209],
  ["Virugambakkam", 13.0500, 80.1900], ["West Mambalam", 13.0400, 80.2200],
];

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getAreaCoords(area) {
  if (!area) return null;
  const key = Object.keys(AREA_COORDS).find(k => area.toLowerCase().includes(k.toLowerCase()));
  return key ? AREA_COORDS[key] : null;
}

export function calcDistance(area, userCoords) {
  if (!userCoords || !area) return null;
  const coords = getAreaCoords(area);
  if (!coords) return null;
  return Math.round(haversineKm(userCoords.lat, userCoords.lng, coords[0], coords[1]) * 10) / 10;
}

export function detectZone(coords) {
  if (!coords) return null;
  let nearest = null, minDist = Infinity;
  for (const [name, lat, lng] of CHENNAI_AREAS) {
    const d = haversineKm(coords.lat, coords.lng, lat, lng);
    if (d < minDist) { minDist = d; nearest = name; }
  }
  return nearest;
}

export function getZoneNeighbours(zoneName, radiusKm = 5) {
  const zone = CHENNAI_AREAS.find(([name]) => name === zoneName);
  if (!zone) return [];
  return CHENNAI_AREAS
    .filter(([name]) => name !== zoneName)
    .filter(([, lat, lng]) => haversineKm(zone[1], zone[2], lat, lng) <= radiusKm)
    .map(([name]) => name);
}

// distance between two area names (km), for gig sorting
export function areaToAreaKm(a, b) {
  const ca = getAreaCoords(a), cb = getAreaCoords(b);
  if (!ca || !cb) return null;
  return Math.round(haversineKm(ca[0], ca[1], cb[0], cb[1]) * 10) / 10;
}

export async function loadHomeZone() {
  try { return (await AsyncStorage.getItem("gg_home_zone")) || null; } catch { return null; }
}
export async function saveHomeZone(zone) {
  try { await AsyncStorage.setItem("gg_home_zone", zone); } catch {}
}
