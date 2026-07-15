import { useCallback, useState } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials } from "../../../components/ui";
import { gigsAPI, applicantsAPI, OPEN_APP_STATUSES } from "../../../lib/api";
import { compatTone, skillLabel } from "../../../lib/skills";
import { F } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";

const makeTone = (C) => ({ high: { bg: C.indigoSoft, fg: C.indigo }, mid: { bg: C.dark ? "#3A2A10" : "#FEF3E2", fg: C.amber }, low: { bg: C.surface2, fg: C.text3 } });

const makeVerif = (C) => ([
  { label: "Unverified",      color: C.text3,  icon: "help-circle-outline" },
  { label: "ID verified",     color: C.indigo, icon: "shield-checkmark-outline" },
  { label: "ID + selfie",     color: C.indigo, icon: "shield-checkmark" },
  { label: "Police verified", color: C.green,  icon: "shield-checkmark" },
]);

const SORTS = [
  { key: "fit",  label: "Best match", cmp: (a, b) => b.compat - a.compat },
  { key: "near", label: "Closest",    cmp: (a, b) => a.distKm - b.distKm },
  { key: "exp",  label: "Experience", cmp: (a, b) => b.catGigs - a.catGigs },
];

const DECLINE_REASONS = ["Too far", "Not enough experience", "Position filled"];

