import { useCallback, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Chip, Skeleton, Empty, VerifiedBadge } from "../../../components/ui";
import { ApplicantCard } from "../../../components/ApplicantCard";
import DayPicker from "../../../components/DayPicker";
import { gigsAPI, applicantsAPI, OPEN_APP_STATUSES } from "../../../lib/api";
import { formatPayRange } from "../../../lib/pay";
import { F } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";

const todayISO = () => new Date().toISOString().slice(0, 10);
const isExpired = (g) => g.completeBy && new Date(g.completeBy + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0));

export default function MyGigs() {
  const C = useC();
  const s = makeStyles(C);
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

  const reportNoShow = async (gigId, applicantId) => {
    await applicantsAPI.reportNoShow(gigId, applicantId);
    setApplicantsByGig((prev) => ({ ...prev, [gigId]: prev[gigId].map((a) => a.id === applicantId ? { ...a, status: "no_show", noShows: a.noShows + 1 } : a) }));
  };

  const startRelist = (gig) => { setRelistingId(gig.id); setRelistDate(todayISO()); };
  const confirmRelist = async (gig) => {
    await gigsAPI.relist(gig.id, { workDate: relistDate, completeBy: relistDate });
    setRelistingId(null);
    await load();
  };

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
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={[s.sectionLbl, { marginBottom: 0 }]}>Applicants ({applicants.length})</Text>
                    {applicants.some((a) => OPEN_APP_STATUSES.includes(a.status)) ? (
                      <Pressable onPress={() => router.push(`/(tabs)/profile/applicants?gigId=${gig.id}`)} style={s.triageLink}>
                        <Text style={s.triageTxt}>Sort & triage</Text>
                        <Ionicons name="chevron-forward" size={12} color={C.indigo} />
                      </Pressable>
                    ) : null}
                  </View>
                  {applicants.length === 0 ? (
                    <Text style={s.noApplicants}>No applicants yet.</Text>
                  ) : applicants.map((a) => (
                    <ApplicantCard key={a.id} applicant={a} onNoShow={() => reportNoShow(gig.id, a.id)} />
                  ))}
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
  triageLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  triageTxt: { fontFamily: F.med, fontSize: 12, color: C.indigo },
  noApplicants: { fontFamily: F.reg, fontSize: 12, color: C.text3 },
  relistBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.indigo, borderRadius: 10, paddingVertical: 11, marginTop: 12 },
  relistBtnTxt: { fontFamily: F.bold, fontSize: 12, color: "#fff" },
  cancelBtn: { flex: 0, alignItems: "center", justifyContent: "center", paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10, backgroundColor: C.surface2 },
  cancelBtnTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
});
