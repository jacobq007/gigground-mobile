# GigGround Home Redesign — Design Handoff Spec
**Concept A: persistent Working / Hiring mode switch**

---

## 1. What's changing

The home screen gets a segmented "Working / Hiring" control in the hero. Switching it swaps the entire home screen's content and accent color — hero copy, live-nearby banner, main feed, stat cards, the shared Dashboard tab, and the FAB's action set. Two color identities, one layout skeleton.

## 2. Color tokens

Keep all existing tokens (`navy`, `indigo` `#4338CA`, `green` `#15803D` money-only, neutrals) untouched. Add a second accent family for Hiring mode:

| Token | Working (existing) | Hiring (new) |
|---|---|---|
| Hero gradient start | `#1A1690` | `#7A1C68` |
| Hero gradient end | `#0D0B5E` | `#34092F` |
| Accent (links, "see all", active tab, avatar squares) | `#5F52F5` | `#9D2478` |
| Accent mid (secondary UI, dividers) | `#3830D0` | `#7A1C68` |
| FAB gradient | `#16208C → #2F62F0` | `#5C0F52 → #D6499A` |
| Soft badge background (e.g. "9 applied" pill) | `#E8E6FD` | `#FBE7F3` |
| Soft badge text | `#2320A8` | `#9D2478` |
| Large money amount in hero (`"₹2,400"`) | `#8CFFC1` on dark hero | keep `#15803D`-derived green — **do not recolor money**, even on the Hiring hero |

**Rule for design:** money is always green, full stop, in both modes — richness comes from the plum/indigo shift, not from touching the one existing color users already trust to mean "cash."

Do not reuse `red` `#ef4444` or `amber` `#f59e0b` anywhere in Hiring mode — those stay reserved for errors/alerts so the mode itself never reads as a warning state.

## 3. Where each color applies (component-level)

- **Hero gradient background** — full recolor per mode
- **Hero headline + streak/stat strip** — accent-tinted secondary text and icons
- **Live-nearby banner** — dot + copy content differ by mode (data, not color — banner card itself stays white/surface in both modes, only the little live-dot and copy change)
- **Feed cards below hero** — avatar/initial squares only pick up the mode accent; card background stays white/surface in both modes (don't tint entire cards — keep hierarchy: accent marks identity, not decoration)
- **Stat cards** (Hiring mode only: Active gigs / New applicants / Committed pay) — numerals in ink/text color, except the pay stat which stays green
- **Segmented control** ("Working | Hiring" pill) — active segment fill matches the *currently active* mode's accent; inactive segment stays translucent white on the hero
- **FAB** — full gradient recolor per mode, plus a **different set of actions** (see §5)
- **Dashboard tab** (bottom tab bar, 3rd slot) — icon stays the same; label swaps "Applications" ⇄ "My gigs"; active-tab tint follows current mode's accent

## 4. States to design

Please produce full-fidelity screens for:

1. **Home — Working mode** (default/initial state)
2. **Home — Hiring mode**
3. **The switch itself** — transition/motion spec between the two (crossfade vs. slide vs. hero-gradient morph — pick one and document timing/easing)
4. **Dashboard tab in both modes** (Applications view vs. My Gigs view) — this is the one existing screen pair (worker application tray + hirer "my posted gigs") this redesign is meant to unify under one tab slot
5. **FAB open state, both modes** (speed-dial expanded)
6. **Empty states** for Hiring mode: no posted gigs yet (should prompt "Post your first gig" clearly, not blend into the empty-working-feed pattern)

## 5. FAB action sets (never mixed)

**Working mode speed-dial** (existing, unchanged):
- Set availability
- Quick apply
- Refer & earn

**Hiring mode speed-dial** (new):
- Invite a worker
- Boost a gig
- Post a gig (primary/top position — this is the action that used to be awkwardly shared with worker actions in the old FAB; it now lives only here)

Never combine items from both lists in one menu, regardless of mode.

## 6. Interaction notes

- The segmented control is *persistent* — always visible at the top of the hero, not hidden behind a settings menu.
- Switching modes should feel instant (< 300ms), not like a page reload — this is a single home screen with two skins, not two separate routes.
- Preserve scroll position within a mode if the user switches away and back within the same session (nice-to-have, not a blocker).

## 7. Reference

Interactive click-through mockup (indigo/plum combo, current accent values above already applied):
`design/home-redesign-concepts.html` in the repo, Concept A frame.

## 8. Open questions for design to resolve

- Exact easing/duration for the mode-switch transition (crossfade recommended as the safe default).
- Whether the segmented control should carry a small icon per mode (💼/🧰-style) or stay text-only.
- Illustration/empty-state art direction for "no posted gigs yet."
