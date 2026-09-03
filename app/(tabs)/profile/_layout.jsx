import { Stack } from "expo-router";
import { useC } from "../../../lib/ThemeContext";

export default function ProfileLayout() {
  const C = useC();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="kyc" />
      <Stack.Screen name="my-gigs" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="applicants" />
      <Stack.Screen name="record" />
    </Stack>
  );
}
