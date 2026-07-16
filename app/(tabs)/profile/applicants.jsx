import { useCallback, useState } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials } from "../../../components/ui";
import { gigsAPI, applicantsAPI, OPEN_APP_STATUSES } from "../../../lib/api";
import { skillLabel } from "../../../lib/skills";
import { F, FS } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";

const SORTS = [
  { key: "fit",  label: "Best match", cmp: (a, b) => b.compat - a.compat },
  { key: "near", label: "Closest",    cmp: (a, b) => a.distKm - b.distKm },
  { key: "exp",  label: "Experience", cmp: (a, b) => b.catGigs - a.catGigs },
];

const DECLINE_REASONS = ["Too far", "Not enough experience", "Position filled"];

// The verification tier, said plainly — a small check + words, not a badge bubble.
const VERIF = [
  { label: "Unverified",      icon: "help-circle-outline" },
  { label: "ID verified",     icon: "shield-checkmark-outline" },
  { label: "ID + selfie",     icon: "shield-checkmark" },
  { label: "Police verified", icon: "shield-checkmark" },
];

// One written "why", not a row of chips.
function buildWhy(a, gig) {
  const parts = [];
  if (gig.skillRequired && gig.skillKey) {
    parts.push(a.skilledMatch ? `Verified in ${skillLabel(gig.skillKey)}.`
      : (a.openToLearn ? `Open to ${skillLabel(gig.skillKey)}, not yet verified.` : `Not verified in ${skillLabel(gig.skillKey)}.`));
  }
  const cat = gig.category ? gig.category.toLowerCase() : "local";
  if (a.catGigs > 0) parts.push(`${a.catGigs} ${cat} gigs · ${a.catRating}★ · ${a.reliability}% reliable.`);
  else parts.push(`New to ${cat} gigs · ${a.reliability}% reliable.`);
  return parts;
}

