import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Pay, Skeleton, FadeIn, Empty } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { gigsAPI, notificationsAPI, applicationsAPI, applicantsAPI } from "../../lib/api";
import { sortGigsByZone } from "../../lib/gigSort";
import { C, FJ, money } from "../../lib/theme";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

// ── V2 · Working (indigo) design tokens ───────────────────────────────────────
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

// ── V2H · Hiring (plum/magenta) design tokens ─────────────────────────────────
// See design/hiring-mode-design-spec.md — proud/rich hiring identity, distinct
// from indigo (working), green (money), and the amber/red alert colors.
const V2H = {
  accent: "#B02A86",
  accentDark: "#7A1C68",
  accentMid: "#9D2478",
  accentLight: "#D6499A",
  badgeBg: "#FBE7F3",
  badgeText: "#9D2478",
  heroStart: "#7A1C68",
  heroEnd: "#34092F",
  heroHighlight: "#F5A8D8",
  bg: "#F3EAF0",
};

const WEEKLY_GOAL = 5000;
const STEP_INDEX = { applied: 1, confirmed: 2, in_shift: 3, done: 4 };

// FAB action sets — never mixed. Every action routes to a real screen.
const WORK_FAB = [
  { label: "Set availability", icon: "calendar", color: "#241EAA", route: "/modals/availability" },
  { label: "Quick apply", icon: "flash", color: "#3A30D6", route: "/(tabs)/jobs" },
  { label: "Refer & earn", icon: "people", color: "#5F52F5", route: "/modals/refer" },
];
const HIRE_FAB = [
  { label: "Post a gig", icon: "add-circle", color: "#7A1C68", route: "/modals/post-gig" },
  { label: "Boost a gig", icon: "rocket", color: "#B02A86", route: "/modals/boost" },
  { label: "Invite a worker", icon: "person-add", color: "#D6499A", route: "/modals/refer?mode=invite" },
];
const FAB_OFFSETS = [68, 136, 204];

// ── Count-up number (hero figures) ────────────────────────────────────────────
function useCountUp(target, deps) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let timer;
    const start = Date.now();
    const dur = 700;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) timer = setTimeout(tick, 20);
    };
    tick();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return val;
}

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

