import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../lib/AuthContext";
import { useC } from "../../../lib/ThemeContext";
import { applicationsAPI, kycAPI } from "../../../lib/api";
import { FJ, FS, money } from "../../../lib/theme";

// ── The worker's record ───────────────────────────────────────────────────────
// The proof ladder turned inside out: not a fraud check, but the thing the
// worker accumulates and can take with them. The income statement leads on
// purpose — a gig worker usually cannot prove earnings to a landlord or a
// lender, and cash earned off-platform is invisible to both. Everything on this
// screen is derived from real data; nothing is scored or invented.

const NAVY_A = "#0E0E63";
const NAVY_B = "#090037";
const MINT = "#37D59F";
const ACCENT = "#3C6AE2";

export default function Record() {
  const router = useRouter();
  const { user } = useAuth();
  const C = useC();
  const s = makeStyles(C);

  const [apps, setApps] = useState([]);
  const [kyc, setKyc] = useState(user?.kyc_status || "unverified");

  useFocusEffect(useCallback(() => {
    applicationsAPI.getMy().then(setApps);
    (async () => setKyc((await kycAPI.getStatus()).status))();
  }, []));

  const name = user?.name || "You";
  const area = user?.area || "Chennai";
  const completed = user?.gigsDone || 0;
  const earned = user?.earned || 0;
  const rating = user?.rating;

  // Where you've worked — grouped from real applications, most recent first.
  const byEmployer = {};
  apps.forEach((a) => {
    if (a.status === "declined" || a.status === "expired" || a.status === "withdrawn") return;
    const k = a.who || "Unknown";
    if (!byEmployer[k]) byEmployer[k] = { who: k, initials: a.initials, area: a.area, count: 0, last: a.appliedAgo };
    byEmployer[k].count += 1;
  });
  const employers = Object.values(byEmployer).sort((x, y) => y.count - x.count);
  const rebookers = employers.filter((e) => e.count >= 2).length;

  const verified = kyc === "verified";
  const canDownload = completed > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </Pressable>
        <Text style={s.headerTitle}>Your record</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, paddingTop: 4, paddingBottom: 40 }}>
        {/* Summary */}
        <LinearGradient colors={[NAVY_A, NAVY_B]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
          <View style={s.heroRing} pointerEvents="none" />
          <Text style={s.heroLabel}>{name} · {area}</Text>
          <View style={s.heroRow}>
            <Text style={s.heroNum}>{completed}</Text>
            <Text style={s.heroNumLabel}>shift{completed === 1 ? "" : "s"} completed</Text>
          </View>
          <View style={s.heroStats}>
            {rating ? (
              <View>
                <Text style={s.statV}>{rating}★</Text>
                <Text style={s.statK}>Rating</Text>
              </View>
            ) : null}
            <View>
              <Text style={s.statV}>{rebookers}</Text>
              <Text style={s.statK}>Rebooked by</Text>
            </View>
            <View>
              <Text style={[s.statV, { color: MINT }]}>{money(earned)}</Text>
              <Text style={s.statK}>Earned here</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Income statement — the reason this screen exists */}
        <View style={[s.card, s.cardGreen]}>
          <View style={s.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.cardTitle}>Verified income statement</Text>
              <Text style={s.cardSub}>{completed} shift{completed === 1 ? "" : "s"}, confirmed by GigGround</Text>
            </View>
            <Text style={s.bigMoney}>{money(earned)}</Text>
          </View>
          <Text style={s.cardBody}>
            Landlords and lenders accept a platform statement as proof of income. Cash you earn off GigGround
            cannot be shown to anyone.
          </Text>
          <Pressable
            style={[s.btn, !canDownload && s.btnDisabled]}
            disabled={!canDownload}
            onPress={() => router.push("/modals/verify")}
          >
            <Ionicons name="download-outline" size={15} color="#fff" />
            <Text style={s.btnTxt}>{canDownload ? "Download statement" : "Complete a shift to unlock"}</Text>
          </Pressable>
        </View>

        {/* Verification — priced in the work it opens up */}
        <Text style={s.section}>Verified</Text>
        <View style={s.card}>
          <View style={s.chipWrap}>
            <Chip s={s} on={verified} label="Aadhaar" />
            <Chip s={s} on={!!user?.isVerifiedWorker} label="Selfie match" />
            <Chip s={s} on={!!area} label="Address" />
          </View>
          {!verified ? (
            <>
              <Text style={s.cardBody}>
                <Text style={s.strong}>ID verification opens higher-paying work.</Text> Verified workers can take
                in-home and cash-handling gigs, which pay more than open-street jobs.
              </Text>
              <Pressable style={s.btn} onPress={() => router.push("/(tabs)/profile/kyc")}>
                <Ionicons name="shield-checkmark-outline" size={15} color="#fff" />
                <Text style={s.btnTxt}>Start verification</Text>
              </Pressable>
            </>
          ) : (
            <Text style={s.cardBody}>You are fully verified. Hirers filter for this.</Text>
          )}
        </View>

        {/* Where you've worked */}
        <Text style={s.section}>Where you have worked</Text>
        {employers.length === 0 ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Nothing here yet</Text>
            <Text style={s.cardBody}>Finish your first shift and the business shows up here for good.</Text>
          </View>
        ) : (
          employers.map((e) => (
            <View key={e.who} style={s.card}>
              <View style={s.row}>
                <View style={s.avatar}><Text style={s.avatarTxt}>{e.initials || e.who.slice(0, 2).toUpperCase()}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{e.who}</Text>
                  <Text style={s.cardSub}>{e.count} shift{e.count === 1 ? "" : "s"}{e.area ? ` · ${e.area}` : ""}</Text>
                </View>
                {e.count >= 2 ? (
                  <View style={s.okChip}><Text style={s.okChipTxt}>Rebooks you</Text></View>
                ) : null}
              </View>
            </View>
          ))
        )}

        {/* Portability is the point */}
        <Pressable style={[s.card, s.cardCentre]} onPress={() => router.push("/modals/refer")}>
          <Text style={s.linkTxt}>Share record as PDF</Text>
          <Text style={s.cardSub}>Works outside GigGround too</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ s, on, label }) {
  return (
    <View style={[s.chip, on ? s.chipOn : s.chipOff]}>
      <Text style={[s.chipTxt, on ? s.chipTxtOn : s.chipTxtOff]}>{on ? `✓ ${label}` : label}</Text>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  back: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: FJ.xbold, fontSize: 17, color: C.text, letterSpacing: -0.3 },

  hero: { borderRadius: 20, padding: 18, marginBottom: 10, overflow: "hidden" },
  heroRing: { position: "absolute", right: -44, top: -44, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  heroLabel: { color: "rgba(255,255,255,0.65)", fontFamily: FJ.med, fontSize: 12.5 },
  heroRow: { flexDirection: "row", alignItems: "baseline", gap: 9, marginTop: 4 },
  heroNum: { fontFamily: FS.bold, fontSize: 32, color: MINT, letterSpacing: -1 },
  heroNumLabel: { fontFamily: FJ.sbold, fontSize: 12.5, color: "rgba(255,255,255,0.7)" },
  heroStats: { flexDirection: "row", gap: 20, marginTop: 14 },
  statV: { fontFamily: FS.bold, fontSize: 15, color: "#fff" },
  statK: { fontFamily: FJ.med, fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 },

  card: { backgroundColor: C.surface, borderRadius: 15, padding: 14, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  cardGreen: { borderLeftWidth: 3, borderLeftColor: C.green },
  cardCentre: { alignItems: "center" },
  cardTitle: { fontFamily: FJ.bold, fontSize: 13.5, color: C.text },
  cardSub: { fontFamily: FJ.med, fontSize: 11, color: C.text2, marginTop: 2 },
  cardBody: { fontFamily: FJ.reg, fontSize: 12.5, color: C.text2, marginTop: 9, lineHeight: 18 },
  strong: { fontFamily: FJ.bold, color: C.text },
  row: { flexDirection: "row", alignItems: "center", gap: 11 },
  bigMoney: { fontFamily: FS.bold, fontSize: 19, color: C.green, letterSpacing: -0.4 },

  section: { fontFamily: FJ.xbold, fontSize: 14, color: C.text, marginTop: 14, marginBottom: 8, letterSpacing: -0.2 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  chipOn: { backgroundColor: C.greenSoft },
  chipOff: { backgroundColor: C.surface2 },
  chipTxt: { fontFamily: FJ.bold, fontSize: 10.5 },
  chipTxtOn: { color: C.green },
  chipTxtOff: { color: C.text3 },

  avatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontFamily: FJ.bold, fontSize: 11, color: C.indigo },
  okChip: { backgroundColor: C.greenSoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  okChipTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: C.green },

  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: ACCENT, borderRadius: 11, paddingVertical: 11, marginTop: 11 },
  btnDisabled: { opacity: 0.45 },
  btnTxt: { fontFamily: FJ.bold, fontSize: 12.5, color: "#fff" },
  linkTxt: { fontFamily: FJ.bold, fontSize: 12.5, color: ACCENT },
});
