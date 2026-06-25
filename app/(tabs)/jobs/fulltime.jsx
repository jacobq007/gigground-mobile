import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Pay, Chip, Skeleton, FadeIn } from "../../../components/ui";
import { gigsAPI } from "../../../lib/api";
import { C, F } from "../../../lib/theme";

export default function FullTime() {
  const router = useRouter();
  const [jobs, setJobs] = useState(null);
  useEffect(() => { (async () => setJobs(await gigsAPI.getBoard()))(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="arrow-back" size={20} color={C.navy} />
          <Text style={s.back}>Gigs</Text>
        </Pressable>
        <Text style={s.h}>Full-time & Part-time</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={s.sub}>Longer commitments from local businesses.</Text>
        {!jobs ? <View style={{ gap: 10, marginTop: 12 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={92} />)}</View> :
          jobs.map((j, i) => (
            <FadeIn key={j.id} delay={i * 50}>
              <View style={s.card}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 10 }}>
                  <Initials text={j.initials} size={40} square bg={C.navy} color="#818cf8" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>{j.title}</Text>
                    <Text style={s.who}>{j.who} · {j.area}</Text>
                  </View>
                  <Chip label={j.jobType} tone={j.jobType === "Full-time" ? "indigo" : "neutral"} />
                </View>
                <Text style={s.desc} numberOfLines={2}>{j.desc}</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <Pay amount={j.payAmount} unit={j.payUnit} size={15} />
                  <Text style={s.ago}>{j.postedAgo} ago</Text>
                </View>
              </View>
            </FadeIn>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  back: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  h: { fontFamily: F.bold, fontSize: 14, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 13, color: C.text2, marginBottom: 14 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 14, marginBottom: 12 },
  title: { fontFamily: F.bold, fontSize: 14, color: C.text },
  who: { fontFamily: F.reg, fontSize: 12, color: C.text2, marginTop: 2 },
  desc: { fontFamily: F.reg, fontSize: 13, color: C.text2, lineHeight: 19 },
  ago: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
});
