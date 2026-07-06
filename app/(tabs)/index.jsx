import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Animated, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Pay, Skeleton, FadeIn } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { gigsAPI, notificationsAPI, applicationsAPI } from "../../lib/api";
import { sortGigsByZone } from "../../lib/gigSort";
import { C, FJ, money } from "../../lib/theme";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

// ── V2 · Indigo design tokens (home screen redesign) ──────────────────────────
const V2 = {
  accent: "#5F52F5",
  accentDark: "#2E27B8",
  accentMid: "#3830D0",
  accentLight: "#7068F0",
  badgeBg: "#E8E6FD",
  badgeText: "#2320A8",
  heroStart: "#1A1690",
  heroEnd: "#0D0B5E",
  bg: "#ECEEF2",
  surfaceDark: "#1A1D22",
  urgentBg: "#FFF0E0",
  urgentText: "#B85E10",
  notifDot: "#D94F2B",
  textPrimary: "#111316",
  textSecondary: "#757B84",
  textTertiary: "#929AA3",
};

const WEEKLY_GOAL = 5000;
const STEP_INDEX = { applied: 1, confirmed: 2, in_shift: 3, done: 4 };
const FAB_ACTIONS = [
  { label: "Set availability", icon: "calendar", color: "#241EAA" },
  { label: "Quick apply", icon: "flash", color: "#3A30D6" },
  { label: "Refer & earn", icon: "people", color: "#5F52F5" },
];
const FAB_OFFSETS = [68, 136, 204];

