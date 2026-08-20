import { useEffect, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton, FadeIn } from "../ui";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { useMode } from "../../lib/ModeContext";
import { useC } from "../../lib/ThemeContext";
import { gigsAPI, notificationsAPI, applicantsAPI } from "../../lib/api";
import { FJ, FS, money } from "../../lib/theme";

// ── Shift-cover home (hirer side) ─────────────────────────────────────────────
// Rebuilt around what a hirer is actually afraid of. The old screen answered
// "how many applied"; this one answers, in order:
//
//   will it fill?        → fill state and the applicant pool, up top
//   what if they bail?   → the standby worker, named before the fear arrives
//   am I paying enough?  → this gig against the real median for its category
//   who do I trust?      → the bench, people who have already worked for you
//
// Every number is derived from the mock API, not invented. No fee or pricing is
// shown: the per-fill charge is a strategy proposal, not a product decision.

const HIRE = {
  accent: "#AD248C", heroA: "#3B002D", heroB: "#1B0016", heroNum: "#FB72C6",
  track: "#39072C", bell: "#D861AA", badgeBg: "#FFD5EE", badgeTx: "#780053",
  avatar: "#751E5F", pageBg: "#F3ECF1",
};
const FILLED_STATUSES = ["confirmed", "in_shift", "done"];

// Deterministic 4-digit arrival code so it is stable per gig across renders.
const codeFor = (id) => {
  let h = 0;
  for (let i = 0; i < String(id).length; i++) h = (h * 31 + String(id).charCodeAt(i)) % 10000;
  return String(h).padStart(4, "0");
};

