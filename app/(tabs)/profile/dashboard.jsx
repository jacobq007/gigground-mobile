import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Pay, Skeleton, Empty } from "../../../components/ui";
import { applicationsAPI, OPEN_APP_STATUSES } from "../../../lib/api";
import { money } from "../../../lib/theme";
import { C, F } from "../../../lib/theme";

const STATUS = {
  applied:     { label: "Applied", color: C.text2, step: 1 },
  seen:        { label: "Seen by hirer", color: C.indigo, step: 1 },
  shortlisted: { label: "Shortlisted", color: C.amber, step: 1 },
  hired:       { label: "Hired", color: C.indigo, step: 2 },
  confirmed:   { label: "Confirmed", color: C.indigo, step: 2 },
  in_shift:    { label: "In shift", color: C.amber, step: 3 },
  done:        { label: "Completed", color: C.green, step: 4 },
};
const ACTIVE = [...OPEN_APP_STATUSES, "hired", "confirmed", "in_shift"];

export default function Dashboard() {
  const router = useRouter();
  const [apps, setApps] = useState(null);
  useFocusEffect(useCallback(() => { (async () => setApps(await applicationsAPI.getMy()))(); }, []));

  const active = (apps || []).filter((a) => ACTIVE.includes(a.status));
  const done = (apps || []).filter((a) => a.status === "done");
  const openCount = (apps || []).filter((a) => OPEN_APP_STATUSES.includes(a.status)).length;
  const earned = done.reduce((sum, a) => sum + (a.payUnit === "hr" ? a.payAmount * 5 : a.payAmount), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={20} color={C.navy} /></Pressable>
        <Text style={s.h}>Dashboard</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Summary tiles */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={s.tile}><Text style={s.tileV}>{active.length}</Text><Text style={s.tileL}>Active</Text></View>
          <View style={s.tile}><Text style={s.tileV}>{done.length}</Text><Text style={s.tileL}>Completed</Text></View>
          <View style={s.tile}><Text style={[s.tileV, { color: C.green }]}>{money(earned)}</Text><Text style={s.tileL}>Earned</Text></View>
        </View>

        {/* Application tray shortcut */}
        <Pressable onPress={() => router.push("/(tabs)/profile/applications")} style={s.tray}>
          <Ionicons name="paper-plane" size={16} color={C.indigo} />
          <View style={{ flex: 1 }}>
            <Text style={s.trayT}>Application tray</Text>
            <Text style={s.trayS}>{openCount} open · every one gets an answer within 24h</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={C.indigo} />
        </Pressable>

        <Text style={s.section}>Active applications</Text>
        {!apps ? <Skeleton height={120} /> : active.length === 0 ? (
          <Empty icon={<Ionicons name="briefcase-outline" size={36} color={C.text3} />} title="No active gigs" subtitle="Apply to a gig and track it here." />
        ) : active.map((a) => {
          const st = STATUS[a.status];
          return (
            <Pressable key={a.id} onPress={() => (a.status === "hired" || a.status === "confirmed") && router.push(`/modals/active-gig?id=${a.id}`)} style={s.card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                <Initials text={a.initials} size={38} square bg={C.navy} color="#818cf8" />
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{a.gigTitle}</Text>
                  <Text style={s.who}>{a.who} · {a.area}</Text>
                </View>
                <Pay amount={a.payAmount} unit={a.payUnit} size={13} />
              </View>
              {/* status tracker */}
              <View style={s.track}>
                {[1, 2, 3, 4].map((n, i) => (
                  <View key={n} style={{ flex: i < 3 ? 1 : 0, flexDirection: "row", alignItems: "center" }}>
                    <View style={[s.tDot, st.step >= n && { backgroundColor: C.indigo, borderColor: C.indigo }]} />
                    {i < 3 ? <View style={[s.tLine, st.step > n && { backgroundColor: C.indigo }]} /> : null}
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
                <Text style={[s.statusTxt, { color: st.color }]}>{st.label}</Text>
                {a.status === "hired" || a.status === "confirmed" ? <Text style={s.openTxt}>Open gig <Ionicons name="chevron-forward" size={11} /></Text> : null}
              </View>
            </Pressable>
          );
        })}

        {done.length > 0 ? <>
          <Text style={s.section}>History</Text>
          {done.map((a) => (
            <View key={a.id} style={[s.card, { opacity: 0.75 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                <Initials text={a.initials} size={34} square bg={C.surface2} color={C.text2} />
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{a.gigTitle}</Text>
                  <Text style={s.who}>{a.who} · completed</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={C.green} />
              </View>
            </View>
          ))}
        </> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  tile: { flex: 1, backgroundColor: C.surface2, borderRadius: 12, padding: 13, alignItems: "flex-start" },
  tileV: { fontFamily: F.bold, fontSize: 18, color: C.text },
  tileL: { fontFamily: F.reg, fontSize: 11, color: C.text2, marginTop: 2 },
  section: { fontFamily: F.bold, fontSize: 14, color: C.text, marginTop: 22, marginBottom: 10 },
  tray: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.indigoSoft, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, marginTop: 14 },
  trayT: { fontFamily: F.bold, fontSize: 13, color: C.indigo },
  trayS: { fontFamily: F.reg, fontSize: 11, color: C.indigo, marginTop: 1, opacity: 0.8 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 13, marginBottom: 11 },
  title: { fontFamily: F.bold, fontSize: 13, color: C.text },
  who: { fontFamily: F.reg, fontSize: 12, color: C.text2, marginTop: 2 },
  track: { flexDirection: "row", alignItems: "center", marginTop: 13 },
  tDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  tLine: { flex: 1, height: 2, backgroundColor: C.border },
  statusTxt: { fontFamily: F.bold, fontSize: 12 },
  openTxt: { fontFamily: F.med, fontSize: 12, color: C.indigo },
});
