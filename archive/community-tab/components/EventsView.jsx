import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Alert } from "react-native";
import { Skeleton, FadeIn } from "./ui";
import EventCard from "./EventCard";
import { eventsAPI, EVENT_CATEGORIES, getRsvp } from "../lib/eventsData";
import { C, F } from "../lib/theme";

const SEGMENTS = [["in-person", "In-person"], ["virtual", "Virtual"], ["agenda", "My agenda"]];

export default function EventsView() {
  const router = useRouter();
  const [events, setEvents] = useState(null);
  const [seg, setSeg] = useState("in-person");
  const [cat, setCat] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => { setEvents(await eventsAPI.getAll()); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const shown = (events || []).filter((e) => {
    if (seg === "agenda") { if (!getRsvp(e.id)) return false; }
    else if (e.type !== seg) return false;
    if (cat !== "all" && e.category !== cat) return false;
    return true;
  });

  const viewGig = (e) => {
    if (e.helperGigId) router.push(`/(tabs)/jobs/${e.helperGigId}`);
    else Alert.alert("Event helpers", "This event isn't hiring helpers right now.");
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Segments */}
      <View style={s.segRow}>
        {SEGMENTS.map(([v, label]) => (
          <Pressable key={v} onPress={() => setSeg(v)} style={[s.segBtn, seg === v && s.segOn]}>
            <Text style={[s.segTxt, seg === v && s.segTxtOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Category chips */}
      <View style={{ flexShrink: 0, flexGrow: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
          <Pressable onPress={() => setCat("all")} style={[s.cat, cat === "all" && s.catOn]}>
            <Text style={[s.catTxt, cat === "all" && s.catTxtOn]}>All</Text>
          </Pressable>
          {EVENT_CATEGORIES.map((c) => (
            <Pressable key={c.id} onPress={() => setCat(c.id)} style={[s.cat, cat === c.id && s.catOn]}>
              <Text style={[s.catTxt, cat === c.id && s.catTxtOn]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.indigo} />}
      >
        {!events ? (
          <View style={{ gap: 10, marginTop: 8 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={150} />)}</View>
        ) : shown.length === 0 ? (
          <Text style={s.empty}>
            {seg === "agenda" ? "You haven't saved any events yet.\nTap Going or Interested on an event." : "No events here yet."}
          </Text>
        ) : (
          shown.map((e, i) => (
            <FadeIn key={e.id} delay={i * 40}>
              <EventCard event={e} onPress={() => router.push(`/(tabs)/community/event/${e.id}`)} onViewGig={() => viewGig(e)} />
            </FadeIn>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  segRow: { flexDirection: "row", gap: 7, paddingHorizontal: 18, paddingBottom: 10 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  segOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  segTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  segTxtOn: { fontFamily: F.bold, color: "#fff" },
  cats: { gap: 7, paddingHorizontal: 18, paddingBottom: 10, alignItems: "center" },
  cat: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  catOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  catTxt: { fontFamily: F.med, fontSize: 11, color: C.text2 },
  catTxtOn: { fontFamily: F.bold, color: C.indigo },
  empty: { fontFamily: F.reg, fontSize: 14, color: C.text3, textAlign: "center", marginTop: 50, lineHeight: 21 },
});
