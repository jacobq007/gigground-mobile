import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { useLocation } from "../lib/LocationContext";
import { useC } from "../lib/ThemeContext";

export default function Index() {
  const { user, loading } = useAuth();
  const { homeZone } = useLocation();
  const C = useC();

  if (loading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
      <ActivityIndicator color={C.indigo} />
    </View>;
  }
  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!homeZone) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
