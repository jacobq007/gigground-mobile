import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { C, F } from "../../lib/theme";

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  const [type, setType] = useState("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name || !email || !password) { setErr("Please fill name, email and password"); return; }
    setErr(""); setBusy(true);
    // City + area are captured next, in the location onboarding step.
    try { await signup({ name, email, password, type }); router.replace("/(auth)/onboarding"); }
    catch (e) { setErr(e.message || "Could not create account"); setBusy(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
        <Ionicons name="arrow-back" size={22} color={C.navy} />
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Create your account</Text>
        <Text style={s.sub}>Tell us who you are to get started.</Text>

        <Text style={s.lbl}>I want to…</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[["user", "Find work", "search"], ["business", "Hire people", "briefcase-outline"]].map(([val, label, ic]) => {
            const on = type === val;
            return (
              <Pressable key={val} onPress={() => setType(val)} style={[s.role, on && s.roleOn]}>
                <Ionicons name={ic} size={20} color={on ? C.indigo : C.text2} />
                <Text style={[s.roleTxt, on && { color: C.indigo }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 14, marginTop: 18 }}>
          <Field label={type === "business" ? "Business name" : "Full name"} value={name} onChangeText={setName} placeholder={type === "business" ? "e.g. Studio K" : "e.g. Rahul Kumar"} />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Choose a password" secureTextEntry />
          {err ? <Text style={s.err}>{err}</Text> : null}
          <Button title={busy ? "Creating…" : "Continue"} onPress={submit} disabled={busy} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.bold, fontSize: 26, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 14, color: C.text2, marginTop: 6 },
  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginTop: 20, marginBottom: 8 },
  role: { flex: 1, alignItems: "center", gap: 7, paddingVertical: 16, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  roleOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  roleTxt: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  err: { fontFamily: F.med, fontSize: 12, color: C.red },
});
