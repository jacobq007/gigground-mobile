// ── GIGGROUND MOBILE — MOCK API CLIENT ────────────────────────────────────────
// Mirrors the web src/api.js interface EXACTLY, but resolves from local mock
// data instead of fetch(). When the backend is ready, only this file changes.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as seed from "./mockData";
import { reliability } from "./reliability";
import { compatibility } from "./skills";

const delay = (ms = 320) => new Promise((r) => setTimeout(r, ms));
const clone = (x) => JSON.parse(JSON.stringify(x));
const uid = (p = "x") => p + "_" + Math.random().toString(36).slice(2, 9);
const DB_VERSION = "v7"; // bump when seed data changes to force a reset

// ── Application lifecycle ─────────────────────────────────────────────────────
// applied → seen → shortlisted → hired | declined | expired | withdrawn
// hired continues through the gig itself: in_shift → done
const HOUR = 3600 * 1000;
const RESPOND_WINDOW_HRS = 24; // hirer must answer within this or we auto-expire
export const OPEN_APP_STATUSES = ["applied", "seen", "shortlisted"];

// Seed rows carry relative `appliedHrsAgo`; turn them into real timestamps.
const hydrateApp = (a) => {
  const appliedAt = Date.now() - (a.appliedHrsAgo || 0) * HOUR;
  return { appliedAt, respondBy: appliedAt + RESPOND_WINDOW_HRS * HOUR, ...a };
};

// The "never silence" guarantee: any open application past its respondBy
// deadline flips to expired and the worker is notified. Runs on every read.
async function sweepApplications() {
  let changed = false;
  for (const a of db.applications) {
    if (OPEN_APP_STATUSES.includes(a.status) && a.respondBy && Date.now() > a.respondBy) {
      a.status = "expired";
      db.notifications.unshift({ id: uid("n"), type: "expired", title: "Application expired", body: `${a.who} didn't respond to your ${a.gigTitle} application in ${RESPOND_WINDOW_HRS}h. We've closed it and freed your slot.`, postedAgo: "now", read: false });
      changed = true;
    }
  }
  if (changed) await persist();
}

let db = null;
let session = null; // current user id

async function persist() {
  try { await AsyncStorage.setItem("gg_db", JSON.stringify(db)); } catch {}
}

async function ensure() {
  if (db) return;
  try {
    const ver = await AsyncStorage.getItem("gg_db_ver");
    const raw = ver === DB_VERSION ? await AsyncStorage.getItem("gg_db") : null;
    if (raw) { db = JSON.parse(raw); }
  } catch {}
  if (!db) {
    db = {
      users: clone(seed.SEED_USERS),
      gigs: clone(seed.SEED_GIGS),
      jobsBoard: clone(seed.SEED_JOBS_BOARD),
      posts: clone(seed.SEED_POSTS),
      applications: clone(seed.SEED_APPLICATIONS).map(hydrateApp),
      gigApplicants: clone(seed.SEED_GIG_APPLICANTS), // gigId → applicants on the hirer's own posted gigs
      chats: clone(seed.SEED_CHATS),
      notifications: clone(seed.SEED_NOTIFICATIONS),
      saved: [],
      kyc: { status: "unverified" },
    };
    await AsyncStorage.setItem("gg_db_ver", DB_VERSION).catch(() => {});
    await persist();
  }
  if (session === null) {
    try { session = await AsyncStorage.getItem("gg_session"); } catch {}
  }
}

const meUser = () => db.users.find((u) => u.id === session) || null;

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: async ({ name, email, password, type, city, area, bizCategory }) => {
    await ensure(); await delay();
    const user = {
      id: uid("u"), name, email, type: type || "user", city: city || "Chennai",
      area: area || "", bizCategory, bio: "", skills: "", skillGraph: [], phone: "",
      rating: 0, gigsDone: 0, earned: 0, kyc_status: "unverified", socials: {},
    };
    db.users.push(user);
    session = user.id;
    await AsyncStorage.setItem("gg_session", session);
    await persist();
    return clone(user);
  },
  signin: async ({ email }) => {
    await ensure(); await delay();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) throw new Error("No account found for that email");
    session = user.id;
    await AsyncStorage.setItem("gg_session", session);
    return clone(user);
  },
  signout: async () => {
    session = null;
    try { await AsyncStorage.removeItem("gg_session"); } catch {}
  },
  me: async () => {
    await ensure();
    return session ? clone(meUser()) : null;
  },
  updateProfile: async (updates) => {
    await ensure(); await delay();
    const u = meUser();
    if (!u) throw new Error("Not signed in");
    Object.assign(u, updates);
    await persist();
    return clone(u);
  },
  isLoggedIn: async () => { await ensure(); return !!session; },
};

