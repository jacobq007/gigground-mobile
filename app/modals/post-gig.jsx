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
import { MIN_PAY, JOB_KINDS } from "../../lib/constants";
import { violatesGuidelines } from "../../lib/moderation";
import { C, F } from "../../lib/theme";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function PostGig() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [unit, setUnit] = useState("hr");
  const [jobKind, setJobKind] = useState("errand");
  const [hrs, setHrs] = useState("");
  const [area, setArea] = useState(user?.area || "");
  const [desc, setDesc] = useState("");
  const [workDate, setWorkDate] = useState(todayISO());
  const [completeBy, setCompleteBy] = useState(todayISO());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false); // guards double-tap / double-fire, independent of the `busy` re-render

  const minFloor = MIN_PAY[jobKind] ?? MIN_PAY.default;
  const canSubmit = title && payMin && area;

  const post = async () => {
    if (submitting.current) return; // dedup guard — a second tap while the first is in flight is a no-op
    setError("");

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
        urgent: false, hrs: hrs || "Flexible", timing: "This week", category: "General", desc, postedAgo: "now",
        workDate, completeBy, reported: false, verifiedHirer: user?.isVerifiedHirer || false,
      });
      router.back();
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

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

          <View>
            <Text style={s.lbl}>Job type</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {JOB_KINDS.map((k) => (
                <Pressable key={k.key} onPress={() => setJobKind(k.key)} style={[s.unit, jobKind === k.key && s.unitOn]}>
                  <Text style={[s.unitTxt, jobKind === k.key && { color: C.indigo }]}>{k.label}</Text>
                </Pressable>
              ))}
            </View>
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

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
  unit: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  unitOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  unitTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  err: { fontFamily: F.med, fontSize: 12, color: C.red },
});
