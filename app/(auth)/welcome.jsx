import { useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui";
import { F } from "../../lib/theme";
import { useC } from "../../lib/ThemeContext";

export default function Welcome() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  return (
    <SafeAreaView style={s.wrap}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 28 }}>
        <View style={s.badge}>
          <View style={s.dot} />
          <Text style={s.badgeTxt}>HYPERLOCAL · CHENNAI</Text>
        </View>
        <Text style={s.brand}>GigGround</Text>
        <Text style={s.tagline}>Find gigs and quick work happening right around you — and the people who need them.</Text>

        <View style={{ marginTop: 28, gap: 14 }}>
          {[["map", "Gigs near your zone, sorted by distance"], ["cash-outline", "See the pay upfront, every time"], ["chatbubbles-outline", "Chat opens the moment you're hired"]].map(([ic, t]) => (
            <View key={t} style={s.row}>
              <Ionicons name={ic} size={18} color={C.indigo} />
              <Text style={s.rowTxt}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 28, paddingBottom: 12, gap: 10 }}>
        <Button title="Create account" onPress={() => router.push("/(auth)/signup")} />
        <Button title="I already have an account" variant="secondary" onPress={() => router.push("/(auth)/login")} />
        <Text style={s.hint}>Demo login: rahul@test.com</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.indigoSoft, alignSelf: "flex-start", paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, marginBottom: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.indigo },
  badgeTxt: { fontFamily: F.bold, fontSize: 10, color: C.indigo, letterSpacing: 1 },
  brand: { fontFamily: F.bold, fontSize: 40, color: C.indigo, letterSpacing: -1 },
  tagline: { fontFamily: F.reg, fontSize: 15, color: C.text2, lineHeight: 23, marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 11 },
  rowTxt: { fontFamily: F.med, fontSize: 14, color: C.text },
  hint: { fontFamily: F.reg, fontSize: 12, color: C.text3, textAlign: "center", marginTop: 4 },
});
