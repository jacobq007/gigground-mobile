# GigGround — frontend architecture & editing guide

A hyperlocal gig marketplace (React Native / Expo Router, SDK 54). One app,
two modes — **Working** (find gigs) and **Hiring** (post & staff gigs) — that
a single account switches between from the home screen.

This doc is the map for changing things safely. Every knob has one home.

## Stack

- **Expo Router v6** file-based routes under `app/`.
- **State via React context** (`lib/*Context.jsx`): auth, location, mode, theme.
- **Mock API** (`lib/api.js`) that mirrors a real backend's shape. Swapping to a
  live server is a one-file change (see below).
- **Fonts**: DM Sans (UI), Plus Jakarta Sans (home headings), Space Grotesk
  (numeric figures). Loaded in `app/_layout.jsx`.

## Theming — the one rule that prevents white-screen crashes

Colours live in **`lib/theme.js`** as two palettes, `LIGHT` and `DARK`, with the
**same keys**. The active palette is read at render time through `useC()`
(`lib/ThemeContext.jsx`). The toggle persists to `gg_theme` in AsyncStorage.

Every screen follows this pattern:

```jsx
import { useC } from "../lib/ThemeContext";
const C = useC();
const s = makeStyles(C);            // StyleSheet built per-render from C
// ...
const makeStyles = (C) => StyleSheet.create({ card: { backgroundColor: C.surface } });
```

**Never** put `C` in a module-level `StyleSheet.create` or a module-level object
(`const X = { color: C.text }`). Expo Router evaluates every route module at
startup, so a module-scope colour reference throws `C is not defined` and blanks
the whole app. If a child component needs colours, take `C` (or the built `s`)
as a prop. This is the single most common bug class in this codebase — grep for
`= StyleSheet.create` outside a `makeStyles` function before shipping.

**To change a colour:** edit `LIGHT` and `DARK` in `lib/theme.js`. That's it —
it flows everywhere. Money is always `green`; keep amber/red for status only.

## Data & taxonomy — add a category, skill, or city

- **Skill categories & skills** → `lib/skills.js` `SKILL_GROUPS`. Each group has
  `{ key, label, skilled, icon (Ionicons name), skills:[{key,label}] }`. Adding a
  group or skill here updates the Skills page, the Post-a-gig category grid, the
  matching engine, and the applicant filters automatically.
- **Category colours** → `GROUP_TINT` / `GROUP_TINT_FG` in `lib/skills.js` (one
  source, read by both grids).
- **Title → category inference** (Post-a-gig search fallback) → `INFER_RULES` in
  `lib/skills.js`: a keyword regex → skill key list, first match wins.
- **Cities & areas** → `lib/constants.js` `CITIES` and `lib/geo.js` (coords +
  nearest-city fallback).
- **Pay floors / job kinds** → `lib/constants.js` `MIN_PAY`.
- **Moderation keywords** → `lib/constants.js` `BANNED_KEYWORDS`.

## Matching

`lib/skills.js` `compatibility(applicant, gig)` returns `{ score, reasons,
skilledMatch }`. Skilled gigs weight verified skill 45%; general gigs drop skill
and renormalise across proximity / rating / reliability / budget. Tune the
weights in `W_SKILLED` / `W_GENERAL`.

## Swapping the mock backend for a real one

`lib/api.js` is the only file that knows data isn't real. Each exported API
object (`authAPI`, `gigsAPI`, `applicantsAPI`, `matchesAPI`, …) returns the exact
shapes the screens consume. To go live, replace the bodies with `fetch()` calls
that return the same shapes — no screen changes. `DB_VERSION` forces a reseed of
the local mock when seed data changes; bump it after editing `lib/mockData.js`.

## Route map

```
app/
  index.jsx                 auth/onboarding gate → redirects
  (auth)/                   welcome · login · signup · onboarding
  (tabs)/
    index.jsx               HOME (Working/Hiring switch, hero, posted gigs)
    jobs/                    gig feed · [id] detail · fulltime board
    dashboard.jsx           worker dashboard
    chat/                   conversations · [id]
    profile/                index · edit · applications · my-gigs
                            applicants · kyc
  modals/                   post-gig · matches · notifications · gigs-map
                            skills · skill-category · availability · refer
                            boost · verify · active-gig
```

New modals must be registered in `app/_layout.jsx` (`<Stack.Screen>` with
`presentation: "modal"`).

## Running it (Codespaces-friendly)

```bash
npm run web        # Metro web dev server, offline (hot reload) → port 8081
```

`npm run web` passes `--offline` on purpose. Plain `expo start` makes a network
call to Expo's servers at startup to validate dependency versions; if that call
is blocked or flaky (restricted egress, proxies, Codespaces), `@expo/cli`
crashes before Metro serves — the port then returns a 404 / "page not found".
`--offline` skips that step. Use `npm run web:online` if you specifically want
the version check.

Static preview (most robust when the dev server misbehaves through a proxy):

```bash
npm run export:web   # → dist/  (must compile clean)
npm run serve:web    # static-serve dist on port 8081
```

Open the app from the editor's **PORTS** tab (port 8081 → globe icon), not a
hand-typed URL.

## Verifying a change

`npm run export:web` must compile clean, then drive the affected screen in a
browser (the repo's design/verify flow uses Playwright against the exported
bundle) and confirm **zero page errors** in both light and dark before
committing.
