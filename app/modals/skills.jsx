import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Toast } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { SKILL_GROUPS, LEVELS, isSkilled, verifiedSkills, openToKeys, profileStrength } from "../../lib/skills";
import { C, F } from "../../lib/theme";

export default function Skills() {
  const router = useRouter();
  const { user, update } = useAuth();
  const [graph, setGraph] = useState(() => (user?.skillGraph || []).map((s) => ({ ...s })));
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const entry = (key) => graph.find((s) => s.key === key);
  const has = (key) => !!entry(key);

  const toggle = (key) => {
    setGraph((g) => {
      if (g.some((s) => s.key === key)) return g.filter((s) => s.key !== key);
      const base = isSkilled(key) ? { key, level: "experienced", years: 1, proofUploaded: false, verified: false } : { key };
      return [...g, base];
    });
  };
  const setLevel = (key, level) => setGraph((g) => g.map((s) => s.key === key ? { ...s, level } : s));
  const bumpYears = (key, d) => setGraph((g) => g.map((s) => s.key === key ? { ...s, years: Math.max(0, (s.years || 0) + d) } : s));
  const toggleProof = (key) => setGraph((g) => g.map((s) => s.key === key ? { ...s, proofUploaded: !s.proofUploaded, verified: !s.proofUploaded } : s));

  const previewUser = { skillGraph: graph };
  const strength = Math.round(profileStrength(previewUser) * 100);
  const vCount = verifiedSkills(previewUser).length;
  const oCount = openToKeys(previewUser).length;
  const matchTypes = useMemo(() => new Set(graph.map((s) => s.key)).size, [graph]);

  const save = async () => {
    setBusy(true);
    // Derive `verified` from proof at save time so it can't drift.
    const clean = graph.map((s) => isSkilled(s.key) ? { ...s, verified: !!s.proofUploaded } : { key: s.key });
    try {
      await update({ skillGraph: clean });
      setToast("Skills saved");
      setTimeout(() => router.back(), 700);
    } catch {
      setBusy(false);
      setToast("Couldn't save — try again");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>What can you do?</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <Text style={s.lede}>Add every skill you're good at. The more you prove, the more — and better-paid — jobs we match you to.</Text>
        <View style={s.progWrap}>
          <View style={s.progTrack}><View style={[s.progFill, { width: `${strength}%` }]} /></View>
          <Text style={s.progLbl}>Profile strength {strength}%{vCount === 0 ? " · add proof to reach Verified" : ""}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {SKILL_GROUPS.map((group) => (
          <View key={group.key} style={{ marginBottom: 20 }}>
            <View style={s.groupHead}>
              <View style={[s.groupTag, group.skilled ? s.tagSkill : s.tagGen]}>
                <Text style={[s.groupTagTxt, { color: group.skilled ? C.indigo : C.text2 }]}>{group.skilled ? "Skilled" : "General"}</Text>
              </View>
              <Text style={s.groupName}>{group.label}</Text>
              {!group.skilled ? <Text style={s.noProof}>· no proof needed</Text> : null}
            </View>

            <View style={s.chips}>
              {group.skills.map((sk) => {
                const on = has(sk.key);
                return (
                  <Pressable key={sk.key} onPress={() => toggle(sk.key)} style={[s.chip, on && (group.skilled ? s.chipOn : s.chipOnGen)]}>
                    {on ? <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} /> : <Text style={s.plus}>+ </Text>}
                    <Text style={[s.chipTxt, on && { color: "#fff" }]}>{sk.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Detail cards for selected skilled skills */}
            {group.skilled && group.skills.filter((sk) => has(sk.key)).map((sk) => {
              const e = entry(sk.key);
              return (
                <View key={sk.key} style={s.det}>
                  <Text style={s.detH}>{sk.label}</Text>
                  <View style={s.lvRow}>
                    {LEVELS.map((l) => (
                      <Pressable key={l.key} onPress={() => setLevel(sk.key, l.key)} style={[s.lvBtn, e.level === l.key && s.lvBtnOn]}>
                        <Text style={[s.lvTxt, e.level === l.key && { color: "#fff" }]}>{l.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={s.detRow}>
                    <Text style={s.detK}>Years of experience</Text>
                    <View style={s.stepper}>
                      <Pressable onPress={() => bumpYears(sk.key, -1)} hitSlop={6} style={s.stepBtn}><Ionicons name="remove" size={15} color={C.text2} /></Pressable>
                      <Text style={s.stepVal}>{e.years || 0} yr</Text>
                      <Pressable onPress={() => bumpYears(sk.key, 1)} hitSlop={6} style={s.stepBtn}><Ionicons name="add" size={15} color={C.text2} /></Pressable>
                    </View>
                  </View>
                  <Pressable onPress={() => toggleProof(sk.key)} style={[s.proofRow, e.proofUploaded && s.proofRowOn]}>
                    <Ionicons name={e.proofUploaded ? "checkmark-circle" : "cloud-upload-outline"} size={16} color={e.proofUploaded ? C.green : C.indigo} />
                    <Text style={[s.proofTxt, e.proofUploaded && { color: C.green }]}>
                      {e.proofUploaded ? "Proof uploaded · Verified" : "Add proof — certificate or portfolio"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.summ}>
          <Text style={s.summT}>{vCount} verified skill{vCount === 1 ? "" : "s"} · {oCount} you're open to</Text>
          <Text style={s.summS}>You'll be matched to {matchTypes} job type{matchTypes === 1 ? "" : "s"}</Text>
        </View>
        <Button title={busy ? "Saving…" : "Save skills"} onPress={save} disabled={busy || graph.length === 0} />
      </View>
      <Toast message={toast} visible={!!toast} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lede: { fontFamily: F.reg, fontSize: 13, color: C.text2, lineHeight: 19 },
  progWrap: { marginTop: 12 },
  progTrack: { height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: "hidden" },
  progFill: { height: "100%", backgroundColor: C.indigo, borderRadius: 3 },
  progLbl: { fontFamily: F.med, fontSize: 11, color: C.text2, marginTop: 6 },

  groupHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  groupTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  tagSkill: { backgroundColor: C.indigoSoft }, tagGen: { backgroundColor: C.surface2 },
  groupTagTxt: { fontFamily: F.bold, fontSize: 9.5, letterSpacing: 0.4, textTransform: "uppercase" },
  groupName: { fontFamily: F.bold, fontSize: 13.5, color: C.text },
  noProof: { fontFamily: F.reg, fontSize: 11, color: C.text3 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  chipOnGen: { backgroundColor: C.navy, borderColor: C.navy },
  plus: { fontFamily: F.bold, fontSize: 13, color: C.text3 },
  chipTxt: { fontFamily: F.med, fontSize: 13, color: C.text },

  det: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.indigo, borderRadius: 14, padding: 12, marginTop: 10 },
  detH: { fontFamily: F.bold, fontSize: 13, color: C.text, marginBottom: 9 },
  lvRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  lvBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 9, backgroundColor: C.surface2, borderWidth: 1, borderColor: "transparent" },
  lvBtnOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  lvTxt: { fontFamily: F.bold, fontSize: 11.5, color: C.text2 },
  detRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  detK: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  stepVal: { fontFamily: F.bold, fontSize: 12.5, color: C.text, minWidth: 34, textAlign: "center" },
  proofRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  proofRowOn: {},
  proofTxt: { fontFamily: F.bold, fontSize: 12, color: C.indigo },

  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, backgroundColor: C.bg },
  summ: { marginBottom: 10 },
  summT: { fontFamily: F.bold, fontSize: 12.5, color: C.text },
  summS: { fontFamily: F.reg, fontSize: 11.5, color: C.text2, marginTop: 2 },
});
