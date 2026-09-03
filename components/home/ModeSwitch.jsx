import { View, Pressable, StyleSheet, Animated } from "react-native";
import { useMode } from "../../lib/ModeContext";
import { FJ } from "../../lib/theme";

// ── Working / Hiring ──────────────────────────────────────────────────────────
// Shared by both shift homes so the control is one component, not two copies
// that have to be kept in sync.
//
// Only the pill moves quickly. Every colour on it is interpolated off the shared
// `wash`, which outlives the screen swap — so when HomeShift is torn down and
// HirerShift mounts mid-animation, the new screen renders the same in-flight
// colour and the change reads as continuous.
//
// The track width comes from the context, not from local state, because this
// component REMOUNTS in the middle of its own animation: Home swaps HomeShift
// for HirerShift the moment mode flips. onLayout has not fired on that first
// frame, so a locally-held measurement is 0 exactly when the pill needs to
// travel — it collapses instead of sliding. Measured once, kept above the swap,
// it is already correct when the new screen mounts.
//
// The pill's transform runs on the native driver and its fill on the JS driver.
// Those cannot share one node, hence the outer/inner pair: RN throws if a single
// animated node is driven both ways.
const INSET = 4; // track padding, each side

const TRACK = ["#172259", "#39072C"];
const PILL = ["#3C6AE2", "#AD248C"];
const ON = "rgba(255,255,255,1)";
const OFF = "rgba(255,255,255,0.55)";

export default function ModeSwitch() {
  const { mode, setMode, pill, wash, trackW, setTrackW } = useMode();

  const half = trackW > 0 ? (trackW - INSET * 2) / 2 : 0;

  const trackBg = wash.interpolate({ inputRange: [0, 1], outputRange: TRACK });
  const pillBg = wash.interpolate({ inputRange: [0, 1], outputRange: PILL });
  const workTx = wash.interpolate({ inputRange: [0, 1], outputRange: [ON, OFF] });
  const hireTx = wash.interpolate({ inputRange: [0, 1], outputRange: [OFF, ON] });
  const slide = pill.interpolate({ inputRange: [0, 1], outputRange: [0, half] });

  return (
    <View style={s.wrap}>
      <Animated.View
        style={[s.track, { backgroundColor: trackBg }]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - trackW) > 0.5) setTrackW(w);
        }}
      >
        <Animated.View
          style={[s.pillOuter, { width: half, transform: [{ translateX: slide }], pointerEvents: "none" }]}
        >
          <Animated.View style={[s.pillFill, { backgroundColor: pillBg }]} />
        </Animated.View>

        <Pressable
          style={s.btn}
          onPress={() => setMode("working")}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === "working" }}
          accessibilityLabel="Working"
        >
          <Animated.Text style={[s.txt, { color: workTx }]}>Working</Animated.Text>
        </Pressable>

        <Pressable
          style={s.btn}
          onPress={() => setMode("hiring")}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === "hiring" }}
          accessibilityLabel="Hiring"
        >
          <Animated.Text style={[s.txt, { color: hireTx }]}>Hiring</Animated.Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingBottom: 10 },
  track: { flexDirection: "row", borderRadius: 99, padding: INSET },
  pillOuter: { position: "absolute", top: INSET, bottom: INSET, left: INSET, borderRadius: 99 },
  pillFill: { flex: 1, borderRadius: 99 },
  btn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 99 },
  txt: { fontFamily: FJ.bold, fontSize: 13 },
});
