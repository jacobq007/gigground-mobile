import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field } from "../../components/ui";
import AreaPicker from "../../components/AreaPicker";
import DayPicker from "../../components/DayPicker";
import { useAuth } from "../../lib/AuthContext";
import { gigsAPI } from "../../lib/api";
import { MIN_PAY } from "../../lib/constants";
import { violatesGuidelines } from "../../lib/moderation";
import { SKILL_GROUPS, GROUP_TINT as TINT, GROUP_TINT_FG as TINT_FG } from "../../lib/skills";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function PostGig() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [group, setGroup] = useState(null);   // chosen SKILL_GROUP
  const [skillKey, setSkillKey] = useState(null); // chosen skill within the group
  const [title, setTitle] = useState("");
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

  const skilled = !!group?.skilled;
  const jobKind = skillKey === "delivery" ? "delivery" : "errand";
  const minFloor = MIN_PAY[jobKind] ?? MIN_PAY.default;
  const canSubmit = title && payMin && area && group && skillKey;

  const pickGroup = (g) => { setGroup(g); setSkillKey(null); setError(""); setStep(2); };

  const post = async () => {
    if (submitting.current) return;
    setError("");
    if (!group || !skillKey) { setError("Pick a category and what exactly you need."); return; }
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
        urgent: false, hrs: hrs || "Flexible", timing: "This week", category: group.label, desc, postedAgo: "now",
        workDate, completeBy, reported: false, verifiedHirer: user?.isVerifiedHirer || false,
        skillRequired: skilled, skillKey: skilled ? skillKey : null,
      });
      router.back();
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const skillLabelOf = (k) => group?.skills.find((x) => x.key === k)?.label || k;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => (step === 2 ? setStep(1) : router.back())} hitSlop={8}>
          <Ionicons name={step === 2 ? "arrow-back" : "close"} size={22} color={C.navy} />
        </Pressable>
        <Text style={s.h}>Post a gig</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Step progress */}
        <View style={s.progTrack}><View style={[s.progFill, { width: step === 1 ? "50%" : "100%" }]} /></View>
        <Text style={s.progLbl}>{step === 1 ? "Step 1 of 2 · Choose a category" : `Step 2 of 2 · ${group?.label}`}</Text>

        {step === 1 ? (
          <View style={s.grid}>
            {SKILL_GROUPS.map((g) => {
              const examples = g.skills.slice(0, 3).map((x) => x.label).join(" · ");
              return (
                <Pressable key={g.key} onPress={() => pickGroup(g)} style={s.box}>
                  <View style={[s.boxIcon, { backgroundColor: TINT[g.key] || C.surface2 }]}>
                    <Ionicons name={g.icon} size={22} color={TINT_FG[g.key] || C.text2} />
                  </View>
                  <Text style={s.boxName}>{g.label}</Text>
                  <Text style={s.boxEx} numberOfLines={2}>{examples}</Text>
                  <Ionicons name="chevron-forward" size={15} color={C.text3} style={s.boxChevron} />
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {/* Chosen category chip */}
            <Pressable onPress={() => setStep(1)} style={s.selChip}>
              <View style={[s.selIcon, { backgroundColor: TINT[group.key] || C.surface2 }]}>
                <Ionicons name={group.icon} size={17} color={TINT_FG[group.key] || C.text2} />
              </View>
              <Text style={s.selName}>{group.label}{skillKey ? ` · ${skillLabelOf(skillKey)}` : ""}</Text>
              <Text style={s.change}>Change</Text>
            </Pressable>

            {/* Which one within the category */}
            <View>
              <Text style={s.lbl}>{skilled ? "Which skill?" : "What kind?"}</Text>
              <View style={s.chips}>
                {group.skills.map((sk) => {
                  const on = skillKey === sk.key;
                  return (
                    <Pressable key={sk.key} onPress={() => setSkillKey(sk.key)} style={[s.chip, on && s.chipOn]}>
                      <Text style={[s.chipTxt, on && { color: "#fff" }]}>{sk.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {skillKey ? (
                <View style={s.note}>
                  <Ionicons name={skilled ? "shield-checkmark" : "people-outline"} size={12} color={skilled ? C.indigo : C.text3} />
                  <Text style={s.noteTxt}>{skilled ? "Matched to verified pros first — workers see a Skilled badge." : "Open to anyone reliable nearby."}</Text>
                </View>
              ) : null}
            </View>

            <Field label="What do you need done?" value={title} onChangeText={setTitle} placeholder="e.g. Help moving furniture" />

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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  progTrack: { height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: "hidden" },
  progFill: { height: "100%", backgroundColor: C.indigo, borderRadius: 3 },
  progLbl: { fontFamily: F.med, fontSize: 11.5, color: C.text2, marginTop: 7, marginBottom: 18 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  box: { width: "47.5%", flexGrow: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 15, minHeight: 120, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  boxIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  boxName: { fontFamily: F.bold, fontSize: 14, color: C.text },
  boxEx: { fontFamily: F.reg, fontSize: 10.5, color: C.text3, marginTop: 3, lineHeight: 14 },
  boxChevron: { position: "absolute", top: 16, right: 14 },

  selChip: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: C.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 11 },
  selIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  selName: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.text },
  change: { fontFamily: F.med, fontSize: 12.5, color: C.indigo },

  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  chipTxt: { fontFamily: F.med, fontSize: 12.5, color: C.text },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 11 },
  noteTxt: { flex: 1, fontFamily: F.reg, fontSize: 12, color: C.text2, lineHeight: 17 },

  unit: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  unitOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  unitTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  err: { fontFamily: F.med, fontSize: 12, color: C.red },
});
