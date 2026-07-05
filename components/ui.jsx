import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, TextInput, View, StyleSheet, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F, money } from "../lib/theme";

// ── Labelled text field ─────────────────────────────────────────────────────────
export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, multiline }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ fontFamily: F.med, fontSize: 12, color: C.text2 }}>{label}</Text> : null}
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.text3}
        secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize} multiline={multiline}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ fontFamily: F.reg, fontSize: 14, color: C.text, backgroundColor: C.surface, borderWidth: 1, borderColor: focus ? C.indigo : C.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: multiline ? 12 : 11, minHeight: multiline ? 88 : 44, textAlignVertical: multiline ? "top" : "center" }}
      />
    </View>
  );
}

// ── Money text — the ONLY place green is used ───────────────────────────────────
export function Pay({ amount, unit, size = 13, style }) {
  const suffix = unit === "hr" ? "/hr" : unit === "day" ? "/day" : unit === "month" ? "/mo" : "";
  return (
    <Text style={[{ color: C.green, fontFamily: F.bold, fontSize: size }, style]}>
      {money(amount)}<Text style={{ fontFamily: F.reg, fontSize: size - 3, color: C.text3 }}>{suffix}</Text>
    </Text>
  );
}

// ── Initials avatar (circle for people, rounded square for businesses) ──────────
export function Initials({ text, size = 30, square = false, bg = C.indigoSoft, color = C.indigo }) {
  return (
    <View style={{ width: size, height: size, borderRadius: square ? size * 0.27 : size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontFamily: F.bold, fontSize: size * 0.38 }}>{text}</Text>
    </View>
  );
}

// ── Neutral chip ────────────────────────────────────────────────────────────────
export function Chip({ label, tone = "neutral", small }) {
  const tones = {
    neutral: { bg: C.surface2, fg: C.text2 },
    red:     { bg: C.redSoft, fg: C.red },
    amber:   { bg: "#FEF3E2", fg: C.amber },
    indigo:  { bg: C.indigoSoft, fg: C.indigo },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <View style={{ backgroundColor: t.bg, paddingHorizontal: small ? 7 : 9, paddingVertical: small ? 2 : 3, borderRadius: 5, alignSelf: "flex-start" }}>
      <Text style={{ color: t.fg, fontFamily: F.med, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

// ── Verified badge — visually distinct from a plain Chip (filled icon + label) ──
export function VerifiedBadge({ label = "Verified", size = "sm" }) {
  const small = size === "sm";
  return (
    <View style={[bStyles.badge, small && bStyles.badgeSm]}>
      <Ionicons name="checkmark-circle" size={small ? 11 : 13} color={C.indigo} />
      <Text style={[bStyles.txt, small && bStyles.txtSm]}>{label}</Text>
    </View>
  );
}
const bStyles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.indigoSoft, borderWidth: 1, borderColor: C.indigo + "33", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: "flex-start" },
  badgeSm: { paddingHorizontal: 6, paddingVertical: 2 },
  txt: { fontFamily: F.bold, fontSize: 11, color: C.indigo },
  txtSm: { fontSize: 10 },
});

// ── Toast — brief auto-dismissing bottom banner ─────────────────────────────────
export function Toast({ message, visible }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }),
      Animated.timing(ty, { toValue: visible ? 0 : 10, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible]);
  if (!message) return null;
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 18, right: 18, bottom: 24, opacity: op, transform: [{ translateY: ty }], backgroundColor: C.navy, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" }}>
      <Text style={{ color: "#fff", fontFamily: F.med, fontSize: 13 }}>{message}</Text>
    </Animated.View>
  );
}

// ── Buttons with press-scale ────────────────────────────────────────────────────
export function Button({ title, onPress, variant = "primary", icon, style, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const spr = (to) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const v = {
    primary:   { bg: C.indigo, fg: "#fff", bd: C.indigo },
    secondary: { bg: C.indigoSoft, fg: C.indigo, bd: "transparent" },
    ghost:     { bg: "transparent", fg: C.text2, bd: C.border },
    danger:    { bg: C.redSoft, fg: C.red, bd: "transparent" },
  }[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled} onPressIn={() => spr(0.97)} onPressOut={() => spr(1)}>
      <Animated.View style={[{ transform: [{ scale }], backgroundColor: v.bg, borderColor: v.bd, borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, opacity: disabled ? 0.5 : 1 }, style]}>
        {icon}
        <Text style={{ color: v.fg, fontFamily: F.bold, fontSize: 14 }}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const inner = (
    <View style={[styles.card, style]}>{children}</View>
  );
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
}

// ── Fade + rise on mount (staggered list polish) ────────────────────────────────
export function FadeIn({ children, delay = 0, style }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 260, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 260, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity: op, transform: [{ translateY: ty }] }, style]}>{children}</Animated.View>;
}

// ── Skeleton shimmer ────────────────────────────────────────────────────────────
export function Skeleton({ height = 64, style }) {
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[{ height, backgroundColor: C.surface2, borderRadius: 12, opacity: op }, style]} />;
}

// ── Empty state ──────────────────────────────────────────────────────────────────
export function Empty({ icon, title, subtitle, action }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 }}>
      {icon}
      <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.text, marginTop: 12, textAlign: "center" }}>{title}</Text>
      {subtitle ? <Text style={{ fontFamily: F.reg, fontSize: 13, color: C.text2, marginTop: 4, textAlign: "center", lineHeight: 19 }}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

export const Divider = ({ style }) => <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: C.border }, style]} />;

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 12 },
});
