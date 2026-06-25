// ── GIGGROUND — Community Events (mock data + in-memory API) ───────────────────
// Inspired by event-platform patterns, rebuilt for a wholesome hyperlocal
// community. Swap this module for a real API later — the shape stays the same.

export const EVENT_CATEGORIES = [
  { id: "workshop",   label: "Workshops",    icon: "color-palette-outline" },
  { id: "meetup",     label: "Meetups",      icon: "people-outline" },
  { id: "market",     label: "Markets",      icon: "storefront-outline" },
  { id: "cultural",   label: "Cultural",     icon: "sparkles-outline" },
  { id: "sports",     label: "Sports",       icon: "fitness-outline" },
  { id: "music",      label: "Music",        icon: "musical-notes-outline" },
  { id: "networking", label: "Networking",   icon: "briefcase-outline" },
  { id: "volunteer",  label: "Volunteering", icon: "heart-outline" },
];

export const CATEGORY_LABEL = Object.fromEntries(EVENT_CATEGORIES.map((c) => [c.id, c.label]));

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtEventDate(iso) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return {
    day: DAYS[d.getDay()],
    num: String(d.getDate()),
    month: MONTHS[d.getMonth()],
    time: `${h}:${String(m).padStart(2, "0")} ${ap}`,
  };
}

export const SEED_EVENTS = [
  {
    id: "e1", title: "Pottery basics — hands-on class", category: "workshop", cost: 0,
    start: "2026-06-21T10:00:00", durationLabel: "2 hrs", type: "in-person",
    venueName: "Adyar Arts Hub", area: "Adyar", distanceKm: 3.2, coords: { lat: 13.0063, lng: 80.2574 },
    organizerName: "Meena Kumari", organizerInitials: "MK", coverColor: "#7c3aed",
    description: "A relaxed, beginner-friendly pottery session. All clay, tools and aprons provided — just bring yourself. We'll cover wheel basics and hand-building, and you'll take your piece home after firing.",
    privacy: "public", going: 12, friendsGoing: 2,
    friendAvatars: [{ t: "RV", c: "#4338CA" }, { t: "AN", c: "#15803D" }],
    capacity: 20, hiringHelpers: 0,
  },
  {
    id: "e2", title: "Velachery weekend flea market", category: "market", cost: 50,
    start: "2026-06-29T16:00:00", durationLabel: "till late", type: "in-person",
    venueName: "Phoenix Grounds", area: "Velachery", distanceKm: 6.1, coords: { lat: 12.9815, lng: 80.2180 },
    organizerName: "Arjun Nair", organizerInitials: "AN", coverColor: "#0891b2",
    description: "50+ local stalls — thrift fashion, handmade crafts, street food and live buskers. Family and pet friendly. ₹50 entry helps us pay the ground and keep stalls free for small sellers.",
    privacy: "public", going: 48, friendsGoing: 5,
    friendAvatars: [{ t: "LP", c: "#be185d" }, { t: "KS", c: "#b45309" }],
    capacity: null, hiringHelpers: 3, helperGigId: "g1",
  },
  {
    id: "e3", title: "Sunday morning run club", category: "sports", cost: 0,
    start: "2026-06-22T06:30:00", durationLabel: "1 hr", type: "in-person",
    venueName: "Besant Nagar Beach", area: "Besant Nagar", distanceKm: 8.4, coords: { lat: 12.9982, lng: 80.2669 },
    organizerName: "Ramesh Venkat", organizerInitials: "RV", coverColor: "#15803D",
    description: "Easy 5K beach run for all levels, followed by filter coffee. Walkers welcome — we regroup at the lighthouse. Bring water and a smile.",
    privacy: "public", going: 31, friendsGoing: 1,
    friendAvatars: [{ t: "MK", c: "#7c3aed" }],
    capacity: null, hiringHelpers: 0,
  },
  {
    id: "e4", title: "Indie music night — live sets", category: "music", cost: 200,
    start: "2026-06-27T19:30:00", durationLabel: "3 hrs", type: "in-person",
    venueName: "The Backyard", area: "Anna Nagar", distanceKm: 5.0, coords: { lat: 13.0891, lng: 80.2104 },
    organizerName: "Lakshmi Priya", organizerInitials: "LP", coverColor: "#be185d",
    description: "Four indie acts from across Chennai, one open mic slot. Doors at 7. Food trucks on site. ₹200 cover, drinks separate.",
    privacy: "public", going: 76, friendsGoing: 3,
    friendAvatars: [{ t: "AN", c: "#0891b2" }, { t: "RV", c: "#4338CA" }],
    capacity: 120, hiringHelpers: 2, helperGigId: "g5",
  },
  {
    id: "e5", title: "Founders & freelancers meetup", category: "networking", cost: 0,
    start: "2026-06-25T18:00:00", durationLabel: "2 hrs", type: "in-person",
    venueName: "WorkAffair", area: "Guindy", distanceKm: 1.8, coords: { lat: 13.0067, lng: 80.2206 },
    organizerName: "Priya S", organizerInitials: "PS", coverColor: "#4338CA",
    description: "Casual evening for indie builders, freelancers and small-business folks. Lightning intros, then open mingling. No pitches, just people.",
    privacy: "public", going: 22, friendsGoing: 0,
    friendAvatars: [], capacity: 40, hiringHelpers: 0,
  },
  {
    id: "e6", title: "Marina beach cleanup drive", category: "volunteer", cost: 0,
    start: "2026-06-28T07:00:00", durationLabel: "2 hrs", type: "in-person",
    venueName: "Marina Beach (Gate 3)", area: "Triplicane", distanceKm: 9.2, coords: { lat: 13.0500, lng: 80.2824 },
    organizerName: "Rahul Kumar", organizerInitials: "RK", coverColor: "#0d9488",
    description: "Monthly cleanup with gloves and bags provided. Two hours, real impact. Certificate for students who need volunteer hours.",
    privacy: "public", going: 64, friendsGoing: 4,
    friendAvatars: [{ t: "KS", c: "#b45309" }, { t: "MK", c: "#7c3aed" }],
    capacity: null, hiringHelpers: 0,
  },
  {
    id: "e7", title: "Resume & interview clinic", category: "workshop", cost: 0,
    start: "2026-06-19T20:00:00", durationLabel: "90 min", type: "virtual",
    venueName: "Online", area: "Online", distanceKm: 0, coords: null, onlineLink: "https://meet.gigground.app/clinic",
    organizerName: "Kavitha S", organizerInitials: "KS", coverColor: "#b45309",
    description: "Bring your resume and questions. We'll do live reviews and mock-interview a few volunteers. Recording shared after.",
    privacy: "public", going: 40, friendsGoing: 0,
    friendAvatars: [], capacity: 100, hiringHelpers: 0,
  },
];

