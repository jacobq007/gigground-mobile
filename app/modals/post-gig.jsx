import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field } from "../../components/ui";
import AreaPicker from "../../components/AreaPicker";
import { useAuth } from "../../lib/AuthContext";
import { gigsAPI } from "../../lib/api";
import { C, F } from "../../lib/theme";

export default function PostGig() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [pay, setPay] = useState("");
  const [unit, setUnit] = useState("hr");
  const [hrs, setHrs] = useState("");
  const [area, setArea] = useState(user?.area || "");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async () => {
    if (!title || !pay || !area) return;
    setBusy(true);
    await gigsAPI.create({
      title, who: user?.name || "You", initials: (user?.name || "Y").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      area, payAmount: parseInt(pay) || 0, payUnit: unit, type: "ONE TIME", gigSubType: "quick",
      urgent: false, hrs: hrs || "Flexible", timing: "This week", category: "General", desc, postedAgo: "now",
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>Post a gig</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 14 }}>
          <Field label="What do you need?" value={title} onChangeText={setTitle} placeholder="e.g. Help moving furniture" />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Pay (₹)" value={pay} onChangeText={setPay} keyboardType="number-pad" placeholder="600" /></View>
            <View style={{ width: 130 }}>
              <Text style={s.lbl}>Per</Text>
              <View style={{ flexDirection: "row", gap: 5 }}>
                {[["hr", "Hour"], ["day", "Day"], ["fixed", "Job"]].map(([v, l]) => (
                  <Pressable key={v} onPress={() => setUnit(v)} style={[s.unit, unit === v && s.unitOn]}>
                    <Text style={[s.unitTxt, unit === v && { color: C.indigo }]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          <Field label="Duration" value={hrs} onChangeText={setHrs} placeholder="e.g. 4 hrs" />
          <Field label="Description" value={desc} onChangeText={setDesc} multiline placeholder="Details workers should know" />
          <View>
            <Text style={s.lbl}>Area</Text>
            <AreaPicker value={area} onChange={setArea} height={180} />
          </View>
          <Button title={busy ? "Posting…" : "Post gig"} onPress={post} disabled={busy || !title || !pay} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
  unit: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  unitOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  unitTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
});