// ── GIGS ──────────────────────────────────────────────────────────────────────
export const gigsAPI = {
  getAll: async () => { await ensure(); await delay(); return clone(db.gigs); },
  getBoard: async () => { await ensure(); await delay(); return clone(db.jobsBoard); },
  getOne: async (id) => { await ensure(); return clone(db.gigs.find((g) => g.id === id) || db.jobsBoard.find((g) => g.id === id) || null); },
  create: async (gigData) => {
    await ensure(); await delay();
    const gig = { id: uid("g"), postedAgo: "now", openings: 1, ...gigData };
    db.gigs.unshift(gig);
    await persist();
    return clone(gig);
  },
  getMy: async () => { await ensure(); return clone(db.gigs.filter((g) => g.who === (meUser()?.name))); },
  updateStatus: async () => ({ ok: true }),
  report: async (id) => {
    await ensure();
    const g = db.gigs.find((x) => x.id === id);
    if (g) { g.reported = true; await persist(); }
    return clone(g);
  },
  // Clones an expired post with a fresh completeBy/workDate so the hirer can re-list in one tap.
  relist: async (id, { workDate, completeBy }) => {
    await ensure(); await delay();
    const src = db.gigs.find((x) => x.id === id);
    if (!src) throw new Error("Gig not found");
    const clone2 = { ...clone(src), id: uid("g"), workDate, completeBy, reported: false, postedAgo: "now" };
    db.gigs.unshift(clone2);
    db.gigApplicants[clone2.id] = [];
    await persist();
    return clone(clone2);
  },
  apply: async (gigId, note = "") => {
    await ensure(); await delay();
    const g = db.gigs.find((x) => x.id === gigId);
    if (!g) throw new Error("Gig not found");
    if (db.applications.some((a) => a.gigId === gigId)) return clone(db.applications.find((a) => a.gigId === gigId));
    const now = Date.now();
    const app = {
      id: uid("a"), gigId, gigTitle: g.title, who: g.who, initials: g.initials,
      area: g.area, payAmount: g.payAmount, payUnit: g.payUnit, hrs: g.hrs,
      status: "applied", appliedAgo: "now", note,
      appliedAt: now, respondBy: now + RESPOND_WINDOW_HRS * HOUR,
    };
    db.applications.unshift(app);
    db.notifications.unshift({ id: uid("n"), type: "applied", title: "Application sent", body: `You applied to ${g.title} at ${g.who}. You'll get an answer within ${RESPOND_WINDOW_HRS}h — never silence.`, postedAgo: "now", read: false });
    await persist();
    return clone(app);
  },
  getApplications: async () => { await ensure(); await sweepApplications(); return clone(db.applications); },
};

// ── APPLICATIONS (worker side) ────────────────────────────────────────────────
export const applicationsAPI = {
  getMy: async () => { await ensure(); await delay(); await sweepApplications(); return clone(db.applications); },
  updateStatus: async (id, status) => {
    await ensure(); await delay();
    const a = db.applications.find((x) => x.id === id);
    if (a) { a.status = status; await persist(); }
    return clone(a);
  },
  withdraw: async (id) => {
    await ensure(); await delay(200);
    const a = db.applications.find((x) => x.id === id);
    if (a && OPEN_APP_STATUSES.includes(a.status)) { a.status = "withdrawn"; await persist(); }
    return clone(a);
  },
};

// ── APPLICANTS (hirer's view of who applied to their own posted gigs) ──────────
// Fit score = relevant experience × reliability × proximity (§11b).
const fitScore = (x) => (x.catGigs * x.catRating) * (x.reliability / 100) / (1 + x.distKm / 3);

// Applicant records come from two shapes (booking-era seeds with
// completed/noShows, triage-era pool with catGigs/reliability/distKm);
// normalize so every record satisfies both the ApplicantCard and the
// triage screen.
function normalizeApplicant(a, i) {
  const completed = a.completed ?? a.catGigs ?? 0;
  const noShows = a.noShows ?? a.strikes ?? 0;
  const distKm = a.distKm ?? +(0.7 + (i % 4) * 0.9).toFixed(1);
  return {
    status: "applied", note: "", appliedAgo: `${(i + 1) * 9}m`,
    ...a,
    completed, noShows, distKm,
    strikes: a.strikes ?? noShows,
    reliability: a.reliability ?? reliability({ completed, noShows }).pct,
    verifiedTier: a.verifiedTier ?? (a.isVerifiedWorker ? 2 : 0),
    isVerifiedWorker: a.isVerifiedWorker ?? (a.verifiedTier ?? 0) >= 2,
    etaMin: a.etaMin ?? Math.round(distKm * 6 + 4),
    catGigs: a.catGigs ?? completed,
    catRating: a.catRating ?? 4.6,
    skilledIn: a.skilledIn ?? [],
    openTo: a.openTo ?? [],
    openToLearn: a.openToLearn ?? false,
    expectRate: a.expectRate ?? null,
  };
}

