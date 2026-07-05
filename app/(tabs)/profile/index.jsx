import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials } from "../../../components/ui";
import { useAuth } from "../../../lib/AuthContext";
import { useLocation } from "../../../lib/LocationContext";
import { kycAPI } from "../../../lib/api";
import { money } from "../../../lib/theme";
import { C, F } from "../../../lib/theme";

const KYC_META = {
  unverified: { label: "Not verified", color: C.text3, bg: C.surface2 },
  pending:    { label: "Under review", color: C.amber, bg: "#FEF3E2" },
  verified:   { label: "Verified", color: C.green, bg: C.greenSoft },
};

export default function Profile() {
  const router = useRouter();
  const { user, signout } = useAuth();
  const { homeZone } = useLocation();
  const [kyc, setKyc] = useState(user?.kyc_status || "unverified");

  useFocusEffect(useCallback(() => { (async () => setKyc((await kycAPI.getStatus()).status))(); }, []));

  const initial = (user?.name || "U")[0].toUpperCase();
  const km = KYC_META[kyc] || KYC_META.unverified;

  const isHirer = user?.type === "business";
  const isVerified = isHirer ? user?.isVerifiedHirer : user?.isVerifiedWorker;
  const verifiedBadge = isVerified ? { label: "Verified", color: C.green, bg: C.greenSoft } : { label: "Not verified", color: C.text3, bg: C.surface2 };

  const MENU = [
    ["grid-outline", "Dashboard", C.indigo, () => router.push("/(tabs)/profile/dashboard")],
    ["briefcase-outline", "My posted gigs", C.indigo, () => router.push("/(tabs)/profile/my-gigs")],
    ["shield-checkmark-outline", "KYC verification", C.text2, () => router.push("/(tabs)/profile/kyc"), km],
    ["ribbon-outline", "Get Verified", C.text2, () => router.push("/modals/verify"), verifiedBadge],
    ["wallet-outline", "Payments", C.green, null],
    ["star-outline", "Reviews", C.text2, null],
    ["create-outline", "Edit profile", C.text2, () => router.push("/(tabs)/profile/edit")],
    ["settings-outline", "Settings", C.text2, null],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.navy }} edges={["top"]}>
      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Navy header */}
        <View style={s.header}>
          <Initials text={initial} size={56} bg={C.indigo} color="#fff" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
            <Text style={s.name}>{user?.name}</Text>
            {kyc === "verified" ? <Ionicons name="checkmark-circle" size={16} color="#4ade80" /> : null}
          </View>
          <Text style={s.loc}>{user?.area || homeZone}, {user?.city || "Chennai"}</Text>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          {[[user?.gigsDone ?? 0, "Gigs"], [user?.rating ?? "—", "Rating"], [money(user?.earned ?? 0), "Earned", true]].map(([v, l, green], i) => (
            <View key={l} style={[s.stat, i < 2 && s.statBorder]}>
              <Text style={[s.statV, green && { color: C.green }]}>{v}</Text>
              <Text style={s.statL}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={s.menu}>
          {MENU.map(([ic, label, color, go, badge], i) => (
            <Pressable key={label} onPress={go || (() => {})} style={[s.row, i < MENU.length - 1 && s.rowBorder]}>
              <Ionicons name={ic} size={19} color={color} />
              <Text style={s.rowLabel}>{label}</Text>
              {badge ? <View style={[s.kycBadge, { backgroundColor: badge.bg }]}><Text style={[s.kycTxt, { color: badge.color }]}>{badge.label}</Text></View> : null}
              <Ionicons name="chevron-forward" size={16} color={C.text3} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={async () => { await signout(); router.replace("/(auth)/welcome"); }} style={s.signout}>
          <Ionicons name="log-out-outline" size={18} color={C.red} />
          <Text style={s.signoutTxt}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.navy, alignItems: "center", paddingTop: 6, paddingBottom: 22 },
  name: { fontFamily: F.bold, fontSize: 17, color: "#fff" },
  loc: { fontFamily: F.reg, fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 },
  stats: { flexDirection: "row", backgroundColor: C.surface, marginHorizontal: 18, marginTop: -16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: C.border },
  statV: { fontFamily: F.bold, fontSize: 16, color: C.text },
  statL: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 2 },
  menu: { backgroundColor: C.surface, marginHorizontal: 18, marginTop: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, paddingHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  rowLabel: { fontFamily: F.med, fontSize: 14, color: C.text, flex: 1 },
  kycBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  kycTxt: { fontFamily: F.bold, fontSize: 10 },
  signout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 18 },
  signoutTxt: { fontFamily: F.med, fontSize: 14, color: C.red },
});
