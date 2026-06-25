import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui";
import AreaPicker from "../../components/AreaPicker";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import { C, F } from "../../lib/theme";

export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const { setHomeZone } = useLocation();
  const [zone, setZone] = useState(user?.area || "");
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!zone) return;
    setBusy(true);
    await setHomeZone(zone);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 20 }}>
        <View style={s.iconWrap}><Ionicons name="location" size={24} color={C.indigo} /></View>
        <Text style={s.title}>Set your Home Zone</Text>
        <Text style={s.sub}>We'll show gigs near here first. You can change it anytime — and we'll never auto-jump your feed just because you moved.</Text>
        <View style={{ marginTop: 22, flex: 1 }}>
          <AreaPicker value={zone} onChange={setZone} height={380} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 28, paddingBottom: 16 }}>
        <Button title={zone ? `Continue with ${zone}` : "Pick an area to continue"} onPress={finish} disabled={!zone || busy} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.indigoSoft, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontFamily: F.bold, fontSize: 24, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 14, color: C.text2, marginTop: 8, lineHeight: 21 },
});
