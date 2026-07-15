import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Pay, Chip, VerifiedBadge } from "./ui";
import { formatPayRange } from "../lib/pay";
import { skillLabel } from "../lib/skills";
import { F } from "../lib/theme";
import { useC } from "../lib/ThemeContext";

const DAY_MS = 24 * 60 * 60 * 1000;

// Days left until completeBy (negative once past). null when the gig has no deadline.
function daysUntil(completeBy) {
  if (!completeBy) return null;
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const end = new Date(completeBy + "T00:00:00");
  return Math.round((end - today) / DAY_MS);
}

// Compact list row — business square · role + meta · pay/timing.
// `onReport`, when passed, shows a flag button (worker feed only — never on a hirer's own posts).
export function GigRow({ gig, dist, onPress, last, onReport }) {
  const C = useC();
  const s = makeStyles(C);
  const isBiz = gig.who && !gig.who.startsWith("Self");
  const daysLeft = daysUntil(gig.completeBy);
  const expired = daysLeft != null && daysLeft < 0;

  return (
    <Pressable onPress={onPress} style={[s.row, !last && s.border, expired && s.expiredRow]}>
      <Initials text={gig.initials} size={38} square={isBiz} bg={isBiz ? C.navy : C.indigoSoft} color={isBiz ? "#818cf8" : C.indigo} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text style={[s.title, expired && s.mutedTxt]} numberOfLines={1}>{gig.title}</Text>
          {gig.skillRequired && gig.skillKey && !expired ? (
            <View style={s.skilled}><Ionicons name="shield-checkmark" size={9} color={C.indigo} /><Text style={s.skilledTxt}>{skillLabel(gig.skillKey)}</Text></View>
          ) : null}
          {gig.urgent && !expired ? <Chip label="Urgent" tone="red" small /> : null}
          {expired ? <Chip label="Expired" tone="neutral" small /> : daysLeft != null ? (
            <Chip label={daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft}d`} tone={daysLeft <= 1 ? "amber" : "neutral"} small />
          ) : null}
        </View>
        <Text style={[s.meta, expired && s.mutedTxt]} numberOfLines={1}>{gig.who} · {gig.area}{dist != null ? ` · ${dist}km` : ""}</Text>
        {gig.verifiedHirer ? <View style={{ marginTop: 4 }}><VerifiedBadge label="Verified Hirer" /></View> : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={[expired && s.mutedTxt]}>
          {gig.payMax != null ? (
            <Text style={{ color: expired ? C.text3 : C.green, fontFamily: F.bold, fontSize: 13 }}>{formatPayRange(gig.payMin ?? gig.payAmount, gig.payMax, gig.payUnit)}</Text>
          ) : (
            <Pay amount={gig.payAmount} unit={gig.payUnit} size={13} />
          )}
        </View>
        <Text style={s.timing}>{gig.timing || gig.hrs}</Text>
        {onReport ? (
          <Pressable onPress={(e) => { e.stopPropagation?.(); onReport(); }} hitSlop={8}>
            <Ionicons name="flag-outline" size={14} color={C.text3} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (C) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  expiredRow: { opacity: 0.55 },
  mutedTxt: { color: C.text3 },
  title: { fontFamily: F.bold, fontSize: 13, color: C.text, flexShrink: 1 },
  meta: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 2 },
  timing: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 2 },
  skilled: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: C.indigoSoft, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  skilledTxt: { fontFamily: F.bold, fontSize: 9.5, color: C.indigo },
});