export default function Applicants() {
  const router = useRouter();
  const C = useC();
  const s = makeStyles(C);
  const { gigId } = useLocalSearchParams();
  const [gig, setGig] = useState(null);
  const [list, setList] = useState(null);
  const [sortKey, setSortKey] = useState("fit");
  const [declining, setDeclining] = useState(null);

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
  const decline = async (a, reason) => { setDeclining(null); await applicantsAPI.decline(a.id, reason); load(); };
  const hire = (a) => Alert.alert(`Hire ${a.name}?`, "Everyone else is auto-declined and notified instantly — nobody waits in silence.", [
    { text: "Cancel", style: "cancel" },
    { text: "Hire", onPress: async () => {
      const res = await applicantsAPI.hire(a.id);
      load();
      if (res) Alert.alert("Hired!", `${a.name} is confirmed.${res.autoDeclined > 0 ? ` ${res.autoDeclined} other applicant${res.autoDeclined === 1 ? " was" : "s were"} auto-declined and notified.` : ""}`);
    } },
  ]);

  const Row = ({ a, muted }) => {
    const v = VERIF[a.verifiedTier] || VERIF[0];
    const isBest = a.topPick && !muted;
    const why = buildWhy(a, gig);

    if (muted) return (
      <View style={s.mutedRow}>
        <Initials text={a.initials} size={34} bg={C.surface2} color={C.text2} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.name}>{a.name}</Text>
          <Text style={s.mutedSub}>{a.status === "hired" ? "Hired for this gig" : a.declineReason ? `Declined · ${a.declineReason}` : "Declined"}</Text>
        </View>
      </View>
    );

    return (
      <View style={[s.cand, isBest && s.candBest]}>
        {isBest ? <Text style={s.ribbon}>Best match</Text> : null}
        <View style={s.toprow}>
          <Initials text={a.initials} size={40} bg={isBest ? C.indigo : C.indigoSoft} color={isBest ? "#fff" : C.indigo} />
          <View style={s.grow}>
            <View style={s.nameRow}>
              <Text style={s.name}>{a.name}</Text>
              <Ionicons name={v.icon} size={12} color={C.indigo} />
              <Text style={s.verif}>{v.label}</Text>
            </View>
            <View style={s.metaRow}>
              <Ionicons name="location-outline" size={12} color={C.text3} />
              <Text style={s.meta}>{a.distKm} km · ~{a.etaMin} min away</Text>
            </View>
            <Text style={s.why}>
              <Text style={s.whyB}>{why[0]}</Text>{why[1] ? ` ${why[1]}` : ""}
            </Text>
          </View>
          <View style={s.match}>
            <Text style={[s.pct, { color: isBest ? C.indigo : C.text }]}>{a.compat}</Text>
            <Text style={s.mlabel}>match</Text>
            <View style={s.bar}><View style={[s.barFill, { width: `${a.compat}%` }]} /></View>
          </View>
        </View>

        {a.strikes > 0 ? <Text style={s.flag}>{a.strikes} strike{a.strikes === 1 ? "" : "s"} · {a.reliability}% reliable</Text> : null}
        {a.note ? <Text style={s.note} numberOfLines={2}>"{a.note}"</Text> : null}

        {declining === a.id ? (
          <View style={s.reasonRow}>
            <Text style={s.reasonLbl}>Why?</Text>
            {DECLINE_REASONS.map((r) => (
              <Pressable key={r} onPress={() => decline(a, r)} style={s.reasonChip}><Text style={s.reasonTxt}>{r}</Text></Pressable>
            ))}
          </View>
        ) : (
          <View style={s.acts}>
            {a.status === "shortlisted" ? (
              <View style={s.linkWrap}><Ionicons name="star" size={13} color={C.amber} /><Text style={[s.link, { color: C.amber }]}>Shortlisted</Text></View>
            ) : (
              <Pressable onPress={() => shortlist(a)} hitSlop={6}><Text style={s.link}>Shortlist</Text></Pressable>
            )}
            <Pressable onPress={() => setDeclining(a.id)} hitSlop={6}><Text style={s.link}>Decline</Text></Pressable>
            <Pressable onPress={() => hire(a)} style={s.prim}><Text style={s.primTxt}>Hire</Text></Pressable>
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
            <View style={s.hdrBadge}><Ionicons name="shield-checkmark" size={10} color={C.indigo} /><Text style={s.hdrBadgeTxt}>Skilled · {skillLabel(gig.skillKey)}</Text></View>
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

        {hired.length === 0 ? (
          <Text style={s.lead}>{open.length} applied · ranked by fit{gig.skillRequired ? " for this skilled gig" : ""}</Text>
        ) : null}

        {hired.map((a) => <Row key={a.id} a={a} muted />)}
        {open.map((a) => <Row key={a.id} a={a} />)}

        {declined.length > 0 ? <>
          <Text style={s.section}>Declined · {declined.length}</Text>
          {declined.map((a) => <Row key={a.id} a={a} muted />)}
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
  hdrBadge: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  hdrBadgeTxt: { fontFamily: F.bold, fontSize: 10.5, color: C.indigo },

  sortRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 6 },
  sortLbl: { fontFamily: F.med, fontSize: 12, color: C.text3, marginRight: 2 },
  sortChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: C.border },
  sortOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  sortTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },

  hiredBanner: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.greenSoft, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 6 },
  hiredTxt: { flex: 1, fontFamily: F.med, fontSize: 12, color: C.green, lineHeight: 17 },

  lead: { fontFamily: F.reg, fontSize: 12, color: C.text3, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },

  cand: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  candBest: { backgroundColor: C.indigoSoft, marginHorizontal: -18, paddingHorizontal: 18 },
  ribbon: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", color: C.indigo, marginBottom: 9 },
  toprow: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  grow: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  name: { fontFamily: F.bold, fontSize: 15, color: C.text, letterSpacing: -0.2 },
  verif: { fontFamily: F.med, fontSize: 11, color: C.indigo },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  meta: { fontFamily: F.reg, fontSize: 12, color: C.text2 },
  why: { fontFamily: F.reg, fontSize: 12.5, color: C.text2, marginTop: 8, lineHeight: 18 },
  whyB: { fontFamily: F.bold, color: C.text },
  match: { alignItems: "flex-end", flex: 0 },
  pct: { fontFamily: FS.bold, fontSize: 21, letterSpacing: -0.5 },
  mlabel: { fontFamily: F.med, fontSize: 9, letterSpacing: 0.5, textTransform: "uppercase", color: C.text3, marginTop: -1 },
  bar: { width: 52, height: 3, borderRadius: 2, backgroundColor: C.border, marginTop: 6, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: C.indigo, borderRadius: 2 },
  flag: { fontFamily: F.med, fontSize: 11, color: C.amber, marginTop: 9 },
  note: { fontFamily: F.reg, fontSize: 12, color: C.text2, fontStyle: "italic", marginTop: 9 },

  acts: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 14 },
  linkWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  link: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  prim: { marginLeft: "auto", backgroundColor: C.indigo, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 9 },
  primTxt: { fontFamily: F.bold, fontSize: 13, color: "#fff" },

  reasonRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 13, flexWrap: "wrap" },
  reasonLbl: { fontFamily: F.med, fontSize: 12, color: C.text3 },
  reasonChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: C.redSoft },
  reasonTxt: { fontFamily: F.med, fontSize: 12, color: C.red },

  mutedRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline, opacity: 0.7 },
  mutedSub: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 2 },
  section: { fontFamily: F.bold, fontSize: 13, color: C.text2, marginTop: 16, marginBottom: 4 },
});
