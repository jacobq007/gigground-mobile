import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Button, Toast } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

// Derive a stable, human-friendly code from the user's identity.
const codeFor = (user) => {
  const base = (user?.name || "GIG").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "GIG";
  const num = String((user?.id || "u0").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 1000).padStart(3, "0");
  return `${base}${num}`;
};

const COPY = {
  refer: {
    title: "Refer & earn",
    heading: "Give ₹100, get ₹100",
    body: "Share your code with a friend. When they finish their first gig, you both earn ₹100 in credits.",
    icon: "gift-outline",
    shareVerb: "Share invite",
    codeLabel: "Your referral code",
  },
  invite: {
    title: "Invite a worker",
    heading: "Bring someone to your gig",
    body: "Know someone reliable? Send them your invite. They'll skip the queue on gigs you post and you'll both be verified faster.",
    icon: "person-add-outline",
    shareVerb: "Send invite",
    codeLabel: "Your invite code",
  },
};

export default function Refer() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const { user } = useAuth();
  const [toast, setToast] = useState("");

  const c = COPY[mode === "invite" ? "invite" : "refer"];
  const code = codeFor(user);
  const link = `https://gigground.app/join?code=${code}`;
  const message = mode === "invite"
    ? `Join me on GigGround and pick up gigs near you. Use my invite ${code}: ${link}`
    : `I'm on GigGround — real gigs near you, get paid fast. Sign up with my code ${code} and we both earn ₹100: ${link}`;

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    setToast("Code copied");
  };
  const share = async () => {
    try {
      await Share.share({ message });
    } catch {
      await Clipboard.setStringAsync(message);
      setToast("Invite copied to clipboard");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.head}>
        <Text style={s.title}>{c.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.close}>
          <Ionicons name="close" size={20} color={C.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.heroIcon}><Ionicons name={c.icon} size={26} color={C.indigo} /></View>
          <Text style={s.heroHeading}>{c.heading}</Text>
          <Text style={s.heroBody}>{c.body}</Text>
        </View>

        <Text style={s.codeLabel}>{c.codeLabel}</Text>
        <Pressable onPress={copyCode} style={s.codeBox}>
          <Text style={s.code}>{code}</Text>
          <View style={s.copyBtn}>
            <Ionicons name="copy-outline" size={15} color={C.indigo} />
            <Text style={s.copyTxt}>Copy</Text>
          </View>
        </Pressable>

        <Text style={s.linkHint} numberOfLines={1}>{link}</Text>
      </ScrollView>

      <View style={s.footer}>
        <Button title={c.shareVerb} onPress={share} icon={<Ionicons name="share-social-outline" size={17} color="#fff" />} />
      </View>
      <Toast message={toast} visible={!!toast} />
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },
  title: { fontFamily: F.bold, fontSize: 19, color: C.text },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", backgroundColor: C.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, paddingVertical: 28, paddingHorizontal: 22, marginTop: 6, marginBottom: 24 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  heroHeading: { fontFamily: F.bold, fontSize: 18, color: C.text, textAlign: "center", marginBottom: 6 },
  heroBody: { fontFamily: F.reg, fontSize: 13, color: C.text2, textAlign: "center", lineHeight: 20 },
  codeLabel: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
  codeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, borderStyle: "dashed", paddingHorizontal: 18, paddingVertical: 16 },
  code: { fontFamily: F.bold, fontSize: 22, letterSpacing: 2, color: C.text },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.indigoSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  copyTxt: { fontFamily: F.bold, fontSize: 13, color: C.indigo },
  linkHint: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 12, textAlign: "center" },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, backgroundColor: C.bg },
});
