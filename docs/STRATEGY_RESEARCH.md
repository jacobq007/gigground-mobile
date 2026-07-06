# GigGround — Competitor Research & Product Strategy

Research date: July 2026. Each section: what competitors do → what GigGround can implement.
Items marked **[BUILT]** already exist in the app (at least as frontend stubs); **[NEXT]** are proposed.

---

## 1. Generalist workers vs. competitors' specialists

**What competitors do**
- **Urban Company**: strictly specialist. Workers onboard into ONE category (beauty, AC repair, cleaning…), pass skill assessments, get trained (250+ trainers, 3M+ training hours since 2014). The category IS the product.
- **Pronto / Snabbit**: narrow on purpose — trained "Pros" for a small set of household tasks (cleaning, dishes, laundry, kitchen prep). Speed comes FROM the narrowness: interchangeable workers → instant dispatch.
- **Instawork (US)**: middle path. Workers hold multiple "positions" (dishwasher, warehouse, bartender), each position unlocked separately by experience/verification, with per-position ratings.

**The insight**: specialists are easy to train, price, and dispatch; generalists are flexible but hard to trust for a specific task. GigGround shouldn't pick one — it should make a generalist worker *legible* per task type.

**Solutions for GigGround**
- Keep one worker account, but attach **per-category skill tracks**: each track has its own gig count, rating, and reliability stat ("12 delivery gigs · 4.9★" vs "2 event gigs · no rating yet").
- **Category unlock levels**: anyone can take Level-0 gigs (errands, queueing, flyering — no skill). Level-1+ (electrical help, cooking) needs either N completed related gigs, a hirer endorsement, or a micro-certification.
- Hirer sees the *relevant* track first on an applicant card, not a blended average.
- Micro-badging over training academies (we can't afford 250 trainers): short in-app quizzes + photo/video proof of prior work unlock category badges.

---

## 2. Cities (Pronto's footprint → GigGround multi-city)

**Pronto is live in 15 cities**: Ahmedabad, Bangalore, Chennai, Delhi, Faridabad, Ghaziabad, Gurgaon, Hyderabad, Jaipur, Kolkata, Mumbai, Navi Mumbai, Noida, Pune, Thane.
**Snabbit**: Mumbai, Bengaluru, Gurugram, Noida, Pune (~140 micromarkets, 40k jobs/day), expanding to Hyderabad, Chennai, Delhi, Kolkata.

**Key competitor mechanic**: they don't launch "cities", they launch **micromarkets** (Snabbit's unit) — a 2–3 km dense pocket where supply and demand are both thick enough for <15-min response.

**Solutions for GigGround**
- Expand `CITIES` in `lib/constants.js` to: Chennai, Bengaluru, Mumbai, Navi Mumbai, Thane, Delhi, Gurgaon, Noida, Ghaziabad, Faridabad, Hyderabad, Pune, Kolkata, Ahmedabad, Jaipur (Pronto parity), plus Kochi, Coimbatore, Lucknow, Indore, Surat as Tier-2 bets competitors haven't saturated.
- Per-city zone lists (the current `geo.js` is Chennai-only). Model each city as a list of zones = micromarkets; the zone-distance sorting already built generalizes.
- Launch playbook per micromarket, not per city: seed 50–100 workers in ONE zone before opening the next. An empty feed kills a marketplace faster than no app.

---

## 3. Women's safety & women-to-women hiring

**What competitors do (and where they fail)**
- **Urban Company**: female workers are assigned only female customers for in-home services and take no bookings after 7 p.m.; SOS button in the partner app, 24-hr women-only helpline, safety kit with pepper spray, trust & safety team of army veterans. BUT: workers report the SOS/helpline sometimes goes unanswered; the systems rely on the worker filing a complaint after the fact.
- **Snabbit "Kavach"** (Mar 2026): proactive tech monitoring during active bookings — risk signals trigger escalation *without* the worker having to press anything.
- **Legal gap**: India's POSH Act doesn't cover platform workers vs. customers — the platform's own process is all the protection there is.

