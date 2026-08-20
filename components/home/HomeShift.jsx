import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton, FadeIn } from "../ui";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { useMode } from "../../lib/ModeContext";
import { useC } from "../../lib/ThemeContext";
import { gigsAPI, notificationsAPI, applicationsAPI, matchesAPI } from "../../lib/api";
import { sortGigsByZone } from "../../lib/gigSort";
import { FJ, FS, money } from "../../lib/theme";

// ── Shift-board home (worker side) ────────────────────────────────────────────
// Three states of ONE screen, never three screens. The day bar and the gig feed
// are present in all of them; only the online strip changes height:
//
//   offline            → strip is one line
//   online, work near  → strip is one line ("3 nearby"); the feed is the answer
//   online, nothing    → strip expands to explain the wait (radius, queue, ETA)
//
// The searching UI is deliberately inversely proportional to the work available.
// Hiring mode is not handled here — app/(tabs)/index.jsx routes it to HomeClassic.

const WORK = {
  accent: "#3C6AE2", heroA: "#0E0E63", heroB: "#090037", heroNum: "#37D59F",
  track: "#172259", bell: "#EBB353", badgeBg: "#D8E8FF", badgeTx: "#0B288E",
  statBg: "#E9EBF1", avatar: "#1D223C", pageBg: "#F0F2F6",
};
const CO = { muted: "#66696F", pay: "#15803D", live: "#33A340", urgent: "#E62B34", hold: "#EBB353" };

// Radius grows while the zone is dry — the geographic half of wave dispatch.
const RADIUS_START = 1.5;
const RADIUS_MAX = 6;
const RADIUS_STEP_MS = 5000;

const QUICK = [
  { icon: "calendar-outline", label: "Availability", route: "/modals/availability" },
  { icon: "map-outline", label: "Map", route: "/modals/gigs-map" },
  { icon: "people-outline", label: "Refer", route: "/modals/refer" },
];

// ── Pulsing dot for the online strip ──────────────────────────────────────────
function PulseDot({ color, on }) {
  const scale = useRef(new Animated.Value(1)).current;
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!on) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
      Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [on, scale, op]);
  return (
    <View style={{ width: 9, height: 9 }}>
      {on ? <Animated.View style={{ position: "absolute", width: 9, height: 9, borderRadius: 4.5, backgroundColor: color, opacity: op, transform: [{ scale }] }} /> : null}
      <View style={{ position: "absolute", top: 1, left: 1, width: 7, height: 7, borderRadius: 3.5, backgroundColor: on ? color : "#4A4E63" }} />
    </View>
  );
}

// ── Concentric rings showing the live search radius ───────────────────────────
function RadiusRings({ radius }) {
  const frac = Math.min(1, radius / RADIUS_MAX);
  return (
    <View style={{ height: 74, justifyContent: "center", alignItems: "center", marginBottom: 10 }} pointerEvents="none">
      {[1, 2, 3].map((i) => {
        const size = 26 + frac * 46 * i;
        return <View key={i} style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: "rgba(55,213,159,0.26)" }} />;
      })}
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: WORK.heroNum }} />
    </View>
  );
}

