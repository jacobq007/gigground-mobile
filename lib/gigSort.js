import { getZoneNeighbours, areaToAreaKm } from "./geo";

// Sort gigs into reach tiers relative to the feed zone.
// Returns { worthTravel, tiers:[{label, gigs}], total }
export function sortGigsByZone(gigs, feedZone) {
  const withDist = gigs.map((g) => ({ ...g, dist: feedZone ? areaToAreaKm(g.area, feedZone) : null }));
  const byDist = (a, b) => (a.dist ?? 999) - (b.dist ?? 999);

  if (!feedZone) {
    return { worthTravel: [], tiers: [{ label: "All gigs", gigs: withDist.sort(byDist) }], total: withDist.length };
  }

  const neighbours = getZoneNeighbours(feedZone, 6);

  // High-value gigs outside the zone worth surfacing regardless of distance
  const highValue = (g) => g.urgent || (g.payUnit === "hr" && g.payAmount >= 1000) || (g.payUnit === "day" && g.payAmount >= 1500);
  const inZone = (g) => g.area === feedZone;
  const inNearby = (g) => neighbours.includes(g.area);

  const worthTravel = withDist
    .filter((g) => !inZone(g) && !inNearby(g) && highValue(g))
    .sort((a, b) => b.payAmount - a.payAmount)
    .slice(0, 3);

  const worthIds = new Set(worthTravel.map((g) => g.id));
  const rest = withDist.filter((g) => !worthIds.has(g.id));

  const yourZone = rest.filter(inZone).sort(byDist);
  const nearby = rest.filter((g) => !inZone(g) && inNearby(g)).sort(byDist);
  const cityWide = rest.filter((g) => !inZone(g) && !inNearby(g)).sort(byDist);

  const tiers = [];
  if (yourZone.length) tiers.push({ label: `Your zone · ${feedZone}`, gigs: yourZone });
  if (nearby.length) tiers.push({ label: "Nearby", gigs: nearby });
  // Only widen to city-wide if results are sparse, OR always show as a final tier
  if (cityWide.length && yourZone.length + nearby.length < 8) tiers.push({ label: "City-wide", gigs: cityWide });
  else if (!yourZone.length && !nearby.length) tiers.push({ label: "City-wide", gigs: cityWide });

  return { worthTravel, tiers, total: withDist.length };
}
