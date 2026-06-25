import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Skeleton, FadeIn } from "../../components/ui";
import { GigRow } from "../../components/GigRow";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { gigsAPI, postsAPI, notificationsAPI } from "../../lib/api";
import { sortGigsByZone } from "../../lib/gigSort";
import { C, F } from "../../lib/theme";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

// ── Temporary theme palettes (toggle near the bell) ───────────────────────────
// "indigo" = brand purple (multi-colour tiles) · "green" = monochrome green
const THEMES = {
  indigo: {
    accent: "#5B4BD6", accentDeep: "#26215C", accentSoft: "#EFEDFC", accentBorder: "#DDD9F7",
    liveBg: "#111827",
    tiles: {
      browse: { bg: "#EAF3DE", border: "#C7DFA6", ic: "#3B6D11", t: "#27500A", s: "#4E7D22" },
      post:   { bg: "#EFEDFC", border: "#D5CFF5", ic: "#5B4BD6", t: "#26215C", s: "#5B4BD6" },
      mygigs: { bg: "#FBEFD9", border: "#F6D596", ic: "#9A6A14", t: "#633806", s: "#9A6A14" },
    },
  },
  green: {
    accent: "#16924C", accentDeep: "#14532D", accentSoft: "#E7F6EC", accentBorder: "#C6E9D2",
    liveBg: "#14532D",
    tiles: {
      browse: { bg: "#EAF6EE", border: "#CBE9D4", ic: "#15803D", t: "#14532D", s: "#2F8F57" },
      post:   { bg: "#EAF6EE", border: "#CBE9D4", ic: "#15803D", t: "#14532D", s: "#2F8F57" },
      mygigs: { bg: "#EAF6EE", border: "#CBE9D4", ic: "#15803D", t: "#14532D", s: "#2F8F57" },
    },
  },
};

