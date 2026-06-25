import { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, ScrollView, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../lib/theme";

// ── Shared filter model ───────────────────────────────────────────────────────
export const EMPTY_RENTAL_FILTERS = { bhk: [], furnishing: [], price: [], verifiedOnly: false };

const BHK = [{ v: 1, l: "1 BHK" }, { v: 2, l: "2 BHK" }, { v: 3, l: "3 BHK" }, { v: 4, l: "4+ BHK" }];
const FURNISHING = ["Fully furnished", "Semi-furnished", "Unfurnished"];
const PRICE_BRACKETS = [
  { id: "lt10",   label: "Under ₹10k", test: (r) => r < 10000 },
  { id: "10to20", label: "₹10k–20k",   test: (r) => r >= 10000 && r < 20000 },
  { id: "20to30", label: "₹20k–30k",   test: (r) => r >= 20000 && r < 30000 },
  { id: "gt30",   label: "Above ₹30k", test: (r) => r >= 30000 },
];

export function matchRental(r, f) {
  if (f.bhk.length && !f.bhk.some((b) => (b === 4 ? r.bedrooms >= 4 : r.bedrooms === b))) return false;
  if (f.furnishing.length && !f.furnishing.includes(r.furnished)) return false;
  if (f.price.length && !PRICE_BRACKETS.filter((p) => f.price.includes(p.id)).some((p) => p.test(r.rent))) return false;
  if (f.verifiedOnly && !r.verified) return false;
  return true;
}

export function countRentalFilters(f) {
  return f.bhk.length + f.furnishing.length + f.price.length + (f.verifiedOnly ? 1 : 0);
}

// ── Bottom-sheet filter UI ────────────────────────────────────────────────────
export default function RentalFilterSheet({ visible, value, rentals, onApply, onClose }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (visible) setDraft(value); }, [visible]);

  const toggle = (key, item) => setDraft((d) => {
    const arr = d[key];
    return { ...d, [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item] };
  });

  const count = (rentals || []).filter((r) => matchRental(r, draft)).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.grab} />
          <View style={s.head}>
            <Text style={s.title}>Filters</Text>
            <Pressable onPress={onClose} style={s.x}><Ionicons name="close" size={18} color={C.text2} /></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <Group label="Home type">
              {BHK.map((b) => <FChip key={b.v} label={b.l} on={draft.bhk.includes(b.v)} onPress={() => toggle("bhk", b.v)} />)}
            </Group>
            <Group label="Furnishing">
              {FURNISHING.map((x) => <FChip key={x} label={x} on={draft.furnishing.includes(x)} onPress={() => toggle("furnishing", x)} />)}
            </Group>
            <Group label="Monthly rent">
              {PRICE_BRACKETS.map((p) => <FChip key={p.id} label={p.label} on={draft.price.includes(p.id)} onPress={() => toggle("price", p.id)} />)}
            </Group>

            <View style={s.toggleRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9, flex: 1 }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={C.green} />
                <View>
                  <Text style={s.toggleTxt}>Verified listings only</Text>
                  <Text style={s.toggleSub}>Owner identity checked</Text>
                </View>
              </View>
              <Switch
                value={draft.verifiedOnly}
                onValueChange={(v) => setDraft((d) => ({ ...d, verifiedOnly: v }))}
                trackColor={{ true: C.indigo, false: C.border }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          <View style={s.footer}>
            <Pressable style={s.reset} onPress={() => setDraft(EMPTY_RENTAL_FILTERS)}>
              <Text style={s.resetTxt}>Reset</Text>
            </Pressable>
            <Pressable style={s.apply} onPress={() => { onApply(draft); onClose(); }}>
              <Text style={s.applyTxt}>Show {count} {count === 1 ? "home" : "homes"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Group({ label, children }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={s.flabel}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{children}</View>
    </View>
  );
}

function FChip({ label, on, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipTxt, on && s.chipTxtOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(17,17,30,0.45)" },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18 },
  grab: { width: 38, height: 4, borderRadius: 99, backgroundColor: C.border, alignSelf: "center", marginBottom: 12 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontFamily: F.bold, fontSize: 17, color: C.text },
  x: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  flabel: { fontFamily: F.bold, fontSize: 12, color: C.text, marginBottom: 9 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, backgroundColor: C.surface },
  chipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  chipTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  chipTxtOn: { color: "#fff", fontFamily: F.bold },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4, marginBottom: 6 },
  toggleTxt: { fontFamily: F.bold, fontSize: 13, color: C.text },
  toggleSub: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 1 },
  footer: { flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  reset: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, backgroundColor: C.surface },
  resetTxt: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  apply: { flex: 2, alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 12, backgroundColor: C.indigo },
  applyTxt: { fontFamily: F.bold, fontSize: 13, color: "#fff" },
});
