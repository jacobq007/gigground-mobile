import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Linking, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials } from "../../../../components/ui";
import { eventsAPI, EVENT_CATEGORIES, CATEGORY_LABEL, fmtEventDate, getRsvp, setRsvp, goingCount } from "../../../../lib/eventsData";
import { money, C, F } from "../../../../lib/theme";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function EventDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState(null);
  const [rsvp, setRsvpState] = useState(null);

  useEffect(() => {
    (async () => {
      const e = await eventsAPI.getOne(id);
      setEvent(e);
      setRsvpState(getRsvp(id));
    })();
  }, [id]);

  if (!event) return <View style={s.center}><ActivityIndicator color={C.indigo} /></View>;

  const dt = fmtEventDate(event.start);
  const d = new Date(event.start);
  const fullDate = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const going = goingCount(event);
  const catIcon = EVENT_CATEGORIES.find((c) => c.id === event.category)?.icon || "calendar-outline";

  const toggle = (val) => {
    const next = rsvp === val ? null : val;
    setRsvp(id, next);
    setRsvpState(next);
  };

  const openMaps = () => {
    if (event.type === "virtual") { Linking.openURL(event.onlineLink); return; }
    const q = event.coords ? `${event.coords.lat},${event.coords.lng}` : encodeURIComponent(`${event.venueName}, ${event.area}, Chennai`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const viewGig = () => {
    if (event.helperGigId) router.push(`/(tabs)/jobs/${event.helperGigId}`);
    else Alert.alert("Event helpers", "This event isn't hiring helpers right now.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="arrow-back" size={20} color={C.navy} />
          <Text style={s.back}>Events</Text>
        </Pressable>
        <Pressable onPress={() => Alert.alert("Share", "Sharing comes with the create-event pass.")} hitSlop={8}>
          <Ionicons name="share-social-outline" size={18} color={C.text3} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Cover */}
        <View style={[s.hero, { backgroundColor: event.coverColor }]}>
          {event.coverImage ? (
            <>
              <Image source={{ uri: event.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, backgroundColor: "rgba(0,0,0,0.4)" }} />
            </>
          ) : (
            <Ionicons name={catIcon} size={64} color="rgba(255,255,255,0.16)" />
          )}
          <View style={s.heroBadges}>
            <View style={s.catPill}><Text style={s.catPillTxt}>{CATEGORY_LABEL[event.category]}</Text></View>
            {event.cost === 0
              ? <View style={[s.costPill, { backgroundColor: "#F0FDF4" }]}><Text style={[s.costPillTxt, { color: C.green }]}>Free</Text></View>
              : <View style={[s.costPill, { backgroundColor: "#fff" }]}><Text style={[s.costPillTxt, { color: "#B45309" }]}>{money(event.cost)}</Text></View>}
          </View>
        </View>

        <View style={{ padding: 18 }}>
          <Text style={s.title}>{event.title}</Text>
          {event.tagline ? <Text style={s.tagline}>{event.tagline}</Text> : null}

          {/* When / where rows */}
          <View style={s.infoRow}>
            <View style={s.infoIcon}><Ionicons name="calendar-outline" size={17} color={C.indigo} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoMain}>{fullDate}</Text>
              <Text style={s.infoSub}>{dt.time} · {event.durationLabel}</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <View style={s.infoIcon}><Ionicons name={event.type === "virtual" ? "videocam-outline" : "location-outline"} size={17} color={C.indigo} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoMain}>{event.venueName}</Text>
              <Text style={s.infoSub}>{event.type === "virtual" ? "Online event" : `${event.area}, Chennai${event.distanceKm != null ? ` · ${event.distanceKm}km away` : ""}`}</Text>
            </View>
            <Pressable onPress={openMaps} hitSlop={8}>
              <Text style={s.infoLink}>{event.type === "virtual" ? "Join" : "Map"}</Text>
            </Pressable>
          </View>

          {/* Attendees */}
          <View style={s.attend}>
            <View style={s.avs}>
              {event.friendAvatars?.slice(0, 4).map((a, i) => (
                <View key={i} style={[s.av, { backgroundColor: a.c, marginLeft: i === 0 ? 0 : -8 }]}><Text style={s.avTxt}>{a.t}</Text></View>
              ))}
              {event.friendAvatars?.length === 0 ? <View style={[s.av, { backgroundColor: C.surface2, marginLeft: 0 }]}><Ionicons name="people-outline" size={14} color={C.text3} /></View> : null}
            </View>
            <Text style={s.attendTxt}>
              <Text style={{ fontFamily: F.bold, color: C.text }}>{going} going</Text>
              {event.friendsGoing > 0 ? `  ·  ${event.friendsGoing} friend${event.friendsGoing > 1 ? "s" : ""}` : ""}
              {event.capacity ? `  ·  ${Math.max(event.capacity - going, 0)} spots left` : ""}
            </Text>
          </View>

          {/* RSVP */}
          <View style={s.rsvpRow}>
            <Pressable onPress={() => toggle("going")} style={[s.rGo, rsvp === "going" && s.rGoOn]}>
              {rsvp === "going" ? <Ionicons name="checkmark-circle" size={16} color="#fff" /> : null}
              <Text style={s.rGoTxt}>{rsvp === "going" ? "You're going" : "Going"}</Text>
            </Pressable>
            <Pressable onPress={() => toggle("interested")} style={[s.rInt, rsvp === "interested" && s.rIntOn]}>
              <Ionicons name={rsvp === "interested" ? "star" : "star-outline"} size={15} color={rsvp === "interested" ? C.indigo : C.text2} />
              <Text style={[s.rIntTxt, rsvp === "interested" && { color: C.indigo, fontFamily: F.bold }]}>Interested</Text>
            </Pressable>
          </View>

          {/* Hiring bridge */}
          {event.hiringHelpers > 0 ? (
            <Pressable onPress={viewGig} style={s.hire}>
              <View style={s.hireIcon}><Ionicons name="briefcase" size={16} color="#A32D2D" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.hireTitle}>Organizer is hiring {event.hiringHelpers} helper{event.hiringHelpers > 1 ? "s" : ""}</Text>
                <Text style={s.hireSub}>Paid gig · setup & support for this event</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#A32D2D" />
            </Pressable>
          ) : null}

          {/* About */}
          <Text style={s.sectionLabel}>About this event</Text>
          <Text style={s.body}>{event.description}</Text>

          {/* Organizer */}
          <Text style={[s.sectionLabel, { marginTop: 20 }]}>Organizer</Text>
          <View style={s.orgCard}>
            <Initials text={event.organizerInitials} size={40} bg={C.indigoSoft} color={C.indigo} />
            <View style={{ flex: 1 }}>
              <Text style={s.orgName}>{event.organizerName}</Text>
              <Text style={s.orgSub}>Hosting in {event.area}</Text>
            </View>
            <Pressable onPress={() => Alert.alert("Message", "Organizer chat opens with the messaging pass.")} style={s.orgBtn}>
              <Text style={s.orgBtnTxt}>Message</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  back: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  hero: { height: 170, alignItems: "center", justifyContent: "center", position: "relative" },
  heroBadges: { position: "absolute", bottom: 12, left: 16, flexDirection: "row", gap: 8 },
  catPill: { backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.35)", paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99 },
  catPillTxt: { fontFamily: F.bold, fontSize: 11, color: "#fff" },
  costPill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99 },
  costPillTxt: { fontFamily: F.bold, fontSize: 11 },
  title: { fontFamily: F.bold, fontSize: 20, color: C.text, lineHeight: 26, marginBottom: 16 },
  tagline: { fontFamily: F.reg, fontSize: 14, color: C.text2, lineHeight: 20, marginTop: -10, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  infoIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center" },
  infoMain: { fontFamily: F.bold, fontSize: 13, color: C.text },
  infoSub: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 1 },
  infoLink: { fontFamily: F.bold, fontSize: 13, color: C.indigo },
  attend: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 12, padding: 12, marginTop: 4, marginBottom: 14 },
  avs: { flexDirection: "row" },
  av: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.surface, alignItems: "center", justifyContent: "center" },
  avTxt: { fontFamily: F.bold, fontSize: 9, color: "#fff" },
  attendTxt: { fontFamily: F.reg, fontSize: 12, color: C.text3, flex: 1 },
  rsvpRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  rGo: { flex: 1.4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: C.indigo },
  rGoOn: { backgroundColor: C.green },
  rGoTxt: { fontFamily: F.bold, fontSize: 14, color: "#fff" },
  rInt: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  rIntOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  rIntTxt: { fontFamily: F.med, fontSize: 14, color: C.text2 },
  hire: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#FFF7F7", borderWidth: StyleSheet.hairlineWidth, borderColor: "#f6dede", borderRadius: 14, padding: 13, marginBottom: 20 },
  hireIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FCEBEB", alignItems: "center", justifyContent: "center" },
  hireTitle: { fontFamily: F.bold, fontSize: 13, color: "#A32D2D" },
  hireSub: { fontFamily: F.reg, fontSize: 11, color: "#b45b5b", marginTop: 1 },
  sectionLabel: { fontFamily: F.bold, fontSize: 13, color: C.text, marginBottom: 10 },
  body: { fontFamily: F.reg, fontSize: 14, color: C.text2, lineHeight: 22 },
  orgCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 14, padding: 13 },
  orgName: { fontFamily: F.bold, fontSize: 14, color: C.text },
  orgSub: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 2 },
  orgBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.indigoSoft },
  orgBtnTxt: { fontFamily: F.bold, fontSize: 12, color: C.indigo },
});
