import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Chip, Button, Pay } from "../../../components/ui";
import { gigsAPI, savedAPI } from "../../../lib/api";
import { money } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";
import { F } from "../../../lib/theme";

const parseHrs = (h) => { const m = String(h).match(/(\d+)/); return m ? parseInt(m[1]) : null; };

export default function JobDetail() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [gig, setGig] = useState(null);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { (async () => {
    setGig(await gigsAPI.getOne(id));
    setSaved(await savedAPI.isSaved(id));
    const apps = await gigsAPI.getApplications();
    setApplied(apps.some((a) => a.gigId === id));
  })(); }, [id]);

  if (!gig) return <View style={s.center}><ActivityIndicator color={C.indigo} /></View>;

  const isBiz = gig.who && !gig.who.startsWith("Self");
  const hrs = parseHrs(gig.hrs);
  const shiftEarn = gig.payUnit === "hr" && hrs ? gig.payAmount * hrs : gig.payUnit === "fixed" ? gig.payAmount : gig.payUnit === "day" ? gig.payAmount : null;

  const apply = async () => {
    setBusy(true);
    await gigsAPI.apply(gig.id);
    setApplied(true); setBusy(false);
  };
  const toggleSave = async () => {
    if (saved) await savedAPI.unsave("gig", gig.id); else await savedAPI.save("gig", gig.id);
    setSaved(!saved);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="arrow-back" size={20} color={C.navy} />
          <Text style={s.back}>Jobs</Text>
        </Pressable>
        <Pressable onPress={toggleSave}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? C.indigo : C.text3} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 16 }}>
          <Initials text={gig.initials} size={44} square={isBiz} bg={isBiz ? C.navy : C.indigoSoft} color={isBiz ? "#818cf8" : C.indigo} />
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{gig.title}</Text>
            <Text style={s.who}>{gig.who} · {gig.area}</Text>
          </View>
        </View>

        {/* Pay hero */}
        <Text style={s.payLabel}>PAY RATE</Text>
        <Pay amount={gig.payAmount} unit={gig.payUnit} size={30} />

        {/* Stat row */}
        <View style={s.stats}>
          {[[gig.area, "Area"], [gig.hrs, "Duration"], [`${gig.openings} left`, "Spots"]].map(([v, l], i) => (
            <View key={l} style={[s.stat, i < 2 && s.statBorder]}>
              <Text style={s.statV} numberOfLines={1}>{v}</Text>
              <Text style={s.statL}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Tags */}
        <View style={{ flexDirection: "row", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
          <Chip label={gig.timing} />
          <Chip label={gig.category} />
          <Chip label={gig.type === "FLEXIBLE" ? "Recurring" : "One-time"} />
          {gig.urgent ? <Chip label="Urgent" tone="red" /> : null}
        </View>

        {/* Earn callout */}
        {shiftEarn ? (
          <View style={s.earn}>
            <Text style={s.earnLabel}>{gig.payUnit === "hr" ? "You'll earn this shift" : gig.payUnit === "day" ? "Per day" : "For this job"}</Text>
            <Text style={s.earnAmt}>{money(shiftEarn)}</Text>
          </View>
        ) : null}

        <Text style={s.descTitle}>About this gig</Text>
        <Text style={s.desc}>{gig.desc}</Text>
      </ScrollView>

      {/* Sticky apply */}
      <View style={s.footer}>
        {applied ? (
          <Pressable onPress={() => router.push("/(tabs)/profile/applications")} style={s.appliedRow}>
            <Ionicons name="checkmark-circle" size={20} color={C.green} />
            <View>
              <Text style={s.appliedTxt}>Application sent — answer within 24h, guaranteed</Text>
              <Text style={s.trayLink}>Track it in your application tray →</Text>
            </View>
          </Pressable>
        ) : (
          <Button title={busy ? "Applying…" : "Apply now"} onPress={apply} disabled={busy} />
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  back: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  title: { fontFamily: F.bold, fontSize: 17, color: C.text },
  who: { fontFamily: F.reg, fontSize: 13, color: C.text2, marginTop: 2 },
  payLabel: { fontFamily: F.bold, fontSize: 10, color: C.text3, letterSpacing: 1, marginBottom: 2 },
  stats: { flexDirection: "row", borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 12, marginTop: 14, backgroundColor: C.surface },
  stat: { flex: 1, paddingVertical: 11, alignItems: "center" },
  statBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: C.border },
  statV: { fontFamily: F.bold, fontSize: 13, color: C.text },
  statL: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 2 },
  earn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.greenSoft, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
  earnLabel: { fontFamily: F.med, fontSize: 12, color: "#166534" },
  earnAmt: { fontFamily: F.bold, fontSize: 16, color: C.green },
  descTitle: { fontFamily: F.bold, fontSize: 14, color: C.text, marginTop: 20, marginBottom: 6 },
  desc: { fontFamily: F.reg, fontSize: 14, color: C.text2, lineHeight: 22 },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline, backgroundColor: C.bg },
  appliedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.greenSoft, borderRadius: 12, paddingVertical: 14 },
  appliedTxt: { fontFamily: F.med, fontSize: 13, color: "#166534" },
  trayLink: { fontFamily: F.reg, fontSize: 11, color: "#166534", opacity: 0.75, marginTop: 2 },
});
