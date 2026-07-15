import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Empty } from "../../components/ui";
import { matchesAPI } from "../../lib/api";
import { compatTone } from "../../lib/skills";
import { formatPayRange } from "../../lib/pay";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

const makeTone = (C) => ({ high: { bg: C.indigoSoft, fg: C.indigo }, mid: { bg: C.dark ? "#3A2A10" : "#FEF3E2", fg: C.amber }, low: { bg: C.surface2, fg: C.text3 } });

export default function Matches() {
  const router = useRouter();
  const C = useC();
  const s = makeStyles(C);
  const TONE = makeTone(C);
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(null); // offer id being acted on

  const load = useCallback(() => { (async () => setList(await matchesAPI.getForMe()))(); }, []);
  useFocusEffect(load);

  const accept = (m) => {
    setBusy(m.id);
    Alert.alert(`Accept this job?`, `${m.gigTitle} at ${m.who}. We'll apply for you and let ${m.who} know right away.`, [
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
          <Text style={s.sub}>Jobs picked for your skills</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {!list ? <View style={s.center}><ActivityIndicator color={C.indigo} /></View> : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          {list.length === 0 ? (
            <Empty icon={<Ionicons name="sparkles-outline" size={36} color={C.text3} />} title="No matches right now" subtitle="Add more skills to your profile and we'll push jobs that fit — you just say yes or no." />
          ) : (
            <>
              <View style={s.intro}>
                <Ionicons name="flash" size={15} color={C.indigo} />
                <Text style={s.introTxt}>{list.length} job{list.length === 1 ? "" : "s"} match your skills. Accept the ones you want — no scrolling a feed, no waiting in silence.</Text>
              </View>

              {list.map((m) => {
                const t = TONE[compatTone(m.matchPct)];
                return (
                  <View key={m.id} style={s.card}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={[s.ring, { borderColor: t.fg, backgroundColor: t.bg }]}>
                        <Text style={[s.ringN, { color: t.fg }]}>{m.matchPct}</Text>
                        <Text style={[s.ringL, { color: t.fg }]}>match</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.title} numberOfLines={1}>{m.gigTitle}</Text>
                        <Text style={s.who} numberOfLines={1}>{m.who} · {m.area}</Text>
                      </View>
                      <Text style={s.pay}>{formatPayRange(m.payMin ?? m.payAmount, m.payMax, m.payUnit)}</Text>
                    </View>

                    <View style={s.whyRow}>
                      <View style={s.whyChip}>
                        <Ionicons name={m.skillRequired ? "shield-checkmark" : "checkmark-circle"} size={11} color={C.indigo} />
                        <Text style={s.whyTxt}>{m.matchWhy}</Text>
                      </View>
                      {m.expiresInMin != null ? (
                        <View style={s.expiry}>
                          <Ionicons name="time-outline" size={11} color={C.amber} />
                          <Text style={s.expiryTxt}>Reply in ~{m.expiresInMin}m</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={s.metaRow}>
                      <View style={s.metaItem}><Ionicons name="calendar-outline" size={13} color={C.text3} /><Text style={s.metaTxt}>{m.timing}</Text></View>
                      <View style={s.metaItem}><Ionicons name="hourglass-outline" size={13} color={C.text3} /><Text style={s.metaTxt}>{m.hrs}</Text></View>
                      <View style={s.metaItem}><Ionicons name="navigate-outline" size={13} color={C.text3} /><Text style={s.metaTxt}>{m.distKm} km · ~{m.etaMin}m</Text></View>
                    </View>

                    {m.desc ? <Text style={s.desc} numberOfLines={2}>{m.desc}</Text> : null}

                    <View style={s.actions}>
                      <Pressable disabled={busy === m.id} onPress={() => skip(m)} style={s.skipBtn}>
                        <Text style={s.skipTxt}>Skip</Text>
                      </Pressable>
                      <Pressable disabled={busy === m.id} onPress={() => accept(m)} style={s.acceptBtn}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={s.acceptTxt}>Accept</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
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
  intro: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.indigoSoft, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 14 },
  introTxt: { flex: 1, fontFamily: F.med, fontSize: 12, color: C.indigo, lineHeight: 17 },
  card: { backgroundColor: C.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 14, marginBottom: 12 },
  ring: { width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  ringN: { fontFamily: F.bold, fontSize: 16, lineHeight: 18 },
  ringL: { fontFamily: F.med, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.3, marginTop: -1 },
  title: { fontFamily: F.bold, fontSize: 14.5, color: C.text },
  who: { fontFamily: F.reg, fontSize: 12, color: C.text2, marginTop: 2 },
  pay: { fontFamily: F.bold, fontSize: 14, color: C.green },
  whyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  whyChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.indigoSoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  whyTxt: { fontFamily: F.bold, fontSize: 11, color: C.indigo },
  expiry: { flexDirection: "row", alignItems: "center", gap: 3 },
  expiryTxt: { fontFamily: F.med, fontSize: 11, color: C.amber },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  desc: { fontFamily: F.reg, fontSize: 12.5, color: C.text2, lineHeight: 18, marginTop: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  skipBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 11, backgroundColor: C.surface2 },
  skipTxt: { fontFamily: F.bold, fontSize: 13, color: C.text2 },
  acceptBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 11, backgroundColor: C.indigo },
  acceptTxt: { fontFamily: F.bold, fontSize: 13, color: "#fff" },
});
