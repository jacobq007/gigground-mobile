import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { CHENNAI_AREAS } from "../lib/geo";
import { F } from "../lib/theme";
import { useC } from "../lib/ThemeContext";

export default function AreaPicker({ value, onChange, height = 280 }) {
  const C = useC();
  const s = makeStyles(C);
  const [q, setQ] = useState("");
  const areas = CHENNAI_AREAS.map((a) => a[0]).filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  return (
    <View>
      <TextInput
        value={q} onChangeText={setQ} placeholder="Search your area…" placeholderTextColor={C.text3}
        style={s.search} autoCapitalize="none"
      />
      <ScrollView style={{ maxHeight: height }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        {areas.map((a) => {
          const active = a === value;
          return (
            <Pressable key={a} onPress={() => onChange(a)} style={[s.chip, active && s.chipOn]}>
              <Text style={[s.chipTxt, active && s.chipTxtOn]}>{a}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  search: { fontFamily: F.reg, fontSize: 14, color: C.text, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 13, height: 44, marginBottom: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface2, borderWidth: 1, borderColor: "transparent" },
  chipOn: { backgroundColor: C.navy },
  chipTxt: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  chipTxtOn: { color: "#fff" },
});
