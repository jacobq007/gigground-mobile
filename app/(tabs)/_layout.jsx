import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../lib/theme";

function TabIcon({ name, focused }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: 34 }}>
      <Ionicons name={name} size={23} color={focused ? C.indigo : "#C4C9D4"} />
      <View style={[s.dot, focused && { backgroundColor: C.indigo }]} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.hairline,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "ios" ? 86 : 64,
          paddingTop: 8,
        },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tabs.Screen name="jobs" options={{ tabBarIcon: ({ focused }) => <TabIcon name="briefcase" focused={focused} /> }} />
      <Tabs.Screen name="community" options={{ tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} /> }} />
      <Tabs.Screen name="chat" options={{ tabBarIcon: ({ focused }) => <TabIcon name="chatbubble" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4, backgroundColor: "transparent" },
});
