import { useHomeVariant } from "../../lib/HomeVariantContext";
import { useMode } from "../../lib/ModeContext";
import HomeClassic from "../../components/home/HomeClassic";
import HomeShift from "../../components/home/HomeShift";

// Home is a switch, not a screen. Two designs ship together so the older one
// can always be turned back on (Profile → Appearance → Home layout):
//
//   "shift"   → HomeShift, the committed-day board with the online switch and
//               the offer bar. Worker side only for now.
//   "classic" → HomeClassic, the original hero home. Also handles Hiring mode
//               in both variants, so switching modes never loses a screen.
export default function Home() {
  const { variant } = useHomeVariant();
  const { mode } = useMode();

  if (variant === "shift" && mode === "working") return <HomeShift />;
  return <HomeClassic />;
}
