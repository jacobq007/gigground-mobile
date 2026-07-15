import { useEffect, useState, useCallback } from "react";
import { Platform, View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton, Pay } from "../../components/ui";
import { useLocation } from "../../lib/LocationContext";
import { gigsAPI } from "../../lib/api";
import { sortGigsByZone } from "../../lib/gigSort";
import { getAreaCoords } from "../../lib/geo";
import { F, money } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

const isExpired = (g) => g.completeBy && new Date(g.completeBy + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0));

// Group gigs by area, keeping only areas we have coordinates for.
function groupByArea(gigs) {
  const groups = {};
  gigs.forEach((g) => {
    const coords = getAreaCoords(g.area);
    if (!coords) return;
    if (!groups[g.area]) groups[g.area] = { area: g.area, coords, gigs: [] };
    groups[g.area].gigs.push(g);
  });
  return Object.values(groups);
}

export default function GigsMap() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { feedZone } = useLocation();
  const [gigs, setGigs] = useState(null);

  const load = useCallback(async () => {
    const all = await gigsAPI.getAll();
    setGigs(all.filter((g) => !isExpired(g)));
  }, []);
  useEffect(() => { load(); }, [load]);

  const sorted = gigs ? sortGigsByZone(gigs, feedZone) : null;
  const nearby = sorted ? [...(sorted.worthTravel || []), ...sorted.tiers.flatMap((t) => t.gigs)] : [];
  const groups = groupByArea(nearby);
  const zone = feedZone || "Chennai";

  const openGig = (id) => router.push(`/(tabs)/jobs/${id}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.head}>
        <View>
          <Text style={s.title}>Gigs near {zone}</Text>
          <Text style={s.sub}>{nearby.length} live · tap a pin to view</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.close}>
          <Ionicons name="close" size={20} color={C.text} />
        </Pressable>
      </View>

      {!gigs ? (
        <View style={{ padding: 18 }}><Skeleton height={320} style={{ borderRadius: 18 }} /></View>
      ) : Platform.OS === "web" ? (
        <WebMap groups={groups} onOpen={openGig} />
      ) : (
        <NativeMap groups={groups} onOpen={openGig} C={C} />
      )}
    </SafeAreaView>
  );
}

// ── Web: real Leaflet map, one marker per area (count badge), popup lists gigs ──
function WebMap({ groups, onOpen }) {
  useEffect(() => {
    const handler = (e) => { if (e.data?.gigId) onOpen(e.data.gigId); };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onOpen]);

  const esc = (str) => String(str).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
  const markers = groups.map((grp) => {
    const items = grp.gigs.map((g) => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid #F1F0EE">
        <div style="min-width:0">
          <div style="font-weight:700;font-size:12.5px;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g.title)}</div>
          <div style="font-size:10.5px;color:#6B7280">${esc(g.who)}</div>
        </div>
        <button onclick="window.parent.postMessage({gigId:'${g.id}'},'*')" style="flex-shrink:0;background:#4338CA;color:#fff;border:none;border-radius:7px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer">₹${g.payAmount}</button>
      </div>`).join("");
    return `
      L.marker([${grp.coords[0]},${grp.coords[1]}], { icon: L.divIcon({
        className:'', iconSize:[38,38], iconAnchor:[19,19],
        html:'<div style="width:38px;height:38px;border-radius:50%;background:#4338CA;border:2.5px solid #fff;box-shadow:0 3px 10px rgba(30,20,120,.45);display:flex;align-items:center;justify-content:center;color:#fff;font-family:system-ui,sans-serif;font-weight:800;font-size:14px">${grp.gigs.length}</div>'
      })}).addTo(map).bindPopup(\`
        <div style="font-family:system-ui,sans-serif;min-width:210px;padding:2px">
          <div style="font-weight:800;font-size:13px;color:#111827;margin-bottom:2px">${esc(grp.area)}</div>
          <div style="font-size:11px;color:#6B7280;margin-bottom:4px">${grp.gigs.length} gig${grp.gigs.length > 1 ? "s" : ""} here</div>
          ${items}
        </div>\`);`;
  }).join("\n");

  // Fallback list shown if Leaflet can't load (no network / CDN blocked).
  const fallbackCards = groups.map((grp) => {
    const rows = grp.gigs.map((g) => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 0;border-top:1px solid #F1F0EE">
        <div style="min-width:0"><div style="font-weight:700;font-size:13.5px;color:#111827">${esc(g.title)}</div><div style="font-size:11.5px;color:#6B7280;margin-top:1px">${esc(g.who)}</div></div>
        <button onclick="window.parent.postMessage({gigId:'${g.id}'},'*')" style="flex-shrink:0;background:#4338CA;color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer">₹${g.payAmount}</button>
      </div>`).join("");
    return `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:6px 14px 10px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0"><div style="width:32px;height:32px;border-radius:16px;background:#4338CA;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">${grp.gigs.length}</div><div style="font-weight:800;font-size:15px;color:#111827">${esc(grp.area)}</div></div>
      ${rows}
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{height:100%;width:100%}#fallback{display:none;height:100%;overflow-y:auto;padding:16px;background:#FAFAF9;font-family:system-ui,sans-serif}.leaflet-popup-content{margin:10px 12px}</style>
  </head><body>
    <div id="map"></div>
    <div id="fallback"><div style="font-size:12px;color:#6B7280;font-weight:600;margin-bottom:12px">Gigs grouped by area · nearest first</div>${fallbackCards}</div>
    <script>
      function showFallback(){ var m=document.getElementById('map'); if(m) m.style.display='none'; document.getElementById('fallback').style.display='block'; }
      try {
        if (typeof L === 'undefined') { showFallback(); }
        else {
          var map=L.map('map',{zoomControl:false}).setView([13.02,80.22],12);
          L.control.zoom({position:'bottomright'}).addTo(map);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'©OSM'}).addTo(map);
          ${markers}
          try { var fg=L.featureGroup(map._layers ? Object.values(map._layers).filter(function(l){return l.getLatLng;}) : []); if(fg.getLayers().length) map.fitBounds(fg.getBounds().pad(0.3)); } catch(e){}
        }
      } catch(e) { showFallback(); }
    </script>
  </body></html>`;

  return (
    <View style={{ flex: 1, margin: 18, borderRadius: 18, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: C.border }}>
      <iframe srcDoc={html} style={{ width: "100%", height: "100%", border: "none" }} title="Gigs map" />
    </View>
  );
}

// ── Native fallback: area pins + expandable gig list ──────────────────────────
function NativeMap({ groups, onOpen, C }) {
  const ms = makeMs(C);
  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={ms.legend}>
        <Ionicons name="location" size={13} color={C.indigo} />
        <Text style={ms.legendTxt}>Gigs grouped by area · nearest first</Text>
      </View>
      {groups.length === 0 ? (
        <Text style={{ fontFamily: F.reg, fontSize: 13, color: C.text2, textAlign: "center", marginTop: 40 }}>No mappable gigs nearby right now.</Text>
      ) : groups.map((grp) => (
        <View key={grp.area} style={ms.areaCard}>
          <View style={ms.areaHead}>
            <View style={ms.pin}><Text style={ms.pinCount}>{grp.gigs.length}</Text></View>
            <Text style={ms.areaName}>{grp.area}</Text>
          </View>
          {grp.gigs.map((g) => (
            <Pressable key={g.id} onPress={() => onOpen(g.id)} style={ms.gigRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={ms.gigTitle} numberOfLines={1}>{g.title}</Text>
                <Text style={ms.gigWho} numberOfLines={1}>{g.who}</Text>
              </View>
              <Pay amount={g.payAmount} unit={g.payUnit} size={15} />
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  title: { fontFamily: F.bold, fontSize: 19, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 12.5, color: C.text2, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
});

const makeMs = (C) => StyleSheet.create({
  legend: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  legendTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  areaCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 12 },
  areaHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  pin: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.indigo, alignItems: "center", justifyContent: "center" },
  pinCount: { fontFamily: F.bold, fontSize: 14, color: "#fff" },
  areaName: { fontFamily: F.bold, fontSize: 15, color: C.text },
  gigRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  gigTitle: { fontFamily: F.bold, fontSize: 13.5, color: C.text },
  gigWho: { fontFamily: F.reg, fontSize: 11.5, color: C.text2, marginTop: 1 },
});
