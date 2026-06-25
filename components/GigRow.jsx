import { View, Text, Pressable, StyleSheet } from "react-native";
import { Initials, Pay, Chip } from "./ui";
import { C, F } from "../lib/theme";

// Compact list row — business square · role + meta · pay/timing.
export function GigRow({ gig, dist, onPress, last }) {
  const isBiz = gig.who && !gig.who.startsWith("Self");
  return (
    <Pressable onPress={onPress} style={[s.row, !last && s.border]}>
      <Initials text={gig.initials} size={38} square={isBiz} bg={isBiz ? C.navy : C.indigoSoft} color={isBiz ? "#818cf8" : C.indigo} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={s.title} numberOfLines={1}>{gig.title}</Text>
          {gig.urgent ? <Chip label="Urgent" tone="red" small /> : null}
        </View>
        <Text style={s.meta} numberOfLines={1}>{gig.who} · {gig.area}{dist != null ? ` · ${dist}km` : ""}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Pay amount={gig.payAmount} unit={gig.payUnit} size={13} />
        <Text style={s.timing}>{gig.timing || gig.hrs}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  title: { fontFamily: F.bold, fontSize: 13, color: C.text, flexShrink: 1 },
  meta: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 2 },
  timing: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 2 },
});
