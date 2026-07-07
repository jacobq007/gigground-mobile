import { Stack } from "expo-router";
import { C } from "../../../lib/theme";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="kyc" />
      <Stack.Screen name="my-gigs" />
    </Stack>
  );
}
