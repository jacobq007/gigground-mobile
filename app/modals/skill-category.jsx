import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Toast } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { groupMeta, groupConfig, getGroupExtras, LEVELS, isSkilled } from "../../lib/skills";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

export default function SkillCategory() {
  const router = useRouter();
  const { group: groupKey } = useLocalSearchParams();
  const { user, update } = useAuth();
  const C = useC();
  const s = makeStyles(C);
  const group = groupMeta(groupKey);
  const cfg = groupConfig(groupKey);

  const groupSkillKeys = group ? new Set(group.skills.map((sk) => sk.key)) : new Set();
  // Only the entries belonging to THIS category are editable here; others are left intact.
  const [graph, setGraph] = useState(() => (user?.skillGraph || []).map((s) => ({ ...s })));
  const savedExtras = getGroupExtras(user, groupKey);
  const [tags, setTags] = useState(savedExtras.tags || []);
  const [mode, setMode] = useState(savedExtras.mode || null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  if (!group) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}><Text style={{ padding: 20 }}>Unknown category.</Text></SafeAreaView>;
  }
  const skilled = group.skilled;
  const entry = (key) => graph.find((s) => s.key === key);
  const has = (key) => !!entry(key);

  const toggle = (key) => setGraph((g) => {
    if (g.some((s) => s.key === key)) return g.filter((s) => s.key !== key);
    return [...g, skilled ? { key, level: "experienced", years: 1, proofUploaded: false, verified: false } : { key }];
  });
  const setLevel = (key, level) => setGraph((g) => g.map((s) => s.key === key ? { ...s, level } : s));
  const bumpYears = (key, d) => setGraph((g) => g.map((s) => s.key === key ? { ...s, years: Math.max(0, (s.years || 0) + d) } : s));
  const toggleProof = (key) => setGraph((g) => g.map((s) => s.key === key ? { ...s, proofUploaded: !s.proofUploaded, verified: !s.proofUploaded } : s));
  const toggleTag = (t) => setTags((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]);

  const picked = group.skills.filter((sk) => has(sk.key)).length;

  const save = async () => {
    setBusy(true);
    const clean = graph.map((s) => isSkilled(s.key) ? { ...s, verified: !!s.proofUploaded } : { key: s.key });
    const skillMeta = { ...(user?.skillMeta || {}), [groupKey]: { tags, mode } };
    try {
      await update({ skillGraph: clean, skillMeta });
      setToast("Saved");
      setTimeout(() => router.back(), 650);
    } catch {
      setBusy(false);
      setToast("Couldn't save — try again");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="chevron-back" size={24} color={C.navy} /></Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Ionicons name={group.icon} size={16} color={C.indigo} />
          <Text style={s.h}>{group.label}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={s.blurb}>{cfg.blurb}</Text>

        <Text style={s.sectionLbl}>{skilled ? "What can you do here?" : "Jobs you'll take"}</Text>
        <View style={s.chips}>
          {group.skills.map((sk) => {
            const on = has(sk.key);
            return (
              <Pressable key={sk.key} onPress={() => toggle(sk.key)} style={[s.chip, on && (skilled ? s.chipOn : s.chipOnGen)]}>
                {on ? <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} /> : <Text style={s.plus}>+ </Text>}
                <Text style={[s.chipTxt, on && { color: "#fff" }]}>{sk.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Per-skill detail (skilled categories only) */}
        {skilled && group.skills.filter((sk) => has(sk.key)).map((sk) => {
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
              <Pressable onPress={() => toggleProof(sk.key)} style={s.proofRow}>
                <Ionicons name={e.proofUploaded ? "checkmark-circle" : "cloud-upload-outline"} size={16} color={e.proofUploaded ? C.green : C.indigo} />
                <Text style={[s.proofTxt, e.proofUploaded && { color: C.green }]}>
                  {e.proofUploaded ? "Proof added · Verified" : `Add proof — ${cfg.proofLabel}`}
                </Text>
              </Pressable>
            </View>
          );
        })}

        {/* Category-specific extras (what makes each page different) */}
        {skilled && picked > 0 && cfg.extra ? (
          <View style={{ marginTop: 20 }}>
            <Text style={s.sectionLbl}>{cfg.extra.label}</Text>
            <View style={s.chips}>
              {cfg.extra.options.map((o) => {
                const on = tags.includes(o);
                return (
                  <Pressable key={o} onPress={() => toggleTag(o)} style={[s.tag, on && s.tagOn]}>
                    <Text style={[s.tagTxt, on && { color: C.indigo }]}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {skilled && picked > 0 && cfg.mode ? (
          <View style={{ marginTop: 20 }}>
            <Text style={s.sectionLbl}>{cfg.mode.label}</Text>
            <View style={{ gap: 8 }}>
              {cfg.mode.options.map((o) => {
                const on = mode === o;
                return (
                  <Pressable key={o} onPress={() => setMode(on ? null : o)} style={[s.modeRow, on && s.modeRowOn]}>
                    <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={18} color={on ? C.indigo : C.text3} />
                    <Text style={[s.modeTxt, on && { color: C.indigo }]}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={s.footer}>
        <Button title={busy ? "Saving…" : picked > 0 ? `Save ${group.label}` : "Save"} onPress={save} disabled={busy || !user} />
      </View>
      <Toast message={toast} visible={!!toast} />
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 16, color: C.text },
  blurb: { fontFamily: F.reg, fontSize: 13.5, color: C.text2, lineHeight: 20, marginBottom: 18 },
  sectionLbl: { fontFamily: F.bold, fontSize: 12.5, color: C.text, marginBottom: 10 },
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
  proofTxt: { fontFamily: F.bold, fontSize: 12, color: C.indigo },

  tag: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  tagOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  tagTxt: { fontFamily: F.med, fontSize: 12.5, color: C.text2 },
  modeRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  modeRowOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  modeTxt: { fontFamily: F.med, fontSize: 13, color: C.text },

  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, backgroundColor: C.bg },
});
