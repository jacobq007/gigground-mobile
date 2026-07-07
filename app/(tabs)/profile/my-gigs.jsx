import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Pay, Skeleton, Empty, Button, Chip } from "../../../components/ui";
import { gigsAPI, applicantsAPI } from "../../../lib/api";
import { C, F } from "../../../lib/theme";

export default function MyGigs() {
  const router = useRouter();
  const [gigs, setGigs] = useState(null);

  useFocusEffect(useCallback(() => { (async () => {
    const mine = await gigsAPI.getMy();
    const withCounts = await Promise.all(mine.map(async (g) => ({ ...g, counts: await applicantsAPI.countForGig(g.id) })));
    setGigs(withCounts);
  })(); }, []));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={20} color={C.navy} /></Pressable>
        <Text style={s.h}>Gigs I posted</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {!gigs ? <Skeleton height={120} /> : gigs.length === 0 ? (
          <Empty
            icon={<Ionicons name="megaphone-outline" size={36} color={C.text3} />}
            title="You haven't posted a gig yet"
            subtitle="Post one and review applicants here — sorted by best fit, decided in seconds."
            action={<Button title="Post a gig" onPress={() => router.push("/modals/post-gig")} />}
          />
        ) : gigs.map((g) => (
          <Pressable key={g.id} onPress={() => router.push(`/(tabs)/profile/applicants?gigId=${g.id}`)} style={s.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <Initials text={g.initials} size={38} square bg={C.indigoSoft} color={C.indigo} />
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{g.title}</Text>
                <Text style={s.who}>{g.area} · posted {g.postedAgo}</Text>
              </View>
              <Pay amount={g.payAmount} unit={g.payUnit} size={13} />
            </View>
            <View style={s.foot}>
              {g.filled ? <Chip label="Filled" small /> : <Chip label={`${g.counts.open} awaiting reply`} tone={g.counts.open > 0 ? "amber" : "neutral"} small />}
              <Text style={s.applicants}>{g.counts.total} applicant{g.counts.total === 1 ? "" : "s"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginLeft: "auto" }}>
                <Text style={s.review}>Review</Text>
                <Ionicons name="chevron-forward" size={13} color={C.indigo} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 13, marginBottom: 11 },
  title: { fontFamily: F.bold, fontSize: 13, color: C.text },
  who: { fontFamily: F.reg, fontSize: 12, color: C.text2, marginTop: 2 },
  foot: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  applicants: { fontFamily: F.reg, fontSize: 12, color: C.text3 },
  review: { fontFamily: F.med, fontSize: 12, color: C.indigo },
});