export default function HomeShift() {
  const router = useRouter();
  const { user } = useAuth();
  const { feedZone } = useLocation();
  const { setMode } = useMode();
  const C = useC();
  const s = makeStyles(C);

  const [gigs, setGigs] = useState(null);
  const [apps, setApps] = useState([]);
  const [unread, setUnread] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [online, setOnline] = useState(false);
  const [radius, setRadius] = useState(RADIUS_START);
  const [queue, setQueue] = useState(4);
  const [offer, setOffer] = useState(null);   // the gig currently in the offer bar
  const [seenOffer, setSeenOffer] = useState(true);

  const barY = useRef(new Animated.Value(120)).current;
  const barOp = useRef(new Animated.Value(0)).current;
  const expandOp = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const [g, u, a, mc] = await Promise.all([
      gigsAPI.getAll(), notificationsAPI.unreadCount(), applicationsAPI.getMy(), matchesAPI.countForMe(),
    ]);
    setGigs(g); setUnread(u); setApps(a); setMatchCount(mc);
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { applicationsAPI.getMy().then(setApps); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const zone = feedZone || "Chennai";
  const name = user?.name || "there";

  const sorted = gigs ? sortGigsByZone(gigs, feedZone) : null;
  const nearGigs = sorted ? [...(sorted.tiers[0]?.gigs || []), ...(sorted.tiers[1]?.gigs || [])] : [];
  const farGigs = sorted ? (sorted.worthTravel || []) : [];
  const dry = online && !!sorted && nearGigs.length === 0;

  // ── The day: built from real applications, not invented ─────────────────────
  const paid = apps.filter((a) => a.status === "done");
  const confirmed = apps.filter((a) => a.status === "hired" || a.status === "in_shift");
  const committed = [...paid, ...confirmed].reduce((sum, a) => sum + (a.payAmount || 0), 0);
  const dayBlocks = [
    ...paid.map((a) => ({ key: a.id, label: a.hrs || "done", state: "done", amt: a.payAmount || 0 })),
    ...confirmed.map((a) => ({ key: a.id, label: a.hrs || "today", state: "conf", amt: a.payAmount || 0 })),
  ];
  while (dayBlocks.length < 4) dayBlocks.push({ key: `open-${dayBlocks.length}`, label: "Free", state: "open", amt: 0 });
  const openCount = dayBlocks.filter((b) => b.state === "open").length;

  const gigsDone = user?.gigsDone || 38;
  const onTime = 96;

  // Widen the radius while the zone stays dry. Resets whenever work appears.
  useEffect(() => {
    if (!dry) { setRadius(RADIUS_START); setQueue(4); return undefined; }
    const t = setInterval(() => {
      setRadius((r) => Math.min(RADIUS_MAX, r + 0.5));
      setQueue((q) => Math.max(1, q - 1));
    }, RADIUS_STEP_MS);
    return () => clearInterval(t);
  }, [dry]);

  // Fade the expansion in/out rather than snapping it.
  useEffect(() => {
    Animated.timing(expandOp, { toValue: dry ? 1 : 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [dry, expandOp]);

  // ── The offer bar ───────────────────────────────────────────────────────────
  // Rises when an exclusive offer lands, holds, then slides away. Going away
  // costs nothing: the offer itself does not expire, so a badge on the feed
  // header and the bell keep it reachable.
  const showBar = useCallback((gig) => {
    setOffer(gig); setSeenOffer(false);
    barY.setValue(120); barOp.setValue(0);
    Animated.parallel([
      Animated.spring(barY, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }),
      Animated.timing(barOp, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [barY, barOp]);

  const hideBar = useCallback(() => {
    Animated.parallel([
      Animated.timing(barY, { toValue: 120, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(barOp, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setOffer(null));
  }, [barY, barOp]);

  // One offer arrives shortly after going online, and auto-dismisses after 6s.
  useEffect(() => {
    if (!online || !nearGigs.length) return undefined;
    const appear = setTimeout(() => showBar(nearGigs[0]), 1800);
    return () => clearTimeout(appear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, gigs]);

  useEffect(() => {
    if (!offer) return undefined;
    const t = setTimeout(hideBar, 6000);
    return () => clearTimeout(t);
  }, [offer, hideBar]);

  const openOffer = () => {
    const g = offer;
    setSeenOffer(true);
    hideBar();
    if (g) router.push(`/(tabs)/jobs/${g.id}`);
  };

  const toggleOnline = () => {
    const next = !online;
    setOnline(next);
    if (!next) { setSeenOffer(true); hideBar(); }
  };

  const feed = dry ? farGigs : nearGigs;
  const preview = feed.slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.dark ? C.bg : WORK.pageBg }} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.name} numberOfLines={1}>{name}</Text>
        <Pressable onPress={() => router.push("/modals/notifications")} style={[s.bell, { backgroundColor: WORK.bell }]}>
          <Ionicons name="notifications-outline" size={17} color="#fff" />
          {unread > 0 || !seenOffer ? <View style={[s.bellDot, { borderColor: C.dark ? C.bg : WORK.pageBg }]} /> : null}
        </Pressable>
      </View>

      {/* Working / Hiring */}
      <View style={s.segWrap}>
        <View style={[s.segTrack, { backgroundColor: WORK.track }]}>
          <View style={s.segBtn}><Text style={[s.segTxt, s.segOn]}>Working</Text></View>
          <Pressable style={s.segBtn} onPress={() => setMode("hiring")}>
            <Text style={[s.segTxt, { color: "rgba(255,255,255,0.55)" }]}>Hiring</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 96 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WORK.accent} />}
      >
        {/* ── Hero: the day, then the online strip ── */}
        <LinearGradient colors={[WORK.heroA, WORK.heroB]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
          <View style={s.heroRing} pointerEvents="none" />

          <View style={s.heroTop}>
            <Text style={s.heroLabel}>Your day so far</Text>
            <Text style={s.heroNumRow}>
              <Text style={s.heroNum}>{money(committed)}</Text>
              <Text style={s.heroNumSuffix}> committed</Text>
            </Text>

            <View style={s.dayBar}>
              {dayBlocks.slice(0, 4).map((b) => (
                <Pressable
                  key={b.key}
                  onPress={() => b.state === "open" ? router.push("/(tabs)/jobs") : null}
                  style={[s.block, b.state === "done" && s.blockDone, b.state === "conf" && s.blockConf, b.state === "open" && s.blockOpen]}
                >
                  <Text style={[s.blockLabel, b.state === "done" && s.blockLabelDark]} numberOfLines={1}>{b.label}</Text>
                  <Text style={[s.blockAmt, b.state === "done" && s.blockLabelDark]} numberOfLines={1}>
                    {b.amt ? money(b.amt) : "—"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={s.dayKey}>
              <View style={s.keyItem}><View style={[s.keyDot, { backgroundColor: WORK.heroNum }]} /><Text style={s.keyTxt}>Paid</Text></View>
              <View style={s.keyItem}><View style={[s.keyDot, { backgroundColor: "rgba(55,213,159,0.4)" }]} /><Text style={s.keyTxt}>Confirmed</Text></View>
              <View style={s.keyItem}><View style={[s.keyDot, { backgroundColor: "rgba(255,255,255,0.16)" }]} /><Text style={s.keyTxt}>{openCount} open</Text></View>
            </View>
          </View>

          {/* The one strip that changes height */}
          <View style={s.strip}>
            <Pressable style={s.stripRow} onPress={toggleOnline} accessibilityRole="switch" accessibilityState={{ checked: online }}>
              <PulseDot color={WORK.heroNum} on={online} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.stripT1}>
                  {!online ? "Go online for offers" : dry ? `Online · nothing in ${zone} yet` : `Online · ${nearGigs.length} nearby`}
                </Text>
                <Text style={s.stripT2}>
                  {!online ? "Your day and the feed stay either way" : dry ? "Widening the search for you" : "Offers come straight to you"}
                </Text>
              </View>
              <View style={[s.switch, online && s.switchOn]}>
                <View style={[s.knob, online && s.knobOn]} />
              </View>
            </Pressable>

            {dry ? (
              <Animated.View style={[s.expand, { opacity: expandOp }]}>
                <RadiusRings radius={radius} />
                <View style={s.expStats}>
                  <View>
                    <Text style={s.expV}>{radius.toFixed(1)} km</Text>
                    <Text style={s.expK}>search radius</Text>
                  </View>
                  <View>
                    <Text style={s.expV}>{ordinal(queue)}</Text>
                    <Text style={s.expK}>in line here</Text>
                  </View>
                  <View>
                    <Text style={s.expV}>18 min</Text>
                    <Text style={s.expK}>median wait</Text>
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </LinearGradient>

        {/* Record — the worker's asset */}
        <Pressable style={s.card} onPress={() => router.push("/(tabs)/profile")}>
          <View style={s.row}>
            <View style={s.recordAv}><Text style={s.recordAvTxt}>{initialsOf(name)}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.cardTitle}>{gigsDone} shifts · {onTime}% on time</Text>
              <Text style={s.cardSub}>Your record is what hirers filter on</Text>
            </View>
            <View style={s.chipOk}><Text style={s.chipOkTxt}>Trusted</Text></View>
          </View>
        </Pressable>

        {/* Quick actions */}
        <View style={s.quickRow}>
          {QUICK.map((q) => (
            <Pressable key={q.label} style={s.quick} onPress={() => router.push(q.route)}>
              <Ionicons name={q.icon} size={16} color={WORK.accent} />
              <Text style={s.quickTxt}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Matches */}
        {matchCount > 0 ? (
          <Pressable style={[s.card, s.cardAccent]} onPress={() => router.push("/modals/matches")}>
            <View style={s.row}>
              <View style={[s.matchIcon, { backgroundColor: WORK.accent }]}><Ionicons name="flash" size={16} color="#fff" /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.cardTitle}>{matchCount} job{matchCount === 1 ? "" : "s"} matched to your skills</Text>
                <Text style={s.cardSub}>Accept or skip. No feed scrolling.</Text>
              </View>
              <View style={[s.badge, { backgroundColor: WORK.badgeBg }]}>
                <Text style={[s.badgeTxt, { color: WORK.badgeTx }]}>{matchCount} new</Text>
              </View>
            </View>
          </Pressable>
        ) : null}

        {/* ── Feed ── */}
        {dry ? (
          <View style={s.dryNote}>
            <Text style={s.dryTitle}>Quiet in {zone} right now</Text>
            <Text style={s.drySub}>
              Nothing open this minute. We are widening your radius automatically — these are the nearest open shifts meanwhile.
            </Text>
          </View>
        ) : null}

        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>{dry ? "Further out" : "Gigs near you"}</Text>
          <View style={s.sectionRight}>
            {offer === null && !seenOffer ? (
              <Pressable onPress={() => { setSeenOffer(true); router.push("/modals/matches"); }} style={s.forYou}>
                <Text style={s.forYouTxt}>1 for you</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.push("/(tabs)/jobs")}>
              <Text style={[s.sectionLink, { color: WORK.accent }]}>See all ›</Text>
            </Pressable>
          </View>
        </View>

        {!gigs ? (
          <View style={{ gap: 8 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={78} style={{ borderRadius: 16 }} />)}</View>
        ) : preview.length === 0 ? (
          <View style={s.dryNote}>
            <Text style={s.dryTitle}>No open shifts anywhere nearby</Text>
            <Text style={s.drySub}>Turn on the switch above and we will bring the next one to you.</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {preview.map((g, i) => (
              <FadeIn key={g.id} delay={i * 60}>
                <Pressable onPress={() => router.push(`/(tabs)/jobs/${g.id}`)} style={[s.gigCard, g.urgent && s.gigUrgent, dry && s.gigFar]}>
                  <View style={s.row}>
                    <View style={[s.avatar, { backgroundColor: WORK.avatar }]}><Text style={s.avatarTxt}>{g.initials}</Text></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.gigTitle} numberOfLines={1}>{g.title}{g.timing ? ` · ${g.timing}` : ""}</Text>
                      <Text style={s.gigMeta} numberOfLines={1}>{g.who} · {g.area}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={s.pay}>{money(g.payAmount)}</Text>
                      {g.hrs ? <Text style={s.payUnit}>{g.hrs}</Text> : null}
                    </View>
                  </View>
                  <View style={s.chips}>
                    {g.urgent ? <View style={s.chipRed}><Text style={s.chipRedTxt}>Urgent</Text></View> : null}
                    {dry ? <View style={s.chipAmber}><Text style={s.chipAmberTxt}>Outside your zone</Text></View> : null}
                    <View style={s.chipGrey}><Text style={s.chipGreyTxt}>{g.openings || 1} opening{(g.openings || 1) === 1 ? "" : "s"}</Text></View>
                  </View>
                </Pressable>
              </FadeIn>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Offer bar ── */}
      {offer ? (
        <Animated.View style={[s.bar, { opacity: barOp, transform: [{ translateY: barY }] }]}>
          <Pressable style={s.barInner} onPress={openOffer} accessibilityRole="button" accessibilityLabel={`Offer: ${offer.title}`}>
            <View style={s.barCount}><Text style={s.barCountTxt}>1</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.barT1} numberOfLines={1}>Yours first · {offer.title} · {money(offer.payAmount)}</Text>
              <Text style={s.barT2} numberOfLines={1}>{offer.who} · {offer.area} · nothing expires in seconds</Text>
            </View>
            <Ionicons name="chevron-up" size={15} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const ordinal = (n) => {
  const suf = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suf[(v - 20) % 10] || suf[v] || suf[0]);
};
const initialsOf = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const makeStyles = (C) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10, gap: 12 },
  name: { flex: 1, fontFamily: FJ.xbold, fontSize: 21, color: C.text, letterSpacing: -0.4 },
  bell: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: CO.urgent, borderWidth: 1.5 },

  segWrap: { paddingHorizontal: 20, paddingBottom: 10 },
  segTrack: { flexDirection: "row", borderRadius: 99, padding: 4 },
  segBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 99 },
  segTxt: { fontFamily: FJ.bold, fontSize: 13 },
  segOn: { color: "#fff" },

  hero: { borderRadius: 20, marginBottom: 12, overflow: "hidden" },
  heroRing: { position: "absolute", right: -44, top: -44, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  heroTop: { padding: 18, paddingBottom: 15 },
  heroLabel: { color: "rgba(255,255,255,0.65)", fontFamily: FJ.med, fontSize: 13.5, marginBottom: 3 },
  heroNumRow: { marginBottom: 4 },
  heroNum: { fontFamily: FS.bold, fontSize: 30, letterSpacing: -1, color: WORK.heroNum },
  heroNumSuffix: { fontFamily: FJ.xbold, fontSize: 20, color: "#fff" },

  dayBar: { flexDirection: "row", gap: 4, marginTop: 12, height: 38 },
  block: { flex: 1, borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  blockDone: { backgroundColor: WORK.heroNum },
  blockConf: { backgroundColor: "rgba(55,213,159,0.28)", borderWidth: 1, borderColor: "rgba(55,213,159,0.5)" },
  blockOpen: { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.26)" },
  blockLabel: { fontFamily: FS.med, fontSize: 8.5, color: "rgba(255,255,255,0.75)" },
  blockAmt: { fontFamily: FS.bold, fontSize: 10, color: "#fff" },
  blockLabelDark: { color: "#04231A" },

  dayKey: { flexDirection: "row", gap: 12, marginTop: 9 },
  keyItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  keyDot: { width: 7, height: 7, borderRadius: 2 },
  keyTxt: { fontFamily: FJ.med, fontSize: 9.5, color: "rgba(255,255,255,0.55)" },

  strip: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.16)" },
  stripRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 18, paddingVertical: 13 },
  stripT1: { fontFamily: FJ.bold, fontSize: 12.5, color: "#fff" },
  stripT2: { fontFamily: FJ.med, fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1 },
  switch: { width: 42, height: 24, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.18)", padding: 2, justifyContent: "center" },
  switchOn: { backgroundColor: WORK.heroNum },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  knobOn: { alignSelf: "flex-end" },

  expand: { paddingHorizontal: 18, paddingBottom: 16 },
  expStats: { flexDirection: "row", gap: 20 },
  expV: { fontFamily: FS.bold, fontSize: 15, color: "#fff" },
  expK: { fontFamily: FJ.med, fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 },

  card: { backgroundColor: C.surface, borderRadius: 15, padding: 13, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  cardAccent: { borderLeftWidth: 3, borderLeftColor: WORK.accent },
  cardTitle: { fontFamily: FJ.bold, fontSize: 13, color: C.text },
  cardSub: { fontFamily: FJ.med, fontSize: 10.5, color: C.text2, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 11 },

  recordAv: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center" },
  recordAvTxt: { fontFamily: FJ.bold, fontSize: 12, color: C.indigo },
  chipOk: { backgroundColor: C.greenSoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  chipOkTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: C.green },

  quickRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  quick: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 11, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  quickTxt: { fontFamily: FJ.bold, fontSize: 11, color: C.text },

  matchIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontFamily: FJ.bold, fontSize: 10 },

  dryNote: { backgroundColor: C.dark ? "#2A2110" : "#FFF6E8", borderRadius: 13, padding: 13, marginBottom: 10 },
  dryTitle: { fontFamily: FJ.xbold, fontSize: 12.5, color: C.dark ? C.amber : "#96620C" },
  drySub: { fontFamily: FJ.med, fontSize: 10.5, color: C.dark ? "#C9A96A" : "#8A6524", marginTop: 3, lineHeight: 15 },

  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 9 },
  sectionTitle: { fontFamily: FJ.xbold, fontSize: 15, color: C.text, letterSpacing: -0.3 },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionLink: { fontFamily: FJ.bold, fontSize: 11.5 },
  forYou: { backgroundColor: WORK.accent, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  forYouTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: "#fff" },

  gigCard: { backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  gigUrgent: { borderLeftWidth: 3, borderLeftColor: CO.urgent },
  gigFar: { borderStyle: "dashed" },
  avatar: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontFamily: FJ.bold, fontSize: 11, color: "#fff" },
  gigTitle: { fontFamily: FJ.bold, fontSize: 13, color: C.text },
  gigMeta: { fontFamily: FJ.med, fontSize: 10.5, color: C.text2, marginTop: 2 },
  pay: { fontFamily: FS.bold, fontSize: 14, color: C.green, letterSpacing: -0.3 },
  payUnit: { fontFamily: FJ.med, fontSize: 9, color: C.text3, marginTop: 1 },

  chips: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 9 },
  chipRed: { backgroundColor: C.redSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2.5 },
  chipRedTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: C.red },
  chipAmber: { backgroundColor: C.dark ? "#3A2A10" : "#FDF0DC", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2.5 },
  chipAmberTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: C.amber },
  chipGrey: { backgroundColor: C.surface2, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2.5 },
  chipGreyTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: C.text2 },

  bar: { position: "absolute", left: 16, right: 16, bottom: 18, borderRadius: 16, overflow: "hidden", backgroundColor: WORK.heroA },
  barInner: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingVertical: 12 },
  barCount: { width: 24, height: 24, borderRadius: 8, backgroundColor: WORK.heroNum, alignItems: "center", justifyContent: "center" },
  barCountTxt: { fontFamily: FS.bold, fontSize: 11, color: "#04231A" },
  barT1: { fontFamily: FJ.bold, fontSize: 12, color: "#fff" },
  barT2: { fontFamily: FJ.med, fontSize: 9.5, color: "rgba(255,255,255,0.55)", marginTop: 1 },
});
