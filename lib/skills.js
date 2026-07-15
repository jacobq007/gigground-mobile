// ── SKILLS & MATCHING ─────────────────────────────────────────────────────────
// A worker's skills are structured data (a "skill graph"), not a bio. Each entry:
//   { key, level, years, proofUploaded, verified }
// Skilled skills become `verified` once proof is uploaded; general (unskilled)
// skills need no proof. Verified skills drive skilled-job matches; general
// skills are the "open to" pool for everyday gigs.

export const SKILL_GROUPS = [
  { key: "tutoring", label: "Tutoring", skilled: true, icon: "school-outline", skills: [
    { key: "maths", label: "Maths" }, { key: "science", label: "Science" }, { key: "english", label: "English" }, { key: "coding", label: "Coding" },
  ] },
  { key: "cooking", label: "Home cooking", skilled: true, icon: "restaurant-outline", skills: [
    { key: "south_indian", label: "South Indian" }, { key: "north_indian", label: "North Indian" }, { key: "baking", label: "Baking" },
  ] },
  { key: "repairs", label: "Home repairs", skilled: true, icon: "construct-outline", skills: [
    { key: "electrical", label: "Electrical" }, { key: "plumbing", label: "Plumbing" }, { key: "carpentry", label: "Carpentry" },
  ] },
  { key: "media", label: "Photography & media", skilled: true, icon: "camera-outline", skills: [
    { key: "photography", label: "Photography" }, { key: "videography", label: "Videography" },
  ] },
  { key: "general", label: "Everyday help", skilled: false, icon: "cube-outline", skills: [
    { key: "delivery", label: "Delivery" }, { key: "moving", label: "Moving" }, { key: "cleaning", label: "Cleaning" }, { key: "errands", label: "Errands" }, { key: "event", label: "Event staff" },
  ] },
];

export const LEVELS = [
  { key: "new", label: "New", pct: 0.4 },
  { key: "experienced", label: "Experienced", pct: 0.7 },
  { key: "expert", label: "Expert", pct: 1 },
];

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
// Weighted blend of skill match, proximity, rating and reliability. Returns a
// 0–100 score plus the reason chips the hirer sees.
const W = { skill: 0.4, near: 0.2, rating: 0.2, reliab: 0.2 };

export function compatibility(applicant, gig) {
  const skilled = !!gig?.skillRequired && !!gig?.skillKey;
  const verifiedIn = applicant.skilledIn || [];
  const openTo = applicant.openTo || [];

  let skillScore, skillReason;
  if (skilled) {
    const verified = verifiedIn.includes(gig.skillKey);
    const willing = openTo.includes(gig.skillKey) || applicant.openToLearn;
    skillScore = verified ? 1 : willing ? 0.4 : 0.12;
    skillReason = { ok: verified, label: verified ? "Skill verified" : `Not verified in ${skillLabel(gig.skillKey)}` };
  } else {
    skillScore = 1; // general job — skill isn't the gate
    skillReason = null;
  }

  const dist = applicant.distKm ?? 3;
  const near = Math.max(0, Math.min(1, 1 - dist / 8));
  const rating = (applicant.catRating ?? 4.5) / 5;
  const reliab = (applicant.reliability ?? 80) / 100;

  const score = Math.round(100 * (W.skill * skillScore + W.near * near + W.rating * rating + W.reliab * reliab));

  const reasons = [];
  if (skillReason) reasons.push(skillReason);
  reasons.push({ ok: dist <= 2.5, label: `${dist} km` });
  reasons.push({ ok: (applicant.catRating ?? 0) >= 4.5, label: `${applicant.catRating ?? "—"} ★` });
  if (applicant.reliability != null) reasons.push({ ok: applicant.reliability >= 90, label: `${applicant.reliability}% reliable` });

  return { score, reasons, skilledMatch: skilled ? verifiedIn.includes(gig.skillKey) : null };
}

export const compatTone = (score) => (score >= 80 ? "high" : score >= 55 ? "mid" : "low");
