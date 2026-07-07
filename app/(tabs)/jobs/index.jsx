import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton, FadeIn, Pay, Initials, Chip } from "../../../components/ui";
import { GigRow } from "../../../components/GigRow";
import { useLocation } from "../../../lib/LocationContext";
import { gigsAPI } from "../../../lib/api";
import { sortGigsByZone } from "../../../lib/gigSort";
import { TIMINGS } from "../../../lib/constants";
import { promptReport } from "../../../lib/report";
import { C, F } from "../../../lib/theme";

const isExpired = (g) => g.completeBy && new Date(g.completeBy + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0));

export default function Jobs() {
  const router = useRouter();
  const { feedZone, detectedZone, showSwitchBanner, switchFeedZone } = useLocation();
  const [seg, setSeg] = useState("gigs");
  const [gigs, setGigs] = useState(null);
  const [q, setQ] = useState("");
  const [timing, setTiming] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => { setGigs(await gigsAPI.getAll()); }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  let filtered = (gigs || []).filter((g) => !isExpired(g));
  if (q) filtered = filtered.filter((g) => (g.title + g.who + g.category).toLowerCase().includes(q.toLowerCase()));
  if (timing) filtered = filtered.filter((g) => g.timing === timing);
  const sorted = gigs ? sortGigsByZone(filtered, feedZone) : null;

  if (seg === "jobs") return <FullTimeRedirect router={router} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.head}>
        <Text style={s.title}>Browse</Text>
        <Pressable onPress={() => setShowFilters((v) => !v)} style={[s.filterBtn, (timing || showFilters) && { backgroundColor: C.indigoSoft }]}>
          <Ionicons name="options-outline" size={18} color={timing ? C.indigo : C.text} />
        </Pressable>
      </View>

      {/* Segmented: Gigs | Jobs */}
      <View style={s.seg}>
        {[["gigs", "Gigs"], ["jobs", "Full-time & Part-time"]].map(([val, label]) => (
          <Pressable key={val} onPress={() => val === "jobs" ? router.push("/(tabs)/jobs/fulltime") : setSeg(val)} style={[s.segItem, seg === val && s.segOn]}>
            <Text style={[s.segTxt, seg === val && s.segTxtOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={C.text3} />
        <TextInput value={q} onChangeText={setQ} placeholder="Roles, businesses…" placeholderTextColor={C.text3} style={s.search} autoCapitalize="none" />
      </View>

      {/* Filters (timing) */}
      {showFilters ? (
        <View style={s.filterRow}>
          {TIMINGS.map((t) => (
            <Pressable key={t} onPress={() => setTiming(timing === t ? null : t)} style={[s.chip, timing === t && s.chipOn]}>
              <Text style={[s.chipTxt, timing === t && s.chipTxtOn]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Switch-zone banner */}
      {showSwitchBanner ? (
        <Pressable onPress={() => switchFeedZone(detectedZone)} style={s.banner}>
          <Ionicons name="navigate-circle-outline" size={16} color={C.indigo} />
          <Text style={s.bannerTxt}>You seem to be in {detectedZone}. Showing {feedZone} — <Text style={{ fontFamily: F.bold, color: C.indigo }}>tap to switch</Text></Text>
        </Pressable>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.indigo} />}>
        {!gigs ? <View style={{ gap: 10, marginTop: 8 }}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} height={62} />)}</View> : (
          <>
            <Text style={s.count}>{sorted.total} gigs · sorted by distance</Text>

            {/* Worth the travel */}
            {sorted.worthTravel.length ? (
              <View style={s.travelBox}>
                <View style={s.travelHead}>
                  <Ionicons name="flame" size={14} color={C.amber} />
                  <Text style={s.travelTitle}>Worth the travel</Text>
                </View>
                {sorted.worthTravel.map((g, i) => (
                  <FadeIn key={g.id} delay={i * 40}>
                    <GigRow gig={g} dist={g.dist} last={i === sorted.worthTravel.length - 1} onPress={() => router.push(`/(tabs)/jobs/${g.id}`)} onReport={() => promptReport("gig", g.id, () => gigsAPI.report(g.id))} />
                  </FadeIn>
                ))}
              </View>
            ) : null}

            {/* Tiers */}
            {sorted.tiers.map((tier) => (
              <View key={tier.label} style={{ marginTop: 18 }}>
                <Text style={s.tierLabel}>{tier.label}</Text>
                <View style={s.card}>
                  {tier.gigs.map((g, i) => (
                    <FadeIn key={g.id} delay={i * 30}>
                      <GigRow gig={g} dist={g.dist} last={i === tier.gigs.length - 1} onPress={() => router.push(`/(tabs)/jobs/${g.id}`)} onReport={() => promptReport("gig", g.id, () => gigsAPI.report(g.id))} />
                    </FadeIn>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FullTimeRedirect({ router }) {
  useEffect(() => { router.replace("/(tabs)/jobs/fulltime"); }, []);
  return <View style={{ flex: 1, backgroundColor: C.bg }} />;
}

const s = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 8 },
  title: { fontFamily: F.bold, fontSize: 18, color: C.text },
  filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  seg: { flexDirection: "row", gap: 6, paddingHorizontal: 18, marginBottom: 10 },
  segItem: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: C.surface2 },
  segOn: { backgroundColor: C.navy },
  segTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  segTxtOn: { color: "#fff" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 7, marginHorizontal: 18, backgroundColor: C.surface2, borderRadius: 10, paddingHorizontal: 12, height: 40 },
  search: { flex: 1, fontFamily: F.reg, fontSize: 13, color: C.text },
  filterRow: { flexDirection: "row", gap: 7, paddingHorizontal: 18, marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: C.surface2 },
  chipOn: { backgroundColor: C.navy },
  chipTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  chipTxtOn: { color: "#fff" },
  banner: { flexDirection: "row", alignItems: "center", gap: 7, marginHorizontal: 18, marginTop: 10, backgroundColor: C.indigoSoft, borderRadius: 10, padding: 10 },
  bannerTxt: { flex: 1, fontFamily: F.reg, fontSize: 12, color: C.text2, lineHeight: 17 },
  count: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 12, marginBottom: 4 },
  travelBox: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: "#F1E5C8", paddingHorizontal: 12, marginTop: 8 },
  travelHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 11, paddingBottom: 2 },
  travelTitle: { fontFamily: F.bold, fontSize: 12, color: C.amber, letterSpacing: 0.3 },
  tierLabel: { fontFamily: F.bold, fontSize: 13, color: C.text2, marginBottom: 8 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, paddingHorizontal: 12 },
});
