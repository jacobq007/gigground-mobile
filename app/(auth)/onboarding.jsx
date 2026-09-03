import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui";
import CityAreaPicker from "../../components/CityAreaPicker";
import IsoCity from "../../components/IsoCity";
import { useAuth } from "../../lib/AuthContext";
import { useLocation, FALLBACK_CITY } from "../../lib/LocationContext";
import { SERVED_CITIES, distanceToCity } from "../../lib/geo";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

const DEFAULT_CITY = FALLBACK_CITY;
const FAR_KM = 60; // beyond this, we treat the user as outside the city's footprint

export default function Onboarding() {
  const router = useRouter();
  const { user, update } = useAuth();
  // Detection already ran at app start (LocationProvider) — we read its result
  // here rather than asking for permission a second time.
  const { setHome, detectedCity, detectedZone, nearbyZones, coords, locating, refreshLocation } = useLocation();

  const [step, setStep] = useState("permission"); // "permission" | "pick"
  // null until they have actually been asked; "denied" keeps them on the map
  // screen with a way forward instead of dumping them into the picker.
  const [permState, setPermState] = useState(null);
  const [city, setCity] = useState(user?.city && SERVED_CITIES.includes(user.city) ? user.city : DEFAULT_CITY);
  const [area, setArea] = useState(user?.area || "");
  const [changingCity, setChangingCity] = useState(false);
  const [note, setNote] = useState(null); // { tone, text }
  const [busy, setBusy] = useState(false);
  const C = useC();
  const s = makeStyles(C);

  // Fill the form in from a successful detection.
  const applyDetection = (dCity, dArea, dCoords) => {
    const far = dCoords ? (distanceToCity(dCoords, dCity) || 0) > FAR_KM : false;
    setCity(dCity);
    setArea(far ? "" : (dArea || ""));
    setNote(far
      ? { tone: "info", text: `We're not in your area yet — ${dCity} is your nearest GigGround city. Pick a spot there to start.` }
      : { tone: "ok", text: `Located you near ${dArea}, ${dCity}. Tweak it below if that's off.` });
    setStep("pick");
  };

  // Startup detection lands asynchronously — the moment it has a city, skip the
  // permission gate and go straight to a prefilled picker.
  useEffect(() => {
    if (locating || step !== "permission" || !detectedCity) return;
    applyDetection(detectedCity, detectedZone, coords);
  }, [locating, detectedCity, detectedZone, coords, step]);

  const allowLocation = async () => {
    const { city: dCity, area: dArea, coords: dCoords, status } = await refreshLocation();
    if (dCity) return applyDetection(dCity, dArea, dCoords);
    // A refusal is recoverable — they may have fat-fingered the OS prompt, so we
    // stay put and leave "Try location again" in reach. Anything else (no fix,
    // no hardware) will not improve on a retry, so we move them along by hand.
    if (status === "denied") return setPermState("denied");
    setCity(DEFAULT_CITY);
    setNote({ tone: "muted", text: "Couldn't read your location — pick your city and area below." });
    setStep("pick");
  };

  const chooseManually = () => {
    setNote({ tone: "muted", text: "Pick your city and area below." });
    setStep("pick");
  };

  const pickCity = (c) => {
    setCity(c);
    setArea("");
    setChangingCity(false);
    setNote(null);
  };

  const finish = async () => {
    if (!area) return;
    setBusy(true);
    await setHome(city, area);
    try { await update({ city, area }); } catch {} // keep the profile in sync; non-critical
    // New workers finish signup by saying what they do — that is what starts
    // their CV. Anyone who already has skills skips it.
    const hasSkills = (user?.skillGraph || []).length > 0;
    router.replace(hasSkills ? "/(tabs)" : "/(auth)/specialize");
  };

  // ── Step 1 · permission gate ────────────────────────────────────────────────
  // The map is the argument. Asking for someone's location in the abstract is a
  // demand; showing the city we would place them in makes it obvious what the
  // permission actually buys. Three states share the one screen — idle, looking,
  // and refused — because a refusal is not an error worth its own dead end.
  if (step === "permission") {
    const denied = permState === "denied";
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ paddingHorizontal: 26, paddingTop: 22 }}>
          <Text style={s.title}>What's your location?</Text>
          <Text style={s.sub}>
            {denied
              ? "You said no to location, which is fine. Choose your area instead and we'll measure from there."
              : "We need it to show you shifts you can actually walk or ride to."}
          </Text>
        </View>

        <View style={{ flex: 1, marginTop: 6 }}>
          <View style={StyleSheet.absoluteFill}>
            <IsoCity accent={C.indigo} fade={C.bg} dark={C.dark} dimmed={denied} />
          </View>

          <View style={s.mapCentre} pointerEvents="none">
            {locating ? (
              <View style={{ alignItems: "center", gap: 11 }}>
                <ActivityIndicator size="large" color={C.indigo} />
                <Text style={s.mapNote}>Finding you…</Text>
              </View>
            ) : denied ? (
              <View style={{ alignItems: "center", gap: 12 }}>
                <Ionicons name="location-outline" size={38} color={C.text3} />
                <View style={s.mapCard}>
                  <Text style={s.mapCardTitle}>Location is off</Text>
                  <Text style={s.mapCardSub}>Pick your area and we'll show shifts around it.</Text>
                </View>
              </View>
            ) : (
              <Ionicons name="location" size={44} color={C.indigo} />
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 26, paddingBottom: 22 }}>
          <View style={s.privacyRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color={C.text3} />
            <Text style={s.privacyTxt}>Used to place you, never to track you. You can change it anytime.</Text>
          </View>
          <Button
            title={locating ? "Finding you…" : denied ? "Try location again" : "Use current location"}
            onPress={allowLocation}
            disabled={locating}
            icon={locating ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="navigate" size={16} color="#fff" />}
          />
          <Pressable onPress={chooseManually} disabled={locating} style={s.secondary}>
            <Text style={s.secondaryTxt}>{denied ? "Choose my area" : "Enter location manually"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 2 · pick city + area ──────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 20 }}>
        <View style={s.iconWrap}><Ionicons name="location" size={22} color={C.indigo} /></View>
        <Text style={s.titleSm}>Set your Home Zone</Text>
        <Text style={s.sub}>We'll show gigs near here first. You can change it anytime.</Text>

        {/* City row */}
        <View style={s.cityRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="business" size={15} color={C.text2} />
            <Text style={s.cityName}>{city}</Text>
          </View>
          <Pressable onPress={() => setChangingCity((v) => !v)} hitSlop={8} style={s.changeBtn}>
            <Text style={s.changeTxt}>{changingCity ? "Close" : "Change city"}</Text>
            <Ionicons name={changingCity ? "chevron-up" : "chevron-down"} size={13} color={C.indigo} />
          </Pressable>
        </View>

        {changingCity ? (
          <View style={s.cityList}>
            {SERVED_CITIES.map((c) => {
              const on = c === city;
              return (
                <Pressable key={c} onPress={() => pickCity(c)} style={[s.cityChip, on && s.cityChipOn]}>
                  <Text style={[s.cityChipTxt, on && s.cityChipTxtOn]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {note ? (
          <View style={[s.note, note.tone === "ok" && s.noteOk, note.tone === "info" && s.noteInfo]}>
            <Ionicons
              name={note.tone === "ok" ? "checkmark-circle" : note.tone === "info" ? "information-circle" : "hand-left"}
              size={15}
              color={note.tone === "ok" ? C.green : note.tone === "info" ? C.amber : C.text2}
            />
            <Text style={s.noteTxt}>{note.text}</Text>
          </View>
        ) : null}

        {/* Closest places to where we located you — one tap to accept. */}
        {city === detectedCity && nearbyZones.length ? (
          <View style={{ marginTop: 14 }}>
            <Text style={s.nearLabel}>Closest to you</Text>
            <View style={s.nearRow}>
              {nearbyZones.slice(0, 4).map((n) => {
                const on = n.name === area;
                return (
                  <Pressable key={n.name} onPress={() => setArea(n.name)} style={[s.nearChip, on && s.nearChipOn]}>
                    <Text style={[s.nearChipTxt, on && s.nearChipTxtOn]}>{n.name}</Text>
                    <Text style={[s.nearChipKm, on && s.nearChipTxtOn]}>{n.km} km</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 16, flex: 1 }}>
          <CityAreaPicker city={city} value={area} onChange={setArea} height={300} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 28, paddingBottom: 16 }}>
        <Button
          title={area ? `Continue with ${area}` : "Pick an area to continue"}
          onPress={finish}
          disabled={!area || busy}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  nearLabel: { fontFamily: F.med, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: C.text3, marginBottom: 8 },
  nearRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  nearChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  nearChipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  nearChipTxt: { fontFamily: F.med, fontSize: 13, color: C.text },
  nearChipKm: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  nearChipTxtOn: { color: "#fff" },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontFamily: F.bold, fontSize: 27, lineHeight: 33, color: C.text, letterSpacing: -0.7 },
  titleSm: { fontFamily: F.bold, fontSize: 24, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 14, color: C.text2, marginTop: 8, lineHeight: 21 },
  secondary: { alignItems: "center", paddingVertical: 14 },

  mapCentre: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  mapNote: { fontFamily: F.bold, fontSize: 13, color: C.text2 },
  mapCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 12, alignItems: "center", maxWidth: 250, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  mapCardTitle: { fontFamily: F.bold, fontSize: 13, color: C.text },
  mapCardSub: { fontFamily: F.reg, fontSize: 11.5, color: C.text2, lineHeight: 16, marginTop: 3, textAlign: "center" },
  privacyRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 6, paddingBottom: 14 },
  privacyTxt: { flex: 1, fontFamily: F.reg, fontSize: 11.5, color: C.text3, lineHeight: 16 },
  secondaryTxt: { fontFamily: F.bold, fontSize: 14.5, color: C.indigo },

  cityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  cityName: { fontFamily: F.bold, fontSize: 15, color: C.text },
  changeBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  changeTxt: { fontFamily: F.bold, fontSize: 13, color: C.indigo },
  cityList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surface2, borderWidth: 1, borderColor: "transparent" },
  cityChipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  cityChipTxt: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  cityChipTxtOn: { color: "#fff" },

  note: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 12, backgroundColor: C.surface2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  noteOk: { backgroundColor: C.greenSoft },
  noteInfo: { backgroundColor: "#FEF3E2" },
  noteTxt: { flex: 1, fontFamily: F.med, fontSize: 12.5, color: C.text2, lineHeight: 18 },
});
