import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Button, Field } from "../../components/ui";
import AreaPicker from "../../components/AreaPicker";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { eventsAPI, EVENT_CATEGORIES } from "../../lib/eventsData";
import { gigsAPI } from "../../lib/api";
import { getAreaCoords, areaToAreaKm } from "../../lib/geo";
import { C, F } from "../../lib/theme";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DURATIONS = ["1 hr", "2 hrs", "3 hrs", "Half day", "Full day", "till late"];
const PRIVACY = [
  ["public", "Public", "Anyone nearby can see it"],
  ["zone", "Zone only", "Only people in your area"],
  ["invite", "Invite only", "Shared by link"],
];
const pad = (n) => String(n).padStart(2, "0");

// Next 30 days as selectable chips
const DATE_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); return d;
});
// Times 06:00 → 23:30 in 30-min steps
const TIME_OPTIONS = [];
for (let h = 6; h <= 23; h++) for (const m of [0, 30]) {
  const ap = h >= 12 ? "PM" : "AM"; const h12 = h % 12 || 12;
  TIME_OPTIONS.push({ h, m, label: `${h12}:${pad(m)} ${ap}` });
}

export default function NewEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const { feedZone } = useLocation();

  const [cover, setCover] = useState(null);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("workshop");
  const [type, setType] = useState("in-person"); // in-person | virtual
  const [paid, setPaid] = useState(false);
  const [cost, setCost] = useState("");
  const [dateIdx, setDateIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(8); // ~10:00 AM
  const [duration, setDuration] = useState("2 hrs");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState(feedZone || user?.area || "");
  const [onlineLink, setOnlineLink] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [helpers, setHelpers] = useState(0);
  const [helperPay, setHelperPay] = useState("400");
  const [capacity, setCapacity] = useState("");
  const [busy, setBusy] = useState(false);

  const pickCover = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!r.canceled && r.assets?.length) setCover(r.assets[0].uri);
    } catch { Alert.alert("Could not open photo library"); }
  };

  const valid = title.trim() && (type === "virtual" ? onlineLink.trim() : venue.trim() && area) && (!paid || cost);

  const submit = async () => {
    if (!valid) { Alert.alert("Almost there", "Add a title, date and location (or online link) first."); return; }
    setBusy(true);
    const d = DATE_OPTIONS[dateIdx]; const t = TIME_OPTIONS[timeIdx];
    const start = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(t.h)}:${pad(t.m)}:00`;
    const dateLabel = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
    const coords = type === "in-person" && area ? (() => { const c = getAreaCoords(area); return c ? { lat: c[0], lng: c[1] } : null; })() : null;
    const distanceKm = type === "in-person" && feedZone && area ? areaToAreaKm(feedZone, area) : undefined;
    const initials = (user?.name || "You").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    const ev = await eventsAPI.create({
      title: title.trim(),
      tagline: tagline.trim() || undefined,
      category,
      cost: paid ? parseInt(cost) || 0 : 0,
      start,
      durationLabel: duration,
      type,
      venueName: type === "virtual" ? "Online" : venue.trim(),
      address: address.trim() || undefined,
      area: type === "virtual" ? "Online" : area,
      distanceKm,
      coords,
      onlineLink: type === "virtual" ? onlineLink.trim() : undefined,
      organizerName: user?.name || "You",
      organizerInitials: initials,
      organizerIsMe: true,
      description: desc.trim(),
      privacy,
      capacity: capacity ? parseInt(capacity) : null,
      hiringHelpers: helpers,
      coverImage: cover || undefined,
    });

    // Events → Gigs bridge: post a real gig so locals can apply to help
    if (helpers > 0) {
      const gigArea = type === "virtual" ? (feedZone || "Chennai") : area;
      const gig = await gigsAPI.create({
        title: `Event helper — ${ev.title}`,
        who: ev.organizerName,
        initials: ev.organizerInitials,
        area: gigArea,
        payAmount: parseInt(helperPay) || 400,
        payUnit: "hr",
        type: "ONE TIME",
        gigSubType: "quick",
        urgent: false,
        hrs: duration,
        timing: dateLabel,
        category: "Events",
        openings: helpers,
        desc: `Help run "${ev.title}"${type !== "virtual" ? ` at ${ev.venueName}, ${area}` : ""} on ${dateLabel} (${t.label}). Setup and support — ${helpers} helper${helpers > 1 ? "s" : ""} needed. Be friendly and on time.`,
        eventId: ev.id,
      });
      ev.helperGigId = gig.id; // link the event to its gig (same ref in store)
    }

    setBusy(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>Create event</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <Text style={s.lbl}>Cover picture <Text style={s.hint}>(optional)</Text></Text>
        <Pressable onPress={pickCover} style={s.cover}>
          {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : (
            <View style={{ alignItems: "center", gap: 6 }}>
              <Ionicons name="image-outline" size={28} color={C.text3} />
              <Text style={s.coverTxt}>Add a cover photo</Text>
            </View>
          )}
          {cover ? <View style={s.coverEdit}><Ionicons name="pencil" size={13} color="#fff" /></View> : null}
        </Pressable>

        <View style={{ gap: 14, marginTop: 18 }}>
          <Field label="Event name" value={title} onChangeText={setTitle} placeholder="e.g. Pottery basics — hands-on class" />
          <Field label="Tagline (optional)" value={tagline} onChangeText={setTagline} placeholder="One catchy line about it" />

          {/* Category */}
          <View>
            <Text style={s.lbl}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {EVENT_CATEGORIES.map((c) => (
                <Pressable key={c.id} onPress={() => setCategory(c.id)} style={[s.pill, category === c.id && s.pillOn]}>
                  <Ionicons name={c.icon} size={14} color={category === c.id ? C.indigo : C.text3} />
                  <Text style={[s.pillTxt, category === c.id && s.pillTxtOn]}>{c.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Field label="Description" value={desc} onChangeText={setDesc} multiline placeholder="What's the event, who's it for, what to bring…" />

          {/* Type */}
          <View>
            <Text style={s.lbl}>Type</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[["in-person", "In-person", "location-outline"], ["virtual", "Virtual", "videocam-outline"]].map(([v, label, ic]) => (
                <Pressable key={v} onPress={() => setType(v)} style={[s.fBtn, type === v && s.fBtnOn, { flex: 1, flexDirection: "row", gap: 6 }]}>
                  <Ionicons name={ic} size={15} color={type === v ? C.indigo : C.text2} />
                  <Text style={[s.fTxt, type === v && s.fTxtOn]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date */}
          <View>
            <Text style={s.lbl}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {DATE_OPTIONS.map((d, i) => (
                <Pressable key={i} onPress={() => setDateIdx(i)} style={[s.dateChip, dateIdx === i && s.dateChipOn]}>
                  <Text style={[s.dateChipDay, dateIdx === i && s.dateChipTxtOn]}>{i === 0 ? "Today" : DAYS[d.getDay()]}</Text>
                  <Text style={[s.dateChipNum, dateIdx === i && s.dateChipTxtOn]}>{d.getDate()}</Text>
                  <Text style={[s.dateChipMon, dateIdx === i && s.dateChipTxtOn]}>{MONTHS[d.getMonth()]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Time */}
          <View>
            <Text style={s.lbl}>Start time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {TIME_OPTIONS.map((t, i) => (
                <Pressable key={i} onPress={() => setTimeIdx(i)} style={[s.pill, timeIdx === i && s.pillOn]}>
                  <Text style={[s.pillTxt, timeIdx === i && s.pillTxtOn]}>{t.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Duration */}
          <View>
            <Text style={s.lbl}>Duration</Text>
            <View style={s.wrapRow}>
              {DURATIONS.map((d) => (
                <Pressable key={d} onPress={() => setDuration(d)} style={[s.pill, duration === d && s.pillOn]}>
                  <Text style={[s.pillTxt, duration === d && s.pillTxtOn]}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Cost */}
          <View>
            <Text style={s.lbl}>Cost</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: paid ? 10 : 0 }}>
              <Pressable onPress={() => setPaid(false)} style={[s.fBtn, !paid && s.fBtnOn, { flex: 1 }]}><Text style={[s.fTxt, !paid && s.fTxtOn]}>Free</Text></Pressable>
              <Pressable onPress={() => setPaid(true)} style={[s.fBtn, paid && s.fBtnOn, { flex: 1 }]}><Text style={[s.fTxt, paid && s.fTxtOn]}>Paid</Text></Pressable>
            </View>
            {paid ? <Field label="Entry / ticket (₹)" value={cost} onChangeText={setCost} keyboardType="number-pad" placeholder="200" /> : null}
          </View>

          {/* Location */}
          {type === "virtual" ? (
            <Field label="Online link" value={onlineLink} onChangeText={setOnlineLink} placeholder="https://meet…" autoCapitalize="none" />
          ) : (
            <>
              <Field label="Venue name" value={venue} onChangeText={setVenue} placeholder="e.g. Adyar Arts Hub" />
              <Field label="Address (optional)" value={address} onChangeText={setAddress} placeholder="Street / landmark" />
              <View>
                <Text style={s.lbl}>Area</Text>
                <AreaPicker value={area} onChange={setArea} height={170} />
              </View>
            </>
          )}

          {/* Helpers (Events → Gigs bridge) */}
          <View style={s.helperCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Ionicons name="briefcase-outline" size={16} color={C.indigo} />
              <Text style={s.helperTitle}>Need helpers for this event?</Text>
            </View>
            <Text style={s.helperSub}>We'll post a paid gig to the Jobs tab so locals can apply.</Text>
            <View style={[s.stepper, { marginTop: 10 }]}>
              <Pressable onPress={() => setHelpers((n) => Math.max(0, n - 1))} style={s.stepBtn}><Ionicons name="remove" size={18} color={C.navy} /></Pressable>
              <Text style={s.stepVal}>{helpers === 0 ? "None" : `${helpers} helper${helpers > 1 ? "s" : ""}`}</Text>
              <Pressable onPress={() => setHelpers((n) => Math.min(10, n + 1))} style={s.stepBtn}><Ionicons name="add" size={18} color={C.navy} /></Pressable>
            </View>
            {helpers > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Field label="Pay per helper (₹ / hr)" value={helperPay} onChangeText={setHelperPay} keyboardType="number-pad" placeholder="400" />
                <Text style={[s.helperSub, { marginTop: 6 }]}>
                  <Ionicons name="briefcase-outline" size={11} color={C.text3} /> Creates a gig: “Event helper — {title || "your event"}”.
                </Text>
              </View>
            ) : null}
          </View>

          {/* Capacity */}
          <Field label="Capacity (optional)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="Max attendees" />

          {/* Privacy */}
          <View>
            <Text style={s.lbl}>Privacy</Text>
            <View style={{ gap: 8 }}>
              {PRIVACY.map(([v, label, sub]) => (
                <Pressable key={v} onPress={() => setPrivacy(v)} style={[s.privRow, privacy === v && s.privRowOn]}>
                  <Ionicons name={privacy === v ? "radio-button-on" : "radio-button-off"} size={18} color={privacy === v ? C.indigo : C.text3} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.privLabel, privacy === v && { color: C.indigo }]}>{label}</Text>
                    <Text style={s.privSub}>{sub}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <Button title={busy ? "Publishing…" : "Publish event"} onPress={submit} disabled={busy || !valid} style={{ marginTop: 4 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
  hint: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  cover: { height: 150, borderRadius: 14, borderWidth: 1, borderColor: C.border, borderStyle: "dashed", backgroundColor: C.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  coverTxt: { fontFamily: F.med, fontSize: 12, color: C.text3 },
  coverEdit: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  pillOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  pillTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  pillTxtOn: { color: C.indigo },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fBtn: { paddingVertical: 11, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  fBtnOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  fTxt: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  fTxtOn: { color: C.indigo },
  dateChip: { width: 56, paddingVertical: 9, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  dateChipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  dateChipDay: { fontFamily: F.med, fontSize: 10, color: C.text3, textTransform: "uppercase" },
  dateChipNum: { fontFamily: F.bold, fontSize: 18, color: C.text, lineHeight: 22 },
  dateChipMon: { fontFamily: F.med, fontSize: 10, color: C.text3, textTransform: "uppercase" },
  dateChipTxtOn: { color: "#fff" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 4 },
  stepBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepVal: { fontFamily: F.bold, fontSize: 16, color: C.text, minWidth: 60, textAlign: "center" },
  helperCard: { backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 14, padding: 13 },
  helperTitle: { fontFamily: F.bold, fontSize: 13, color: C.text },
  helperSub: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  privRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  privRowOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  privLabel: { fontFamily: F.bold, fontSize: 13, color: C.text },
  privSub: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 1 },
});
