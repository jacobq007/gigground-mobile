// ── SKILLS & MATCHING ─────────────────────────────────────────────────────────
// A worker's skills are structured data (a "skill graph"), not a bio. Each entry:
//   { key, level, years, proofUploaded, verified }
// Skilled skills become `verified` once proof is uploaded; general (unskilled)
// skills need no proof. Verified skills drive skilled-job matches; general
// skills are the "open to" pool for everyday gigs.

export const SKILL_GROUPS = [
  // Tutoring is the launch category, so it leads.
  { key: "tutoring", label: "Tutoring", skilled: true, icon: "school-outline", skills: [
    { key: "maths", label: "Maths" }, { key: "science", label: "Science" }, { key: "english", label: "Spoken English" }, { key: "coding", label: "Coding" }, { key: "music", label: "Music" },
  ] },
  { key: "cooking", label: "Home cooking", skilled: true, icon: "restaurant-outline", skills: [
    { key: "south_indian", label: "South Indian" }, { key: "north_indian", label: "North Indian" }, { key: "baking", label: "Baking" }, { key: "tiffin", label: "Tiffin / meal prep" },
  ] },
  { key: "beauty", label: "Beauty & wellness", skilled: true, icon: "sparkles-outline", skills: [
    { key: "hair", label: "Hair & grooming" }, { key: "makeup", label: "Makeup" }, { key: "mehndi", label: "Mehndi" }, { key: "massage", label: "Massage" },
  ] },
  { key: "repairs", label: "Home repairs", skilled: true, icon: "construct-outline", skills: [
    { key: "electrical", label: "Electrical" }, { key: "plumbing", label: "Plumbing" }, { key: "carpentry", label: "Carpentry" }, { key: "appliance", label: "Appliance repair" }, { key: "painting", label: "Painting" },
  ] },
  { key: "media", label: "Photography & media", skilled: true, icon: "camera-outline", skills: [
    { key: "photography", label: "Photography" }, { key: "videography", label: "Videography" }, { key: "editing", label: "Photo/video editing" },
  ] },
  { key: "general", label: "Everyday help", skilled: false, icon: "cube-outline", skills: [
    { key: "delivery", label: "Delivery" }, { key: "moving", label: "Moving" }, { key: "cleaning", label: "Cleaning" }, { key: "errands", label: "Errands" }, { key: "event", label: "Event staff" }, { key: "kitchen_help", label: "Kitchen help" },
  ] },
];

export const LEVELS = [
  { key: "new", label: "New", pct: 0.4 },
  { key: "experienced", label: "Experienced", pct: 0.7 },
  { key: "expert", label: "Expert", pct: 1 },
];

// Per-category config — this is what makes each category's "add skill" page
// different: its own proof wording and its own extra questions.
export const GROUP_CONFIG = {
  tutoring: {
    blurb: "Add the subjects you teach. Proof unlocks paid tuition matches.",
    proofLabel: "Degree / teaching certificate",
    extra: { label: "Boards & levels you teach", options: ["Class 1–5", "Class 6–10", "Class 11–12", "College", "CBSE", "State board", "ICSE"] },
    mode: { label: "How do you teach?", options: ["At student's home", "Online", "My place"] },
  },
  cooking: {
    blurb: "Pick the cuisines you cook and how you like to work.",
    proofLabel: "Food-safety / FSSAI (optional)",
    extra: { label: "Meals you take on", options: ["Breakfast", "Lunch", "Dinner", "Party orders", "Daily tiffin"] },
    mode: { label: "Where do you cook?", options: ["At the client's kitchen", "My kitchen (delivery)"] },
  },
  beauty: {
    blurb: "List your services. A certificate helps you get booked faster.",
    proofLabel: "Certification (optional)",
    extra: { label: "Who you serve", options: ["Women", "Men", "Kids", "Bridal"] },
    mode: { label: "Where do you work?", options: ["At the client's home", "At a salon"] },
  },
  repairs: {
    blurb: "Add your trades. A licence or ID is required for trade jobs.",
    proofLabel: "Trade licence / ID proof",
    extra: { label: "What you handle", options: ["Repairs", "New installation", "Emergency call-outs"] },
    mode: { label: "Tools", options: ["I bring my own tools", "Client provides tools"] },
  },
  media: {
    blurb: "Show what you shoot. A portfolio is your strongest proof.",
    proofLabel: "Portfolio link",
    extra: { label: "You cover", options: ["Events", "Weddings", "Portraits", "Product", "Reels"] },
    mode: { label: "Gear", options: ["I have my own gear", "Rented / client gear"] },
  },
  general: {
    blurb: "Tick the everyday jobs you're happy to take. No proof needed.",
    proofLabel: null, extra: null, mode: null,
  },
};

