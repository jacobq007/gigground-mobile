// Reliability % + strike count for a gig applicant, from completed vs no-show bookings.
export function reliability({ completed = 0, noShows = 0 } = {}) {
  const total = completed + noShows;
  const pct = total === 0 ? 100 : Math.round((completed / total) * 100);
  return { pct, strikes: noShows };
}
