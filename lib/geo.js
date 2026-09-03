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
  if (key) return AREA_COORDS[key];
  // Fall back to any served city's locality list (other cities beyond Chennai),
  // then to its famous spots, so a gig pinned to a landmark still resolves.
  const needle = area.toLowerCase();
  for (const city of Object.values(CITIES_GEO)) {
    const hit = city.areas.find(([name]) => needle.includes(name.toLowerCase()));
    if (hit) return [hit[1], hit[2]];
  }
  for (const city of Object.values(CITIES_GEO)) {
    const hit = (city.landmarks || []).find(([name]) => needle.includes(name.toLowerCase()));
    if (hit) return [hit[1], hit[2]];
  }
  return null;
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
export async function loadHomeCity() {
  try { return (await AsyncStorage.getItem("gg_home_city")) || null; } catch { return null; }
}
export async function saveHomeCity(city) {
  try { await AsyncStorage.setItem("gg_home_city", city); } catch {}
}
// The Home Zone belongs to the account, not the device — one signs out with the
// other, or the next person to log in silently inherits where the last one lived.
export async function clearHome() {
  try { await AsyncStorage.multiRemove(["gg_home_zone", "gg_home_city"]); } catch {}
}

// ── SERVED CITIES + MAJOR LOCALITIES ──────────────────────────────────────────
// Every city we operate in. Chennai reuses the detailed area list above; other
// cities carry their major localities. Each area is [name, lat, lng].
// `landmarks` is optional — the well-known spots people name instead of a
// locality ("meet at Kankaria Lake"). Same [name, lat, lng] shape.
export const CITIES_GEO = {
  Chennai: {
    center: [13.0827, 80.2707],
    areas: CHENNAI_AREAS,
  },
  Bengaluru: {
    center: [12.9716, 77.5946],
    areas: [
      ["Indiranagar", 12.9719, 77.6412], ["Koramangala", 12.9352, 77.6245], ["Whitefield", 12.9698, 77.7500],
      ["Jayanagar", 12.9250, 77.5938], ["HSR Layout", 12.9116, 77.6389], ["BTM Layout", 12.9166, 77.6101],
      ["Marathahalli", 12.9591, 77.6974], ["Electronic City", 12.8452, 77.6602], ["MG Road", 12.9757, 77.6068],
      ["Malleshwaram", 13.0035, 77.5647], ["Rajajinagar", 12.9982, 77.5551], ["Hebbal", 13.0358, 77.5970],
      ["Yelahanka", 13.1007, 77.5963], ["JP Nagar", 12.9063, 77.5857], ["Banashankari", 12.9255, 77.5468],
      ["Bellandur", 12.9260, 77.6762], ["Sarjapur Road", 12.9010, 77.6870], ["Bannerghatta Road", 12.8880, 77.5970],
    ],
  },
  Mumbai: {
    center: [19.0760, 72.8777],
    areas: [
      ["Andheri", 19.1197, 72.8468], ["Bandra", 19.0596, 72.8295], ["Borivali", 19.2307, 72.8567],
      ["Dadar", 19.0176, 72.8440], ["Powai", 19.1176, 72.9060], ["Colaba", 18.9067, 72.8147],
      ["Juhu", 19.1075, 72.8263], ["Malad", 19.1866, 72.8484], ["Goregaon", 19.1550, 72.8496],
      ["Thane", 19.2183, 72.9781], ["Chembur", 19.0522, 72.9005], ["Worli", 19.0176, 72.8177],
      ["Lower Parel", 18.9960, 72.8300], ["Vashi", 19.0770, 72.9986], ["Kurla", 19.0726, 72.8845],
      ["Ghatkopar", 19.0858, 72.9089],
    ],
  },
  Delhi: {
    center: [28.6139, 77.2090],
    areas: [
      ["Connaught Place", 28.6315, 77.2167], ["Karol Bagh", 28.6519, 77.1909], ["Saket", 28.5245, 77.2066],
      ["Dwarka", 28.5921, 77.0460], ["Rohini", 28.7361, 77.1200], ["Lajpat Nagar", 28.5677, 77.2433],
      ["Hauz Khas", 28.5494, 77.2001], ["Janakpuri", 28.6217, 77.0878], ["Nehru Place", 28.5494, 77.2519],
      ["Vasant Kunj", 28.5200, 77.1591], ["Pitampura", 28.6980, 77.1310], ["Chandni Chowk", 28.6506, 77.2303],
      ["Mayur Vihar", 28.6089, 77.2960], ["Rajouri Garden", 28.6469, 77.1200], ["Preet Vihar", 28.6413, 77.2932],
    ],
  },
  Hyderabad: {
    center: [17.3850, 78.4867],
    areas: [
      ["Gachibowli", 17.4401, 78.3489], ["HITEC City", 17.4435, 78.3772], ["Madhapur", 17.4483, 78.3915],
      ["Banjara Hills", 17.4156, 78.4347], ["Jubilee Hills", 17.4319, 78.4073], ["Kukatpally", 17.4948, 78.3996],
      ["Secunderabad", 17.4399, 78.4983], ["Begumpet", 17.4441, 78.4614], ["Ameerpet", 17.4374, 78.4487],
      ["Kondapur", 17.4615, 78.3677], ["Miyapur", 17.4968, 78.3711], ["Dilsukhnagar", 17.3687, 78.5247],
      ["Uppal", 17.4056, 78.5591], ["LB Nagar", 17.3457, 78.5522],
    ],
  },
  Pune: {
    center: [18.5204, 73.8567],
    areas: [
      ["Kothrud", 18.5074, 73.8077], ["Hinjewadi", 18.5913, 73.7389], ["Baner", 18.5590, 73.7868],
      ["Viman Nagar", 18.5679, 73.9143], ["Hadapsar", 18.5089, 73.9260], ["Kharadi", 18.5515, 73.9430],
      ["Aundh", 18.5590, 73.8077], ["Wakad", 18.5985, 73.7626], ["Koregaon Park", 18.5362, 73.8939],
      ["Shivajinagar", 18.5308, 73.8478], ["Camp", 18.5158, 73.8790], ["Magarpatta", 18.5158, 73.9280],
      ["Pimpri", 18.6279, 73.8009], ["Chinchwad", 18.6410, 73.7997],
    ],
  },
  Kolkata: {
    center: [22.5726, 88.3639],
    areas: [
      ["Salt Lake", 22.5797, 88.4174], ["New Town", 22.5800, 88.4650], ["Park Street", 22.5535, 88.3520],
      ["Howrah", 22.5958, 88.2636], ["Ballygunge", 22.5270, 88.3660], ["Behala", 22.4990, 88.3120],
      ["Dumdum", 22.6420, 88.4200], ["Garia", 22.4640, 88.3900], ["Jadavpur", 22.4990, 88.3710],
      ["Esplanade", 22.5650, 88.3510], ["Rajarhat", 22.6190, 88.4560], ["Tollygunge", 22.4930, 88.3460],
      ["Alipore", 22.5350, 88.3320], ["Shyambazar", 22.6000, 88.3730],
    ],
  },
  Ahmedabad: {
    center: [23.0225, 72.5714],
    areas: [
      ["Navrangpura", 23.0367, 72.5600], ["CG Road", 23.0270, 72.5600], ["Satellite", 23.0300, 72.5100],
      ["Vastrapur", 23.0395, 72.5265], ["Bodakdev", 23.0400, 72.5100], ["Thaltej", 23.0480, 72.5060],
      ["SG Highway", 23.0400, 72.5070], ["Prahlad Nagar", 23.0120, 72.5070], ["Bopal", 23.0330, 72.4700],
      ["Maninagar", 22.9960, 72.6020], ["Naranpura", 23.0530, 72.5570], ["Paldi", 23.0110, 72.5680],
      ["Ellisbridge", 23.0230, 72.5720], ["Ashram Road", 23.0330, 72.5720], ["Shahibaug", 23.0500, 72.5900],
      ["Sabarmati", 23.0700, 72.5800], ["Chandkheda", 23.1130, 72.5850], ["Gota", 23.1000, 72.5400],
      ["Ghatlodia", 23.0600, 72.5400], ["Vejalpur", 23.0000, 72.5200], ["Nikol", 23.0500, 72.6650],
      ["Vastral", 23.0000, 72.6600], ["Isanpur", 22.9700, 72.5900], ["Lal Darwaja", 23.0270, 72.5870],
    ],
    landmarks: [
      ["Sabarmati Ashram", 23.0608, 72.5806], ["Sabarmati Riverfront", 23.0225, 72.5800],
      ["Kankaria Lake", 22.9977, 72.6020], ["Vastrapur Lake", 23.0380, 72.5260],
      ["Sidi Saiyyed Mosque", 23.0270, 72.5800], ["Jama Masjid", 23.0245, 72.5875],
      ["Bhadra Fort", 23.0250, 72.5850], ["Teen Darwaza", 23.0240, 72.5870],
      ["Manek Chowk", 23.0250, 72.5890], ["Law Garden", 23.0250, 72.5620],
      ["Hutheesing Jain Temple", 23.0400, 72.5900], ["Swaminarayan Temple Kalupur", 23.0290, 72.5960],
      ["Dada Harir Stepwell", 23.0430, 72.6050], ["Adalaj Stepwell", 23.1660, 72.5800],
      ["Sarkhej Roza", 22.9840, 72.5000], ["Gujarat Science City", 23.0770, 72.5060],
      ["ISKCON Temple", 23.0270, 72.5090], ["Narendra Modi Stadium", 23.0920, 72.5970],
      ["Ahmedabad One Mall", 23.0400, 72.5250],
    ],
  },
  Vadodara: {
    center: [22.3072, 73.1812],
    areas: [
      ["Alkapuri", 22.3100, 73.1700], ["Sayajigunj", 22.3100, 73.1830], ["Fatehgunj", 22.3200, 73.1900],
      ["Subhanpura", 22.3230, 73.1650], ["Gotri", 22.3200, 73.1300], ["Akota", 22.2950, 73.1650],
      ["Old Padra Road", 22.2900, 73.1600], ["Vasna Road", 22.2950, 73.1400], ["Tandalja", 22.2900, 73.1400],
      ["Bhayli", 22.2900, 73.1100], ["Manjalpur", 22.2760, 73.1900], ["Makarpura", 22.2500, 73.1800],
      ["Karelibaug", 22.3230, 73.2020], ["Waghodia Road", 22.3130, 73.2300], ["Ajwa Road", 22.3300, 73.2400],
      ["Harni", 22.3400, 73.2200], ["Sama", 22.3400, 73.1900], ["Nizampura", 22.3300, 73.1800],
      ["Chhani", 22.3600, 73.1700], ["Dandia Bazaar", 22.3050, 73.1980], ["Mandvi", 22.2980, 73.2030],
    ],
    landmarks: [
      ["Laxmi Vilas Palace", 22.2938, 73.1925], ["Sayaji Baug", 22.3120, 73.1870],
      ["Baroda Museum & Picture Gallery", 22.3120, 73.1880], ["Sur Sagar Lake", 22.3050, 73.2020],
      ["Kirti Mandir", 22.3020, 73.1970], ["Nyay Mandir", 22.3050, 73.2000],
      ["Khanderao Market", 22.3010, 73.2020], ["Mandvi Gate", 22.2985, 73.2030],
      ["Navlakhi Stepwell", 22.2950, 73.1900], ["Maharaja Sayajirao University", 22.3070, 73.1830],
      ["EME Temple", 22.3230, 73.1600], ["Aurobindo Ashram", 22.3110, 73.1930],
      ["ISKCON Vadodara", 22.2760, 73.1560], ["Ajwa Nimeta Garden", 22.3400, 73.3300],
      ["Champaner-Pavagadh", 22.4860, 73.5320],
    ],
  },
};

