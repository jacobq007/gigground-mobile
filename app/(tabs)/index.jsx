import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton, FadeIn, Empty } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { useMode } from "../../lib/ModeContext";
import { useC } from "../../lib/ThemeContext";
import { gigsAPI, notificationsAPI, applicationsAPI, applicantsAPI, matchesAPI } from "../../lib/api";
import { sortGigsByZone } from "../../lib/gigSort";
import { FJ, FS, money } from "../../lib/theme";

// ── Design tokens (exact OKLCH → hex from the home-redesign reference) ─────────
const WORK = {
  accent: "#3C6AE2", heroA: "#0E0E63", heroB: "#090037", heroNum: "#37D59F",
  track: "#172259", bell: "#EBB353", badgeBg: "#D8E8FF", badgeTx: "#0B288E",
  statBg: "#E9EBF1", avatar: "#1D223C", pageBg: "#F0F2F6",
  fab: ["#3C6AE2", "#293295"],
  actions: [
    { label: "Set availability", icon: "calendar", color: "#2B2D89", route: "/modals/availability" },
    { label: "Quick apply", icon: "flash", color: "#364AB5", route: "/(tabs)/jobs" },
    { label: "Refer & earn", icon: "people", color: "#3C6AE2", route: "/modals/refer" },
  ],
};
const HIRE = {
  accent: "#AD248C", heroA: "#3B002D", heroB: "#1B0016", heroNum: "#FB72C6",
  track: "#39072C", bell: "#D861AA", badgeBg: "#FFD5EE", badgeTx: "#780053",
  statBg: "#EFE4EB", avatar: "#751E5F", pageBg: "#F3ECF1",
  fab: ["#BB3398", "#740063"],
  actions: [
    { label: "Invite a worker", icon: "person-add", color: "#74065C", route: "/modals/refer?mode=invite" },
    { label: "Boost a gig", icon: "rocket", color: "#981E87", route: "/modals/boost" },
    { label: "Post a gig", icon: "add", color: "#BD3DA8", route: "/modals/post-gig" },
  ],
};
const CO = { heading: "#0B0D12", muted: "#66696F", pay: "#15803D", liveDot: "#33A340", flame: "#F3821D", unread: "#E62B34" };
const FAB_OFFSETS = [68, 136, 204];

// ── Count-up figure (mount + tab-switch), ease-out-cubic ──────────────────────
function useCountUp(target, deps) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let timer;
    const start = Date.now();
    const dur = 800;
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

