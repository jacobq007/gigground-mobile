import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Toast, Skeleton, Empty, Initials } from "../../components/ui";
import { gigsAPI, applicantsAPI } from "../../lib/api";
import { C, F } from "../../lib/theme";

// Hiring-mode accent (plum/magenta) — see design/hiring-mode-design-spec.md
const PLUM = "#9D2478";
const PLUM_SOFT = "#FBE7F3";

const BOOST_PERKS = [
  { icon: "rocket-outline", label: "Top of nearby feed", hint: "for 48 hours" },
  { icon: "notifications-outline", label: "Push to matching workers", hint: "within 3 km" },
  { icon: "flash-outline", label: "\"Urgent\" badge", hint: "stands out in lists" },
];

export default function Boost() {
  const router = useRouter();
  const [gigs, setGigs] = useState(null);
  const [applicants, setApplicants] = useState({});
  const [selected, setSelected] = useState(null);
  const [boosted, setBoosted] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const my = await gigsAPI.getMy();
    setGigs(my);
    if (my.length === 1) setSelected(my[0].id);
    const entries = await Promise.all(my.map(async (g) => [g.id, (await applicantsAPI.getForGig(g.id)).length]));
    setApplicants(Object.fromEntries(entries));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmBoost = () => {
    setBoosted(true);
    setToast("Gig boosted — it's now top of the feed");
    setTimeout(() => router.back(), 1100);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.head}>
        <Text style={s.title}>Boost a gig</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.close}>
          <Ionicons name="close" size={20} color={C.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={s.perks}>
          {BOOST_PERKS.map((p) => (
            <View key={p.label} style={s.perk}>
              <View style={s.perkIcon}><Ionicons name={p.icon} size={17} color={PLUM} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.perkLabel}>{p.label}</Text>
                <Text style={s.perkHint}>{p.hint}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>Choose a gig to boost</Text>
        {!gigs ? (
          <View style={{ gap: 8 }}>{[1, 2].map((i) => <Skeleton key={i} height={68} style={{ borderRadius: 14 }} />)}</View>
        ) : gigs.length === 0 ? (
          <Empty
            icon={<Ionicons name="megaphone-outline" size={30} color={C.text3} />}
            title="No posted gigs yet"
            subtitle="Post a gig first, then boost it to reach more workers."
            action={<Button title="Post a gig" onPress={() => router.replace("/modals/post-gig")} />}
          />
        ) : gigs.map((g) => {
          const on = selected === g.id;
          return (
            <Pressable key={g.id} onPress={() => setSelected(g.id)} style={[s.gig, on && s.gigOn]}>
              <Initials text={g.initials} size={42} square bg={on ? PLUM : C.navy} color="#fff" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.gigTitle} numberOfLines={1}>{g.title}</Text>
                <Text style={s.gigMeta}>{applicants[g.id] ?? 0} applied · {g.area}</Text>
              </View>
              <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={22} color={on ? PLUM : C.border} />
            </Pressable>
          );
        })}
      </ScrollView>

      {gigs && gigs.length > 0 ? (
        <View style={s.footer}>
          <Pressable
            onPress={confirmBoost}
            disabled={!selected || boosted}
            style={[s.boostBtn, (!selected || boosted) && { opacity: 0.5 }]}
          >
            <Ionicons name="rocket" size={17} color="#fff" />
            <Text style={s.boostTxt}>{boosted ? "Boosted" : "Boost this gig · ₹49"}</Text>
          </Pressable>
        </View>
      ) : null}
      <Toast message={toast} visible={!!toast} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },
  title: { fontFamily: F.bold, fontSize: 19, color: C.text },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  perks: { backgroundColor: PLUM_SOFT, borderRadius: 18, padding: 16, gap: 14, marginTop: 6, marginBottom: 24 },
  perk: { flexDirection: "row", alignItems: "center", gap: 12 },
  perkIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  perkLabel: { fontFamily: F.bold, fontSize: 13.5, color: C.text },
  perkHint: { fontFamily: F.reg, fontSize: 11.5, color: C.text2, marginTop: 1 },
  sectionLabel: { fontFamily: F.bold, fontSize: 13, color: C.text, marginBottom: 12 },
  gig: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  gigOn: { borderColor: PLUM, backgroundColor: PLUM_SOFT },
  gigTitle: { fontFamily: F.bold, fontSize: 14, color: C.text },
  gigMeta: { fontFamily: F.reg, fontSize: 12, color: C.text2, marginTop: 2 },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, backgroundColor: C.bg },
  boostBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PLUM, borderRadius: 12, paddingVertical: 14 },
  boostTxt: { fontFamily: F.bold, fontSize: 14, color: "#fff" },
});
