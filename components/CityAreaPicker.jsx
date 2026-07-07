import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCityAreas } from "../lib/geo";
import { C, F } from "../lib/theme";

// Search box + bubble chips of the major localities in `city`.
export default function CityAreaPicker({ city, value, onChange, height = 340 }) {
  const [q, setQ] = useState("");
  const all = getCityAreas(city);
  const query = q.trim().toLowerCase();
  const areas = query ? all.filter((n) => n.toLowerCase().includes(query)) : all;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={C.text3} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={`Search areas in ${city}…`}
          placeholderTextColor={C.text3}
          style={s.search}
          autoCapitalize="none"
        />
        {q ? (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={C.text3} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={{ maxHeight: height }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {areas.length === 0 ? (
          <Text style={s.empty}>No areas match “{q}”. Try another name.</Text>
        ) : areas.map((a) => {
          const active = a === value;
          return (
            <Pressable key={a} onPress={() => onChange(a)} style={[s.chip, active && s.chipOn]}>
              {active ? <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} /> : null}
              <Text style={[s.chipTxt, active && s.chipTxtOn]}>{a}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  search: { flex: 1, fontFamily: F.reg, fontSize: 14, color: C.text },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surface2, borderWidth: 1, borderColor: "transparent" },
  chipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  chipTxt: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  chipTxtOn: { color: "#fff" },
  empty: { fontFamily: F.reg, fontSize: 13, color: C.text3, paddingVertical: 20 },
});