// ── Active gig card (worker) ──────────────────────────────────────────────────
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
  const [mode, setMode] = useState("working"); // "working" | "hiring"
  const [gigs, setGigs] = useState(null);
  const [apps, setApps] = useState([]);
  const [myGigs, setMyGigs] = useState(null);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [trackW, setTrackW] = useState(0);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;
  const fabAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const contentAnim = useRef(new Animated.Value(1)).current;
  const segAnim = useRef(new Animated.Value(0)).current; // 0 = working, 1 = hiring

  const isWorking = mode === "working";
  const T = isWorking ? V2 : V2H;

  const load = useCallback(async () => {
    const [g, u, a, mine] = await Promise.all([
      gigsAPI.getAll(), notificationsAPI.unreadCount(), applicationsAPI.getMy(), gigsAPI.getMy(),
    ]);
    setGigs(g); setUnread(u); setApps(a); setMyGigs(mine);
    const entries = await Promise.all(mine.map(async (gig) => [gig.id, (await applicantsAPI.getForGig(gig.id)).length]));
    setApplicantCounts(Object.fromEntries(entries));
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { applicationsAPI.getMy().then(setApps); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const switchMode = (next) => {
    if (next === mode) return;
    setFabOpen(false);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.spring(fabRotate, { toValue: 0, useNativeDriver: true, friction: 7, tension: 80 }),
      Animated.timing(contentAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.spring(segAnim, { toValue: next === "hiring" ? 1 : 0, useNativeDriver: true, friction: 9, tension: 70 }),
    ]).start(() => {
      setMode(next);
      Animated.timing(contentAnim, { toValue: 1, duration: 190, useNativeDriver: true }).start();
    });
  };

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
  const fabActions = isWorking ? WORK_FAB : HIRE_FAB;
  const handleFabAction = (i) => {
    toggleFab();
    router.push(fabActions[i].route);
  };

  const firstName = (user?.name || "there").split(" ")[0];
  const zone = feedZone || "Chennai";

  // Worker-side derived data
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

  // Hirer-side derived data
  const postedGigs = myGigs || [];
  const newApplicants = postedGigs.reduce((sum, g) => sum + (applicantCounts[g.id] || 0), 0);
  const committedPay = postedGigs.reduce((sum, g) => sum + (g.payAmount || 0), 0);

  const earnCount = useCountUp(potentialToday, [mode, potentialToday]);
  const applicantsCount = useCountUp(newApplicants, [mode, newApplicants]);

  const thumbTranslate = segAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, trackW / 2 - 4)] });
  const fabGrad = isWorking ? [V2.accentLight, V2.accentMid] : [V2H.accentLight, V2H.accentDark];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={["top"]}>
      {/* Header */}
      <View style={[s.nav, { backgroundColor: T.bg }]}>
        <Text style={s.logo}><Text style={{ color: T.accent }}>Gig</Text><Text style={{ color: T.accentDark }}>Ground</Text></Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => router.push("/(tabs)/jobs")} style={s.iconBtn}>
            <Ionicons name="search" size={15} color="#5A5F66" />
          </Pressable>
          <Pressable onPress={() => router.push("/modals/notifications")} style={s.iconBtn}>
            <Ionicons name="notifications-outline" size={15} color="#5A5F66" />
            {unread > 0 ? <View style={s.notifDot} /> : null}
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/profile")} style={s.locPill}>
            <Ionicons name="location-sharp" size={10} color={T.accent} />
            <Text style={s.locTxt}>{zone}</Text>
            <Ionicons name="chevron-down" size={9} color="#8A8F98" />
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/profile")} style={[s.avatar, { backgroundColor: T.accent }]}>
            <Text style={s.avatarTxt}>{firstName[0]?.toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      {/* Persistent Working / Hiring switch */}
      <View style={[s.segWrap, { backgroundColor: T.bg }]}>
        <View style={s.segTrack} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
          <Animated.View style={[s.segThumb, { width: trackW ? trackW / 2 - 4 : "48%", transform: [{ translateX: thumbTranslate }] }]} />
          <Pressable style={s.segBtn} onPress={() => switchMode("working")}>
            <Ionicons name="briefcase" size={14} color={isWorking ? V2.accent : "#8A8F98"} />
            <Text style={[s.segTxt, { color: isWorking ? V2.accent : "#8A8F98" }]}>Working</Text>
          </Pressable>
          <Pressable style={s.segBtn} onPress={() => switchMode("hiring")}>
            <Ionicons name="megaphone" size={14} color={!isWorking ? V2H.accent : "#8A8F98"} />
            <Text style={[s.segTxt, { color: !isWorking ? V2H.accent : "#8A8F98" }]}>Hiring</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}>

          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <Text style={s.greet}>{greeting()}, {firstName} 👋</Text>

            {isWorking ? (
              /* ══════════════ WORKING ══════════════ */
              <>
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
                    <Text style={s.heroAmount}>{money(earnCount)}</Text>
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}>
                        <Text style={s.progressLabel}>{money(weeklyEarned)} earned this week</Text>
                        <Text style={s.progressLabel}>Goal {money(WEEKLY_GOAL)}</Text>
                      </View>
                      <View style={s.progressTrack}><View style={[s.progressFill, { width: `${progressPct}%` }]} /></View>
                    </View>
                    <Pressable onPress={() => router.push("/(tabs)/jobs")} style={s.heroCta}>
                      <Text style={[s.heroCtaTxt, { color: V2.heroStart }]}>Find gigs now →</Text>
                    </Pressable>
                  </View>
                </LinearGradient>

                {/* Live gigs banner + functional Map button */}
                <View style={s.liveBanner}>
                  <Pressable onPress={() => router.push("/(tabs)/jobs")} style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <PulseDot color={V2.accent} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.liveTitle}>{nearCount} gigs live near you</Text>
                      <Text style={s.liveSub} numberOfLines={1}>
                        {priceRange ? `₹${priceRange.min} – ₹${priceRange.max}` : "No gigs yet"} · nearby
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => router.push("/modals/gigs-map")} style={s.mapBtn}>
                    <Ionicons name="map-outline" size={13} color={V2.accent} />
                    <Text style={s.mapBtnTxt}>Map</Text>
                  </Pressable>
                </View>

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
              </>
            ) : (
              /* ══════════════ HIRING ══════════════ */
              <>
                <LinearGradient colors={[V2H.heroStart, V2H.heroEnd]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={s.hero}>
                  <View style={s.ring1} pointerEvents="none" />
                  <View style={s.ring2} pointerEvents="none" />
                  <View>
                    <View style={s.heroTop}>
                      <Text style={s.heroLabel}>Your gigs have</Text>
                      <View style={s.streakPill}>
                        <Ionicons name="ribbon" size={13} color={V2H.heroHighlight} />
                        <Text style={s.streakTxt}>Trusted hirer</Text>
                      </View>
                    </View>
                    <Text style={s.heroAmount}>
                      <Text style={{ color: V2H.heroHighlight }}>{applicantsCount}</Text>
                      <Text style={{ fontSize: 24 }}> new applicants</Text>
                    </Text>
                    <Text style={[s.progressLabel, { marginBottom: 16 }]}>
                      {postedGigs.length} active post{postedGigs.length === 1 ? "" : "s"} · fill them before the weekend
                    </Text>
                    <Pressable onPress={() => router.push("/(tabs)/profile/my-gigs")} style={s.heroCta}>
                      <Text style={[s.heroCtaTxt, { color: V2H.heroStart }]}>Review applicants →</Text>
                    </Pressable>
                  </View>
                </LinearGradient>

                {/* Hirer live banner */}
                <View style={s.liveBanner}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <PulseDot color={V2H.accentLight} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.liveTitle}>42 workers active near {zone}</Text>
                      <Text style={s.liveSub} numberOfLines={1}>Good time to post</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => router.push("/modals/post-gig")} style={[s.mapBtn, { backgroundColor: V2H.accent }]}>
                    <Ionicons name="add" size={15} color="#fff" />
                    <Text style={[s.mapBtnTxt, { color: "#fff" }]}>Post</Text>
                  </Pressable>
                </View>

                {/* Stat strip */}
                <View style={s.statRow}>
                  <View style={s.statCard}>
                    <Text style={s.statNum}>{postedGigs.length}</Text>
                    <Text style={s.statLabel}>Active gigs</Text>
                  </View>
                  <View style={s.statCard}>
                    <Text style={[s.statNum, { color: V2H.accent }]}>{newApplicants}</Text>
                    <Text style={s.statLabel}>New applicants</Text>
                  </View>
                  <View style={s.statCard}>
                    <Text style={[s.statNum, { color: C.green }]}>{money(committedPay)}</Text>
                    <Text style={s.statLabel}>Committed pay</Text>
                  </View>
                </View>

                <FadeIn delay={120}>
                  <View style={{ marginTop: 22 }}>
                    <View style={s.sectionHead}>
                      <Text style={s.sectionTitle}>Your posted gigs</Text>
                      <Pressable onPress={() => router.push("/(tabs)/profile/my-gigs")}><Text style={[s.sectionLink, { color: V2H.accent }]}>Manage ›</Text></Pressable>
                    </View>
                    {!myGigs ? (
                      <><Skeleton height={70} style={{ marginBottom: 8, borderRadius: 16 }} /><Skeleton height={70} style={{ borderRadius: 16 }} /></>
                    ) : postedGigs.length === 0 ? (
                      <View style={s.emptyWrap}>
                        <Empty
                          icon={<Ionicons name="megaphone-outline" size={30} color={V2H.accent} />}
                          title="No posted gigs yet"
                          subtitle="Post your first gig and reach workers nearby in minutes."
                          action={
                            <Pressable onPress={() => router.push("/modals/post-gig")} style={s.emptyCta}>
                              <Ionicons name="add" size={16} color="#fff" />
                              <Text style={s.emptyCtaTxt}>Post a gig</Text>
                            </Pressable>
                          }
                        />
                      </View>
                    ) : postedGigs.map((g, i) => (
                      <FadeIn key={g.id} delay={i * 40}>
                        <Pressable onPress={() => router.push("/(tabs)/profile/my-gigs")} style={s.nearbyCard}>
                          <Initials text={g.initials} size={44} square bg={V2H.accentMid} color="#fff" />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={s.nearbyTitle} numberOfLines={1}>{g.title}</Text>
                            <Text style={s.nearbyMeta} numberOfLines={1}>Posted {g.postedAgo || "recently"} · {g.area}</Text>
                          </View>
                          <View style={[s.appliedBadge, { backgroundColor: V2H.badgeBg }]}>
                            <Text style={[s.appliedTxt, { color: V2H.badgeText }]}>{applicantCounts[g.id] || 0} applied</Text>
                          </View>
                        </Pressable>
                      </FadeIn>
                    ))}
                  </View>
                </FadeIn>
              </>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* FAB speed dial */}
      <Animated.View pointerEvents={fabOpen ? "auto" : "none"} style={[StyleSheet.absoluteFill, { opacity: backdropAnim }]}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={toggleFab} />
      </Animated.View>

      {fabActions.map((action, i) => {
        const anim = fabAnims[i];
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -FAB_OFFSETS[i]] });
        return (
          <Animated.View key={action.label} pointerEvents={fabOpen ? "auto" : "none"} style={[s.fabAction, { opacity: anim, transform: [{ translateY }] }]}>
            <Pressable onPress={() => handleFabAction(i)} accessibilityRole="button" accessibilityLabel={action.label} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={s.fabLabelPill}><Text style={s.fabLabelTxt}>{action.label}</Text></View>
              <View style={[s.fabCircle, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={22} color="#fff" />
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      <View style={s.fabMainWrap}>
        <Pressable onPress={toggleFab} accessibilityRole="button" accessibilityLabel={fabOpen ? "Close quick actions" : "Open quick actions"}>
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
              <LinearGradient colors={fabGrad} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={s.fabFill}>
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
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.04)" },
  logo: { fontFamily: FJ.xbold, fontSize: 22, letterSpacing: -0.6 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  notifDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: V2.notifDot, borderWidth: 1.5, borderColor: V2.bg },
  locPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  locTxt: { fontFamily: FJ.bold, fontSize: 12, color: "#18181B" },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontFamily: FJ.xbold, fontSize: 14 },

  // Segmented Working/Hiring control
  segWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  segTrack: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 999, padding: 4, position: "relative", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  segThumb: { position: "absolute", top: 4, bottom: 4, left: 4, borderRadius: 999, backgroundColor: "#F2F1FA" },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, zIndex: 1 },
  segTxt: { fontFamily: FJ.bold, fontSize: 13.5 },

  greet: { fontFamily: FJ.med, fontSize: 14, color: V2.textSecondary, marginBottom: 16, marginTop: 4 },

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
  heroCtaTxt: { fontFamily: FJ.xbold, fontSize: 15 },

  liveBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: V2.surfaceDark, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 15 },
  liveTitle: { color: "#fff", fontFamily: FJ.bold, fontSize: 15, letterSpacing: -0.2 },
  liveSub: { color: "#8A8F98", fontFamily: FJ.med, fontSize: 12, marginTop: 2 },
  mapBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9, marginLeft: 8 },
  mapBtnTxt: { fontFamily: FJ.bold, fontSize: 13, color: "#18181B" },

  statRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  statNum: { fontFamily: FJ.xbold, fontSize: 20, color: V2.textPrimary, letterSpacing: -0.4 },
  statLabel: { fontFamily: FJ.med, fontSize: 10.5, color: V2.textSecondary, marginTop: 3 },

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
  appliedBadge: { borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6 },
  appliedTxt: { fontFamily: FJ.bold, fontSize: 12 },

  emptyWrap: { backgroundColor: "#fff", borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  emptyCta: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: V2H.accent, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  emptyCtaTxt: { fontFamily: FJ.bold, fontSize: 14, color: "#fff" },

  fabAction: { position: "absolute", right: 20, bottom: 24, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 102 },
  fabLabelPill: { backgroundColor: "#fff", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 22, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  fabLabelTxt: { fontFamily: FJ.bold, fontSize: 13, color: "#18181B" },
  fabCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", shadowColor: "#3820C8", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  fabMainWrap: { position: "absolute", bottom: 24, right: 20, zIndex: 103 },
  fabMain: { width: 58, height: 58, borderRadius: 29, shadowColor: "#3214C8", shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  fabFill: { flex: 1, borderRadius: 29, alignItems: "center", justifyContent: "center" },
});