export const groupMeta = (key) => SKILL_GROUPS.find((g) => g.key === key) || null;
export const groupConfig = (key) => GROUP_CONFIG[key] || GROUP_CONFIG.general;

// Group-level extras (tags + working mode) live in user.skillMeta[groupKey].
export const getGroupExtras = (user, groupKey) => (user?.skillMeta?.[groupKey] || { tags: [], mode: null });

// How many skills a worker has added within a group, and whether any are verified.
export function groupStatus(user, groupKey) {
  const grp = groupMeta(groupKey);
  if (!grp) return { count: 0, verified: 0 };
  const keys = new Set(grp.skills.map((s) => s.key));
  const mine = getSkills(user).filter((s) => keys.has(s.key));
  return { count: mine.length, verified: mine.filter((s) => grp.skilled && s.verified).length };
}

// Flat lookup of every skill → its group + skilled flag.
const SKILL_INDEX = {};
SKILL_GROUPS.forEach((g) => g.skills.forEach((s) => { SKILL_INDEX[s.key] = { ...s, group: g.key, groupLabel: g.label, skilled: g.skilled, icon: g.icon }; }));

export const allSkills = () => Object.values(SKILL_INDEX);
export const skillMeta = (key) => SKILL_INDEX[key] || null;
export const skillLabel = (key) => SKILL_INDEX[key]?.label || key;
export const isSkilled = (key) => !!SKILL_INDEX[key]?.skilled;
export const levelLabel = (key) => LEVELS.find((l) => l.key === key)?.label || key;
export const levelPct = (key) => LEVELS.find((l) => l.key === key)?.pct || 0.4;

// Skilled skills only, for the "requires a skill" picker on a job post.
export const skilledSkills = () => allSkills().filter((s) => s.skilled);

// ── Post-a-gig category picker helpers ────────────────────────────────────────
// The poster already types what they need, so infer a category from the title.
// First rule that matches wins; returns the full skill-index entry or null.
const INFER_RULES = [
  [/mov(e|ing)|shift(ing)?|furniture|unload|loading|luggage|relocat/i, "moving"],
  [/deliver|courier|parcel|pick[\s-]?up|\bdrop\b|dispatch|package/i, "delivery"],
  [/clean|sweep|\bmop|dusting|housekeep/i, "cleaning"],
  [/grocer|medicine|pharmacy|errand|\bbuy\b|fetch/i, "errands"],
  [/\bevent|usher|waiter|serv(e|er|ing)|catering|setup crew|stage|reception/i, "event"],
  [/kitchen help|dishwash|prep cook|\bkitchen\b/i, "kitchen_help"],
  [/tuition|tutor|teach|\bmaths?\b|algebra|geometry/i, "maths"],
  [/science|physics|chemistry|biology/i, "science"],
  [/spoken english|\benglish\b|grammar/i, "english"],
  [/coding|programming|python|java|web ?dev/i, "coding"],
  [/guitar|piano|\bmusic\b|singing|keyboard|violin/i, "music"],
  [/bak(e|ing)|\bcake|pastry|dessert|cookies?/i, "baking"],
  [/tiffin|meal prep|daily meals?/i, "tiffin"],
  [/south indian|idli|dosa|sambar/i, "south_indian"],
  [/north indian|\broti|paneer|\bcurry/i, "north_indian"],
  [/\bcook\b|\bchef\b/i, "south_indian"],
  [/haircut|\bhair\b|grooming|barber/i, "hair"],
  [/make-?up|bridal makeup/i, "makeup"],
  [/mehndi|henna/i, "mehndi"],
  [/massage|\bspa\b/i, "massage"],
  [/electric|wiring|switch ?board|fan install/i, "electrical"],
  [/plumb|\btap\b|leak|\bpipe|drain/i, "plumbing"],
  [/carpenter|carpentry|\bwood|cupboard|door repair/i, "carpentry"],
  [/appliance|fridge|washing machine|\bac repair|microwave/i, "appliance"],
  [/\bpaint/i, "painting"],
  [/photograph|photo ?shoot/i, "photography"],
  [/videograph|video ?shoot|filming|cinematograph/i, "videography"],
  [/photo edit|video edit|editing|retouch/i, "editing"],
];

export function inferSkill(title) {
  const t = String(title || "");
  if (t.trim().length < 3) return null;
  for (const [re, key] of INFER_RULES) {
    if (re.test(t) && SKILL_INDEX[key]) return { key, ...SKILL_INDEX[key] };
  }
  return null;
}

// Search every skill by its label, key, or group label (so "cook" hits Cooking).
export function searchSkills(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  return allSkills().filter((s) =>
    s.label.toLowerCase().includes(q) || s.key.includes(q) || s.groupLabel.toLowerCase().includes(q));
}

