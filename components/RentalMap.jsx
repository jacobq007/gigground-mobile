import { Platform, View, Text, Pressable, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, money } from "../lib/theme";

export default function RentalMap({ rentals, height = 320 }) {
  const router = useRouter();
  if (Platform.OS === "web") return <WebMap rentals={rentals} height={height} router={router} />;
  return <NativeMapDots rentals={rentals} height={height} router={router} />;
}

// ── Web: full Leaflet map in an iframe ────────────────────────────────────────
function WebMap({ rentals, height, router }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.rentalId) router.push(`/(tabs)/community/${e.data.rentalId}`);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [router]);

  const markers = rentals
    .filter((r) => r.coords)
    .map(
      (r) => `
      L.circleMarker([${r.coords.lat},${r.coords.lng}],{
        radius:14,fillColor:'${r.verified ? "#15803D" : "#4338CA"}',
        color:'#fff',weight:2,fillOpacity:0.92
      }).addTo(map).bindPopup(\`
        <div style="font-family:system-ui,sans-serif;min-width:170px;padding:4px 2px">
          <div style="font-weight:700;font-size:13px;margin-bottom:3px;color:#111">${r.title.replace(/'/g, "&#39;")}</div>
          <div style="color:#15803D;font-weight:700;font-size:15px;margin-bottom:5px">₹${Number(r.rent).toLocaleString("en-IN")}/mo</div>
          <div style="font-size:11px;color:#6B7280;margin-bottom:10px">${r.bedrooms}BHK · ${r.furnished || r.rentalType} · ${r.area}</div>
          <button onclick="window.parent.postMessage({rentalId:'${r.id}'},'*')" style="width:100%;padding:8px;background:#4338CA;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">View listing →</button>
        </div>\`);
    `
    )
    .join("\n");

  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{height:100%;width:100%}</style>
  </head><body>
    <div id="map"></div>
    <script>
      const map=L.map('map',{zoomControl:false}).setView([13.045,80.228],12);
      L.control.zoom({position:'bottomright'}).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'©OSM'}).addTo(map);
      ${markers}
    </script>
  </body></html>`;

  return (
    <View style={{ height, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: C.border }}>
      <iframe srcDoc={html} style={{ width: "100%", height: "100%", border: "none" }} title="Rental map" />
    </View>
  );
}

// ── Native fallback: area dot grid ───────────────────────────────────────────
function NativeMapDots({ rentals, height, router }) {
  const areaGroups = {};
  rentals.forEach((r) => {
    if (!areaGroups[r.area]) areaGroups[r.area] = [];
    areaGroups[r.area].push(r);
  });

  return (
    <View style={[ms.container, { minHeight: height }]}>
      <View style={ms.header}>
        <Ionicons name="map-outline" size={14} color={C.text2} />
        <Text style={ms.headerTxt}>Rentals by area</Text>
        <View style={ms.legend}>
          <View style={[ms.ldot, { backgroundColor: C.green }]} />
          <Text style={ms.ltxt}>Verified</Text>
          <View style={[ms.ldot, { backgroundColor: C.indigo }]} />
          <Text style={ms.ltxt}>Listed</Text>
        </View>
      </View>
      <View style={ms.grid}>
        {Object.entries(areaGroups).map(([area, items]) => (
          <Pressable key={area} onPress={() => router.push(`/(tabs)/community/${items[0].id}`)} style={ms.pin}>
            <View style={[ms.pinDot, { backgroundColor: items.some((r) => r.verified) ? C.green : C.indigo }]}>
              <Text style={ms.pinCount}>{items.length}</Text>
            </View>
            <Text style={ms.pinLabel}>{area}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const ms = StyleSheet.create({
  container: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, backgroundColor: C.surface2, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 },
  headerTxt: { fontFamily: F.bold, fontSize: 12, color: C.text2, flex: 1 },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  ldot: { width: 8, height: 8, borderRadius: 99 },
  ltxt: { fontFamily: F.reg, fontSize: 10, color: C.text3 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  pin: { alignItems: "center", gap: 6, width: 68 },
  pinDot: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  pinCount: { fontFamily: F.bold, fontSize: 15, color: "#fff" },
  pinLabel: { fontFamily: F.med, fontSize: 11, color: C.text2, textAlign: "center" },
});
