import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Chip, Skeleton, Empty, VerifiedBadge } from "../../../components/ui";
import DayPicker from "../../../components/DayPicker";
import { gigsAPI, applicantsAPI, OPEN_APP_STATUSES } from "../../../lib/api";
import { compatTone } from "../../../lib/skills";
import { formatPayRange } from "../../../lib/pay";
import { F } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";

const todayISO = () => new Date().toISOString().slice(0, 10);
const isExpired = (g) => g.completeBy && new Date(g.completeBy + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0));
const BOOKED_STATUSES = ["confirmed", "in_shift"];
const makeTone = (C) => ({ high: { bg: C.indigoSoft, fg: C.indigo }, mid: { bg: C.dark ? "#3A2A10" : "#FEF3E2", fg: C.amber }, low: { bg: C.surface2, fg: C.text3 } });

export default function MyGigs() {
  const C = useC();
  const s = makeStyles(C);
  const TONE = makeTone(C);
  const router = useRouter();
  const [gigs, setGigs] = useState(null);
  const [applicantsByGig, setApplicantsByGig] = useState({});
  const [relistingId, setRelistingId] = useState(null);
  const [relistDate, setRelistDate] = useState(todayISO());

  const load = useCallback(async () => {
    const my = await gigsAPI.getMy();
    setGigs(my);
    const entries = await Promise.all(my.map(async (g) => [g.id, await applicantsAPI.getForGig(g.id)]));
    setApplicantsByGig(Object.fromEntries(entries));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const reportNoShow = (gigId, a) => Alert.alert(
    "Report no-show?",
    `${a.name} will be marked as a no-show for this booking and get a strike. This can't be undone.`,
    [{ text: "Cancel", style: "cancel" }, { text: "Report no-show", style: "destructive", onPress: async () => {
      await applicantsAPI.reportNoShow(gigId, a.id);
      setApplicantsByGig((prev) => ({ ...prev, [gigId]: prev[gigId].map((x) => x.id === a.id ? { ...x, status: "no_show", noShows: x.noShows + 1 } : x) }));
    } }]
  );

  const startRelist = (gig) => { setRelistingId(gig.id); setRelistDate(todayISO()); };
  const confirmRelist = async (gig) => {
    await gigsAPI.relist(gig.id, { workDate: relistDate, completeBy: relistDate });
    setRelistingId(null);
    await load();
  };

  const openTriage = (gigId) => router.push(`/(tabs)/profile/applicants?gigId=${gigId}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={20} color={C.navy} /></Pressable>
        <Text style={s.h}>My posted gigs</Text>
        <Pressable onPress={() => router.push("/modals/post-gig")} hitSlop={8}><Ionicons name="add" size={22} color={C.indigo} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {!gigs ? <Skeleton height={140} /> : gigs.length === 0 ? (
          <Empty icon={<Ionicons name="briefcase-outline" size={36} color={C.text3} />} title="No posted gigs yet" subtitle="Post a gig from the home screen to start hiring." />
        ) : gigs.map((gig) => {
          const expired = isExpired(gig);
          const applicants = applicantsByGig[gig.id] || [];
          const open = applicants.filter((a) => OPEN_APP_STATUSES.includes(a.status));
          const booked = applicants.filter((a) => BOOKED_STATUSES.includes(a.status));
          const hired = applicants.find((a) => a.status === "hired");
          const top = applicants.find((a) => a.topPick) || open[0];
          const shortlisted = open.filter((a) => a.status === "shortlisted").length;

          return (
            <View key={gig.id} style={[s.card, expired && s.cardExpired]}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={s.title}>{gig.title}</Text>
                    {expired ? <Chip label="Expired" tone="neutral" small /> : null}
                    {gig.reported ? <Chip label="Reported" tone="red" small /> : null}
                  </View>
                  <Text style={s.meta}>{gig.area} · Complete by {gig.completeBy}</Text>
                </View>
                <Text style={s.pay}>{formatPayRange(gig.payMin ?? gig.payAmount, gig.payMax, gig.payUnit)}</Text>
              </View>
              {gig.verifiedHirer ? <View style={{ marginTop: 8 }}><VerifiedBadge label="Verified Hirer" /></View> : null}

              {expired ? (
                relistingId === gig.id ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={s.sectionLbl}>New work day</Text>
                    <DayPicker value={relistDate} onChange={setRelistDate} />
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                      <Pressable onPress={() => confirmRelist(gig)} style={s.relistBtn}><Text style={s.relistBtnTxt}>Confirm re-list</Text></Pressable>
                      <Pressable onPress={() => setRelistingId(null)} style={s.cancelBtn}><Text style={s.cancelBtnTxt}>Cancel</Text></Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={() => startRelist(gig)} style={s.relistBtn}>
                    <Ionicons name="refresh" size={14} color="#fff" />
                    <Text style={s.relistBtnTxt}>Re-list</Text>
                  </Pressable>
                )
              ) : (
                <View style={{ marginTop: 14 }}>
                  {/* Hired — the decision is made */}
                  {hired ? (
                    <View style={s.hiredBanner}>
                      <Ionicons name="checkmark-circle" size={15} color={C.green} />
                      <Text style={s.hiredTxt}>{hired.name} hired</Text>
                    </View>
                  ) : null}

                  {/* Booked workers — the only thing you manage inline is a no-show */}
                  {booked.map((a) => (
                    <View key={a.id} style={s.bookedRow}>
                      <View style={s.dot} />
                      <Text style={s.bookedName} numberOfLines={1}>{a.name}</Text>
                      <Chip label={a.status === "in_shift" ? "In shift" : "Confirmed"} tone="indigo" small />
                      <Pressable onPress={() => reportNoShow(gig.id, a)} hitSlop={6} style={s.noShowLink}>
                        <Text style={s.noShowTxt}>Didn't show</Text>
                      </Pressable>
                    </View>
                  ))}

                  {/* Who to hire — one preview + one clear way in */}
                  {open.length > 0 ? (
                    <Pressable onPress={() => openTriage(gig.id)} style={s.reviewBtn}>
                      {top && top.compat != null ? (() => { const t = TONE[compatTone(top.compat)]; return (
                        <View style={[s.ring, { borderColor: t.fg, backgroundColor: t.bg }]}>
                          <Text style={[s.ringN, { color: t.fg }]}>{top.compat}</Text>
                        </View>
                      ); })() : null}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.reviewTitle}>Review & hire</Text>
                        <Text style={s.reviewSub} numberOfLines={1}>
                          {top ? `Top match: ${top.name}` : `${open.length} waiting`}
                          {shortlisted > 0 ? ` · ${shortlisted} shortlisted` : ""}
                        </Text>
                      </View>
                      <View style={s.waitBadge}><Text style={s.waitTxt}>{open.length} waiting</Text></View>
                      <Ionicons name="chevron-forward" size={18} color={C.indigo} />
                    </Pressable>
                  ) : !hired && booked.length === 0 ? (
                    <Text style={s.noApplicants}>No applicants yet — we'll notify you the moment someone applies.</Text>
                  ) : booked.length > 0 && !hired ? (
                    <Pressable onPress={() => openTriage(gig.id)} style={s.linkRow}>
                      <Text style={s.linkTxt}>View all applicants</Text>
                      <Ionicons name="chevron-forward" size={13} color={C.indigo} />
                    </Pressable>
                  ) : null}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 14, marginBottom: 12 },
  cardExpired: { opacity: 0.75 },
  title: { fontFamily: F.bold, fontSize: 14, color: C.text },
  meta: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 3 },
  pay: { fontFamily: F.bold, fontSize: 14, color: C.green },
  sectionLbl: { fontFamily: F.bold, fontSize: 11, color: C.text2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  noApplicants: { fontFamily: F.reg, fontSize: 12.5, color: C.text3, lineHeight: 18 },

  hiredBanner: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.greenSoft, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, marginBottom: 10 },
  hiredTxt: { fontFamily: F.bold, fontSize: 12.5, color: C.green },

  bookedRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.indigo },
  bookedName: { flex: 1, fontFamily: F.bold, fontSize: 13, color: C.text },
  noShowLink: { paddingHorizontal: 4, paddingVertical: 2 },
  noShowTxt: { fontFamily: F.med, fontSize: 12, color: C.red },

  reviewBtn: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: C.indigoSoft, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, marginTop: 2 },
  ring: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  ringN: { fontFamily: F.bold, fontSize: 14 },
  reviewTitle: { fontFamily: F.bold, fontSize: 14, color: C.indigo },
  reviewSub: { fontFamily: F.med, fontSize: 12, color: C.indigo, opacity: 0.8, marginTop: 1 },
  waitBadge: { backgroundColor: C.indigo, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  waitTxt: { fontFamily: F.bold, fontSize: 11, color: "#fff" },

  linkRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  linkTxt: { fontFamily: F.med, fontSize: 12.5, color: C.indigo },

  relistBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.indigo, borderRadius: 10, paddingVertical: 11, marginTop: 12 },
  relistBtnTxt: { fontFamily: F.bold, fontSize: 12, color: "#fff" },
  cancelBtn: { flex: 0, alignItems: "center", justifyContent: "center", paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10, backgroundColor: C.surface2 },
  cancelBtnTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
});
