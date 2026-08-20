import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials } from "../../../components/ui";
import { useAuth } from "../../../lib/AuthContext";
import { useLocation } from "../../../lib/LocationContext";
import { useTheme, useC } from "../../../lib/ThemeContext";
import { useHomeVariant } from "../../../lib/HomeVariantContext";
import { kycAPI } from "../../../lib/api";
import { verifiedSkills, openToKeys, skillLabel, levelLabel } from "../../../lib/skills";
import { money } from "../../../lib/theme";
import { F } from "../../../lib/theme";

export default function Profile() {
  const router = useRouter();
  const { user, signout } = useAuth();
  const { homeZone } = useLocation();
  const { dark, toggle } = useTheme();
  const { variant, toggle: toggleHome } = useHomeVariant();
  const C = useC();
  const s = makeS(C);
  const [kyc, setKyc] = useState(user?.kyc_status || "unverified");

  useFocusEffect(useCallback(() => { (async () => setKyc((await kycAPI.getStatus()).status))(); }, []));

  const KYC_META = {
    unverified: { label: "Not verified", color: C.text3, bg: C.surface2 },
    pending:    { label: "Under review", color: C.amber, bg: dark ? "#3A2A10" : "#FEF3E2" },
    verified:   { label: "Verified", color: C.green, bg: C.greenSoft },
  };
  const initial = (user?.name || "U")[0].toUpperCase();
  const km = KYC_META[kyc] || KYC_META.unverified;

  const isHirer = user?.type === "business";
  const isVerified = isHirer ? user?.isVerifiedHirer : user?.isVerifiedWorker;
  const verifiedBadge = isVerified ? { label: "Verified", color: C.green, bg: C.greenSoft } : { label: "Not verified", color: C.text3, bg: C.surface2 };

  const MENU = [
    ["paper-plane-outline", "My applications", C.indigo, () => router.push("/(tabs)/profile/applications")],
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

        {/* Skills & credentials */}
        {!isHirer ? <SkillsSection user={user} onEdit={() => router.push("/modals/skills")} /> : null}

        {/* Appearance */}
        <View style={s.menu}>
          <View style={[s.row, s.rowBorder]}>
            <Ionicons name={dark ? "moon" : "moon-outline"} size={19} color={C.indigo} />
            <Text style={s.rowLabel}>Dark mode</Text>
            <Switch
              value={dark}
              onValueChange={toggle}
              trackColor={{ false: C.border, true: C.indigo }}
              thumbColor="#fff"
              ios_backgroundColor={C.border}
            />
          </View>
          {/* Both home designs stay shipped — flip between them any time. */}
          <View style={s.row}>
            <Ionicons name="grid-outline" size={19} color={C.indigo} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Shift board home</Text>
              <Text style={s.rowSub}>
                {variant === "shift" ? "New: committed day, go online, offers" : "Classic: the original hero home"}
              </Text>
            </View>
            <Switch
              value={variant === "shift"}
              onValueChange={toggleHome}
              trackColor={{ false: C.border, true: C.indigo }}
              thumbColor="#fff"
              ios_backgroundColor={C.border}
            />
          </View>
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

function SkillsSection({ user, onEdit }) {
  const C = useC();
  const sk = makeSk(C);
  const verified = verifiedSkills(user);
  const openTo = openToKeys(user);
  const empty = verified.length === 0 && openTo.length === 0;
  return (
    <View style={sk.card}>
      <View style={sk.head}>
        <Text style={sk.title}>Skills & credentials</Text>
        <Pressable onPress={onEdit} hitSlop={8} style={sk.editBtn}>
          <Ionicons name={empty ? "add" : "create-outline"} size={14} color={C.indigo} />
          <Text style={sk.editTxt}>{empty ? "Add" : "Edit"}</Text>
        </Pressable>
      </View>

      {empty ? (
        <Pressable onPress={onEdit} style={sk.emptyRow}>
          <Ionicons name="sparkles-outline" size={16} color={C.indigo} />
          <Text style={sk.emptyTxt}>Tell us what you can do — get matched to the right jobs.</Text>
        </Pressable>
      ) : (
        <>
          {verified.length > 0 ? (
            <View style={{ marginBottom: openTo.length ? 12 : 0 }}>
              <Text style={sk.subhead}><Ionicons name="shield-checkmark" size={11} color={C.indigo} /> Verified skills</Text>
              {verified.map((v) => (
                <View key={v.key} style={sk.vrow}>
                  <Text style={sk.vname}>{skillLabel(v.key)}</Text>
                  <View style={sk.vpill}><Text style={sk.vpillTxt}>{levelLabel(v.level)}{v.years ? ` · ${v.years} yr` : ""}</Text></View>
                </View>
              ))}
            </View>
          ) : null}
          {openTo.length > 0 ? (
            <View>
              <Text style={sk.subhead}>Open to (general gigs)</Text>
              <View style={sk.otWrap}>
                {openTo.map((k) => <View key={k} style={sk.otChip}><Text style={sk.otTxt}>{skillLabel(k)}</Text></View>)}
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const makeSk = (C) => StyleSheet.create({
  card: { backgroundColor: C.surface, marginHorizontal: 16, marginTop: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 14 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { fontFamily: F.bold, fontSize: 14, color: C.text },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  editTxt: { fontFamily: F.bold, fontSize: 12.5, color: C.indigo },
  emptyRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.indigoSoft, borderRadius: 11, padding: 12 },
  emptyTxt: { flex: 1, fontFamily: F.med, fontSize: 12.5, color: C.text2, lineHeight: 17 },
  subhead: { fontFamily: F.bold, fontSize: 11, color: C.text2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 },
  vrow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  vname: { fontFamily: F.bold, fontSize: 13, color: C.text },
  vpill: { backgroundColor: C.indigoSoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  vpillTxt: { fontFamily: F.bold, fontSize: 10.5, color: C.indigo },
  otWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  otChip: { backgroundColor: C.surface2, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 },
  otTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
});

const makeS = (C) => StyleSheet.create({
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
  rowSub: { fontFamily: F.reg, fontSize: 11.5, color: C.text2, marginTop: 1 },
  kycBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  kycTxt: { fontFamily: F.bold, fontSize: 10 },
  signout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 18 },
  signoutTxt: { fontFamily: F.med, fontSize: 14, color: C.red },
});
