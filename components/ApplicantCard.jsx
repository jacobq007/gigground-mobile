import { Alert, View, Text, Pressable, StyleSheet } from "react-native";
import { Initials, Chip, VerifiedBadge } from "./ui";
import { reliability } from "../lib/reliability";
import { F } from "../lib/theme";
import { useC } from "../lib/ThemeContext";

const STATUS_LABEL = { applied: "Applied", confirmed: "Confirmed", in_shift: "In shift", done: "Completed", no_show: "No-show" };
const NO_SHOW_ELIGIBLE = ["confirmed", "in_shift"];

export function ApplicantCard({ applicant, onNoShow }) {
  const C = useC();
  const s = makeStyles(C);
  const { pct, strikes } = reliability(applicant);

  const confirmNoShow = () => {
    Alert.alert(
      "Report no-show?",
      `${applicant.name} will be marked as a no-show for this booking and get a strike. This can't be undone.`,
      [{ text: "Cancel", style: "cancel" }, { text: "Report no-show", style: "destructive", onPress: onNoShow }]
    );
  };

  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
        <Initials text={applicant.initials} size={38} bg={C.indigoSoft} color={C.indigo} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={s.name}>{applicant.name}</Text>
            {applicant.isVerifiedWorker ? <VerifiedBadge label="Verified Worker" /> : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
            <Text style={s.reliability}>{pct}% reliable · {strikes} strike{strikes === 1 ? "" : "s"}</Text>
            {strikes >= 3 ? <Chip label="High risk" tone="red" small /> : null}
          </View>
        </View>
        <Chip label={STATUS_LABEL[applicant.status] || applicant.status} tone={applicant.status === "no_show" ? "red" : "indigo"} small />
      </View>
      {NO_SHOW_ELIGIBLE.includes(applicant.status) ? (
        <Pressable onPress={confirmNoShow} style={s.noShowBtn}>
          <Text style={s.noShowTxt}>Worker didn't show</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 13, marginBottom: 10 },
  name: { fontFamily: F.bold, fontSize: 13, color: C.text },
  reliability: { fontFamily: F.reg, fontSize: 11, color: C.text2 },
  noShowBtn: { marginTop: 11, alignSelf: "flex-start", backgroundColor: C.redSoft, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  noShowTxt: { fontFamily: F.bold, fontSize: 12, color: C.red },
});