function applicantsFor(gigId) {
  db.gigApplicants = db.gigApplicants || {};
  if (!db.gigApplicants[gigId]) {
    // Lazily seed a few applicants so any posted gig is demoable.
    const pool = clone(seed.APPLICANT_POOL);
    const n = 4 + (gigId.charCodeAt(gigId.length - 1) % 3);
    db.gigApplicants[gigId] = pool.slice(0, n).map((p) => ({
      id: uid("ap"), gigId,
      initials: p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      ...p,
    }));
  }
  db.gigApplicants[gigId] = db.gigApplicants[gigId].map(normalizeApplicant);
  return db.gigApplicants[gigId];
}

export const applicantsAPI = {
  // Sorted by compatibility with THIS gig (skill match + proximity + rating +
  // reliability); the best open applicant carries topPick (hirer can ignore it).
  getForGig: async (gigId) => {
    await ensure(); await delay();
    const gig = db.gigs.find((x) => x.id === gigId) || null;
    const list = applicantsFor(gigId);
    await persist();
    const out = clone(list);
    out.forEach((a) => {
      const c = compatibility(a, gig || {});
      a.compat = c.score;
      a.compatReasons = c.reasons;
      a.skilledMatch = c.skilledMatch;
      a.fit = fitScore(a); // kept for the "Experience"/legacy sorts
    });
    out.sort((a, b) => b.compat - a.compat);
    const best = out.find((a) => OPEN_APP_STATUSES.includes(a.status));
    out.forEach((a) => { a.topPick = best ? a.id === best.id : false; });
    return out;
  },
  countForGig: async (gigId) => {
    await ensure();
    const list = applicantsFor(gigId);
    await persist();
    return { total: list.length, open: list.filter((a) => OPEN_APP_STATUSES.includes(a.status)).length };
  },
  shortlist: async (id) => {
    await ensure(); await delay(200);
    for (const list of Object.values(db.gigApplicants)) {
      const a = list.find((x) => x.id === id);
      if (a) { a.status = "shortlisted"; await persist(); return clone(a); }
    }
    return null;
  },
  decline: async (id, reason = "Position filled") => {
    await ensure(); await delay(200);
    for (const list of Object.values(db.gigApplicants)) {
      const a = list.find((x) => x.id === id);
      if (a) { a.status = "declined"; a.declineReason = reason; await persist(); return clone(a); }
    }
    return null;
  },
  // Hiring one applicant instantly auto-declines everyone else still open on
  // the gig — no ghosting-by-default. Booking-stage statuses (confirmed,
  // in_shift, done, no_show) are left untouched. Returns the auto-decline count.
  hire: async (id) => {
    await ensure(); await delay(200);
    for (const list of Object.values(db.gigApplicants)) {
      const a = list.find((x) => x.id === id);
      if (!a) continue;
      a.status = "hired";
      let autoDeclined = 0;
      for (const other of list) {
        if (other.id !== id && OPEN_APP_STATUSES.includes(other.status)) {
          other.status = "declined";
          other.declineReason = "Position filled";
          autoDeclined++;
        }
      }
      const g = db.gigs.find((x) => x.id === a.gigId);
      if (g) g.filled = true;
      await persist();
      return { hired: clone(a), autoDeclined };
    }
    return null;
  },
  // Reports a no-show: strikes the worker, moves the booking to a terminal "no_show"
  // status. No refund logic — Path A has no payment flow to refund.
  reportNoShow: async (gigId, applicantId) => {
    await ensure(); await delay();
    const list = db.gigApplicants[gigId];
    const a = list && list.find((x) => x.id === applicantId);
    if (!a) throw new Error("Applicant not found");
    a.noShows += 1;
    a.status = "no_show";
    await persist();
    return clone(a);
  },
};