export default function HirerShift() {
  const router = useRouter();
  const { user } = useAuth();
  const { feedZone } = useLocation();
  const { setMode } = useMode();
  const C = useC();
  const s = makeStyles(C);

  const [allGigs, setAllGigs] = useState(null);
  const [myGigs, setMyGigs] = useState(null);
  const [byGig, setByGig] = useState({});
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const load = useCallback(async () => {
    const [all, mine, u] = await Promise.all([gigsAPI.getAll(), gigsAPI.getMy(), notificationsAPI.unreadCount()]);
    setAllGigs(all); setMyGigs(mine); setUnread(u);
    const entries = await Promise.all(mine.map(async (g) => [g.id, await applicantsAPI.getForGig(g.id)]));
    setByGig(Object.fromEntries(entries));
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { gigsAPI.getMy().then(setMyGigs); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const name = user?.name || "there";
  const zone = feedZone || "Chennai";
  const posted = myGigs || [];

  // The gig that needs attention: an unfilled one first, else the most recent.
  const focusGig = posted.find((g) => !(byGig[g.id] || []).some((a) => FILLED_STATUSES.includes(a.status))) || posted[0];
  const focusApps = focusGig ? (byGig[focusGig.id] || []) : [];
  const hired = focusApps.find((a) => FILLED_STATUSES.includes(a.status));
  const openApps = focusApps.filter((a) => !FILLED_STATUSES.includes(a.status));
  const standby = hired ? openApps[0] : null;
  const topPick = !hired ? (openApps.find((a) => a.topPick) || openApps[0]) : null;

  // Pay guidance from the real spread of gigs in the same category.
  const peers = allGigs && focusGig
    ? allGigs.filter((g) => g.category === focusGig.category && g.payUnit === focusGig.payUnit && g.id !== focusGig.id)
    : [];
  const median = peers.length
    ? [...peers].map((g) => g.payAmount).sort((a, b) => a - b)[Math.floor(peers.length / 2)]
    : null;
  const payDelta = median && focusGig ? focusGig.payAmount - median : null;

  // The bench: everyone who has actually worked one of your gigs.
  const bench = [];
  Object.values(byGig).forEach((list) => {
    list.forEach((a) => {
      if (!FILLED_STATUSES.includes(a.status)) return;
      const found = bench.find((b) => b.name === a.name);
      if (found) found.shifts += 1;
      else bench.push({ name: a.name, initials: a.initials, shifts: 1, reliability: a.reliability, distKm: a.distKm });
    });
  });
  bench.sort((x, y) => y.shifts - x.shifts);

  const totalApplicants = Object.values(byGig).reduce((n, l) => n + l.length, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.dark ? C.bg : HIRE.pageBg }} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.name} numberOfLines={1}>{name}</Text>
        <Pressable onPress={() => router.push("/modals/notifications")} style={[s.bell, { backgroundColor: HIRE.bell }]}>
          <Ionicons name="notifications-outline" size={17} color="#fff" />
          {unread > 0 ? <View style={[s.bellDot, { borderColor: C.dark ? C.bg : HIRE.pageBg }]} /> : null}
        </Pressable>
      </View>

      <View style={s.segWrap}>
        <View style={[s.segTrack, { backgroundColor: HIRE.track }]}>
          <Pressable style={s.segBtn} onPress={() => setMode("working")}>
            <Text style={[s.segTxt, { color: "rgba(255,255,255,0.55)" }]}>Working</Text>
          </Pressable>
          <View style={s.segBtn}><Text style={[s.segTxt, { color: "#fff" }]}>Hiring</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={HIRE.accent} />}
      >
        {!myGigs ? (
          <View style={{ gap: 8 }}>{[1, 2].map((i) => <Skeleton key={i} height={110} style={{ borderRadius: 18 }} />)}</View>
        ) : !focusGig ? (
          <LinearGradient colors={[HIRE.heroA, HIRE.heroB]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
            <View style={s.heroRing} pointerEvents="none" />
            <Text style={s.heroLabel}>Nothing posted</Text>
            <Text style={s.heroBig}>Post a shift</Text>
            <Text style={s.heroSub}>Workers near {zone} see it straight away. You only hear from people who are free.</Text>
          </LinearGradient>
        ) : (
          <>
            {/* ── Fill state ── */}
            <LinearGradient colors={[HIRE.heroA, HIRE.heroB]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
              <View style={s.heroRing} pointerEvents="none" />
              {hired ? (
                <>
                  <Text style={s.heroLabel}>Filled · {focusGig.title}</Text>
                  <Text style={[s.heroBig, { color: HIRE.heroNum }]}>{hired.name}</Text>
                  <Text style={s.heroSub}>
                    {hired.completed} shift{hired.completed === 1 ? "" : "s"} done · {hired.reliability}% reliable
                    {hired.etaMin ? ` · about ${hired.etaMin} min away` : ""}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.heroLabel}>Filling · {focusGig.title}</Text>
                  <Text style={s.heroNumRow}>
                    <Text style={s.heroNum}>{openApps.length}</Text>
                    <Text style={s.heroNumSuffix}> {openApps.length === 1 ? "person" : "people"} free</Text>
                  </Text>
                  <Text style={s.heroSub}>
                    {openApps.length === 0
                      ? `Nobody yet. Workers near ${focusGig.area} are being notified in order of fit.`
                      : `Best fit first. Tap to see who they are and pick one.`}
                  </Text>
                  {openApps.length > 0 ? (
                    <Pressable onPress={() => router.push(`/(tabs)/profile/applicants?gigId=${focusGig.id}`)} style={s.heroBtn}>
                      <Ionicons name="people" size={15} color={HIRE.accent} />
                      <Text style={s.heroBtnTxt}>Review {openApps.length}</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </LinearGradient>

            {/* ── Arrival pass ── */}
            {hired ? (
              <>
                <Pressable style={[s.card, s.cardMagenta]} onPress={() => router.push(`/(tabs)/profile/applicants?gigId=${focusGig.id}`)}>
                  <View style={s.row}>
                    <View style={s.avatarRound}><Text style={s.avatarRoundTxt}>{hired.initials}</Text></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.cardTitle}>{hired.name} · arrival pass</Text>
                      <Text style={s.cardSub}>
                        {hired.completed} shifts · {hired.reliability}% reliable{hired.distKm ? ` · ${hired.distKm} km` : ""}
                      </Text>
                    </View>
                    {hired.topPick ? <View style={s.pinkChip}><Text style={s.pinkChipTxt}>Top fit</Text></View> : null}
                  </View>
                  <View style={s.chips}>
                    {hired.isVerifiedWorker ? <View style={s.okChip}><Text style={s.okChipTxt}>ID verified</Text></View> : null}
                    {hired.strikes === 0 ? <View style={s.okChip}><Text style={s.okChipTxt}>No strikes</Text></View> : null}
                    {hired.noShows > 0 ? <View style={s.redChip}><Text style={s.redChipTxt}>{hired.noShows} no-show{hired.noShows === 1 ? "" : "s"}</Text></View> : null}
                  </View>
                </Pressable>

                <Pressable style={s.codeCard} onPress={() => setShowCode((v) => !v)}>
                  <Text style={s.codeLabel}>{showCode ? "Read this out when they arrive" : "Tap to reveal arrival code"}</Text>
                  <Text style={s.codeDigits}>{showCode ? codeFor(focusGig.id).split("").join(" ") : "• • • •"}</Text>
                  <Text style={s.codeSub}>Handing it over is what proves they were here</Text>
                </Pressable>

                {/* The no-show answer, before the fear arrives */}
                {standby ? (
                  <View style={[s.card, s.cardGreen]}>
                    <View style={s.row}>
                      <View style={[s.avatarRound, { backgroundColor: C.greenSoft }]}>
                        <Text style={[s.avatarRoundTxt, { color: C.green }]}>{standby.initials}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.cardTitle}>{standby.name} is your backup</Text>
                        <Text style={s.cardSub}>
                          {standby.distKm} km away. If {hired.name.split(" ")[0]} does not check in, offer it to them without reposting.
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}

            {/* ── Pay guidance ── */}
            {median ? (
              <View style={[s.card, payDelta < 0 ? s.cardAmber : s.cardGreen]}>
                <Text style={s.cardTitle}>
                  {payDelta < 0
                    ? `${money(focusGig.payAmount)} is below the going rate`
                    : `${money(focusGig.payAmount)} is a competitive rate`}
                </Text>
                <Text style={s.cardBody}>
                  Other {focusGig.category ? focusGig.category.toLowerCase() : "similar"} gigs on GigGround pay around{" "}
                  <Text style={s.strong}>{money(median)}</Text>
                  {focusGig.payUnit === "hr" ? " an hour" : focusGig.payUnit === "day" ? " a day" : ""}.
                  {payDelta < 0
                    ? ` Raising it by ${money(Math.abs(payDelta))} puts you level with them and widens who will take it.`
                    : " Shifts at or above the going rate get taken first."}
                </Text>
                {payDelta < 0 ? (
                  <Pressable style={s.btn} onPress={() => router.push("/modals/boost")}>
                    <Ionicons name="trending-up" size={15} color="#fff" />
                    <Text style={s.btnTxt}>Raise the rate</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </>
        )}

        {/* ── Posting is the hirer's primary action and is never more than one tap
             away, whatever state the current shift is in. These three are what
             the old speed-dial FAB carried. ── */}
        <Pressable style={s.postBtn} onPress={() => router.push("/modals/post-gig")} accessibilityRole="button">
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.postBtnTxt}>Post a shift</Text>
        </Pressable>
        <View style={s.quickRow}>
          <Pressable style={s.quick} onPress={() => router.push("/modals/boost")}>
            <Ionicons name="trending-up-outline" size={15} color={HIRE.accent} />
            <Text style={s.quickTxt}>Boost a gig</Text>
          </Pressable>
          <Pressable style={s.quick} onPress={() => router.push("/modals/refer?mode=invite")}>
            <Ionicons name="person-add-outline" size={15} color={HIRE.accent} />
            <Text style={s.quickTxt}>Invite a worker</Text>
          </Pressable>
        </View>

        {/* ── Bench ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Your bench</Text>
          <Pressable onPress={() => router.push("/modals/refer?mode=invite")}>
            <Text style={[s.sectionLink, { color: HIRE.accent }]}>Invite ›</Text>
          </Pressable>
        </View>
        {bench.length === 0 ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Nobody on your bench yet</Text>
            <Text style={s.cardBody}>
              Anyone who finishes a shift for you lands here. Next time you can ask them directly instead of
              posting to everyone.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
            {bench.map((b) => (
              <Pressable key={b.name} style={s.benchCard} onPress={() => router.push("/modals/post-gig")}>
                <View style={s.benchAv}><Text style={s.benchAvTxt}>{b.initials}</Text></View>
                <Text style={s.benchName} numberOfLines={1}>{b.name.split(" ")[0]}</Text>
                <Text style={s.benchMeta}>{b.shifts} shift{b.shifts === 1 ? "" : "s"}</Text>
                <Text style={[s.benchState, { color: b.reliability >= 80 ? C.green : C.text3 }]}>
                  {b.reliability >= 80 ? "Reliable" : `${b.reliability}%`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Posted gigs ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Your posted gigs</Text>
          {posted.length > 0 ? (
            <Pressable onPress={() => router.push("/(tabs)/profile/my-gigs")}>
              <Text style={[s.sectionLink, { color: HIRE.accent }]}>Manage all ›</Text>
            </Pressable>
          ) : null}
        </View>
        {posted.length === 0 ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>No posted gigs</Text>
            <Text style={s.cardBody}>Post one and workers near {zone} see it straight away.</Text>
            <Pressable style={s.btn} onPress={() => router.push("/modals/post-gig")}>
              <Ionicons name="add" size={15} color="#fff" />
              <Text style={s.btnTxt}>Post a gig</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {posted.map((g, i) => {
              const list = byGig[g.id] || [];
              const isFilled = list.some((a) => FILLED_STATUSES.includes(a.status));
              const openN = list.filter((a) => !FILLED_STATUSES.includes(a.status)).length;
              return (
                <FadeIn key={g.id} delay={i * 60}>
                  <Pressable onPress={() => router.push(`/(tabs)/profile/applicants?gigId=${g.id}`)} style={s.card}>
                    <View style={s.row}>
                      <View style={[s.avatar, { backgroundColor: HIRE.avatar }]}><Text style={s.avatarTxt}>{g.initials}</Text></View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.cardTitle} numberOfLines={1}>{g.title}</Text>
                        <Text style={s.cardSub} numberOfLines={1}>
                          {money(g.payAmount)} · posted {g.postedAgo || "recently"}
                        </Text>
                      </View>
                      {isFilled ? (
                        <View style={s.okChip}><Text style={s.okChipTxt}>Filled</Text></View>
                      ) : (
                        <View style={[s.pinkChip, { backgroundColor: HIRE.badgeBg }]}>
                          <Text style={[s.pinkChipTxt, { color: HIRE.badgeTx }]}>{openN} free</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </FadeIn>
              );
            })}
          </View>
        )}

        {totalApplicants > 0 ? (
          <Text style={s.footNote}>
            {totalApplicants} {totalApplicants === 1 ? "person has" : "people have"} put their hand up across your posts.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10, gap: 12 },
  name: { flex: 1, fontFamily: FJ.xbold, fontSize: 21, color: C.text, letterSpacing: -0.4 },
  bell: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: "#E62B34", borderWidth: 1.5 },

  segWrap: { paddingHorizontal: 20, paddingBottom: 10 },
  segTrack: { flexDirection: "row", borderRadius: 99, padding: 4 },
  segBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 99 },
  segTxt: { fontFamily: FJ.bold, fontSize: 13 },

  hero: { borderRadius: 20, padding: 18, marginBottom: 10, overflow: "hidden" },
  heroRing: { position: "absolute", right: -44, top: -44, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  heroLabel: { color: "rgba(255,255,255,0.62)", fontFamily: FJ.med, fontSize: 12.5 },
  heroBig: { fontFamily: FJ.xbold, fontSize: 23, color: "#fff", letterSpacing: -0.5, marginTop: 3 },
  heroNumRow: { marginTop: 3 },
  heroNum: { fontFamily: FS.bold, fontSize: 30, color: HIRE.heroNum, letterSpacing: -1 },
  heroNumSuffix: { fontFamily: FJ.xbold, fontSize: 19, color: "#fff" },
  heroSub: { color: "rgba(255,255,255,0.5)", fontFamily: FJ.med, fontSize: 11, marginTop: 6, lineHeight: 16 },
  heroBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#fff", borderRadius: 11, paddingVertical: 9, marginTop: 13 },
  heroBtnTxt: { fontFamily: FJ.bold, fontSize: 12, color: HIRE.accent },

  card: { backgroundColor: C.surface, borderRadius: 15, padding: 13, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  cardMagenta: { borderLeftWidth: 3, borderLeftColor: HIRE.accent },
  cardGreen: { borderLeftWidth: 3, borderLeftColor: C.green },
  cardAmber: { borderLeftWidth: 3, borderLeftColor: C.amber },
  cardTitle: { fontFamily: FJ.bold, fontSize: 13, color: C.text },
  cardSub: { fontFamily: FJ.med, fontSize: 10.5, color: C.text2, marginTop: 2, lineHeight: 15 },
  cardBody: { fontFamily: FJ.reg, fontSize: 12, color: C.text2, marginTop: 8, lineHeight: 17.5 },
  strong: { fontFamily: FJ.bold, color: C.text },
  row: { flexDirection: "row", alignItems: "center", gap: 11 },

  avatar: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontFamily: FJ.bold, fontSize: 11, color: "#fff" },
  avatarRound: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.dark ? "#3A1030" : "#EFE4EB", alignItems: "center", justifyContent: "center" },
  avatarRoundTxt: { fontFamily: FJ.bold, fontSize: 12, color: HIRE.accent },

  codeCard: { backgroundColor: HIRE.heroA, borderRadius: 15, padding: 15, alignItems: "center", marginBottom: 8 },
  codeLabel: { fontFamily: FJ.sbold, fontSize: 10.5, color: "rgba(255,255,255,0.6)" },
  codeDigits: { fontFamily: FS.bold, fontSize: 28, color: "#fff", letterSpacing: 5, marginTop: 4 },
  codeSub: { fontFamily: FJ.med, fontSize: 9.5, color: "rgba(255,255,255,0.48)", marginTop: 5 },

  chips: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 9 },
  okChip: { backgroundColor: C.greenSoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  okChipTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: C.green },
  pinkChip: { backgroundColor: C.dark ? "#3A1030" : "#FFD5EE", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  pinkChipTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: HIRE.accent },
  redChip: { backgroundColor: C.redSoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  redChipTxt: { fontFamily: FJ.bold, fontSize: 9.5, color: C.red },

  postBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: HIRE.accent, borderRadius: 13, paddingVertical: 14, marginTop: 2 },
  postBtnTxt: { fontFamily: FJ.xbold, fontSize: 14, color: "#fff", letterSpacing: -0.2 },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  quick: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 11, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  quickTxt: { fontFamily: FJ.bold, fontSize: 11, color: C.text },

  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 9 },
  sectionTitle: { fontFamily: FJ.xbold, fontSize: 15, color: C.text, letterSpacing: -0.3 },
  sectionLink: { fontFamily: FJ.bold, fontSize: 11.5 },

  benchCard: { width: 78, backgroundColor: C.surface, borderRadius: 14, padding: 10, alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  benchAv: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.dark ? "#3A1030" : "#EFE4EB", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  benchAvTxt: { fontFamily: FJ.bold, fontSize: 11.5, color: HIRE.accent },
  benchName: { fontFamily: FJ.bold, fontSize: 10.5, color: C.text },
  benchMeta: { fontFamily: FS.med, fontSize: 8.5, color: C.text2, marginTop: 1 },
  benchState: { fontFamily: FJ.bold, fontSize: 8.5, marginTop: 4 },

  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: HIRE.accent, borderRadius: 11, paddingVertical: 11, marginTop: 11 },
  btnTxt: { fontFamily: FJ.bold, fontSize: 12.5, color: "#fff" },

  footNote: { fontFamily: FJ.med, fontSize: 11, color: C.text3, marginTop: 16, textAlign: "center" },
});
