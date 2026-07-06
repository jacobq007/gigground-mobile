import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Chip, Skeleton, FadeIn } from "../../../components/ui";
import RentalCard from "../../../components/RentalCard";
import RentalMap from "../../../components/RentalMap";
import RentalFilterSheet, { EMPTY_RENTAL_FILTERS, matchRental, countRentalFilters } from "../../../components/RentalFilterSheet";
import EventsView from "../../../components/EventsView";
import { postsAPI } from "../../../lib/api";
import { promptReport } from "../../../lib/report";
import { C, F } from "../../../lib/theme";

const TYPE_META = {
  errand: { label: "Errand", tone: "indigo" },
  info:   { label: "Info",   tone: "neutral" },
  alert:  { label: "Alert",  tone: "red" },
  rental: { label: "Rental", tone: "amber" },
};
const FILTERS = [["events","Events"],["rental","Rentals"],["buzz","Buzz"]];
const BUZZ_TYPES = ["errand", "info", "alert"];

export default function Community() {
  const router = useRouter();
  const [posts, setPosts] = useState(null);
  const [filter, setFilter] = useState("events");
  const [viewMode, setViewMode] = useState("list"); // "list" | "map"
  const [refreshing, setRefreshing] = useState(false);
  const [rentalFilters, setRentalFilters] = useState(EMPTY_RENTAL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const load = useCallback(async () => { setPosts(await postsAPI.getAll()); }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const shown = (posts || [])
    .filter((p) => (filter === "buzz" ? BUZZ_TYPES.includes(p.type) : p.type === filter))
    .filter((p) => p.type !== "rental" || matchRental(p, rentalFilters));
  const rentalPosts = (posts || []).filter((p) => p.type === "rental" && matchRental(p, rentalFilters));
  const activeFilterCount = countRentalFilters(rentalFilters);

  const handlePost = () => {
    if (filter === "events") { router.push("/modals/new-event"); return; }
    router.push(filter === "rental" ? "/modals/new-rental" : "/modals/new-post");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View style={s.head}>
        <Text style={s.title}>Community</Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {filter === "rental" && (
            <View style={s.toggle}>
              <Pressable onPress={() => setViewMode("list")} style={[s.tBtn, viewMode === "list" && s.tBtnOn]}>
                <Ionicons name="list" size={15} color={viewMode === "list" ? C.indigo : C.text2} />
              </Pressable>
              <Pressable onPress={() => setViewMode("map")} style={[s.tBtn, viewMode === "map" && s.tBtnOn]}>
                <Ionicons name="map-outline" size={15} color={viewMode === "map" ? C.indigo : C.text2} />
              </Pressable>
            </View>
          )}
          <Pressable onPress={handlePost} style={s.newBtn}>
            <Ionicons name={filter === "events" ? "add" : "create-outline"} size={16} color="#fff" />
            <Text style={s.newTxt}>{filter === "events" ? "Create" : filter === "rental" ? "List" : "Post"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter chips */}
      <View style={s.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {FILTERS.map(([val, label]) => (
          <Pressable key={val} onPress={() => { setFilter(val); setViewMode("list"); }} style={[s.chip, filter === val && s.chipOn]}>
            <Text style={[s.chipTxt, filter === val && s.chipTxtOn]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      </View>

      {/* Rental quick-filters + full filter button */}
      {filter === "rental" && (
        <View style={s.rentalBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, alignItems: "center", paddingRight: 8 }}>
            {[[1, "1 BHK"], [2, "2 BHK"], [3, "3 BHK"]].map(([v, label]) => {
              const on = rentalFilters.bhk.includes(v);
              return (
                <Pressable key={v} onPress={() => setRentalFilters((f) => ({ ...f, bhk: on ? f.bhk.filter((x) => x !== v) : [...f.bhk, v] }))} style={[s.qchip, on && s.qchipOn]}>
                  <Text style={[s.qchipTxt, on && s.qchipTxtOn]}>{label}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => setRentalFilters((f) => ({ ...f, verifiedOnly: !f.verifiedOnly }))} style={[s.qchip, rentalFilters.verifiedOnly && s.qchipOn]}>
              <Text style={[s.qchipTxt, rentalFilters.verifiedOnly && s.qchipTxtOn]}>Verified</Text>
            </Pressable>
          </ScrollView>
          <Pressable onPress={() => setFilterOpen(true)} style={s.filterBtn}>
            <Ionicons name="options-outline" size={18} color={C.indigo} />
            {activeFilterCount > 0 ? <View style={s.filterBadge}><Text style={s.filterBadgeTxt}>{activeFilterCount}</Text></View> : null}
          </Pressable>
        </View>
      )}

      {/* Events tab */}
      {filter === "events" ? (
        <EventsView />
      ) : filter === "rental" && viewMode === "map" ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 32 }}>
          {posts ? (
            <>
              <RentalMap rentals={rentalPosts} height={380} />
              <Text style={s.mapHint}>
                {rentalPosts.length} rental{rentalPosts.length !== 1 ? "s" : ""} · tap a pin to view
              </Text>
            </>
          ) : (
            <Skeleton height={380} />
          )}
        </ScrollView>
      ) : (
        /* List view */
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.indigo} />}
        >
          {!posts ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height={filter === "rental" ? 220 : 110} />)}
            </View>
          ) : shown.length === 0 ? (
            filter === "rental" && activeFilterCount > 0 ? (
              <View style={{ alignItems: "center" }}>
                <Text style={s.empty}>No rentals match your filters.</Text>
                <Pressable onPress={() => setRentalFilters(EMPTY_RENTAL_FILTERS)} style={s.clearBtn}>
                  <Text style={s.clearTxt}>Clear filters</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={s.empty}>Nothing here yet.</Text>
            )
          ) : (
            shown.map((p, i) => {
              if (p.type === "rental") {
                return (
                  <FadeIn key={p.id} delay={i * 40}>
                    <RentalCard rental={p} onPress={() => router.push(`/(tabs)/community/${p.id}`)} />
                  </FadeIn>
                );
              }
              const meta = TYPE_META[p.type];
              return (
                <FadeIn key={p.id} delay={i * 40}>
                  <Pressable onPress={() => router.push(`/(tabs)/community/${p.id}`)} style={s.card}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 8 }}>
                      <Initials text={p.initials} size={28} bg={C.surface2} color={C.text2} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.author}>{p.authorName}</Text>
                        <Text style={s.sub}>{p.area} · {p.postedAgo} ago</Text>
                      </View>
                      <Chip label={meta.label} tone={meta.tone} small />
                    </View>
                    <Text style={s.postTitle}>{p.title}</Text>
                    <Text style={s.postBody} numberOfLines={2}>{p.body}</Text>
                    <View style={s.footer}>
                      <View style={s.foot}><Ionicons name="arrow-up" size={14} color={C.text3} /><Text style={s.footTxt}>{p.votes}</Text></View>
                      <View style={s.foot}><Ionicons name="chatbubble-outline" size={13} color={C.text3} /><Text style={s.footTxt}>{p.comments.length}</Text></View>
                      <Pressable onPress={() => promptReport("post", p.id)} style={s.foot} hitSlop={8}>
                        <Ionicons name="flag-outline" size={13} color={C.text3} />
                      </Pressable>
                    </View>
                  </Pressable>
                </FadeIn>
              );
            })
          )}
        </ScrollView>
      )}

      <RentalFilterSheet
        visible={filterOpen}
        value={rentalFilters}
        rentals={(posts || []).filter((p) => p.type === "rental")}
        onApply={setRentalFilters}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 8 },
  title: { fontFamily: F.bold, fontSize: 18, color: C.text },
  toggle: { flexDirection: "row", backgroundColor: C.surface2, borderRadius: 8, padding: 2 },
  tBtn: { padding: 6, borderRadius: 6 },
  tBtnOn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.indigo, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99 },
  newTxt: { fontFamily: F.bold, fontSize: 12, color: "#fff" },
  filterBar: { flexShrink: 0, flexGrow: 0 },
  filters: { gap: 7, paddingHorizontal: 18, paddingVertical: 8, alignItems: "center" },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99, backgroundColor: C.surface2 },
  chipOn: { backgroundColor: C.navy },
  chipTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  chipTxtOn: { color: "#fff" },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 13, marginBottom: 11 },
  author: { fontFamily: F.bold, fontSize: 12, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 1 },
  postTitle: { fontFamily: F.bold, fontSize: 14, color: C.text, marginBottom: 3 },
  postBody: { fontFamily: F.reg, fontSize: 13, color: C.text2, lineHeight: 19 },
  footer: { flexDirection: "row", gap: 16, marginTop: 11, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  foot: { flexDirection: "row", alignItems: "center", gap: 4 },
  footTxt: { fontFamily: F.med, fontSize: 12, color: C.text3 },
  mapHint: { fontFamily: F.reg, fontSize: 12, color: C.text3, textAlign: "center", marginTop: 10 },
  empty: { fontFamily: F.reg, fontSize: 14, color: C.text3, textAlign: "center", marginTop: 40 },
  rentalBar: { flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 12, paddingBottom: 8, gap: 8 },
  qchip: { flexShrink: 0, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, backgroundColor: C.surface },
  qchipOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  qchipTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  qchipTxtOn: { fontFamily: F.bold, color: C.indigo },
  filterBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.indigoSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: C.indigo, alignItems: "center", justifyContent: "center" },
  filterBadge: { position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 99, backgroundColor: C.indigo, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.bg },
  filterBadgeTxt: { fontFamily: F.bold, fontSize: 9, color: "#fff" },
  clearBtn: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  clearTxt: { fontFamily: F.med, fontSize: 13, color: C.indigo },
});
