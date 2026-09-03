import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Easing, Platform } from "react-native";

// Shared Home intent: "working" (find gigs) vs "hiring" (post gigs).
// Lives above the tab navigator so both the Home screen and the bottom
// nav bar (which relabels/recolors per mode) read the same value.
const ModeCtx = createContext(null);
export const useMode = () => useContext(ModeCtx);

// ── The mode switch is a wash, not a slide ────────────────────────────────────
// One base duration of 380ms, split into two tracks that deliberately disagree:
//
//   pill  160ms — lands almost before you finish the tap, so the press feels answered
//   wash  513ms — the colour keeps travelling after the pill has already stopped
//
// The stagger is the whole point. Move both together and it reads as a control
// sliding; let the colour run on behind and it reads as the surface changing
// underneath you, which is what we are after.
//
// Both values live HERE rather than in the switch because Home swaps HomeShift
// for HirerShift the moment `mode` flips. An Animated.Value owned by either
// screen would be unmounted mid-flight and the wash would snap. These survive
// the swap, so the incoming screen picks the colour up exactly where the
// outgoing one left it — as long as it interpolates the same pair off `wash`.
const PILL_MS = 160;
const WASH_MS = 513;
const PILL_EASING = Easing.bezier(0.2, 0.9, 0.25, 1);
const WASH_EASING = Easing.bezier(0.22, 1, 0.36, 1);

// The pill is a transform, so it can ride the native driver on a device. On web
// there is no native animated module: asking for it there does not degrade, it
// throws out of the press handler — which silently killed the colour animation
// queued behind it. Colours can never use it, on any platform.
const PILL_NATIVE = Platform.OS !== "web";

export function ModeProvider({ children }) {
  const [mode, setModeState] = useState("working");

  // Measured width of the mode switch's track, kept here rather than in the
  // switch itself. The switch REMOUNTS mid-animation (Home swaps HomeShift for
  // HirerShift the moment mode flips), and a fresh mount has not been laid out
  // yet — a locally-held measurement is 0 on exactly the frame the pill needs to
  // travel, so it collapses instead of sliding. Held here it survives the swap.
  const [trackW, setTrackW] = useState(0);

  // 0 = working, 1 = hiring.
  // Two values, not one, because they run at different speeds — and because
  // transforms can go on the native driver while colours cannot.
  const pill = useRef(new Animated.Value(0)).current; // native driver
  const wash = useRef(new Animated.Value(0)).current; // JS driver (colours)

  const setMode = useCallback((next) => {
    setModeState(next);
    const to = next === "hiring" ? 1 : 0;
    Animated.timing(pill, { toValue: to, duration: PILL_MS, easing: PILL_EASING, useNativeDriver: PILL_NATIVE }).start();
    Animated.timing(wash, { toValue: to, duration: WASH_MS, easing: WASH_EASING, useNativeDriver: false }).start();
  }, [pill, wash]);

  return (
    <ModeCtx.Provider value={{ mode, setMode, pill, wash, trackW, setTrackW }}>
      {children}
    </ModeCtx.Provider>
  );
}

// Interpolate any working → hiring colour pair off the shared wash. Screens use
// this instead of picking a colour from `mode`, so the change is carried rather
// than cut.
export function useWash(working, hiring) {
  const { wash } = useMode();
  return wash.interpolate({ inputRange: [0, 1], outputRange: [working, hiring] });
}
