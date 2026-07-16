import { useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field } from "../../components/ui";
import AreaPicker from "../../components/AreaPicker";
import DayPicker from "../../components/DayPicker";
import { useAuth } from "../../lib/AuthContext";
import { gigsAPI } from "../../lib/api";
import { MIN_PAY } from "../../lib/constants";
import { violatesGuidelines } from "../../lib/moderation";
import { inferSkill, searchSkills, POPULAR_SKILLS } from "../../lib/skills";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function PostGig() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [sel, setSel] = useState(null);        // chosen category/skill (skill-index entry) or null
  const [picking, setPicking] = useState(false); // search picker open
  const [query, setQuery] = useState("");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [unit, setUnit] = useState("hr");
  const [hrs, setHrs] = useState("");
  const [area, setArea] = useState(user?.area || "");
  const [desc, setDesc] = useState("");
  const [workDate, setWorkDate] = useState(todayISO());
  const [completeBy, setCompleteBy] = useState(todayISO());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const inferred = useMemo(() => inferSkill(title), [title]);
  const results = useMemo(() => searchSkills(query), [query]);
  const jobKind = sel?.key === "delivery" ? "delivery" : "errand";
  const minFloor = MIN_PAY[jobKind] ?? MIN_PAY.default;
  const canSubmit = title && payMin && area && sel;

  const choose = (item) => { setSel(item); setPicking(false); setQuery(""); setError(""); };

  const post = async () => {
    if (submitting.current) return;
    setError("");
    if (!sel) { setError("Pick what kind of work this is."); return; }
    const min = parseInt(payMin, 10) || 0;
    const max = payMax ? parseInt(payMax, 10) || 0 : min;
    if (max < min) { setError("Max pay can't be lower than min pay."); return; }
    if (min < minFloor) { setError(`Minimum pay for this job type is ₹${minFloor}.`); return; }
    if (completeBy < workDate) { setError("Complete-by date can't be before the work day."); return; }
    if (violatesGuidelines(title, desc)) { setError("This post violates community guidelines."); return; }

    submitting.current = true;
    setBusy(true);
    try {
      await gigsAPI.create({
        title, who: user?.name || "You", initials: (user?.name || "Y").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        area, payAmount: min, payMin: min, payMax: max, payUnit: unit, type: "ONE TIME", gigSubType: "quick", jobKind,
        urgent: false, hrs: hrs || "Flexible", timing: "This week", category: sel.groupLabel || "General", desc, postedAgo: "now",
        workDate, completeBy, reported: false, verifiedHirer: user?.isVerifiedHirer || false,
        skillRequired: !!sel.skilled, skillKey: sel.skilled ? sel.key : null,
      });
      router.back();
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const NoteLine = ({ skilled }) => (
    <View style={s.noteLine}>
      <Ionicons name={skilled ? "shield-checkmark" : "people-outline"} size={12} color={skilled ? C.indigo : C.text3} />
      <Text style={s.noteTxt}>{skilled ? "Matched to verified pros first — workers see a Skilled badge." : "Open to anyone reliable nearby — no verification needed."}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>Post a gig</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 14 }}>
          <Field label="What do you need?" value={title} onChangeText={setTitle} placeholder="e.g. Help moving furniture" />

          {/* ── Category — inferred from the title, with a search fallback ── */}
          <View>
            <Text style={s.lbl}>Category</Text>

            {picking ? (
              <View>
                <View style={s.search}>
                  <Ionicons name="search" size={15} color={C.indigo} />
                  <TextInput
                    value={query} onChangeText={setQuery} autoFocus
                    placeholder="Search a skill or job — e.g. cooking"
                    placeholderTextColor={C.text3} style={s.searchInput}
                  />
                  <Pressable onPress={() => { setPicking(false); setQuery(""); }} hitSlop={8}>
                    <Ionicons name="close" size={16} color={C.text3} />
                  </Pressable>
                </View>

                {query ? (
                  results.length === 0 ? (
                    <Text style={s.empty}>No match for “{query}”. Try another word.</Text>
                  ) : (
                    <View style={s.results}>
                      {results.slice(0, 8).map((r) => (
                        <Pressable key={r.key} onPress={() => choose(r)} style={s.resultRow}>
                          <Ionicons name={r.icon} size={16} color={C.text2} />
                          <Text style={s.resultLbl}>{r.label}</Text>
                          <Text style={s.resultGrp}>{r.groupLabel}</Text>
                          <Text style={[s.resultTag, r.skilled && { color: C.indigo }]}>{r.skilled ? "verified pros" : "anyone nearby"}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )
                ) : (
                  <>
                    <Text style={s.orLbl}>Popular</Text>
                    <View style={s.popularRow}>
                      {POPULAR_SKILLS.map((p) => (
                        <Pressable key={p.key} onPress={() => choose(p)} style={s.pop}>
                          <Ionicons name={p.icon} size={13} color={C.text2} />
                          <Text style={s.popTxt}>{p.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ) : sel ? (
              <View style={[s.catCard, sel.skilled && s.catCardSkill]}>
                <View style={s.catRow}>
                  <Ionicons name={sel.icon} size={17} color={sel.skilled ? C.indigo : C.navy} />
                  <Text style={s.catTitle}>{sel.groupLabel} · <Text style={{ color: sel.skilled ? C.indigo : C.text }}>{sel.label}</Text></Text>
                  <Pressable onPress={() => setPicking(true)} hitSlop={8}><Text style={s.change}>Change</Text></Pressable>
                </View>
                <NoteLine skilled={sel.skilled} />
              </View>
            ) : inferred ? (
              <View style={s.sugCard}>
                <View style={s.catRow}>
                  <Ionicons name="sparkles" size={15} color={C.indigo} />
                  <Text style={s.sugTitle}>Looks like <Text style={s.sugStrong}>{inferred.groupLabel} · {inferred.label}</Text></Text>
                </View>
                <NoteLine skilled={inferred.skilled} />
                <View style={s.sugActions}>
                  <Pressable onPress={() => choose(inferred)} style={s.useBtn}><Text style={s.useTxt}>Yes, use this</Text></Pressable>
                  <Pressable onPress={() => setPicking(true)} hitSlop={8}><Text style={s.change}>Pick another</Text></Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setPicking(true)} style={s.choose}>
                <Ionicons name="add-circle-outline" size={16} color={C.text3} />
                <Text style={s.chooseTxt}>{title.trim().length >= 3 ? "Choose a category" : "Type what you need, we'll suggest one"}</Text>
                <Ionicons name="chevron-forward" size={15} color={C.text3} style={{ marginLeft: "auto" }} />
              </Pressable>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}><Field label={`Min pay (₹, floor ₹${minFloor})`} value={payMin} onChangeText={setPayMin} keyboardType="number-pad" placeholder={String(minFloor)} /></View>
            <View style={{ flex: 1 }}><Field label="Max pay (₹, optional)" value={payMax} onChangeText={setPayMax} keyboardType="number-pad" placeholder="e.g. 800" /></View>
          </View>
          <View>
            <Text style={s.lbl}>Per</Text>
            <View style={{ flexDirection: "row", gap: 5 }}>
              {[["hr", "Hour"], ["day", "Day"], ["fixed", "Job"]].map(([v, l]) => (
                <Pressable key={v} onPress={() => setUnit(v)} style={[s.unit, unit === v && s.unitOn]}>
                  <Text style={[s.unitTxt, unit === v && { color: C.indigo }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Field label="Duration" value={hrs} onChangeText={setHrs} placeholder="e.g. 4 hrs" />
          <Field label="Description" value={desc} onChangeText={setDesc} multiline placeholder="Details workers should know" />

          <View>
            <Text style={s.lbl}>Area</Text>
            <AreaPicker value={area} onChange={setArea} height={180} />
          </View>

          <View>
            <Text style={s.lbl}>Work day</Text>
            <DayPicker value={workDate} onChange={(d) => { setWorkDate(d); if (completeBy < d) setCompleteBy(d); }} />
          </View>
          <View>
            <Text style={s.lbl}>Complete by</Text>
            <DayPicker value={completeBy} onChange={setCompleteBy} minDate={workDate} />
          </View>

          {error ? <Text style={s.err}>{error}</Text> : null}
          <Button title={busy ? "Posting…" : "Post gig"} onPress={post} disabled={busy || !canSubmit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
  unit: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  unitOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  unitTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  err: { fontFamily: F.med, fontSize: 12, color: C.red },

  noteLine: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 9 },
  noteTxt: { flex: 1, fontFamily: F.reg, fontSize: 12, color: C.text2, lineHeight: 17 },
  change: { fontFamily: F.med, fontSize: 12.5, color: C.indigo },

  // selected
  catCard: { borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, backgroundColor: C.surface },
  catCardSkill: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  catRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  catTitle: { flex: 1, fontFamily: F.bold, fontSize: 13.5, color: C.text },

  // suggestion
  sugCard: { borderWidth: 1, borderColor: C.indigo, borderRadius: 12, padding: 13, backgroundColor: C.indigoSoft },
  sugTitle: { flex: 1, fontFamily: F.med, fontSize: 13.5, color: C.text },
  sugStrong: { fontFamily: F.bold },
  sugActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12 },
  useBtn: { backgroundColor: C.indigo, borderRadius: 9, paddingHorizontal: 15, paddingVertical: 9 },
  useTxt: { fontFamily: F.bold, fontSize: 12.5, color: "#fff" },

  // choose prompt
  choose: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: C.border, borderRadius: 12, borderStyle: "dashed", paddingHorizontal: 13, paddingVertical: 13, backgroundColor: C.surface },
  chooseTxt: { fontFamily: F.med, fontSize: 13, color: C.text3 },

  // search picker
  search: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: C.indigo, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: C.surface },
  searchInput: { flex: 1, fontFamily: F.reg, fontSize: 13.5, color: C.text, padding: 0 },
  empty: { fontFamily: F.reg, fontSize: 12.5, color: C.text3, marginTop: 12 },
  results: { marginTop: 6 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  resultLbl: { fontFamily: F.med, fontSize: 13.5, color: C.text },
  resultGrp: { fontFamily: F.reg, fontSize: 11.5, color: C.text3 },
  resultTag: { marginLeft: "auto", fontFamily: F.med, fontSize: 10.5, color: C.text3 },
  orLbl: { fontFamily: F.med, fontSize: 11, color: C.text3, marginTop: 14, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  popularRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  pop: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: C.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.surface },
  popTxt: { fontFamily: F.med, fontSize: 12.5, color: C.text2 },
});
