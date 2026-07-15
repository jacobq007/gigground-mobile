import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/AuthContext";
import { SKILL_GROUPS, profileStrength, groupStatus, verifiedSkills } from "../../lib/skills";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

// Soft tint per category so the boxes read as distinct destinations.
const TINT = {
  tutoring: "#EEF0FE", cooking: "#FDEFE7", beauty: "#FBE9F4",
  repairs: "#E9F3EE", media: "#EAF0FB", general: "#F1F0EE",
};
const TINT_FG = {
  tutoring: "#4338CA", cooking: "#B65B25", beauty: "#AD248C",
  repairs: "#2F855A", media: "#2F55D4", general: "#6B7280",
};

export default function Skills() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [, force] = useState(0);

  // Re-read after returning from a category page so counts/strength update.
  useFocusEffect(useCallback(() => { refresh?.().finally(() => force((n) => n + 1)); }, []));

  const C = useC();
  const s = makeStyles(C);
  const strength = Math.round(profileStrength(user) * 100);
  const vCount = verifiedSkills(user).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>Skills & credentials</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Text style={s.lede}>Pick a category to add what you can do. Verified skills get you matched to skilled, better-paid jobs.</Text>

        <View style={s.progWrap}>
          <View style={s.progTrack}><View style={[s.progFill, { width: `${Math.max(4, strength)}%` }]} /></View>
          <Text style={s.progLbl}>Profile strength {strength}% · {vCount} verified skill{vCount === 1 ? "" : "s"}</Text>
        </View>

        <View style={s.grid}>
          {SKILL_GROUPS.map((g) => {
            const st = groupStatus(user, g.key);
            const tint = TINT[g.key] || C.surface2;
            const fg = TINT_FG[g.key] || C.text2;
            return (
              <Pressable key={g.key} onPress={() => router.push(`/modals/skill-category?group=${g.key}`)} style={s.box}>
                <View style={[s.boxIcon, { backgroundColor: tint }]}>
                  <Ionicons name={g.icon} size={22} color={fg} />
                </View>
                <Text style={s.boxName}>{g.label}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
                  {st.count === 0 ? (
                    <Text style={s.boxAdd}>Add</Text>
                  ) : (
                    <>
                      <Text style={s.boxCount}>{st.count} added</Text>
                      {st.verified > 0 ? <View style={s.vDot}><Ionicons name="shield-checkmark" size={10} color={C.indigo} /></View> : null}
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={15} color={C.text3} style={s.boxChevron} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lede: { fontFamily: F.reg, fontSize: 13.5, color: C.text2, lineHeight: 20 },
  progWrap: { marginTop: 14, marginBottom: 20 },
  progTrack: { height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: "hidden" },
  progFill: { height: "100%", backgroundColor: C.indigo, borderRadius: 3 },
  progLbl: { fontFamily: F.med, fontSize: 11, color: C.text2, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  box: { width: "47.5%", flexGrow: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 15, minHeight: 116, justifyContent: "flex-start", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  boxIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  boxName: { fontFamily: F.bold, fontSize: 14, color: C.text },
  boxAdd: { fontFamily: F.bold, fontSize: 12, color: C.indigo },
  boxCount: { fontFamily: F.med, fontSize: 11.5, color: C.text2 },
  vDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center" },
  boxChevron: { position: "absolute", top: 16, right: 14 },
});
