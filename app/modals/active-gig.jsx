import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials } from "../../components/ui";
import { applicationsAPI, chatAPI } from "../../lib/api";
import { getAreaCoords } from "../../lib/geo";
import { money } from "../../lib/theme";
import { C, F } from "../../lib/theme";

const STEPS = ["Applied", "Confirmed", "In shift", "Done"];
const STEP_INDEX = { applied: 1, confirmed: 2, in_shift: 3, done: 4 };

export default function ActiveGig() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [app, setApp] = useState(null);

  useEffect(() => { (async () => {
    const apps = await applicationsAPI.getMy();
    setApp(apps.find((a) => a.id === id));
  })(); }, [id]);

  if (!app) return <View style={s.center}><ActivityIndicator color={C.indigo} /></View>;

  const step = STEP_INDEX[app.status] || 1;
  const earn = app.payUnit === "hr" ? app.payAmount * 5 : app.payAmount;
  const coords = getAreaCoords(app.area);

  const navigate = () => {
    const q = coords ? `${coords[0]},${coords[1]}` : encodeURIComponent(app.area + ", Chennai");
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };
  const contact = async () => { const c = await chatAPI.openForGig(app.gigId); router.replace(`/(tabs)/chat/${c.id}`); };
  const cancel = () => Alert.alert("Cancel this gig?", "The hirer will be notified.", [
    { text: "Keep gig", style: "cancel" },
    { text: "Cancel gig", style: "destructive", onPress: () => router.back() },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.navy }} edges={["top"]}>
      {/* Navy header */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={s.kicker}>ACTIVE GIG</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" /></Pressable>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
          <Initials text={app.initials} size={42} square bg="#2a2f3d" color="#818cf8" />
          <View style={{ flex: 1 }}>
            <Text style={s.gigTitle}>{app.gigTitle}</Text>
            <Text style={s.gigWho}>{app.who} · {app.area}</Text>
          </View>
          <View style={s.statusPill}>
            <View style={s.statusDot} />
            <Text style={s.statusTxt}>{app.status === "confirmed" ? "Confirmed" : STEPS[step - 1]}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 18 }}>
        {/* Tracker */}
        <View style={s.track}>
          {STEPS.map((_, i) => (
            <View key={i} style={{ flex: i < 3 ? 1 : 0, flexDirection: "row", alignItems: "center" }}>
              <View style={[s.tDot, step >= i + 1 && { backgroundColor: C.indigo, borderColor: C.indigo }]} />
              {i < 3 ? <View style={[s.tLine, step > i + 1 && { backgroundColor: C.indigo }]} /> : null}
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6, marginBottom: 18 }}>
          {STEPS.map((label, i) => (
            <Text key={label} style={[s.tLabel, step >= i + 1 && { color: C.indigo, fontFamily: F.med }]}>{label}</Text>
          ))}
        </View>

        {/* Shift card */}
        <View style={s.shift}>
          <View style={s.shiftRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="time-outline" size={15} color={C.text3} />
              <Text style={s.shiftTime}>Tonight · 7:00 PM – 12:00 AM</Text>
            </View>
            <Text style={s.shiftHrs}>{app.hrs}</Text>
          </View>
          <View style={[s.shiftRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline, paddingTop: 11, marginTop: 11 }]}>
            <Text style={s.earnLabel}>You'll earn</Text>
            <Text style={s.earnAmt}>{money(earn)}</Text>
          </View>
        </View>

        {/* Payment note */}
        <View style={s.payNote}>
          <Ionicons name="information-circle-outline" size={15} color={C.text2} />
          <Text style={s.payNoteTxt}>Payment is settled directly with the hirer after the shift.</Text>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Pressable onPress={navigate} style={s.action}>
            <Ionicons name="navigate" size={20} color={C.text} />
            <Text style={s.actionTxt}>Navigate</Text>
          </Pressable>
          <Pressable onPress={contact} style={s.action}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.text} />
            <Text style={s.actionTxt}>Contact</Text>
          </Pressable>
          <Pressable onPress={cancel} style={[s.action, { backgroundColor: C.redSoft }]}>
            <Ionicons name="close-circle-outline" size={20} color={C.red} />
            <Text style={[s.actionTxt, { color: C.red }]}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  header: { backgroundColor: C.navy, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 20 },
  kicker: { fontFamily: F.bold, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5 },
  gigTitle: { fontFamily: F.bold, fontSize: 16, color: "#fff" },
  gigWho: { fontFamily: F.reg, fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(21,128,61,0.18)", borderWidth: 1, borderColor: "rgba(74,222,128,0.4)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#4ade80" },
  statusTxt: { fontFamily: F.bold, fontSize: 11, color: "#4ade80" },
  track: { flexDirection: "row", alignItems: "center" },
  tDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  tLine: { flex: 1, height: 2, backgroundColor: C.border },
  tLabel: { fontFamily: F.reg, fontSize: 11, color: C.text3, width: 60, textAlign: "left" },
  shift: { backgroundColor: C.surface, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 14 },
  shiftRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shiftTime: { fontFamily: F.med, fontSize: 13, color: C.text },
  shiftHrs: { fontFamily: F.reg, fontSize: 12, color: C.text3 },
  earnLabel: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  earnAmt: { fontFamily: F.bold, fontSize: 18, color: C.green },
  payNote: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.surface2, borderRadius: 10, padding: 11, marginTop: 12 },
  payNoteTxt: { flex: 1, fontFamily: F.reg, fontSize: 12, color: C.text2, lineHeight: 17 },
  actions: { flexDirection: "row", gap: 9, marginTop: 16 },
  action: { flex: 1, alignItems: "center", gap: 6, backgroundColor: C.surface2, borderRadius: 12, paddingVertical: 14 },
  actionTxt: { fontFamily: F.med, fontSize: 12, color: C.text },
});