export const SERVED_CITIES = Object.keys(CITIES_GEO);

// Nearest served city to a GPS coordinate — always returns one of SERVED_CITIES,
// so a user outside our footprint still lands on the closest city we operate in.
export function nearestCity(coords) {
  if (!coords) return null;
  let best = null, min = Infinity;
  for (const [name, city] of Object.entries(CITIES_GEO)) {
    const d = haversineKm(coords.lat, coords.lng, city.center[0], city.center[1]);
    if (d < min) { min = d; best = name; }
  }
  return best;
}

// Distance (km) from a coordinate to a served city's center.
export function distanceToCity(coords, city) {
  const c = CITIES_GEO[city];
  if (!coords || !c) return null;
  return Math.round(haversineKm(coords.lat, coords.lng, c.center[0], c.center[1]) * 10) / 10;
}

// Major locality names for a city (for the picker).
export function getCityAreas(city) {
  return (CITIES_GEO[city]?.areas || []).map((a) => a[0]);
}

// Famous spots in a city — landmarks people use as meeting points. Empty for
// cities we haven't mapped landmarks for yet.
export function getCityLandmarks(city) {
  return (CITIES_GEO[city]?.landmarks || []).map((l) => l[0]);
}

// Nearest famous spot within a city to a GPS coordinate, with its distance.
// Returns { name, km } or null when the city has no landmarks mapped.
export function nearestLandmarkInCity(coords, city) {
  const spots = CITIES_GEO[city]?.landmarks;
  if (!coords || !spots?.length) return null;
  let best = null, min = Infinity;
  for (const [name, lat, lng] of spots) {
    const d = haversineKm(coords.lat, coords.lng, lat, lng);
    if (d < min) { min = d; best = name; }
  }
  return { name: best, km: Math.round(min * 10) / 10 };
}

// Nearest localities in a city to a GPS coordinate, closest first.
// Returns [{ name, km }] — used to show "places near you" at startup.
export function nearestAreasInCity(coords, city, limit = 6) {
  const areas = CITIES_GEO[city]?.areas;
  if (!coords || !areas) return [];
  return areas
    .map(([name, lat, lng]) => ({ name, km: Math.round(haversineKm(coords.lat, coords.lng, lat, lng) * 10) / 10 }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

// Nearest locality within a given city to a GPS coordinate.
export function detectNearestAreaInCity(coords, city) {
  const areas = CITIES_GEO[city]?.areas;
  if (!coords || !areas) return null;
  let best = null, min = Infinity;
  for (const [name, lat, lng] of areas) {
    const d = haversineKm(coords.lat, coords.lng, lat, lng);
    if (d < min) { min = d; best = name; }
  }
  return best;
}
