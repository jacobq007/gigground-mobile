import { Stack } from "expo-router";
import { C } from "../../../lib/theme";

export default function JobsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="fulltime" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
