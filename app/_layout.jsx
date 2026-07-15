import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/AuthContext";
import { LocationProvider } from "../lib/LocationContext";
import { C } from "../lib/theme";

const isWeb = Platform.OS === "web";

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular, DMSans_500Medium, DMSans_700Bold,
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
    SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  const tree = (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: "slide_from_right" }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modals/notifications" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="modals/post-gig" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="modals/active-gig" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="modals/verify" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="modals/gigs-map" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="modals/availability" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="modals/refer" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="modals/boost" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="modals/skills" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          </Stack>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );

  // On web, frame the app like a phone so it looks right when shown on a desktop.
  if (isWeb) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#E9E8E4", minHeight: "100%" }}>
        <View style={{ width: 400, height: 844, maxHeight: "100%", backgroundColor: C.bg, overflow: "hidden", borderRadius: 28, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" }}>
          {tree}
        </View>
      </View>
    );
  }
  return tree;
}
