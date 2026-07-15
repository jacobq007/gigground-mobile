import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

export default function Verify() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { user, update } = useAuth();
  const [uploaded, setUploaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const isHirer = user?.type === "business";

  const submit = async () => {
    setBusy(true);
    // Stub: no real ID check yet — flips the local verified flag for testing.
    await update(isHirer ? { isVerifiedHirer: true } : { isVerifiedWorker: true });
    setBusy(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>Get Verified</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text style={s.sub}>Verified {isHirer ? "hirers" : "workers"} get a badge that shows up on {isHirer ? "your job posts" : "your applications"}.</Text>

        <Pressable onPress={() => setUploaded(true)} style={[s.upload, uploaded && s.uploadDone]}>
          <Ionicons name={uploaded ? "checkmark-circle" : "cloud-upload-outline"} size={28} color={uploaded ? C.green : C.text3} />
          <Text style={s.uploadTxt}>{uploaded ? "ID photo attached" : "Upload a photo of your government ID"}</Text>
          <Text style={s.uploadSub}>Placeholder — no file is actually sent yet.</Text>
        </Pressable>

        <Button title={busy ? "Submitting…" : "Submit for verification"} onPress={submit} disabled={busy || !uploaded} style={{ marginTop: 20 }} />
        <Text style={s.note}>This is a test stub: submitting marks your account as verified immediately, with no real review.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 13, color: C.text2, lineHeight: 19, marginBottom: 20 },
  upload: { alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed", borderRadius: 14, paddingVertical: 32, paddingHorizontal: 20 },
  uploadDone: { borderColor: C.green, borderStyle: "solid", backgroundColor: C.greenSoft },
  uploadTxt: { fontFamily: F.bold, fontSize: 13, color: C.text, textAlign: "center" },
  uploadSub: { fontFamily: F.reg, fontSize: 11, color: C.text3, textAlign: "center" },
  note: { fontFamily: F.reg, fontSize: 11, color: C.text3, textAlign: "center", marginTop: 12, lineHeight: 16 },
});
