import { Alert } from "react-native";
import { reportsAPI } from "./api";

const REASONS = ["Spam", "Harassment", "Scam", "Illegal / unsafe", "Other"];

// Strict report/flag — available on every post, comment, message, and job card.
// `onReported` (optional) fires after the report is recorded, e.g. to flip a local "reported" flag.
export function promptReport(targetType, targetId, onReported) {
  Alert.alert("Report " + targetType, "Why are you reporting this?", [
    ...REASONS.map((reason) => ({
      text: reason,
      onPress: async () => {
        await reportsAPI.create({ target_type: targetType, target_id: targetId, reason: reason.toLowerCase() });
        onReported?.();
        Alert.alert("Thanks", "Our team will review this shortly.");
      },
    })),
    { text: "Cancel", style: "cancel" },
  ]);
}
