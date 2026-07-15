import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

export default function Login() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { signin } = useAuth();
  const [email, setEmail] = useState("rahul@test.com");
  const [password, setPassword] = useState("test123");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(""); setBusy(true);
    try { await signin({ email, password }); router.replace("/"); }
    catch (e) { setErr(e.message || "Could not sign in"); setBusy(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
        <Ionicons name="arrow-back" size={22} color={C.navy} />
      </Pressable>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, paddingHorizontal: 28 }}>
        <Text style={s.title}>Welcome back</Text>
        <Text style={s.sub}>Sign in to pick up where you left off.</Text>
        <View style={{ gap: 14, marginTop: 24 }}>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          {err ? <Text style={s.err}>{err}</Text> : null}
          <Button title={busy ? "Signing in…" : "Sign in"} onPress={submit} disabled={busy} style={{ marginTop: 4 }} />
        </View>
        <Pressable onPress={() => router.replace("/(auth)/signup")} style={{ marginTop: 18 }}>
          <Text style={s.alt}>New here? <Text style={{ color: C.indigo, fontFamily: F.bold }}>Create an account</Text></Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  title: { fontFamily: F.bold, fontSize: 26, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 14, color: C.text2, marginTop: 6 },
  err: { fontFamily: F.med, fontSize: 12, color: C.red },
  alt: { fontFamily: F.reg, fontSize: 13, color: C.text2, textAlign: "center" },
});
