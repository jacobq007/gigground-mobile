// ── GIGGROUND MOBILE — MOCK API CLIENT ────────────────────────────────────────
// Mirrors the web src/api.js interface EXACTLY, but resolves from local mock
// data instead of fetch(). When the backend is ready, only this file changes.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as seed from "./mockData";

const delay = (ms = 320) => new Promise((r) => setTimeout(r, ms));
const clone = (x) => JSON.parse(JSON.stringify(x));
const uid = (p = "x") => p + "_" + Math.random().toString(36).slice(2, 9);
const DB_VERSION = "v4"; // bump when seed data changes to force a reset

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
      applications: clone(seed.SEED_APPLICATIONS),
      gigApplicants: clone(seed.SEED_GIG_APPLICANTS),
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
      area: area || "", bizCategory, bio: "", skills: "", phone: "",
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
  apply: async (gigId) => {
    await ensure(); await delay();
    const g = db.gigs.find((x) => x.id === gigId);
    if (!g) throw new Error("Gig not found");
    if (db.applications.some((a) => a.gigId === gigId)) return clone(db.applications.find((a) => a.gigId === gigId));
    const app = {
      id: uid("a"), gigId, gigTitle: g.title, who: g.who, initials: g.initials,
      area: g.area, payAmount: g.payAmount, payUnit: g.payUnit, hrs: g.hrs,
      status: "applied", appliedAgo: "now",
    };
    db.applications.unshift(app);
    db.notifications.unshift({ id: uid("n"), type: "applied", title: "Application sent", body: `You applied to ${g.title} at ${g.who}.`, postedAgo: "now", read: false });
    await persist();
    return clone(app);
  },
  getApplications: async () => { await ensure(); return clone(db.applications); },
};

// ── APPLICATIONS ──────────────────────────────────────────────────────────────
export const applicationsAPI = {
  getMy: async () => { await ensure(); await delay(); return clone(db.applications); },
  updateStatus: async (id, status) => {
    await ensure(); await delay();
    const a = db.applications.find((x) => x.id === id);
    if (a) { a.status = status; await persist(); }
    return clone(a);
  },
};

// ── GIG APPLICANTS (hirer's view of who applied to their own posted gigs) ───────
export const applicantsAPI = {
  getForGig: async (gigId) => { await ensure(); return clone(db.gigApplicants[gigId] || []); },
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
