import { Stack } from "expo-router";
import { useC } from "../../../lib/ThemeContext";

export default function ChatLayout() {
  const C = useC();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