// ── POSTS (community) ───────────────────────────────────────────────────────────
export const postsAPI = {
  getAll: async () => { await ensure(); await delay(); return clone(db.posts); },
  getOne: async (id) => { await ensure(); return clone(db.posts.find((p) => p.id === id) || null); },
  create: async (postData) => {
    await ensure(); await delay();
    const me = meUser();
    const post = {
      id: uid("p"), votes: 0, comments: [], postedAgo: "now",
      authorName: me?.name || "You", initials: (me?.name || "You").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      authorType: me?.type || "user", ...postData,
    };
    db.posts.unshift(post);
    await persist();
    return clone(post);
  },
  vote: async (postId) => {
    await ensure();
    const p = db.posts.find((x) => x.id === postId);
    if (p) { p.votes += 1; await persist(); }
    return clone(p);
  },
  getComments: async (postId) => { await ensure(); return clone(db.posts.find((p) => p.id === postId)?.comments || []); },
  addComment: async (postId, body) => {
    await ensure(); await delay();
    const p = db.posts.find((x) => x.id === postId);
    const c = { id: uid("c"), who: meUser()?.name || "You", body, ago: "now" };
    if (p) { p.comments.push(c); await persist(); }
    return clone(c);
  },
  makeOffer: async () => ({ ok: true }),
};

// ── CHAT ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  getConversations: async () => { await ensure(); await delay(); return clone(db.chats); },
  getMessages: async (convId) => { await ensure(); return clone(db.chats.find((c) => c.id === convId)?.messages || []); },
  sendMessage: async (convId, body) => {
    await ensure();
    const c = db.chats.find((x) => x.id === convId);
    const msg = { id: uid("m"), fromMe: true, body, time: "now" };
    if (c) { c.messages.push(msg); c.unread = 0; await persist(); }
    return clone(msg);
  },
  openForGig: async (gigId) => {
    await ensure();
    let c = db.chats.find((x) => x.gigId === gigId);
    if (!c) {
      const g = db.gigs.find((x) => x.id === gigId);
      c = { id: uid("ch"), name: g?.who || "Hirer", initials: g?.initials || "?", gigId, gigTitle: g?.title, bookingScoped: true, unread: 0, messages: [] };
      db.chats.unshift(c);
      await persist();
    }
    return clone(c);
  },
  markRead: async (convId) => {
    await ensure();
    const c = db.chats.find((x) => x.id === convId);
    if (c) { c.unread = 0; await persist(); }
  },
};

// ── SAVED ───────────────────────────────────────────────────────────────────────
export const savedAPI = {
  getAll: async () => { await ensure(); return clone(db.saved); },
  save: async (itemType, itemId) => {
    await ensure();
    if (!db.saved.some((s) => s.itemId === itemId)) { db.saved.push({ itemType, itemId }); await persist(); }
    return { ok: true };
  },
  unsave: async (itemType, itemId) => {
    await ensure();
    db.saved = db.saved.filter((s) => s.itemId !== itemId);
    await persist();
    return { ok: true };
  },
  isSaved: async (itemId) => { await ensure(); return db.saved.some((s) => s.itemId === itemId); },
};

// ── NOTIFICATIONS ────────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: async () => { await ensure(); await delay(); return clone(db.notifications); },
  unreadCount: async () => { await ensure(); return db.notifications.filter((n) => !n.read).length; },
  markRead: async (id) => {
    await ensure();
    const n = db.notifications.find((x) => x.id === id);
    if (n) { n.read = true; await persist(); }
    return { ok: true };
  },
  markAllRead: async () => {
    await ensure();
    db.notifications.forEach((n) => (n.read = true));
    await persist();
    return { ok: true };
  },
};

// ── KYC (mock — frontend only) ────────────────────────────────────────────────
export const kycAPI = {
  getStatus: async () => { await ensure(); return { status: db.kyc.status }; },
  submit: async (payload) => {
    await ensure(); await delay();
    db.kyc = { status: "pending", ...payload, submittedAgo: "now" };
    const u = meUser(); if (u) u.kyc_status = "pending";
    await persist();
    return { status: "pending" };
  },
  // dev shortcut so the verified badge is demoable without a backend
  devVerify: async () => {
    await ensure();
    db.kyc.status = "verified";
    const u = meUser(); if (u) u.kyc_status = "verified";
    await persist();
    return { status: "verified" };
  },
};

// ── REPORTS / PUSH (mock stubs) ──────────────────────────────────────────────────
export const reportsAPI = {
  create: async ({ target_type, target_id, reason }) => {
    await ensure(); await delay(200);
    return { id: uid("r"), target_type, target_id, reason, status: "open" };
  },
};
export const pushAPI = {
  register: async () => ({ ok: true }),
  remove: async () => ({ ok: true }),
};

// dev helper: wipe local data back to seed
export const __resetMock = async () => {
  db = null; session = null;
  try { await AsyncStorage.multiRemove(["gg_db", "gg_session", "gg_home_zone"]); } catch {}
  await ensure();
};