// ── Count-up number for the live tile ─────────────────────────────────────────
function CountUp({ value, style, duration = 700 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(e * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <Text style={style}>{n}</Text>;
}

// ── Pulsing live dot ──────────────────────────────────────────────────────────
function PulseDot({ color = "#4ADE80" }) {
  const scale = useRef(new Animated.Value(1)).current;
  const op = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.4, duration: 1500, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
      Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.7, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ width: 8, height: 8 }}>
      <Animated.View style={{ position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity: op, transform: [{ scale }] }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

// ── Animated equalizer for the live-updates strip ─────────────────────────────
function Equalizer({ color }) {
  const heights = [7, 15, 10, 14];
  const vals = useRef(heights.map(() => new Animated.Value(0.45))).current;
  useEffect(() => {
    const loops = vals.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 130),
      Animated.timing(v, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.45, duration: 420, useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 16 }}>
      {vals.map((v, i) => (
        <Animated.View key={i} style={{ width: 3, height: heights[i], borderRadius: 2, backgroundColor: color, transform: [{ scaleY: v }] }} />
      ))}
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { feedZone } = useLocation();
  const [gigs, setGigs] = useState(null);
  const [posts, setPosts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [themeKey, setThemeKey] = useState("indigo"); // temporary preview toggle
  const T = THEMES[themeKey];

  const load = useCallback(async () => {
    const [g, p, u] = await Promise.all([gigsAPI.getAll(), postsAPI.getAll(), notificationsAPI.unreadCount()]);
    setGigs(g); setPosts(p); setUnread(u);
  }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const firstName = (user?.name || "there").split(" ")[0];
  const zone = feedZone || "Chennai";
  const sorted = gigs ? sortGigsByZone(gigs, feedZone) : null;
  const nearCount = sorted ? (sorted.tiers[0]?.gigs.length || 0) + (sorted.tiers[1]?.gigs.length || 0) : 0;
  const jobsToday = gigs?.length || 0;
  const preview = sorted ? [...(sorted.worthTravel || []), ...sorted.tiers.flatMap((t) => t.gigs)].slice(0, 3) : [];
  const trending = preview[0];

  const tileDefs = [
    { key: "browse", icon: "search",              title: "Browse all", sub: "Find the right opportunity", go: () => router.push("/(tabs)/jobs") },
    { key: "post",   icon: "add-circle-outline",  title: "Post a gig", sub: "Hire trusted locals",        go: () => router.push("/modals/post-gig") },
    { key: "mygigs", icon: "calendar-outline",    title: "My gigs",    sub: "Track progress & earnings",  go: () => router.push("/(tabs)/profile/dashboard") },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Top nav */}
      <View style={s.nav}>
        <Text style={s.logo}>Gig<Text style={{ color: T.accent }}>Ground</Text></Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => router.push("/(tabs)/profile")} style={s.locPill}>
            <Ionicons name="location-sharp" size={12} color={T.accent} />
            <Text style={s.locTxt}>{zone}</Text>
          </Pressable>
          <Pressable onPress={() => setThemeKey((k) => (k === "indigo" ? "green" : "indigo"))} style={s.iconBtn}>
            <Ionicons name="color-palette-outline" size={18} color={T.accent} />
          </Pressable>
          <Pressable onPress={() => router.push("/modals/notifications")} style={s.iconBtn}>
            <Ionicons name="notifications-outline" size={18} color={C.navy} />
            {unread > 0 ? <View style={s.badge}><Text style={s.badgeTxt}>{unread}</Text></View> : null}
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}>

        {/* Hero */}
        <View style={{ paddingHorizontal: 18, paddingTop: 10 }}>
          <FadeIn>
            <Text style={s.greet}>{greeting()}, {firstName}</Text>
            <Text style={s.h1}>What's happening{"\n"}in <Text style={{ color: T.accent }}>{zone}</Text> today?</Text>
            <View style={s.statRow}>
              <Ionicons name="briefcase" size={15} color={T.accent} />
              <Text style={[s.statTxt, { color: T.accent }]}>{jobsToday} jobs today</Text>
              <View style={s.statDiv} />
              <Text style={s.statUpd}>Updated just now</Text>
            </View>
          </FadeIn>
        </View>

        {/* Swipeable tiles */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 11, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 4 }}>
          <FadeIn delay={60}>
            <Pressable onPress={() => router.push("/(tabs)/jobs")} style={[s.tile, { backgroundColor: T.liveBg }]}>
              <View style={s.liveRow}>
                <PulseDot />
                <Text style={s.liveLab}>LIVE</Text>
              </View>
              <CountUp value={nearCount} style={s.liveNum} />
              <Text style={s.liveSub}>gigs near{"\n"}you now</Text>
              <Ionicons name="arrow-forward" size={17} color="#fff" style={{ marginTop: 14 }} />
            </Pressable>
          </FadeIn>
          {tileDefs.map((d, i) => {
            const tc = T.tiles[d.key];
            return (
              <FadeIn key={d.key} delay={120 + i * 60}>
                <Pressable onPress={d.go} style={[s.tile, { backgroundColor: tc.bg, borderWidth: StyleSheet.hairlineWidth, borderColor: tc.border }]}>
                  <View style={s.tileIcWrap}><Ionicons name={d.icon} size={19} color={tc.ic} /></View>
                  <Text style={[s.tileT, { color: tc.t }]}>{d.title}</Text>
                  <Text style={[s.tileS, { color: tc.s }]}>{d.sub}</Text>
                  <Ionicons name="arrow-forward" size={16} color={tc.ic} style={{ marginTop: 12 }} />
                </Pressable>
              </FadeIn>
            );
          })}
        </ScrollView>

        {/* Live updates strip */}
        <View style={{ paddingHorizontal: 18 }}>
          <FadeIn delay={300}>
            <View style={[s.liveUpd, { backgroundColor: T.accentSoft, borderColor: T.accentBorder }]}>
              <Equalizer color={T.accent} />
              <Text style={[s.liveUpdT, { color: T.accentDeep }]}>Live updates</Text>
              <Text style={s.liveUpdS}>New gigs in the last 2 min</Text>
            </View>
          </FadeIn>

          {/* Trending strip */}
          {trending ? (
            <FadeIn delay={360}>
              <Pressable onPress={() => router.push(`/(tabs)/jobs/${trending.id}`)} style={s.trend}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.trendLab, { color: T.accent }]}>TRENDING NEAR YOU</Text>
                  <Text style={s.trendT} numberOfLines={1}>{trending.title}</Text>
                </View>
                <Ionicons name="arrow-up" size={18} color={T.accent} style={{ transform: [{ rotate: "45deg" }] }} />
              </Pressable>
            </FadeIn>
          ) : null}
        </View>

        {/* Nearby gigs preview */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Nearby gigs</Text>
            <Pressable onPress={() => router.push("/(tabs)/jobs")}><Text style={[s.link, { color: T.accent }]}>See all</Text></Pressable>
          </View>
          <View style={s.card}>
            {!gigs ? <><Skeleton height={48} style={{ marginBottom: 10 }} /><Skeleton height={48} /></> :
              preview.map((g, i) => (
                <FadeIn key={g.id} delay={i * 40}>
                  <GigRow gig={g} dist={g.dist} last={i === preview.length - 1} onPress={() => router.push(`/(tabs)/jobs/${g.id}`)} />
                </FadeIn>
              ))}
          </View>
        </View>

        {/* Local buzz preview */}
        <View style={[s.section, { paddingTop: 4 }]}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Local buzz</Text>
            <Pressable onPress={() => router.push("/(tabs)/community")}><Text style={[s.link, { color: T.accent }]}>Open</Text></Pressable>
          </View>
          <View style={s.card}>
            {posts.slice(0, 2).map((p, i) => (
              <FadeIn key={p.id} delay={i * 40}>
                <Pressable onPress={() => router.push(`/(tabs)/community/${p.id}`)} style={[{ paddingVertical: 11 }, i === 0 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline }]}>
                  <Text style={s.buzzTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={s.buzzMeta}>{p.area} · {p.authorName}</Text>
                </Pressable>
              </FadeIn>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10 },
  logo: { fontFamily: F.bold, fontSize: 19, color: C.text, letterSpacing: -0.5 },
  locPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99 },
  locTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 4, right: 5, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: C.red, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeTxt: { color: "#fff", fontFamily: F.bold, fontSize: 9 },

  greet: { fontFamily: F.reg, fontSize: 13, color: C.text3 },
  h1: { fontFamily: F.bold, fontSize: 27, color: C.text, marginTop: 6, lineHeight: 32, letterSpacing: -0.5 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 16 },
  statTxt: { fontFamily: F.bold, fontSize: 14 },
  statDiv: { width: 1, height: 14, backgroundColor: C.border },
  statUpd: { fontFamily: F.reg, fontSize: 13, color: C.text3 },

  tile: { width: 132, borderRadius: 19, paddingHorizontal: 15, paddingTop: 17, paddingBottom: 15 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 11 },
  liveLab: { fontFamily: F.bold, fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: 0.8 },
  liveNum: { fontFamily: F.bold, fontSize: 48, color: "#fff", letterSpacing: -2, lineHeight: 50 },
  liveSub: { fontFamily: F.reg, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 16, marginTop: 6 },
  tileIcWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  tileT: { fontFamily: F.bold, fontSize: 15, lineHeight: 18 },
  tileS: { fontFamily: F.reg, fontSize: 12, lineHeight: 16, marginTop: 4 },

  liveUpd: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14 },
  liveUpdT: { fontFamily: F.bold, fontSize: 13 },
  liveUpdS: { fontFamily: F.reg, fontSize: 13, color: C.text3, flexShrink: 1 },
  trend: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginTop: 11 },
  trendLab: { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },
  trendT: { fontFamily: F.bold, fontSize: 14, color: C.text },

  section: { paddingHorizontal: 18, marginTop: 22 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontFamily: F.bold, fontSize: 14, color: C.text },
  link: { fontFamily: F.med, fontSize: 13 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, paddingHorizontal: 12 },
  buzzTitle: { fontFamily: F.med, fontSize: 13, color: C.text },
  buzzMeta: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 2 },
});