// ── RSVP store (module-level so list + detail stay in sync this session) ───────
const rsvpStore = {};
export function getRsvp(id) { return rsvpStore[id] || null; }
export function setRsvp(id, val) { rsvpStore[id] = val; }
export function goingCount(ev) { return ev.going + (getRsvp(ev.id) === "going" ? 1 : 0); }

const CATEGORY_COLOR = {
  workshop: "#7c3aed", meetup: "#4338CA", market: "#0891b2", cultural: "#be185d",
  sports: "#15803D", music: "#db2777", networking: "#4338CA", volunteer: "#0d9488",
};

export const eventsAPI = {
  getAll: async () => SEED_EVENTS.slice().sort((a, b) => new Date(a.start) - new Date(b.start)),
  getOne: async (id) => SEED_EVENTS.find((e) => e.id === id) || null,
  create: async (e) => {
    const ev = {
      id: "ev_" + Date.now(),
      going: 0, friendsGoing: 0, friendAvatars: [],
      capacity: null, hiringHelpers: 0, privacy: "public",
      coverColor: CATEGORY_COLOR[e.category] || "#4338CA",
      ...e,
    };
    SEED_EVENTS.push(ev);
    if (ev.organizerIsMe) setRsvp(ev.id, "going"); // organizer auto-attends
    return ev;
  },
};
