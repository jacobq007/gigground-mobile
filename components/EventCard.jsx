import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F, money } from "../lib/theme";
import { CATEGORY_LABEL, fmtEventDate, getRsvp, setRsvp, goingCount } from "../lib/eventsData";

export default function EventCard({ event, onPress, onViewGig }) {
  const [rsvp, setRsvpState] = useState(getRsvp(event.id));
  const dt = fmtEventDate(event.start);
  const going = goingCount(event);

  const toggle = (val) => {
    const next = rsvp === val ? null : val;
    setRsvp(event.id, next);
    setRsvpState(next);
  };

  return (
    <View style={s.card}>
      <Pressable onPress={onPress} style={s.row}>
        {/* Date block */}
        <View style={s.date}>
          <Text style={s.dateDay}>{dt.day}</Text>
          <Text style={s.dateNum}>{dt.num}</Text>
          <Text style={s.dateMon}>{event.type === "virtual" ? "ONLINE" : dt.month}</Text>
        </View>

        {/* Main */}
        <View style={s.main}>
          <View style={s.badges}>
            <View style={[s.bd, s.bdCat]}><Text style={[s.bdTxt, { color: "#3730A3" }]}>{CATEGORY_LABEL[event.category]?.toUpperCase()}</Text></View>
            {event.cost === 0
              ? <View style={[s.bd, s.bdFree]}><Text style={[s.bdTxt, { color: C.green }]}>FREE</Text></View>
              : <View style={[s.bd, s.bdPaid]}><Text style={[s.bdTxt, { color: "#B45309" }]}>{money(event.cost)}</Text></View>}
            {event.hiringHelpers > 0
              ? <View style={[s.bd, s.bdHire]}><Text style={[s.bdTxt, { color: "#A32D2D" }]}>HIRING {event.hiringHelpers}</Text></View>
              : null}
          </View>

          <Text style={s.title} numberOfLines={2}>{event.title}</Text>

          <View style={s.meta}>
            <Ionicons name="time-outline" size={12} color={C.text3} />
            <Text style={s.metaTxt}>{dt.time} · {event.durationLabel}</Text>
          </View>
          <View style={s.meta}>
            <Ionicons name={event.type === "virtual" ? "videocam-outline" : "location-outline"} size={12} color={C.text3} />
            <Text style={s.metaTxt} numberOfLines={1}>{event.venueName}</Text>
            {event.type !== "virtual" && event.distanceKm != null ? <Text style={s.dist}> · {event.distanceKm}km</Text> : null}
          </View>

          <View style={s.social}>
            {event.friendAvatars?.length > 0 ? (
              <View style={s.avs}>
                {event.friendAvatars.slice(0, 3).map((a, i) => (
                  <View key={i} style={[s.av, { backgroundColor: a.c, marginLeft: i === 0 ? 0 : -6 }]}>
                    <Text style={s.avTxt}>{a.t}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={s.socialTxt}>
              <Text style={s.socialB}>{going} going</Text>
              {event.friendsGoing > 0 ? ` · ${event.friendsGoing} friend${event.friendsGoing > 1 ? "s" : ""}` : ""}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Actions */}
      <View style={s.actions}>
        <Pressable onPress={() => toggle("going")} style={[s.go, rsvp === "going" && s.goOn]}>
          {rsvp === "going" ? <Ionicons name="checkmark" size={14} color={C.green} /> : null}
          <Text style={[s.goTxt, rsvp === "going" && s.goTxtOn]}>Going</Text>
        </Pressable>
        <Pressable onPress={() => toggle("interested")} style={[s.int, rsvp === "interested" && s.intOn]}>
          <Text style={[s.intTxt, rsvp === "interested" && s.intTxtOn]}>Interested</Text>
        </Pressable>
      </View>

      {/* Events → Gigs bridge */}
      {event.hiringHelpers > 0 ? (
        <Pressable onPress={onViewGig} style={s.hire}>
          <Ionicons name="briefcase-outline" size={14} color="#A32D2D" />
          <Text style={s.hireTxt}>Organizer needs {event.hiringHelpers} helper{event.hiringHelpers > 1 ? "s" : ""}</Text>
          <Text style={s.hireLink}>View gig</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, marginBottom: 12, overflow: "hidden" },
  row: { flexDirection: "row", gap: 12, padding: 13 },
  date: { width: 52, backgroundColor: C.surface2, borderRadius: 11, alignItems: "center", paddingVertical: 8, alignSelf: "flex-start" },
  dateDay: { fontFamily: F.bold, fontSize: 11, color: C.text2, textTransform: "uppercase" },
  dateNum: { fontFamily: F.bold, fontSize: 22, color: C.text, lineHeight: 26 },
  dateMon: { fontFamily: F.med, fontSize: 10, color: C.text2, textTransform: "uppercase" },
  main: { flex: 1, minWidth: 0 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 5 },
  bd: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  bdTxt: { fontFamily: F.bold, fontSize: 9 },
  bdCat: { backgroundColor: "#EEF2FF" },
  bdFree: { backgroundColor: "#F0FDF4" },
  bdPaid: { backgroundColor: "#FEF3E2" },
  bdHire: { backgroundColor: "#FCEBEB" },
  title: { fontFamily: F.bold, fontSize: 14, color: C.text, lineHeight: 18, marginBottom: 6 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  metaTxt: { fontFamily: F.reg, fontSize: 11, color: C.text2, flexShrink: 1 },
  dist: { fontFamily: F.med, fontSize: 11, color: C.indigo },
  social: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 },
  avs: { flexDirection: "row" },
  av: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: C.surface, alignItems: "center", justifyContent: "center" },
  avTxt: { fontFamily: F.bold, fontSize: 7, color: "#fff" },
  socialTxt: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  socialB: { fontFamily: F.bold, color: C.text },
  actions: { flexDirection: "row", gap: 8, paddingHorizontal: 13, paddingBottom: 13 },
  go: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 9, borderRadius: 10, backgroundColor: C.indigo },
  goOn: { backgroundColor: "#F0FDF4", borderWidth: StyleSheet.hairlineWidth, borderColor: "#bbf7d0" },
  goTxt: { fontFamily: F.bold, fontSize: 12, color: "#fff" },
  goTxtOn: { color: C.green },
  int: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: 10, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  intOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  intTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  intTxtOn: { fontFamily: F.bold, color: C.indigo },
  hire: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FFF7F7", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#f6dede", paddingHorizontal: 13, paddingVertical: 9 },
  hireTxt: { fontFamily: F.med, fontSize: 11, color: "#A32D2D", flex: 1 },
  hireLink: { fontFamily: F.bold, fontSize: 11, color: "#A32D2D", textDecorationLine: "underline" },
});
