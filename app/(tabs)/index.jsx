import { useHomeVariant } from "../../lib/HomeVariantContext";
import { useMode } from "../../lib/ModeContext";
import HomeClassic from "../../components/home/HomeClassic";
import HomeShift from "../../components/home/HomeShift";
import HirerShift from "../../components/home/HirerShift";

// Home is a switch, not a screen. Two designs ship together so the older one
// can always be turned back on (Profile → Appearance → Shift board home):
//
//   "shift"   → HomeShift (working) / HirerShift (hiring)
//   "classic" → HomeClassic, the original hero home, which handles both modes
//
// HomeClassic stays fully wired in either direction — nothing about the old
// design is deleted or unreachable.
export default function Home() {
  const { variant } = useHomeVariant();
  const { mode } = useMode();

  if (variant !== "shift") return <HomeClassic />;
  return mode === "hiring" ? <HirerShift /> : <HomeShift />;
}
