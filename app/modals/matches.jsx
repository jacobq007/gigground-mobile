import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Empty, Initials } from "../../components/ui";
import { matchesAPI } from "../../lib/api";
import { formatPayRange } from "../../lib/pay";
import { F, FS } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

export default function Matches() {
  const router = useRouter();
  const C = useC();
  const s = makeStyles(C);
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => { (async () => setList(await matchesAPI.getForMe()))(); }, []);
  useFocusEffect(load);

  const accept = (m) => {
    setBusy(m.id);
    Alert.alert("Accept this job?", `${m.gigTitle} at ${m.who}. We'll apply for you and let ${m.who} know right away.`, [
      { text: "Not now", style: "cancel", onPress: () => setBusy(null) },
      { text: "Accept", onPress: async () => {
        await matchesAPI.accept(m.id);
        setBusy(null);
        setList((prev) => (prev || []).filter((x) => x.id !== m.id));
        Alert.alert("You're in!", `Applied to ${m.gigTitle}. Track it under My applications.`);
      } },
    ]);
  };

  const skip = async (m) => {
    setBusy(m.id);
    await matchesAPI.skip(m.id);
    setList((prev) => (prev || []).filter((x) => x.id !== m.id));
    setBusy(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={s.h}>Matched for you</Text>
          <Text style={s.sub}>Picked for your skills</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {!list ? <View style={s.center}><ActivityIndicator color={C.indigo} /></View> : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          {list.length === 0 ? (
            <Empty icon={<Ionicons name="sparkles-outline" size={36} color={C.text3} />} title="No matches right now" subtitle="Add more skills to your profile and we'll push jobs that fit — you just say yes or no." />
          ) : (
            <>
              <Text style={s.cap}>One clear yes-or-no at a time — no feed to scroll.</Text>

              {list.map((m) => (
                <View key={m.id} style={s.card}>
                  <View style={s.hd}>
                    <Initials text={m.initials} size={40} bg={C.surface2} color={C.text2} />
                    <View style={s.grow}>
                      <Text style={s.title} numberOfLines={1}>{m.gigTitle}</Text>
                      <Text style={s.who} numberOfLines={1}>{m.who} · {m.area}</Text>
                    </View>
                  </View>

                  <Text style={s.pay}>{formatPayRange(m.payMin ?? m.payAmount, m.payMax, m.payUnit)}</Text>

                  <View style={s.facts}>
                    <Text style={s.fact}><Text style={s.factB}>{m.distKm} km</Text> away</Text>
                    <Text style={s.factDot}>·</Text>
                    <Text style={s.fact}><Text style={s.factB}>{m.timing}</Text></Text>
                  </View>

                  <View style={s.fitRow}>
                    <Ionicons name="sparkles" size={13} color={C.indigo} />
                    <Text style={s.fitTxt}>{m.matchWhy} — a strong match.</Text>
                  </View>

                  <View style={s.meter}>
                    <View style={s.meterTop}>
                      <Text style={s.meterL}>Fit</Text>
                      <Text style={s.meterV}>{m.matchPct}%</Text>
                    </View>
                    <View style={s.track}><View style={[s.trackFill, { width: `${m.matchPct}%` }]} /></View>
                  </View>

                  {m.expiresInMin != null ? <Text style={s.reply}>Reply within ~{m.expiresInMin} min</Text> : null}

                  <View style={s.acts}>
                    <Pressable disabled={busy === m.id} onPress={() => skip(m)} style={s.skip}><Text style={s.skipTxt}>Skip</Text></Pressable>
                    <Pressable disabled={busy === m.id} onPress={() => accept(m)} style={s.acc}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text style={s.accTxt}>Accept</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              <Text style={s.foot}>Accepting applies for you and tells the hirer right away.</Text>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 1 },
  cap: { fontFamily: F.reg, fontSize: 12.5, color: C.text2, marginBottom: 14 },

  card: { backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 16, padding: 15, marginBottom: 12 },
  hd: { flexDirection: "row", alignItems: "center", gap: 11 },
  grow: { flex: 1, minWidth: 0 },
  title: { fontFamily: F.bold, fontSize: 16, color: C.text, letterSpacing: -0.2 },
  who: { fontFamily: F.reg, fontSize: 12.5, color: C.text2, marginTop: 2 },
  pay: { fontFamily: FS.bold, fontSize: 17, color: C.green, marginTop: 13, letterSpacing: -0.3 },

  facts: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  fact: { fontFamily: F.reg, fontSize: 12.5, color: C.text2 },
  factB: { fontFamily: F.bold, color: C.text },
  factDot: { fontFamily: F.reg, fontSize: 12.5, color: C.text3 },

  fitRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 13, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  fitTxt: { flex: 1, fontFamily: F.med, fontSize: 12.5, color: C.indigo },

  meter: { marginTop: 13 },
  meterTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  meterL: { fontFamily: F.med, fontSize: 11.5, color: C.text2 },
  meterV: { fontFamily: FS.bold, fontSize: 12.5, color: C.indigo },
  track: { height: 5, borderRadius: 3, backgroundColor: C.surface2, overflow: "hidden" },
  trackFill: { height: "100%", backgroundColor: C.indigo, borderRadius: 3 },

  reply: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 10 },

  acts: { flexDirection: "row", gap: 10, marginTop: 15 },
  skip: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 11, borderWidth: 1, borderColor: C.border },
  skipTxt: { fontFamily: F.bold, fontSize: 13, color: C.text2 },
  acc: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 11, backgroundColor: C.indigo },
  accTxt: { fontFamily: F.bold, fontSize: 13, color: "#fff" },

  foot: { fontFamily: F.reg, fontSize: 11, color: C.text3, textAlign: "center", marginTop: 4 },
});
