import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field } from "../../../components/ui";
import AreaPicker from "../../../components/AreaPicker";
import { useAuth } from "../../../lib/AuthContext";
import { C, F } from "../../../lib/theme";

export default function EditProfile() {
  const router = useRouter();
  const { user, update } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState(user?.skills || "");
  const [area, setArea] = useState(user?.area || "");
  const [insta, setInsta] = useState(user?.socials?.instagram || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await update({ name, phone, bio, skills, area, socials: { ...(user?.socials || {}), instagram: insta } });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>Edit profile</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 14 }}>
          <Field label="Full name" value={name} onChangeText={setName} />
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 ..." />
          <Field label="Bio" value={bio} onChangeText={setBio} multiline placeholder="A line about you" />
          <Field label="Skills" value={skills} onChangeText={setSkills} placeholder="e.g. Moving, Event setup" />
          <Field label="Instagram" value={insta} onChangeText={setInsta} autoCapitalize="none" placeholder="@handle" />
          <View>
            <Text style={s.lbl}>Area</Text>
            <AreaPicker value={area} onChange={setArea} height={200} />
          </View>
          <Button title={busy ? "Saving…" : "Save changes"} onPress={save} disabled={busy} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
});
