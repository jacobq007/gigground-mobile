import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field } from "../../components/ui";
import AreaPicker from "../../components/AreaPicker";
import { useAuth } from "../../lib/AuthContext";
import { postsAPI } from "../../lib/api";
import { C, F } from "../../lib/theme";

const TYPES = [
  ["errand", "Errand", "walk"],
  ["info", "Info", "information-circle"],
  ["alert", "Alert", "warning"],
  ["rental", "Rental", "home"],
];

export default function NewPost() {
  const router = useRouter();
  const { user } = useAuth();
  const [type, setType] = useState("errand");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rent, setRent] = useState("");
  const [rentalType, setRentalType] = useState("Room");
  const [area, setArea] = useState(user?.area || "");
  const [busy, setBusy] = useState(false);

  const post = async () => {
    if (!title || !area) return;
    setBusy(true);
    await postsAPI.create({
      type, title, body, area, category: type,
      ...(type === "rental" ? { rent: parseInt(rent) || 0, rentalType } : {}),
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>New post</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={s.lbl}>Post type</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {TYPES.map(([v, label, ic]) => (
            <Pressable key={v} onPress={() => setType(v)} style={[s.type, type === v && s.typeOn]}>
              <Ionicons name={ic} size={18} color={type === v ? C.indigo : C.text2} />
              <Text style={[s.typeTxt, type === v && { color: C.indigo }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 14 }}>
          <Field label="Title" value={title} onChangeText={setTitle} placeholder={type === "rental" ? "e.g. 1BHK near metro" : "What's happening?"} />
          <Field label="Details" value={body} onChangeText={setBody} multiline placeholder="Add more context" />
          {type === "rental" ? (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}><Field label="Rent (₹/mo)" value={rent} onChangeText={setRent} keyboardType="number-pad" placeholder="10000" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.lbl}>Type</Text>
                <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
                  {["Room", "PG", "Apartment"].map((t) => (
                    <Pressable key={t} onPress={() => setRentalType(t)} style={[s.rt, rentalType === t && s.rtOn]}>
                      <Text style={[s.rtTxt, rentalType === t && { color: C.indigo }]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
          <View>
            <Text style={s.lbl}>Area</Text>
            <AreaPicker value={area} onChange={setArea} height={170} />
          </View>
          <Button title={busy ? "Posting…" : "Post to community"} onPress={post} disabled={busy || !title} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
  type: { flex: 1, alignItems: "center", gap: 5, paddingVertical: 12, borderRadius: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  typeOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  typeTxt: { fontFamily: F.med, fontSize: 11, color: C.text2 },
  rt: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  rtOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  rtTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
});