// A short curated set for the "or pick a popular one" row.
export const POPULAR_SKILLS = ["delivery", "moving", "cleaning", "maths", "errands"]
  .map((k) => SKILL_INDEX[k] ? { key: k, ...SKILL_INDEX[k] } : null).filter(Boolean);

// ── Reading a worker's skill graph ────────────────────────────────────────────
export const getSkills = (user) => (user?.skillGraph || []);
export const verifiedSkills = (user) => getSkills(user).filter((s) => isSkilled(s.key) && s.verified);
export const verifiedSkillKeys = (user) => verifiedSkills(user).map((s) => s.key);
export const openToKeys = (user) => getSkills(user).filter((s) => !isSkilled(s.key)).map((s) => s.key);
export const hasSkill = (user, key) => getSkills(user).some((s) => s.key === key);

// verification_tier: 0 = none verified (general only), 1 = has a verified skilled skill.
// (Tier 2 / trade-emergency is reserved for the later phase.)
export const verificationTier = (user) => (verifiedSkills(user).length > 0 ? 1 : 0);

// Profile strength 0–1: rewards breadth + proof.
export function profileStrength(user) {
  const skills = getSkills(user);
  if (skills.length === 0) return 0;
  let score = 0;
  skills.forEach((s) => {
    if (isSkilled(s.key)) score += s.verified ? 1 : 0.5;
    else score += 0.4;
  });
  return Math.max(0.05, Math.min(1, score / 4));
}

// ── Compatibility: how well an applicant fits a specific gig ───────────────────
// Skilled jobs weight skill match heavily; general jobs drop skill entirely and
// renormalize across the remaining signals (so scores stay honest instead of
// everyone landing at ~90%). Budget fit is folded in when we know a rate.
const W_SKILLED = { skill: 0.45, near: 0.15, rating: 0.15, reliab: 0.15, rate: 0.10 };
const W_GENERAL = { near: 0.35, rating: 0.25, reliab: 0.25, rate: 0.15 };

// How the applicant's expected rate sits against the gig's budget.
function rateFit(applicant, gig) {
  const r = applicant.expectRate;
  const lo = gig?.payMin ?? gig?.payAmount;
  const hi = gig?.payMax ?? lo;
  if (r == null || lo == null) return { score: 0.8, reason: null };
  if (r <= hi) return { score: 1, reason: { ok: true, label: "In budget" } };
  const over = (r - hi) / hi;
  if (over <= 0.15) return { score: 0.6, reason: { ok: false, label: `₹${r} · a bit high` } };
  return { score: 0.3, reason: { ok: false, label: `₹${r} · above budget` } };
}

export function compatibility(applicant, gig) {
  const skilled = !!gig?.skillRequired && !!gig?.skillKey;
  const verifiedIn = applicant.skilledIn || [];
  const openTo = applicant.openTo || [];

  let skillScore = 1, skillReason = null;
  if (skilled) {
    const verified = verifiedIn.includes(gig.skillKey);
    const willing = openTo.includes(gig.skillKey) || applicant.openToLearn;
    skillScore = verified ? 1 : willing ? 0.4 : 0.12;
    skillReason = { ok: verified, label: verified ? "Skill verified" : `Not verified in ${skillLabel(gig.skillKey)}` };
  }

  const dist = applicant.distKm ?? 3;
  const near = Math.max(0, Math.min(1, 1 - dist / 8));
  const rating = (applicant.catRating ?? 4.5) / 5;
  const reliab = (applicant.reliability ?? 80) / 100;
  const rf = rateFit(applicant, gig);

  const score = Math.round(100 * (skilled
    ? (W_SKILLED.skill * skillScore + W_SKILLED.near * near + W_SKILLED.rating * rating + W_SKILLED.reliab * reliab + W_SKILLED.rate * rf.score)
    : (W_GENERAL.near * near + W_GENERAL.rating * rating + W_GENERAL.reliab * reliab + W_GENERAL.rate * rf.score)));

  // Keep the reason chips to the four most decision-relevant signals.
  const reasons = [];
  if (skillReason) reasons.push(skillReason);
  reasons.push({ ok: dist <= 2.5, label: `${dist} km` });
  reasons.push({ ok: (applicant.catRating ?? 0) >= 4.5, label: `${applicant.catRating ?? "—"} ★` });
  if (rf.reason) reasons.push(rf.reason);
  else reasons.push({ ok: (applicant.reliability ?? 0) >= 90, label: `${applicant.reliability ?? "—"}% reliable` });

  return { score, reasons, skilledMatch: skilled ? verifiedIn.includes(gig.skillKey) : null };
}

export const compatTone = (score) => (score >= 80 ? "high" : score >= 55 ? "mid" : "low");
