import { Tabs } from "expo-router";
import { View, Pressable, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ModeProvider, useMode } from "../../lib/ModeContext";
import { FJ } from "../../lib/theme";

// Per-mode accent — blue-violet (working) / magenta (hiring), matching the home redesign.
const ACCENT = { working: "#3C6AE2", hiring: "#AD248C" };
const SOFT = { working: "#D8E8FF", hiring: "#FFD5EE" };
const INACTIVE = "#8A8F98";

// Third tab relabels: Dashboard (working) → My gigs (hiring).
const TAB_CFG = {
  index: { icon: "home", label: "Home" },
  jobs: { icon: "briefcase", label: "Jobs" },
  dashboard: { icon: "grid", label: { working: "Dashboard", hiring: "My gigs" } },
  chat: { icon: "chatbubble", label: "Chat" },
  profile: { icon: "person", label: "Profile" },
};

function ModeTabBar({ state, navigation }) {
  const { mode } = useMode();
  const insets = useSafeAreaInsets();
  const accent = ACCENT[mode] || ACCENT.working;
  const soft = SOFT[mode] || SOFT.working;

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, i) => {
        const cfg = TAB_CFG[route.name];
        if (!cfg) return null;
        const focused = state.index === i;
        const label = typeof cfg.label === "string" ? cfg.label : cfg.label[mode] || cfg.label.working;
        const color = focused ? accent : INACTIVE;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={s.item} accessibilityRole="button" accessibilityLabel={label}>
            <View style={[s.iconWrap, focused && { backgroundColor: soft }]}>
              <Ionicons name={cfg.icon} size={18} color={color} />
            </View>
            <Text style={[s.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <ModeProvider>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <ModeTabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="jobs" />
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </ModeProvider>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6E4EF",
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 2 },
  iconWrap: { width: 40, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: FJ.sbold, fontSize: 9.5 },
});