export default function Applicants() {
  const router = useRouter();
  const C = useC();
  const s = makeStyles(C);
  const TONE = makeTone(C);
  const VERIF = makeVerif(C);
  const { gigId } = useLocalSearchParams();
  const [gig, setGig] = useState(null);
  const [list, setList] = useState(null);
  const [sortKey, setSortKey] = useState("fit");
  const [declining, setDeclining] = useState(null); // applicant id showing reason chips

  const load = useCallback(() => { (async () => {
    setGig(await gigsAPI.getOne(gigId));
    setList(await applicantsAPI.getForGig(gigId));
  })(); }, [gigId]);
  useFocusEffect(load);

  if (!gig || !list) return <View style={s.center}><ActivityIndicator color={C.indigo} /></View>;

  const sort = SORTS.find((x) => x.key === sortKey) || SORTS[0];
  const open = list.filter((a) => OPEN_APP_STATUSES.includes(a.status)).sort(sort.cmp);
  const hired = list.filter((a) => a.status === "hired");
  const declined = list.filter((a) => a.status === "declined");

  const shortlist = async (a) => { await applicantsAPI.shortlist(a.id); load(); };
  const decline = async (a, reason) => {
    setDeclining(null);
    await applicantsAPI.decline(a.id, reason);
    load();
  };
  const hire = (a) => Alert.alert(`Hire ${a.name}?`, "Everyone else is auto-declined and notified instantly — nobody waits in silence.", [
    { text: "Cancel", style: "cancel" },
    { text: "Hire", onPress: async () => {
      const res = await applicantsAPI.hire(a.id);
      load();
      if (res) Alert.alert("Hired!", `${a.name} is confirmed.${res.autoDeclined > 0 ? ` ${res.autoDeclined} other applicant${res.autoDeclined === 1 ? " was" : "s were"} auto-declined and notified.` : ""}`);
    } },
  ]);

  const Card = ({ a, muted }) => {
    const v = VERIF[a.verifiedTier] || VERIF[0];
    return (
      <View style={[s.card, muted && { opacity: 0.65 }, a.topPick && !muted && s.topPickCard]}>
        {a.topPick && !muted ? (
          <View style={s.topPickTag}>
            <Ionicons name="sparkles" size={10} color="#fff" />
            <Text style={s.topPickTxt}>BEST MATCH</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
          {a.compat != null && !muted ? (() => { const t = TONE[compatTone(a.compat)]; return (
            <View style={[s.ring, { borderColor: t.fg, backgroundColor: t.bg }]}>
              <Text style={[s.ringN, { color: t.fg }]}>{a.compat}</Text>
              <Text style={[s.ringL, { color: t.fg }]}>match</Text>
            </View>
          ); })() : <Initials text={a.initials} size={40} />}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{a.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Ionicons name={v.icon} size={12} color={v.color} />
              <Text style={[s.verif, { color: v.color }]}>{v.label}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.dist}>{a.distKm} km</Text>
            <Text style={s.eta}>~{a.etaMin} min away</Text>
          </View>
        </View>

        {a.compatReasons && !muted ? (
          <View style={s.reasons}>
            {a.compatReasons.map((r, i) => (
              <View key={i} style={[s.rz, { backgroundColor: r.ok ? C.indigoSoft : C.surface2 }]}>
                <Ionicons name={r.ok ? "checkmark" : "close"} size={10} color={r.ok ? C.indigo : C.text3} />
                <Text style={[s.rzTxt, { color: r.ok ? C.indigo : C.text3 }]}>{r.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* The four scannable things: relevant stats · reliability + strikes · verification (above) · distance (above) */}
        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statV}>{a.catGigs} <Text style={s.statStar}>· {a.catRating}★</Text></Text>
            <Text style={s.statL}>{gig.category} gigs</Text>
          </View>
          <View style={[s.stat, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: C.border }]}>
            <Text style={[s.statV, a.strikes > 0 && { color: C.red }]}>{a.reliability}%{a.strikes > 0 ? ` · ${a.strikes}⚑` : ""}</Text>
            <Text style={s.statL}>{a.strikes > 0 ? `Reliable · ${a.strikes} strike${a.strikes === 1 ? "" : "s"}` : "Reliability"}</Text>
          </View>
        </View>

        {a.note ? <Text style={s.note}>"{a.note}"</Text> : null}

        {muted ? (
          a.declineReason ? <Text style={s.declinedTxt}>Declined · {a.declineReason}</Text> : null
        ) : declining === a.id ? (
          <View style={s.reasonRow}>
            <Text style={s.reasonLbl}>Why?</Text>
            {DECLINE_REASONS.map((r) => (
              <Pressable key={r} onPress={() => decline(a, r)} style={s.reasonChip}>
                <Text style={s.reasonTxt}>{r}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={s.actions}>
            {a.status === "shortlisted" ? (
              <View style={[s.actBtn, s.shortlisted]}>
                <Ionicons name="star" size={13} color={C.amber} />
                <Text style={[s.actTxt, { color: C.amber }]}>Shortlisted</Text>
              </View>
            ) : (
              <Pressable onPress={() => shortlist(a)} style={s.actBtn}>
                <Ionicons name="star-outline" size={13} color={C.text2} />
                <Text style={s.actTxt}>Shortlist</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setDeclining(a.id)} style={s.actBtn}>
              <Ionicons name="close" size={14} color={C.text2} />
              <Text style={s.actTxt}>Decline</Text>
            </Pressable>
            <Pressable onPress={() => hire(a)} style={[s.actBtn, s.hireBtn]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={[s.actTxt, { color: "#fff" }]}>Hire</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={20} color={C.navy} /></Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={s.h}>Applicants</Text>
          {gig.skillRequired && gig.skillKey ? (
            <View style={s.hdrBadge}><Ionicons name="shield-checkmark" size={10} color="#fff" /><Text style={s.hdrBadgeTxt}>Skilled · {skillLabel(gig.skillKey)}</Text></View>
          ) : (
            <Text style={s.sub} numberOfLines={1}>{gig.title} · {gig.area}</Text>
          )}
        </View>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {hired.length > 0 ? (
          <View style={s.hiredBanner}>
            <Ionicons name="checkmark-circle" size={16} color={C.green} />
            <Text style={s.hiredTxt}>{hired[0].name} is hired for this gig. Everyone else was notified instantly.</Text>
          </View>
        ) : (
          <View style={s.sortRow}>
            <Text style={s.sortLbl}>Sort</Text>
            {SORTS.map((x) => (
              <Pressable key={x.key} onPress={() => setSortKey(x.key)} style={[s.sortChip, sortKey === x.key && s.sortOn]}>
                <Text style={[s.sortTxt, sortKey === x.key && { color: C.indigo }]}>{x.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {hired.map((a) => <Card key={a.id} a={a} muted />)}
        {open.map((a) => <Card key={a.id} a={a} />)}

        {declined.length > 0 ? <>
          <Text style={s.section}>Declined · {declined.length}</Text>
          {declined.map((a) => <Card key={a.id} a={a} muted />)}
        </> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 1 },
  sortRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
  sortLbl: { fontFamily: F.med, fontSize: 12, color: C.text3, marginRight: 2 },
  sortChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  sortOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  sortTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  hiredBanner: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.greenSoft, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 14 },
  hiredTxt: { flex: 1, fontFamily: F.med, fontSize: 12, color: "#166534", lineHeight: 17 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 13, marginBottom: 11 },
  topPickCard: { borderColor: C.indigo, borderWidth: 1 },
  topPickTag: { position: "absolute", top: -9, left: 12, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.indigo, paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 5 },
  topPickTxt: { fontFamily: F.bold, fontSize: 9, color: "#fff", letterSpacing: 0.5 },
  name: { fontFamily: F.bold, fontSize: 14, color: C.text },
  ring: { width: 46, height: 46, borderRadius: 23, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  ringN: { fontFamily: F.bold, fontSize: 15, lineHeight: 17 },
  ringL: { fontFamily: F.med, fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.3, marginTop: -1 },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 10 },
  rz: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  rzTxt: { fontFamily: F.bold, fontSize: 10 },
  hdrBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.indigo, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginTop: 2 },
  hdrBadgeTxt: { fontFamily: F.bold, fontSize: 10, color: "#fff" },
  verif: { fontFamily: F.med, fontSize: 11 },
  dist: { fontFamily: F.bold, fontSize: 13, color: C.text },
  eta: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 1 },
  statRow: { flexDirection: "row", borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 10, marginTop: 12, backgroundColor: C.bg },
  stat: { flex: 1, paddingVertical: 8, alignItems: "center" },
  statV: { fontFamily: F.bold, fontSize: 13, color: C.text },
  statStar: { fontFamily: F.med, fontSize: 12, color: C.amber },
  statL: { fontFamily: F.reg, fontSize: 10, color: C.text3, marginTop: 1 },
  note: { fontFamily: F.reg, fontSize: 12, color: C.text2, fontStyle: "italic", marginTop: 10 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: C.surface2 },
  shortlisted: { backgroundColor: "#FEF3E2" },
  hireBtn: { backgroundColor: C.indigo },
  actTxt: { fontFamily: F.bold, fontSize: 12, color: C.text2 },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" },
  reasonLbl: { fontFamily: F.med, fontSize: 12, color: C.text3 },
  reasonChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: C.redSoft },
  reasonTxt: { fontFamily: F.med, fontSize: 12, color: C.red },
  declinedTxt: { fontFamily: F.med, fontSize: 11, color: C.red, marginTop: 10 },
  section: { fontFamily: F.bold, fontSize: 13, color: C.text2, marginTop: 14, marginBottom: 10 },
});
