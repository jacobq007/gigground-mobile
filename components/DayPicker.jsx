import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { F } from "../lib/theme";
import { useC } from "../lib/ThemeContext";

const DAY_MS = 24 * 60 * 60 * 1000;
const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const toISODate = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

// Horizontal chip row of upcoming calendar days. `minDate` (ISO) excludes earlier days.
export default function DayPicker({ value, onChange, minDate, days = 10 }) {
  const C = useC();
  const s = makeStyles(C);
  const start = minDate ? new Date(minDate + "T00:00:00") : new Date(new Date().setHours(0, 0, 0, 0));
  const options = Array.from({ length: days }, (_, i) => new Date(start.getTime() + i * DAY_MS));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((d) => {
        const iso = toISODate(d);
        const on = value === iso;
        return (
          <Pressable key={iso} onPress={() => onChange(iso)} style={[s.chip, on && s.chipOn]}>
            <Text style={[s.txt, on && s.txtOn]}>{fmt(d)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  txt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  txtOn: { color: C.indigo, fontFamily: F.bold },
});
