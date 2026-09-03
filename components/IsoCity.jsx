import { memo } from "react";
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Polygon, Rect, G } from "react-native-svg";

// ── The city under the location screen ────────────────────────────────────────
// Drawn rather than shipped as an image: it recolours with the palette, stays
// sharp at any pixel density, and costs nothing to download.
//
// Isometric projection. One tile has half-extents W2 x H2; a block is a 1x1
// footprint extruded upward by `h`. Each block is three flat polygons — top,
// left, right — lit from the upper right, so the mass reads without any outline.
//
//   screen x = OX + (gx - gy) * W2
//   screen y = OY + (gx + gy) * H2 - lift
//
// Blocks are painted back-to-front by (gx + gy), which is the depth order on an
// isometric grid — nearer blocks simply overlap the ones behind them.

const VB_W = 390;
const VB_H = 400;
const W2 = 27;
const H2 = 15.5;
const OX = 195;
const OY = 88;

const P = (gx, gy, lift = 0) => [OX + (gx - gy) * W2, OY + (gx + gy) * H2 - lift];
const pts = (arr) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

// gx, gy, height, tone.
//   0 — plain concrete
//   1 — the taller core sitting under the glow
//   2 — low structures: sheds, single-storey shops
const CITY = [
  [0, 0, 62, 1], [1, 0, 40, 0], [2, 0, 26, 2], [3, 0, 44, 0],
  [0, 1, 34, 0], [1, 1, 74, 1], [2, 1, 30, 2], [3, 1, 52, 0],
  [0, 2, 46, 0], [1, 2, 28, 2], [2, 2, 58, 1], [3, 2, 32, 0],
  [0, 3, 24, 2], [1, 3, 50, 0], [2, 3, 36, 0], [3, 3, 66, 1],
  [-1, 0, 30, 0], [-1, 1, 48, 0], [-1, 2, 22, 2], [-1, 3, 38, 0],
  [0, 4, 42, 0], [1, 4, 26, 2], [2, 4, 46, 0], [3, 4, 28, 2],
  [4, 1, 34, 0], [4, 2, 24, 2], [4, 3, 40, 0],
  [-2, 1, 26, 2], [-2, 2, 36, 0], [-2, 3, 22, 2],
];

const LIGHT = {
  0: { top: "#D9D7D2", right: "#BFBCB6", left: "#A8A49D" },
  1: { top: "#C9C7E8", right: "#AEABD8", left: "#918DC4" },
  2: { top: "#E3E1DC", right: "#CCC9C3", left: "#B5B1AA" },
  ground: "#EDECE9",
};
const DARK = {
  0: { top: "#2E3039", right: "#25272E", left: "#1C1E24" },
  1: { top: "#3A3768", right: "#2F2D56", left: "#242243" },
  2: { top: "#34363F", right: "#2A2C34", left: "#212329" },
  ground: "#1A1B21",
};

// Depth-sorted once at module load — the layout is static.
const ORDERED = [...CITY].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));

function IsoCity({ accent = "#4338CA", fade = "#FAFAF9", dark = false, dimmed = false }) {
  const tones = dark ? DARK : LIGHT;

  // "slice" fills the slot rather than letterboxing inside it: the frame is
  // wider than the artwork is tall, and the default "meet" shrinks the city to a
  // stamp floating in the middle of the screen.
  return (
    <Svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      opacity={dimmed ? 0.45 : 1}
    >
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="52%" r="42%">
          <Stop offset="0" stopColor={accent} stopOpacity={dark ? 0.4 : 0.3} />
          <Stop offset="0.6" stopColor={accent} stopOpacity={dark ? 0.16 : 0.1} />
          <Stop offset="1" stopColor={accent} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="fadeout" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.55" stopColor={fade} stopOpacity={0} />
          <Stop offset="1" stopColor={fade} stopOpacity={1} />
        </LinearGradient>
      </Defs>

      {/* The zone we would place you in, bleeding out into the rest of the city */}
      <Ellipse cx={195} cy={208} rx={180} ry={120} fill="url(#glow)" />

      <Polygon points={pts([P(-2.2, -0.5), P(4.4, -0.5), P(4.4, -0.2), P(-2.2, -0.2)])} fill={tones.ground} />
      <Polygon points={pts([P(-2.2, 4.2), P(4.4, 4.2), P(4.4, 4.6), P(-2.2, 4.6)])} fill={tones.ground} />

      {ORDERED.map(([gx, gy, h, tone]) => {
        const t = tones[tone] || tones[0];
        const a0 = P(gx, gy);
        const b0 = P(gx + 1, gy);
        const c0 = P(gx + 1, gy + 1);
        const d0 = P(gx, gy + 1);
        const a1 = P(gx, gy, h);
        const b1 = P(gx + 1, gy, h);
        const c1 = P(gx + 1, gy + 1, h);
        const d1 = P(gx, gy + 1, h);
        return (
          <G key={`${gx}:${gy}`}>
            <Polygon points={pts([d0, c0, c1, d1])} fill={t.left} />
            <Polygon points={pts([c0, b0, b1, c1])} fill={t.right} />
            <Polygon points={pts([a1, b1, c1, d1])} fill={t.top} />
          </G>
        );
      })}

      {/* Let the city dissolve into the page rather than ending on a hard edge */}
      <Rect x={0} y={300} width={VB_W} height={100} fill="url(#fadeout)" />
    </Svg>
  );
}

export default memo(IsoCity);