**Solutions for GigGround**
- **Yes to women-to-women matching as a worker-controlled toggle**, not a forced rule: female workers choose "accept female hirers only" (default ON for in-home categories). Forcing it platform-wide shrinks women's earning pool — make it their choice.
- Category-aware: public-place gigs (store errand, event staff) are lower-risk than in-home; only in-home/night gigs trigger the strict mode.
- **In-gig safety session**: when a gig starts, offer live location sharing to a trusted contact + periodic "are you OK?" check-ins; a missed check-in escalates automatically (the Kavach lesson: don't depend on the victim pressing a button).
- SOS must dial 112 directly (already stubbed **[BUILT]** in booking chat) AND alert the platform in parallel — never platform-helpline-only (the UC failure mode).
- Misconduct reports: instant hirer freeze pending review (can't post/book), permanent device+ID ban on confirmation — not just account ban (see §10 device identity).
- No worker photos on applicant cards pre-booking; hirer address revealed to worker only after confirmation; both sides' phone numbers masked (chat already booking-scoped **[BUILT]**).
- Verified-women-hirer badge stacking: female worker sees whether hirer is ID-verified + female before accepting.

---

## 4. "Worker didn't actually work" — escrow disputes

**What competitors/industry do**
- ID + selfie face-match at *shift start*, not just onboarding (Didit, Incognia) — confirms the person on site is the person hired. Up to 15% of gig accounts show fake/duplicate signals.
- GPS check-in/check-out geofenced to the worksite; anti-spoofing checks because location faking is a known fraud-as-a-service tool.
- Escrow platforms resolve disputes with **evidence artifacts**, not he-said-she-said.

**Solution: a "proof ladder" — every rung auto-collected, so disputes are decided by data**
1. **Check-in**: worker taps "Start work" only within ~200 m of the gig location (GPS) → timestamped.
2. **Selfie-at-site** for higher-value gigs: camera-only capture (no gallery upload).
3. **Hirer OTP handshake**: hirer's app shows a 4-digit code; worker enters it to start the clock. Hirer literally cannot later claim the worker never arrived — they handed over the code. (Cheap, offline-friendly, kills most disputes on its own.)
4. **Completion**: photo of finished work where applicable + hirer confirmation tap; auto-release escrow after N hours if hirer doesn't respond (protects worker from silent hirers).
5. **Dispute path**: if hirer files "didn't work" — platform reviews the ladder. Code entered + GPS present + photos = pay the worker, strike the hirer's complaint credibility. No check-in at all = refund hirer, strike worker (strikes system **[BUILT]**).
- Both sides carry a **complaint-credibility score**: hirers who repeatedly file disputes that lose evidence reviews get deprioritized/flagged too. Fraud is two-sided.

---

## 5. Job categories + the "local delivery / store errand" flow

**Proposed category tree** (each maps to a `MIN_PAY` floor — mechanism already **[BUILT]**):

| Category | Examples | Pricing unit | Floor (draft) |
|---|---|---|---|
| Errands & delivery | store pickup, medicine run, queue-standing, document drop | per task + per km | ₹60 base + ₹15/km |
| Household help | cleaning, dishes, laundry, cooking help | per hour | ₹150/hr (UC InstaHelp pays ₹150–180/hr — match it) |
| Moving & lifting | furniture shift, van unloading, warehouse | per hour / fixed | ₹200/hr |
| Events & hospitality | serving, crowd mgmt, setup/teardown | per shift | ₹500/shift |
| Retail & counter | cashier, promoter, inventory | per day | ₹600/day |
| Care & assistance | elder accompaniment, pet walking, tuition pickup | per hour | ₹150/hr |
| Skilled-lite | basic repairs, assembly, gardening, painting help | per job (quote) | ₹300/job |
| Digital-lite | phone/data entry, local surveys, photo tasks | per task | ₹100/task |

**The store-errand flow specifically** (modeled on Swiggy Genie: ₹29 first 2 km + ₹15/km, distance-priced, minutes-matched):
1. Hirer posts: item + store/area + drop location + item budget. App computes the errand fee automatically from distance (no negotiation — speed requires fixed pricing).
2. Item cost handling: hirer prepays item cost into escrow along with the fee; worker shows the receipt photo at handoff (receipt = proof rung, see §4). Never make the worker front the money — that's the #1 reason informal errand-running fails.
3. Broadcast to online workers in the zone, first-accept wins (no application round at all for this category — apply/choose only makes sense for skilled/scheduled gigs; instant categories need dispatch, see §9).
4. Target: accepted <5 min, done <60 min. If unclaimed 10 min, auto-bump fee by 20% (surge floor, capped).

---

## 6. Trust & appearance without uniforms

**What competitors do**: UC/Pronto/Snabbit issue uniforms + branded kit (UC's black backpack). This works because the worker is full-time-ish on one platform. GigGround's casual workers won't carry a uniform to a one-off gig.

**Digital substitutes for the uniform**
- **Arrival Pass**: when a worker is confirmed, hirer gets a card with photo, first name, verified badge, rating, and the 4-digit start code (§4). The worker on the doorstep must match the photo + know nothing except what's needed. This is what the uniform actually does — it answers "is this person who I'm expecting?"
- Verification badge tiers **[partially BUILT]**: ID-verified → +selfie match → +address → +police clearance (top tier for in-home). Show the tier on every card.
- Profile completeness enforced before first application: real photo (liveness-checked), skills, intro line. A well-formed profile IS the uniform.
- Optional physical layer later: a ₹99 starter kit (t-shirt + ID lanyard) unlocked after 10 gigs — earned, not required. Workers who invest signal commitment; hirers can filter "kit-carrying" workers for premium gigs.
- **"First gig shadowing"** for in-home categories: first-timer only gets in-home gigs paired alongside an experienced worker (2-person gigs) until they earn solo status.

---

## 7. Why use GigGround — matching the ₹500–2000/day promise for ANYONE

**The competitor promise**: Snabbit workers earn ₹25–30k/month; UC InstaHelp pays ₹150–180/hr + insurance. But all of them require you to *be* something (trained cleaner, bike owner, beautician).

**GigGround's counter-position: "your day, filled"** — the app's job is not one gig, it's a full day's income assembled from whatever you CAN do.
- **Day-fill engine**: worker sets availability window (FAB stub already **[BUILT]**) + what they're able to do (checkboxes: can lift / can cook / has bike / has smartphone only). App proposes a **chained day plan**: 7–9am store errands, 10–1 moving help, 3–6 event setup → projected total shown up front ("today's plan: ₹1,240"). The home screen's "You could earn today" hero **[BUILT]** becomes real: it's the sum of the proposed chain.
- **No-asset ladder**: zero-asset workers (no bike, no tools) get walkable-radius gigs (queueing, in-zone errands, household help, event staff). The onboarding question is "what do you have?" not "what are you?"
- **Earnings floor experiments** (the retention weapon): "complete every gig in your accepted day-plan and earn less than ₹500 → we top up the difference." Bounded cost, only on accepted-and-completed plans, per-worker per-week cap. This is the single strongest answer to "why this app".
- Streaks/consistency bonuses (streak UI **[BUILT]**) + same-day payout (Snabbit's Early Salary shows demand for this — even 50% instant advance matters).

---

## 8. Future-proofing: low-skill / semi-skill / AI-proof work

**Research consensus (2026)**: physical trades ~91–94% automation-resistant; care work ~96%; the resilient core = physical presence + adaptation to messy environments + human trust. 170M new roles projected globally by 2030 even as repetitive roles disappear.

**What this means for GigGround's category strategy**
- Every category in §5 is presence-based — correctly positioned already. Explicitly AVOID building categories around pure-digital tasks that LLMs eat (writing, basic design, data entry beyond physical-world capture).
- **Double down on**: last-metre logistics (the km AI can't walk), household physical help, care & accompaniment (aging India = structural growth), event/hospitality surge labor, "human presence as a service" (queueing, being at a delivery, witnessing).
- **New AI-era categories to own early**: AI-output verification in the physical world (photograph this site, verify this address/shop exists, ground-truth data collection for AI companies — humans as sensors), robot-adjacent ops later (charging/resetting/cleaning delivery bots).
- The play: GigGround becomes the API for "I need a human, physically, there" — that demand grows as AI automates everything else.

---

## 9. Killing the time lag (worker's next gig / hirer's time-to-fill)

**What competitors do**
- **Instawork's tiered dispatch**: shifts are NOT broadcast to everyone. A fit score (skill, reliability, distance, past performance) ranks workers; the shift is released in waves to the best-fit tier first, widening until filled. High fill rates AND high quality.
- **Pronto**: auto-reassignment — if a Pro cancels, the system re-dispatches without the customer doing anything.
- **Snabbit**: dense micromarkets = worker is never far from the next job.

**Solutions for GigGround — split by gig type**
- **Instant gigs (errands, urgent)**: no applications at all. Dispatch: notify the top-fit tier of online workers → first accept wins → wave widens every 2 min. Hirer never reads applications for a ₹150 errand.
- **Scheduled gigs (events, retail)**: applications, but with auto-shortlisting (§11) and application expiry (unanswered after 24h = auto-declined with notification, freeing the worker's slot — no zombie applications).
- **"Next gig" prompt at completion **: the moment a worker marks a gig complete, the app immediately shows the 3 best-fit open gigs nearby ("your next gig is 400 m away, starts in 40 min"). Completion screen = discovery surface. This is the single highest-impact retention feature.
- **Availability heartbeat**: "I'm free now" toggle puts the worker in the instant-dispatch pool; going online in a zone with nothing nearby shows honest wait estimates + the nearest busier zone.
- Backup worker on confirmed gigs: silently hold the #2 applicant as standby; primary no-show (§4 detects it by missed check-in) → instant offer to backup. Hirer's job still gets done — Pronto's reassignment lesson.

---

## 10. Anti-spam & abuse restrictions

- **Workers**: daily active-application cap (e.g., 10 open applications at once — forces intentionality, keeps hirer inboxes readable); withdraw-to-free-a-slot; accepted-then-abandoned gig = strike (**[BUILT]** strikes) + 24h application freeze; cancel rate >X% = temporary instant-pool removal (Wonolo model: reliability gates access).
- **Hirers**: max open posts (e.g., 5); repost cooldown for identical posts (dedupe by title+area hash); posts require completing previous gig's confirmation flow first (can't accumulate limbo gigs); fake-post pattern (many posts, never hires) = posting freeze.
- **Both**: phone+device fingerprint at signup (multi-accounting is the top gig-fraud vector — 15% of gig accounts show fake/duplicate signals); one active account per device; banned-user device IDs blocked from re-registration; rate limits on chat messages to unmatched parties (no cold spam).
- Moderation keyword filter **[BUILT]** + report flow **[BUILT]** already cover content spam basics.

---

## 11. The core loop: multi-apply UX + hirer choice UX + guaranteed response

This is the heart of the app. Three sub-problems:

**a) Applying to 7 different-skill jobs must be effortless**
- **One-tap apply**: the profile IS the application (per-category track from §1 auto-attaches — applying to a delivery gig sends your delivery stats; to an event gig, your event stats). No forms, no cover letters.
- Optional single structured add-on: one line ("I have a bike / I've done 3 weddings") + availability confirmation chip. Nothing else.
- **Application tray** (new screen): all open applications with live status (Seen / Shortlisted / Declined / Expired), countdown to auto-expiry, one-tap withdraw. The worker always knows where they stand — that's the "always get a reply" promise made structural:
  - Hirer picks someone → everyone else auto-declined instantly with notification (no ghosting-by-default).
  - Nothing happens in 24h → auto-expire + notify. **A worker's application NEVER ends in silence.**

**b) Hirer must differentiate applicants in seconds**
- Applicant cards (**[BUILT]** base) show exactly four scannable things: relevant-category stats (not blended), reliability % + strikes (**[BUILT]**), verification tier (**[BUILT]**), distance/ETA. Nothing else above the fold.
- **Sort & compare**: default sort = fit score (relevant experience × reliability × proximity). "Top pick" badge on the algorithmically best applicant (hirer can ignore it, most won't).
- Swipe-style triage for many applicants: shortlist / decline in one gesture each; decline requires a one-tap reason chip (too far / not enough experience / filled) — which becomes the worker's feedback instead of silence.

**c) Structural change this implies**
- Split the data model: `applications` get statuses `applied → seen → shortlisted → hired | declined | expired` (currently jumps applied→confirmed). Add `seenAt`, `respondBy` timestamps.
- Notification surface for application-state changes (notifications system **[BUILT]** — needs new event types).
- Per-category worker stats on the user model (extends §1).
- Hirer-side applicant list gets sort + swipe triage (extends **[BUILT]** my-gigs screen).

---

## Priority order (impact ÷ effort, frontend-first)

1. **§11 application loop** — statuses, auto-expiry, auto-decline, application tray, applicant sort. Core promise: no silence, fast choice.
2. **§9 next-gig prompt on completion** + "I'm free now" toggle — biggest retention lever, cheap to build.
3. **§4 proof ladder** — OTP handshake + GPS check-in first (both cheap, kill most disputes); selfie/photo later.
4. **§5 category tree** — extends the built `MIN_PAY`/`jobKind` mechanism; unlocks per-category stats (§1).
5. **§3 safety pack** — women-to-women toggle, live-location session, direct-112 SOS upgrade.
6. **§7 day-fill plan + earnings floor pilot** — the differentiator; needs §5+§9 first.
7. **§2 multi-city zone model** — schema now (city→zones), launch discipline later.
8. **§6 arrival pass + verification tiers** — rides on §4's confirmation flow.
9. **§10 rate limits** — before public launch, not before.