// ── Pulsing live dot ──────────────────────────────────────────────────────────
function PulseDot({ color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
      Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ width: 12, height: 12 }}>
      <Animated.View style={{ position: "absolute", inset: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: color, opacity: op, transform: [{ scale }] }} />
      <View style={{ position: "absolute", top: 2, left: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

// ── Active gig card ────────────────────────────────────────────────────────────
function ActiveGigCard({ app, onPress }) {
  const step = STEP_INDEX[app.status] || 1;
  const pct = Math.round((step / 4) * 100);
  const label = app.status === "in_shift" ? "In shift" : "Confirmed";
  return (
    <Pressable onPress={onPress} style={s.activeCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Initials text={app.initials} size={46} square bg={C.navy} color="#fff" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.activeTitle}>{app.gigTitle}</Text>
          <Text style={s.activeSub}>{app.who} · {app.area}</Text>
        </View>
        <View style={s.confirmedBadge}><Text style={s.confirmedBadgeTxt}>{label}</Text></View>
      </View>
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={s.shiftLabel}>Shift progress</Text>
          <Text style={s.shiftPct}>{pct}% done</Text>
        </View>
        <View style={s.shiftTrack}>
          <LinearGradient colors={[V2.accentDark, V2.accentLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.shiftFill, { width: `${pct}%` }]} />
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={s.statusDot} />
          <Text style={s.statusTxt}>In progress</Text>
        </View>
        <Text style={s.openTxt}>Open gig ›</Text>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { feedZone } = useLocation();
  const [gigs, setGigs] = useState(null);
  const [apps, setApps] = useState([]);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;
  const fabAnims = useRef(FAB_ACTIONS.map(() => new Animated.Value(0))).current;

  const load = useCallback(async () => {
    const [g, u, a] = await Promise.all([gigsAPI.getAll(), notificationsAPI.unreadCount(), applicationsAPI.getMy()]);
    setGigs(g); setUnread(u); setApps(a);
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { applicationsAPI.getMy().then(setApps); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggleFab = () => {
    const opening = !fabOpen;
    setFabOpen(opening);
    Animated.timing(backdropAnim, { toValue: opening ? 1 : 0, duration: 260, useNativeDriver: true }).start();
    Animated.spring(fabRotate, { toValue: opening ? 1 : 0, useNativeDriver: true, friction: 7, tension: 80 }).start();
    fabAnims.forEach((v, i) => {
      const delay = opening ? [0, 70, 140][i] : [80, 40, 0][i];
      Animated.spring(v, { toValue: opening ? 1 : 0, delay, useNativeDriver: true, friction: 7, tension: 70 }).start();
    });
  };
  const handleFabAction = (i) => {
    toggleFab();
    if (i === 0) Alert.alert("Set availability", "Coming soon — for now, keep your profile up to date.");
    else if (i === 1) router.push("/(tabs)/jobs");
    else Alert.alert("Refer & earn", "Referral rewards are coming soon!");
  };

  const firstName = (user?.name || "there").split(" ")[0];
  const zone = feedZone || "Chennai";
  const sorted = gigs ? sortGigsByZone(gigs, feedZone) : null;
  const nearGigs = sorted ? [...(sorted.tiers[0]?.gigs || []), ...(sorted.tiers[1]?.gigs || [])] : [];
  const nearCount = nearGigs.length;
  const preview = sorted ? [...(sorted.worthTravel || []), ...sorted.tiers.flatMap((t) => t.gigs)].slice(0, 3) : [];
  const priceRange = nearGigs.length ? { min: Math.min(...nearGigs.map((g) => g.payAmount)), max: Math.max(...nearGigs.map((g) => g.payAmount)) } : null;

  const activeApps = apps.filter((a) => a.status === "confirmed" || a.status === "in_shift");
  const doneApps = apps.filter((a) => a.status === "done");
  const weeklyEarned = doneApps.reduce((sum, a) => sum + (a.payUnit === "hr" ? a.payAmount * 5 : a.payAmount), 0);
  const progressPct = Math.min(100, Math.round((weeklyEarned / WEEKLY_GOAL) * 100));
  const potentialToday = preview.reduce((sum, g) => sum + g.payAmount, 0);
  const streak = Math.max(1, Math.min(user?.gigsDone || 1, 7));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: V2.bg }} edges={["top"]}>
      {/* Header */}
      <View style={s.nav}>
        <Text style={s.logo}><Text style={{ color: V2.accent }}>Gig</Text><Text style={{ color: V2.accentDark }}>Ground</Text></Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => router.push("/(tabs)/jobs")} style={s.iconBtn}>
            <Ionicons name="search" size={15} color="#5A5F66" />
          </Pressable>
          <Pressable onPress={() => router.push("/modals/notifications")} style={s.iconBtn}>
            <Ionicons name="notifications-outline" size={15} color="#5A5F66" />
            {unread > 0 ? <View style={s.notifDot} /> : null}
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/profile")} style={s.locPill}>
            <Ionicons name="location-sharp" size={10} color={V2.accent} />
            <Text style={s.locTxt}>{zone}</Text>
            <Ionicons name="chevron-down" size={9} color="#8A8F98" />
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/profile")} style={s.avatar}>
            <Text style={s.avatarTxt}>{firstName[0]?.toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={V2.accent} />}>

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <FadeIn>
            <Text style={s.greet}>{greeting()}, {firstName} 👋</Text>

            {/* Earnings hero card */}
            <LinearGradient colors={[V2.heroStart, V2.heroEnd]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={s.hero}>
              <View style={s.ring1} pointerEvents="none" />
              <View style={s.ring2} pointerEvents="none" />
              <View>
                <View style={s.heroTop}>
                  <Text style={s.heroLabel}>You could earn today</Text>
                  <View style={s.streakPill}>
                    <Text style={{ fontSize: 12, lineHeight: 14 }}>🔥</Text>
                    <Text style={s.streakTxt}>{streak}-day streak</Text>
                  </View>
                </View>
                <Text style={s.heroAmount}>{money(potentialToday)}</Text>
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}>
                    <Text style={s.progressLabel}>{money(weeklyEarned)} earned this week</Text>
                    <Text style={s.progressLabel}>Goal {money(WEEKLY_GOAL)}</Text>
                  </View>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${progressPct}%` }]} />
                  </View>
                </View>
                <Pressable onPress={() => router.push("/(tabs)/jobs")} style={s.heroCta}>
                  <Text style={s.heroCtaTxt}>Find gigs now →</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {/* Live gigs banner */}
            <Pressable onPress={() => router.push("/(tabs)/jobs")} style={s.liveBanner}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <PulseDot color={V2.accent} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.liveTitle}>{nearCount} gigs live near you</Text>
                  <Text style={s.liveSub} numberOfLines={1}>
                    {priceRange ? `₹${priceRange.min} – ₹${priceRange.max}` : "No gigs yet"} · nearby
                  </Text>
                </View>
              </View>
              <View style={s.mapBtn}>
                <Ionicons name="map-outline" size={13} color={V2.accent} />
                <Text style={s.mapBtnTxt}>Map</Text>
              </View>
            </Pressable>
          </FadeIn>

          {/* Active gigs */}
          {activeApps.length > 0 ? (
            <FadeIn delay={80}>
              <View style={{ marginBottom: 22, marginTop: 22 }}>
                <View style={s.sectionHead}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={s.sectionTitle}>Active gigs</Text>
                    <View style={s.countBadge}><Text style={s.countBadgeTxt}>{activeApps.length}</Text></View>
                  </View>
                  <Pressable onPress={() => router.push("/(tabs)/dashboard")}><Text style={s.sectionLink}>Dashboard ›</Text></Pressable>
                </View>
                {activeApps.map((a) => (
                  <ActiveGigCard key={a.id} app={a} onPress={() => router.push(`/modals/active-gig?id=${a.id}`)} />
                ))}
              </View>
            </FadeIn>
          ) : null}

          {/* Nearby gigs */}
          <FadeIn delay={140}>
            <View style={{ marginTop: activeApps.length > 0 ? 0 : 22 }}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Nearby gigs</Text>
                <Pressable onPress={() => router.push("/(tabs)/jobs")}><Text style={s.sectionLink}>See all ›</Text></Pressable>
              </View>
              {!gigs ? (
                <><Skeleton height={70} style={{ marginBottom: 8, borderRadius: 16 }} /><Skeleton height={70} style={{ marginBottom: 8, borderRadius: 16 }} /><Skeleton height={70} style={{ borderRadius: 16 }} /></>
              ) : preview.map((g, i) => (
                <FadeIn key={g.id} delay={i * 40}>
                  <Pressable onPress={() => router.push(`/(tabs)/jobs/${g.id}`)} style={s.nearbyCard}>
                    <Initials text={g.initials} size={44} square bg={g.who?.startsWith("Self") ? V2.accentDark : C.navy} color="#fff" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={s.nearbyTitle} numberOfLines={1}>{g.title}</Text>
                        {g.urgent ? <View style={s.urgentBadge}><Text style={s.urgentTxt}>Urgent</Text></View> : null}
                      </View>
                      <Text style={s.nearbyMeta} numberOfLines={1}>{g.who} · {g.area}</Text>
                      <Text style={s.nearbyDate}>{g.timing || g.hrs}</Text>
                    </View>
                    <Pay amount={g.payAmount} unit={g.payUnit} size={17} />
                  </Pressable>
                </FadeIn>
              ))}
            </View>
          </FadeIn>
        </View>
      </ScrollView>

      {/* FAB speed dial */}
      <Animated.View pointerEvents={fabOpen ? "auto" : "none"} style={[StyleSheet.absoluteFill, { opacity: backdropAnim }]}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={toggleFab} />
      </Animated.View>

      {FAB_ACTIONS.map((action, i) => {
        const anim = fabAnims[i];
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -FAB_OFFSETS[i]] });
        return (
          <Animated.View key={action.label} pointerEvents={fabOpen ? "auto" : "none"} style={[s.fabAction, { opacity: anim, transform: [{ translateY }] }]}>
            <View style={s.fabLabelPill}><Text style={s.fabLabelTxt}>{action.label}</Text></View>
            <Pressable onPress={() => handleFabAction(i)} style={[s.fabCircle, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon} size={22} color="#fff" />
            </Pressable>
          </Animated.View>
        );
      })}

      <View style={s.fabMainWrap}>
        <Pressable onPress={toggleFab}>
          <Animated.View style={[s.fabMain, {
            transform: [
              { rotate: fabRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) },
              { scale: fabRotate.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) },
            ],
          }]}>
            {fabOpen ? (
              <View style={[s.fabFill, { backgroundColor: V2.surfaceDark }]}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
            ) : (
              <LinearGradient colors={[V2.accentLight, V2.accentMid]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={s.fabFill}>
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8, backgroundColor: V2.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.04)" },
  logo: { fontFamily: FJ.xbold, fontSize: 22, letterSpacing: -0.6 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  notifDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: V2.notifDot, borderWidth: 1.5, borderColor: V2.bg },
  locPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  locTxt: { fontFamily: FJ.bold, fontSize: 12, color: "#18181B" },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: V2.accent, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontFamily: FJ.xbold, fontSize: 14 },

  greet: { fontFamily: FJ.med, fontSize: 14, color: V2.textSecondary, marginBottom: 16 },

  hero: { borderRadius: 24, padding: 22, marginBottom: 14, overflow: "hidden" },
  ring1: { position: "absolute", right: -44, top: -44, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  ring2: { position: "absolute", right: -68, top: -68, width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  heroLabel: { color: "rgba(255,255,255,0.62)", fontFamily: FJ.med, fontSize: 13 },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.13)", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  streakTxt: { color: "#fff", fontFamily: FJ.bold, fontSize: 12 },
  heroAmount: { fontFamily: FJ.xbold, fontSize: 46, color: "#fff", letterSpacing: -2, lineHeight: 50, marginBottom: 18 },
  progressLabel: { color: "rgba(255,255,255,0.52)", fontFamily: FJ.med, fontSize: 11 },
  progressTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 2 },
  heroCta: { width: "100%", paddingVertical: 15, backgroundColor: "#fff", borderRadius: 14, alignItems: "center" },
  heroCtaTxt: { fontFamily: FJ.xbold, fontSize: 15, color: V2.heroStart },

  liveBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: V2.surfaceDark, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 15, marginBottom: 0 },
  liveTitle: { color: "#fff", fontFamily: FJ.bold, fontSize: 15, letterSpacing: -0.2 },
  liveSub: { color: "#8A8F98", fontFamily: FJ.med, fontSize: 12, marginTop: 2 },
  mapBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9, marginLeft: 8 },
  mapBtnTxt: { fontFamily: FJ.bold, fontSize: 13, color: "#18181B" },

  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: FJ.xbold, fontSize: 15, color: V2.textPrimary, letterSpacing: -0.3 },
  sectionLink: { fontFamily: FJ.sbold, fontSize: 13, color: V2.accent },
  countBadge: { backgroundColor: V2.badgeBg, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeTxt: { color: V2.badgeText, fontFamily: FJ.xbold, fontSize: 12 },

  activeCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  activeTitle: { fontFamily: FJ.bold, fontSize: 15, color: V2.textPrimary, letterSpacing: -0.2 },
  activeSub: { fontFamily: FJ.reg, fontSize: 12, color: "#757B84", marginTop: 2 },
  confirmedBadge: { backgroundColor: V2.badgeBg, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6 },
  confirmedBadgeTxt: { color: V2.badgeText, fontFamily: FJ.bold, fontSize: 12 },
  shiftLabel: { fontFamily: FJ.med, fontSize: 11, color: "#757B84" },
  shiftPct: { fontFamily: FJ.bold, fontSize: 11, color: V2.accent },
  shiftTrack: { height: 5, backgroundColor: "#EDEDF0", borderRadius: 3, overflow: "hidden" },
  shiftFill: { height: "100%", borderRadius: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: V2.accent },
  statusTxt: { fontFamily: FJ.sbold, fontSize: 12, color: V2.accent },
  openTxt: { fontFamily: FJ.bold, fontSize: 12, color: V2.accent },

  nearbyCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  nearbyTitle: { fontFamily: FJ.bold, fontSize: 14, color: V2.textPrimary, flexShrink: 1 },
  nearbyMeta: { fontFamily: FJ.reg, fontSize: 12, color: "#757B84", marginTop: 1 },
  nearbyDate: { fontFamily: FJ.reg, fontSize: 11, color: "#929AA3", marginTop: 2 },
  urgentBadge: { backgroundColor: V2.urgentBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  urgentTxt: { color: V2.urgentText, fontFamily: FJ.xbold, fontSize: 10, letterSpacing: 0.2, textTransform: "uppercase" },

  fabAction: { position: "absolute", right: 20, bottom: 24, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 102 },
  fabLabelPill: { backgroundColor: "#fff", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 22, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  fabLabelTxt: { fontFamily: FJ.bold, fontSize: 13, color: "#18181B" },
  fabCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", shadowColor: "#3820C8", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  fabMainWrap: { position: "absolute", bottom: 24, right: 20, zIndex: 103 },
  fabMain: { width: 58, height: 58, borderRadius: 29, shadowColor: "#3214C8", shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  fabFill: { flex: 1, borderRadius: 29, alignItems: "center", justifyContent: "center" },
});