// ── Pulsing live dot (2s loop) ────────────────────────────────────────────────
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
    <View style={{ width: 10, height: 10 }}>
      <Animated.View style={{ position: "absolute", inset: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: op, transform: [{ scale }] }} />
      <View style={{ position: "absolute", top: 2, left: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

// ── Streak flame with flicker loop (SVG icon, no emoji) ───────────────────────
function FlameIcon() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-3deg"] });
  return (
    <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
      <Ionicons name="flame" size={13} color={CO.flame} />
    </Animated.View>
  );
}

function StreakPill({ streak, best, s }) {
  return (
    <View style={s.streakPill}>
      <FlameIcon />
      <Text style={s.streakTxt}>{streak}-day streak</Text>
      <Text style={s.streakBest}>· best is {best} days</Text>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { feedZone } = useLocation();
  const { mode, setMode } = useMode();
  const [gigs, setGigs] = useState(null);
  const [apps, setApps] = useState([]);
  const [myGigs, setMyGigs] = useState(null);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [matchCount, setMatchCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [trackW, setTrackW] = useState(0);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;
  const fabAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const contentAnim = useRef(new Animated.Value(1)).current;
  const segAnim = useRef(new Animated.Value(mode === "hiring" ? 1 : 0)).current;

  const isWorking = mode === "working";
  const T = isWorking ? WORK : HIRE;
  const C = useC();
  const s = makeStyles(C);
  const pageBg = C.dark ? C.bg : T.pageBg;
  const statBg = C.dark ? C.surface2 : T.statBg;

  const load = useCallback(async () => {
    const [g, u, a, mine, mc] = await Promise.all([
      gigsAPI.getAll(), notificationsAPI.unreadCount(), applicationsAPI.getMy(), gigsAPI.getMy(), matchesAPI.countForMe(),
    ]);
    setGigs(g); setUnread(u); setApps(a); setMyGigs(mine); setMatchCount(mc);
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
      Animated.timing(contentAnim, { toValue: 0, duration: 190, useNativeDriver: true }),
      Animated.spring(segAnim, { toValue: next === "hiring" ? 1 : 0, useNativeDriver: true, bounciness: 12, speed: 12 }),
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
  const handleFabAction = (i) => { toggleFab(); router.push(T.actions[i].route); };

  const name = user?.name || "there";
  const firstName = name.split(" ")[0];
  const zone = feedZone || "Chennai";

  // Worker data
  const sorted = gigs ? sortGigsByZone(gigs, feedZone) : null;
  const nearGigs = sorted ? [...(sorted.tiers[0]?.gigs || []), ...(sorted.tiers[1]?.gigs || [])] : [];
  const nearCount = nearGigs.length;
  const preview = sorted ? [...(sorted.worthTravel || []), ...sorted.tiers.flatMap((t) => t.gigs)].slice(0, 3) : [];
  const potentialToday = preview.reduce((sum, g) => sum + g.payAmount, 0);
  const streak = Math.max(1, Math.min(user?.gigsDone || 4, 11));
  const bestStreak = Math.max(11, streak);

  // Hirer data
  const postedGigs = myGigs || [];
  const newApplicants = postedGigs.reduce((sum, g) => sum + (applicantCounts[g.id] || 0), 0);
  const committedPay = postedGigs.reduce((sum, g) => sum + (g.payAmount || 0), 0);

  const earnCount = useCountUp(potentialToday, [mode, potentialToday]);
  const applicantsCount = useCountUp(newApplicants, [mode, newApplicants]);

  const thumbTranslate = segAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, trackW / 2 - 4)] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={["top"]}>
      {/* Header — name + bell */}
      <View style={[s.header, { backgroundColor: pageBg }]}>
        <Text style={s.name} numberOfLines={1}>{name}</Text>
        <Pressable onPress={() => router.push("/modals/notifications")} style={[s.bell, { backgroundColor: T.bell }]}>
          <Ionicons name="notifications-outline" size={17} color="#fff" />
          {unread > 0 ? <View style={[s.bellDot, { borderColor: pageBg }]} /> : null}
        </Pressable>
      </View>

      {/* Segmented Working / Hiring */}
      <View style={[s.segWrap, { backgroundColor: pageBg }]}>
        <View style={[s.segTrack, { backgroundColor: T.track }]} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
          <Animated.View style={[s.segThumb, { width: trackW ? trackW / 2 - 4 : "48%", transform: [{ translateX: thumbTranslate }] }]} />
          <Pressable style={s.segBtn} onPress={() => switchMode("working")}>
            <Text style={[s.segTxt, { color: isWorking ? WORK.accent : "rgba(255,255,255,0.55)" }]}>Working</Text>
          </Pressable>
          <Pressable style={s.segBtn} onPress={() => switchMode("hiring")}>
            <Text style={[s.segTxt, { color: !isWorking ? HIRE.accent : "rgba(255,255,255,0.55)" }]}>Hiring</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }, { scale: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }] }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}>

          {isWorking ? (
            /* ═══════════ WORKING ═══════════ */
            <>
              <LinearGradient colors={[WORK.heroA, WORK.heroB]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
                <View style={s.ring1} pointerEvents="none" />
                <View style={s.ring2} pointerEvents="none" />
                <Text style={s.heroLabel}>You could earn</Text>
                <Text style={s.heroNumRow}>
                  <Text style={[s.heroNum, { color: WORK.heroNum }]}>{money(earnCount)}</Text>
                  <Text style={s.heroNumSuffix}> today</Text>
                </Text>
                <Text style={s.heroContext}>{streak}-day streak · {nearCount} gigs open near {zone}</Text>
                <StreakPill streak={streak} best={bestStreak} s={s} />
              </LinearGradient>

              {/* Matched-for-you — Rapido-style pushed offers */}
              {matchCount > 0 ? (
                <Pressable onPress={() => router.push("/modals/matches")} style={s.matchCard}>
                  <View style={[s.matchIcon, { backgroundColor: WORK.accent }]}>
                    <Ionicons name="flash" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.matchTitle}>{matchCount} job{matchCount === 1 ? "" : "s"} matched to your skills</Text>
                    <Text style={s.matchSub}>Tap to accept or skip — no feed scrolling</Text>
                  </View>
                  <View style={[s.matchBadge, { backgroundColor: WORK.badgeBg }]}>
                    <Text style={[s.matchBadgeTxt, { color: WORK.badgeTx }]}>{matchCount} new</Text>
                  </View>
                </Pressable>
              ) : null}

              {/* Live banner (white) + icon map button */}
              <View style={s.banner}>
                <PulseDot color={CO.liveDot} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.bannerTitle}>{nearCount} gigs live near {zone}</Text>
                  <Text style={s.bannerSub}>Updated 3 min ago</Text>
                </View>
                <Pressable onPress={() => router.push("/modals/gigs-map")} style={[s.mapBtn, { backgroundColor: statBg }]}>
                  <Ionicons name="map" size={16} color={WORK.accent} />
                </Pressable>
              </View>

              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Gigs near you</Text>
                <Pressable onPress={() => router.push("/(tabs)/jobs")}><Text style={[s.sectionLink, { color: WORK.accent }]}>See all ›</Text></Pressable>
              </View>
              {!gigs ? (
                <View style={{ gap: 8 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={72} style={{ borderRadius: 16 }} />)}</View>
              ) : (
                <View style={{ gap: 8 }}>
                  {preview.map((g, i) => (
                    <FadeIn key={g.id} delay={i * 60}>
                      <Pressable onPress={() => router.push(`/(tabs)/jobs/${g.id}`)} style={s.gigCard}>
                        <View style={[s.avatar, { backgroundColor: WORK.avatar }]}><Text style={s.avatarTxt}>{g.initials}</Text></View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.gigTitle} numberOfLines={1}>{g.title}</Text>
                          <Text style={s.gigMeta} numberOfLines={1}>{g.who} · {g.area}</Text>
                        </View>
                        <Text style={s.pay}>{money(g.payAmount)}</Text>
                      </Pressable>
                    </FadeIn>
                  ))}
                </View>
              )}
            </>
          ) : (
            /* ═══════════ HIRING ═══════════ */
            <>
              <LinearGradient colors={[HIRE.heroA, HIRE.heroB]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
                <View style={s.ring1} pointerEvents="none" />
                <View style={s.ring2} pointerEvents="none" />
                <Text style={s.heroLabel}>Your gigs have</Text>
                <Text style={s.heroNumRow}>
                  <Text style={[s.heroNum, { color: HIRE.heroNum, fontSize: 30 }]}>{applicantsCount}</Text>
                  <Text style={s.heroNumSuffix}> new applicants</Text>
                </Text>
                <Text style={s.heroContext}>{postedGigs.length} active post{postedGigs.length === 1 ? "" : "s"} · fill them before the weekend</Text>
                <StreakPill streak={streak} best={bestStreak} s={s} />
              </LinearGradient>

              {/* Live banner (white) */}
              <View style={s.banner}>
                <PulseDot color={CO.liveDot} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.bannerTitle}>42 workers active near {zone}</Text>
                  <Text style={s.bannerSub}>Good time to post</Text>
                </View>
              </View>

              {/* Stat strip */}
              <View style={s.statRow}>
                <View style={[s.statCard, { backgroundColor: statBg }]}>
                  <Text style={s.statNum}>{postedGigs.length}</Text>
                  <Text style={s.statLabel}>Active gigs</Text>
                </View>
                <View style={[s.statCard, { backgroundColor: statBg }]}>
                  <Text style={[s.statNum, { color: HIRE.accent }]}>{newApplicants}</Text>
                  <Text style={s.statLabel}>New applicants</Text>
                </View>
                <View style={[s.statCard, { backgroundColor: statBg }]}>
                  <Text style={[s.statNum, { color: C.green }]}>{money(committedPay)}</Text>
                  <Text style={s.statLabel}>Committed pay</Text>
                </View>
              </View>

              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Your posted gigs</Text>
                <Pressable onPress={() => router.push("/(tabs)/profile/my-gigs")}><Text style={[s.sectionLink, { color: HIRE.accent }]}>Manage ›</Text></Pressable>
              </View>
              {!myGigs ? (
                <View style={{ gap: 8 }}>{[1, 2].map((i) => <Skeleton key={i} height={72} style={{ borderRadius: 16 }} />)}</View>
              ) : postedGigs.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Empty
                    icon={<Ionicons name="megaphone-outline" size={30} color={HIRE.accent} />}
                    title="No posted gigs yet"
                    subtitle="Post your first gig and reach workers nearby in minutes."
                    action={
                      <Pressable onPress={() => router.push("/modals/post-gig")} style={[s.emptyCta, { backgroundColor: HIRE.accent }]}>
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text style={s.emptyCtaTxt}>Post a gig</Text>
                      </Pressable>
                    }
                  />
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {postedGigs.map((g, i) => (
                    <FadeIn key={g.id} delay={i * 60}>
                      <Pressable onPress={() => router.push(`/(tabs)/profile/applicants?gigId=${g.id}`)} style={s.gigCard}>
                        <View style={[s.avatar, { backgroundColor: HIRE.avatar }]}><Text style={s.avatarTxt}>{g.initials}</Text></View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.gigTitle} numberOfLines={1}>{g.title}</Text>
                          <Text style={s.gigMeta} numberOfLines={1}>Posted {g.postedAgo || "recently"} · tap to review</Text>
                        </View>
                        <View style={[s.appliedBadge, { backgroundColor: HIRE.badgeBg }]}>
                          <Text style={[s.appliedTxt, { color: HIRE.badgeTx }]}>{applicantCounts[g.id] || 0} applied</Text>
                        </View>
                      </Pressable>
                    </FadeIn>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* FAB backdrop */}
      <Animated.View pointerEvents={fabOpen ? "auto" : "none"} style={[StyleSheet.absoluteFill, { opacity: backdropAnim }]}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(10,5,20,0.42)" }} onPress={toggleFab} />
      </Animated.View>

      {/* Speed-dial actions */}
      {T.actions.map((action, i) => {
        const anim = fabAnims[i];
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -FAB_OFFSETS[i]] });
        return (
          <Animated.View key={action.label} pointerEvents={fabOpen ? "auto" : "none"} style={[s.fabAction, { opacity: anim, transform: [{ translateY }] }]}>
            <Pressable onPress={() => handleFabAction(i)} accessibilityRole="button" accessibilityLabel={action.label} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={s.fabLabelPill}><Text style={s.fabLabelTxt}>{action.label}</Text></View>
              <View style={[s.fabCircle, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={21} color="#fff" />
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      {/* FAB main */}
      <View style={s.fabMainWrap}>
        <Pressable onPress={toggleFab} accessibilityRole="button" accessibilityLabel={fabOpen ? "Close quick actions" : "Open quick actions"}>
          <Animated.View style={[s.fabMain, {
            transform: [
              { rotate: fabRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) },
              { scale: fabRotate.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) },
            ],
          }]}>
            {fabOpen ? (
              <View style={[s.fabFill, { backgroundColor: "#151B24" }]}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
            ) : (
              <LinearGradient colors={T.fab} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.fabFill}>
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8 },
  name: { fontFamily: FJ.xbold, fontSize: 20, color: C.text, letterSpacing: -0.5, flex: 1 },
  bell: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", position: "relative" },
  bellDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: CO.unread, borderWidth: 1.5 },

  segWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  segTrack: { flexDirection: "row", borderRadius: 999, padding: 4, position: "relative" },
  segThumb: { position: "absolute", top: 4, bottom: 4, left: 4, borderRadius: 999, backgroundColor: "#fff" },
  segBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, zIndex: 1 },
  segTxt: { fontFamily: FJ.bold, fontSize: 13.5 },

  hero: { borderRadius: 24, padding: 22, marginBottom: 14, overflow: "hidden" },
  ring1: { position: "absolute", right: -44, top: -44, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  ring2: { position: "absolute", right: -68, top: -68, width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  heroLabel: { color: "rgba(255,255,255,0.65)", fontFamily: FJ.med, fontSize: 14.5, marginBottom: 4 },
  heroNumRow: { marginBottom: 10 },
  heroNum: { fontFamily: FS.bold, fontSize: 33, letterSpacing: -1 },
  heroNumSuffix: { fontFamily: FJ.xbold, fontSize: 26, color: "#fff" },
  heroContext: { color: "rgba(255,255,255,0.5)", fontFamily: FJ.med, fontSize: 12.5, marginBottom: 16 },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.13)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignSelf: "flex-start" },
  streakTxt: { color: "#fff", fontFamily: FJ.bold, fontSize: 12 },
  streakBest: { color: "rgba(255,255,255,0.55)", fontFamily: FJ.med, fontSize: 12 },

  banner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 22, shadowColor: "#140A28", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  bannerTitle: { fontFamily: FJ.bold, fontSize: 14.5, color: C.text },
  bannerSub: { fontFamily: FJ.med, fontSize: 12, color: C.text2, marginTop: 2 },
  mapBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  matchCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, borderWidth: 1, borderColor: C.indigoSoft, shadowColor: "#140A28", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  matchIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  matchTitle: { fontFamily: FJ.bold, fontSize: 14, color: C.text, letterSpacing: -0.2 },
  matchSub: { fontFamily: FJ.med, fontSize: 12, color: C.text2, marginTop: 2 },
  matchBadge: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 },
  matchBadgeTxt: { fontFamily: FJ.bold, fontSize: 12 },

  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: FJ.xbold, fontSize: 15, color: C.text, letterSpacing: -0.3 },
  sectionLink: { fontFamily: FJ.sbold, fontSize: 13 },

  statRow: { flexDirection: "row", gap: 8, marginBottom: 22 },
  statCard: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10 },
  statNum: { fontFamily: FS.bold, fontSize: 19, color: C.text, letterSpacing: -0.3 },
  statLabel: { fontFamily: FJ.sbold, fontSize: 10.5, color: C.text2, marginTop: 2 },

  gigCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, shadowColor: "#140A28", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontFamily: FJ.xbold, fontSize: 11 },
  gigTitle: { fontFamily: FJ.bold, fontSize: 14, color: C.text },
  gigMeta: { fontFamily: FJ.med, fontSize: 12, color: C.text2, marginTop: 2 },
  pay: { fontFamily: FS.bold, fontSize: 16, color: C.green, letterSpacing: -0.3 },
  appliedBadge: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 },
  appliedTxt: { fontFamily: FJ.bold, fontSize: 12 },

  emptyWrap: { backgroundColor: C.surface, borderRadius: 16, shadowColor: "#140A28", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  emptyCta: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  emptyCtaTxt: { fontFamily: FJ.bold, fontSize: 14, color: "#fff" },

  fabAction: { position: "absolute", right: 20, bottom: 24, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 102 },
  fabLabelPill: { backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  fabLabelTxt: { fontFamily: FJ.bold, fontSize: 12.5, color: C.text },
  fabCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  fabMainWrap: { position: "absolute", bottom: 24, right: 20, zIndex: 103 },
  fabMain: { width: 58, height: 58, borderRadius: 29, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  fabFill: { flex: 1, borderRadius: 29, alignItems: "center", justifyContent: "center" },
});
