import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui";
import CityAreaPicker from "../../components/CityAreaPicker";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { detectHome } from "../../lib/locate";
import { SERVED_CITIES, distanceToCity } from "../../lib/geo";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

const DEFAULT_CITY = "Chennai";
const FAR_KM = 60; // beyond this, we treat the user as outside the city's footprint

export default function Onboarding() {
  const router = useRouter();
  const { user, update } = useAuth();
  const { setHome } = useLocation();

  const [step, setStep] = useState("permission"); // "permission" | "pick"
  const [city, setCity] = useState(user?.city && SERVED_CITIES.includes(user.city) ? user.city : DEFAULT_CITY);
  const [area, setArea] = useState(user?.area || "");
  const [changingCity, setChangingCity] = useState(false);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState(null); // { tone, text }
  const [busy, setBusy] = useState(false);
  const C = useC();
  const s = makeStyles(C);

  const allowLocation = async () => {
    setLocating(true);
    const { status, city: detectedCity, area: detectedArea, coords } = await detectHome();
    setLocating(false);

    if (detectedCity && coords) {
      const far = (distanceToCity(coords, detectedCity) || 0) > FAR_KM;
      setCity(detectedCity);
      setArea(far ? "" : (detectedArea || ""));
      setNote(far
        ? { tone: "info", text: `We're not in your area yet — ${detectedCity} is your nearest GigGround city. Pick a spot there to start.` }
        : { tone: "ok", text: `Located you near ${detectedArea}, ${detectedCity}. Tweak it below if that's off.` });
    } else {
      // denied / unavailable — let them choose by hand
      setCity(DEFAULT_CITY);
      setNote({ tone: "muted", text: status === "denied"
        ? "No problem — pick your city and area below."
        : "Couldn't read your location — pick your city and area below." });
    }
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
    router.replace("/(tabs)");
  };

  // ── Step 1 · permission gate ────────────────────────────────────────────────
  if (step === "permission") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 20, alignItems: "center", justifyContent: "center" }}>
          <View style={s.bigIcon}><Ionicons name="location" size={34} color={C.indigo} /></View>
          <Text style={s.title}>Find gigs right around you</Text>
          <Text style={[s.sub, { textAlign: "center" }]}>
            Share your location so we can set your home city and show gigs nearby first. We only use it to place you — never to track you, and you can change it anytime.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 28, paddingBottom: 16, gap: 10 }}>
          <Button
            title={locating ? "Locating…" : "Allow location access"}
            onPress={allowLocation}
            disabled={locating}
            icon={locating ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="navigate" size={16} color="#fff" />}
          />
          <Pressable onPress={chooseManually} disabled={locating} style={s.secondary}>
            <Text style={s.secondaryTxt}>Choose my area manually</Text>
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

        <View style={{ marginTop: 16, flex: 1 }}>
          <CityAreaPicker city={city} value={area} onChange={setArea} height={360} />
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
  bigIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontFamily: F.bold, fontSize: 26, color: C.text, textAlign: "center", letterSpacing: -0.5 },
  titleSm: { fontFamily: F.bold, fontSize: 24, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 14, color: C.text2, marginTop: 8, lineHeight: 21 },
  secondary: { alignItems: "center", paddingVertical: 12 },
  secondaryTxt: { fontFamily: F.bold, fontSize: 14, color: C.text2 },

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
