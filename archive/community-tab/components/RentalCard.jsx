import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F, money } from "../lib/theme";

export default function RentalCard({ rental, onPress }) {
  const hasPhoto = rental.photos?.length > 0;
  const heroColor = rental.heroColor || C.navy;
  const totalPhotos = rental.photoCount || rental.photos?.length || 0;

  return (
    <Pressable onPress={onPress} style={s.card}>
      {/* ── Photo Hero ── */}
      <View style={s.hero}>
        {hasPhoto ? (
          <Image source={{ uri: rental.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: heroColor, alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="home" size={60} color="rgba(255,255,255,0.1)" />
          </View>
        )}

        {/* overlay layers — simulate gradient */}
        <View style={{ position: "absolute", bottom: 80, left: 0, right: 0, height: 40, backgroundColor: "rgba(0,0,0,0.12)" }} />
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundColor: "rgba(0,0,0,0.42)" }} />

        {/* Photo count */}
        {totalPhotos > 0 && (
          <View style={s.photoCount}>
            <Ionicons name="camera-outline" size={11} color="#fff" />
            <Text style={s.photoCountTxt}>{totalPhotos} photos</Text>
          </View>
        )}

        {/* Bottom badges */}
        <View style={s.heroBadges}>
          <View style={s.typePill}>
            <Text style={s.typePillTxt}>{rental.bedrooms}BHK · {rental.furnished || rental.rentalType}</Text>
          </View>
          <View style={s.pricePill}>
            <Text style={s.pricePillTxt}>{money(rental.rent)}/mo</Text>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>{rental.title}</Text>
        <View style={s.meta}>
          <Ionicons name="location-outline" size={12} color={C.text3} />
          <Text style={s.metaTxt}>{rental.area}, Chennai</Text>
          <Text style={s.sep}>·</Text>
          <Ionicons name="time-outline" size={12} color={C.text3} />
          <Text style={s.metaTxt}>{rental.postedAgo} ago</Text>
        </View>
        <View style={s.statRow}>
          <View style={s.stat}>
            <Ionicons name="bed-outline" size={13} color={C.text2} />
            <Text style={s.statTxt}>{rental.bedrooms} bed</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="water-outline" size={13} color={C.text2} />
            <Text style={s.statTxt}>{rental.bathrooms} bath</Text>
          </View>
          {rental.floor ? (
            <View style={s.stat}>
              <Ionicons name="layers-outline" size={13} color={C.text2} />
              <Text style={s.statTxt}>{rental.floor}</Text>
            </View>
          ) : null}
          {rental.verified ? (
            <View style={[s.stat, s.verifiedStat]}>
              <Ionicons name="shield-checkmark-outline" size={13} color={C.green} />
              <Text style={[s.statTxt, { color: C.green }]}>Verified</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, overflow: "hidden", marginBottom: 14 },
  hero: { height: 170, position: "relative" },
  photoCount: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.48)", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  photoCountTxt: { fontFamily: F.med, fontSize: 11, color: "#fff" },
  heroBadges: { position: "absolute", bottom: 12, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  typePill: { backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.3)", paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99 },
  typePillTxt: { fontFamily: F.med, fontSize: 11, color: "#fff" },
  pricePill: { backgroundColor: C.green, paddingHorizontal: 13, paddingVertical: 5, borderRadius: 99 },
  pricePillTxt: { fontFamily: F.bold, fontSize: 15, color: "#fff" },
  body: { padding: 13 },
  title: { fontFamily: F.bold, fontSize: 15, color: C.text, marginBottom: 5 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  metaTxt: { fontFamily: F.reg, fontSize: 12, color: C.text3 },
  sep: { color: C.text3, fontSize: 12 },
  statRow: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  stat: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.surface2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  verifiedStat: { backgroundColor: "#F0FDF4" },
  statTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
});
