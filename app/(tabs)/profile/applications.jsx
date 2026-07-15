import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Pay, Skeleton, Empty, Chip } from "../../../components/ui";
import { applicationsAPI, OPEN_APP_STATUSES } from "../../../lib/api";
import { F } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";

const makeMeta = (C) => ({
  applied:     { label: "Applied",     color: C.text2,  bg: C.surface2,  icon: "paper-plane-outline" },
  seen:        { label: "Seen",        color: C.indigo, bg: C.indigoSoft, icon: "eye-outline" },
  shortlisted: { label: "Shortlisted", color: C.amber,  bg: "#FEF3E2",   icon: "star" },
  hired:       { label: "Hired",       color: C.green,  bg: C.greenSoft, icon: "checkmark-circle" },
  in_shift:    { label: "In shift",    color: C.amber,  bg: "#FEF3E2",   icon: "time" },
  done:        { label: "Completed",   color: C.green,  bg: C.greenSoft, icon: "checkmark-done" },
  declined:    { label: "Declined",    color: C.red,    bg: C.redSoft,   icon: "close-circle-outline" },
  expired:     { label: "Expired",     color: C.text3,  bg: C.surface2,  icon: "hourglass-outline" },
  withdrawn:   { label: "Withdrawn",   color: C.text3,  bg: C.surface2,  icon: "arrow-undo-outline" },
});

const hrsLeft = (respondBy) => Math.max(0, Math.ceil((respondBy - Date.now()) / 3600000));

export default function ApplicationTray() {
  const C = useC();
  const s = makeStyles(C);
  const META = makeMeta(C);
  const router = useRouter();
  const [apps, setApps] = useState(null);

  const load = useCallback(() => { (async () => setApps(await applicationsAPI.getMy()))(); }, []);
  useFocusEffect(load);

  const open = (apps || []).filter((a) => OPEN_APP_STATUSES.includes(a.status));
  const hired = (apps || []).filter((a) => a.status === "hired" || a.status === "in_shift");
  const closed = (apps || []).filter((a) => ["declined", "expired", "withdrawn", "done"].includes(a.status));

  const withdraw = (a) => Alert.alert("Withdraw application?", `${a.gigTitle} at ${a.who}. This frees up one of your application slots.`, [
    { text: "Keep it", style: "cancel" },
    { text: "Withdraw", style: "destructive", onPress: async () => { await applicationsAPI.withdraw(a.id); load(); } },
  ]);

  const StatusChip = ({ a }) => {
    const m = META[a.status] || META.applied;
    return (
      <View style={[s.chip, { backgroundColor: m.bg }]}>
        <Ionicons name={m.icon} size={11} color={m.color} />
        <Text style={[s.chipTxt, { color: m.color }]}>{m.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={20} color={C.navy} /></Pressable>
        <Text style={s.h}>My applications</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* The promise */}
        <View style={s.promise}>
          <Ionicons name="shield-checkmark" size={16} color={C.indigo} />
          <Text style={s.promiseTxt}>Every application gets an answer within 24h — a hirer reply, or we close it and free your slot. Never silence.</Text>
        </View>

        <Text style={s.section}>Open <Text style={s.count}>· {open.length}</Text></Text>
        {!apps ? <Skeleton height={110} /> : open.length === 0 ? (
          <Empty icon={<Ionicons name="paper-plane-outline" size={36} color={C.text3} />} title="No open applications" subtitle="Apply to a gig and track every status change here." />
        ) : open.map((a) => (
          <View key={a.id} style={s.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <Initials text={a.initials} size={38} square bg={C.navy} color="#818cf8" />
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{a.gigTitle}</Text>
                <Text style={s.who}>{a.who} · {a.area}</Text>
              </View>
              <Pay amount={a.payAmount} unit={a.payUnit} size={13} />
            </View>
            <View style={s.cardFoot}>
              <StatusChip a={a} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="time-outline" size={12} color={C.text3} />
                <Text style={s.countdown}>
                  {a.status === "shortlisted" ? "Answer coming soon" : `Auto-reply in ~${hrsLeft(a.respondBy)}h`}
                </Text>
              </View>
              <Pressable onPress={() => withdraw(a)} hitSlop={6} style={s.withdraw}>
                <Text style={s.withdrawTxt}>Withdraw</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {hired.length > 0 ? <>
          <Text style={s.section}>Hired <Text style={s.count}>· {hired.length}</Text></Text>
          {hired.map((a) => (
            <Pressable key={a.id} onPress={() => router.push(`/modals/active-gig?id=${a.id}`)} style={s.card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                <Initials text={a.initials} size={38} square bg={C.navy} color="#818cf8" />
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{a.gigTitle}</Text>
                  <Text style={s.who}>{a.who} · {a.area}</Text>
                </View>
                <StatusChip a={a} />
                <Ionicons name="chevron-forward" size={15} color={C.text3} />
              </View>
            </Pressable>
          ))}
        </> : null}

        {closed.length > 0 ? <>
          <Text style={s.section}>Closed <Text style={s.count}>· {closed.length}</Text></Text>
          {closed.map((a) => (
            <View key={a.id} style={[s.card, { opacity: 0.72 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                <Initials text={a.initials} size={34} square bg={C.surface2} color={C.text2} />
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{a.gigTitle}</Text>
                  <Text style={s.who}>{a.who} · {a.area}</Text>
                </View>
                <StatusChip a={a} />
              </View>
              {a.status === "declined" && a.declineReason ? (
                <View style={{ marginTop: 9 }}>
                  <Chip label={`Reason: ${a.declineReason}`} small />
                </View>
              ) : null}
            </View>
          ))}
        </> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  promise: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.indigoSoft, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11 },
  promiseTxt: { flex: 1, fontFamily: F.med, fontSize: 12, color: C.indigo, lineHeight: 17 },
  section: { fontFamily: F.bold, fontSize: 14, color: C.text, marginTop: 20, marginBottom: 10 },
  count: { fontFamily: F.reg, fontSize: 13, color: C.text3 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 13, marginBottom: 11 },
  title: { fontFamily: F.bold, fontSize: 13, color: C.text },
  who: { fontFamily: F.reg, fontSize: 12, color: C.text2, marginTop: 2 },
  cardFoot: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chipTxt: { fontFamily: F.bold, fontSize: 11 },
  countdown: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  withdraw: { marginLeft: "auto" },
  withdrawTxt: { fontFamily: F.med, fontSize: 12, color: C.red },
});
