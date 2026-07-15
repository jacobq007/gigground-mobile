import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Toast } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

const DAY_MS = 24 * 60 * 60 * 1000;
const dayLabel = (d) => d.toLocaleDateString("en-IN", { weekday: "short" });
const dateLabel = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const toISO = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

const SLOTS = [
  { key: "morning", label: "Morning", hint: "6am – 12pm", icon: "sunny-outline" },
  { key: "afternoon", label: "Afternoon", hint: "12pm – 5pm", icon: "partly-sunny-outline" },
  { key: "evening", label: "Evening", hint: "5pm – 11pm", icon: "moon-outline" },
];

export default function Availability() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { user, update } = useAuth();
  const start = new Date(new Date().setHours(0, 0, 0, 0));
  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY_MS));

  const saved = user?.availability || {};
  const [selectedDays, setSelectedDays] = useState(saved.days || []);
  const [slots, setSlots] = useState(saved.slots || ["morning", "evening"]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const toggleDay = (iso) => setSelectedDays((prev) => prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]);
  const toggleSlot = (key) => setSlots((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);

  const save = async () => {
    setBusy(true);
    try {
      await update({ availability: { days: selectedDays, slots, updatedAt: Date.now() } });
      setToast("Availability saved");
      setTimeout(() => router.back(), 700);
    } catch {
      setBusy(false);
      setToast("Couldn't save — try again");
    }
  };

  const canSave = selectedDays.length > 0 && slots.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.head}>
        <Text style={s.title}>Set availability</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.close}>
          <Ionicons name="close" size={20} color={C.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Text style={s.lede}>Let nearby hirers know when you can work. You can update this anytime.</Text>

        <Text style={s.sectionLabel}>Which days?</Text>
        <View style={s.dayRow}>
          {days.map((d) => {
            const iso = toISO(d);
            const on = selectedDays.includes(iso);
            return (
              <Pressable key={iso} onPress={() => toggleDay(iso)} style={[s.day, on && s.dayOn]}>
                <Text style={[s.dayName, on && s.dayTxtOn]}>{dayLabel(d)}</Text>
                <Text style={[s.dayDate, on && s.dayTxtOn]}>{dateLabel(d)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>What times?</Text>
        <View style={{ gap: 10 }}>
          {SLOTS.map((slot) => {
            const on = slots.includes(slot.key);
            return (
              <Pressable key={slot.key} onPress={() => toggleSlot(slot.key)} style={[s.slot, on && s.slotOn]}>
                <View style={[s.slotIcon, on && { backgroundColor: C.indigo }]}>
                  <Ionicons name={slot.icon} size={18} color={on ? "#fff" : C.text2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.slotLabel, on && { color: C.indigo }]}>{slot.label}</Text>
                  <Text style={s.slotHint}>{slot.hint}</Text>
                </View>
                <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={22} color={on ? C.indigo : C.border} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Button title={busy ? "Saving…" : "Save availability"} onPress={save} disabled={!canSave || busy} />
      </View>
      <Toast message={toast} visible={!!toast} />
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },
  title: { fontFamily: F.bold, fontSize: 19, color: C.text },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  lede: { fontFamily: F.reg, fontSize: 13.5, color: C.text2, lineHeight: 20, marginBottom: 22 },
  sectionLabel: { fontFamily: F.bold, fontSize: 13, color: C.text, marginBottom: 12 },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  day: { width: 68, alignItems: "center", paddingVertical: 10, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  dayOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  dayName: { fontFamily: F.bold, fontSize: 12.5, color: C.text },
  dayDate: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 2 },
  dayTxtOn: { color: C.indigo },
  slot: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  slotOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  slotIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  slotLabel: { fontFamily: F.bold, fontSize: 14, color: C.text },
  slotHint: { fontFamily: F.reg, fontSize: 11.5, color: C.text2, marginTop: 1 },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, backgroundColor: C.bg },
});
