# Archived: Community tab

Removed from the bottom tab bar (replaced by the Dashboard tab). These files
are untouched, just relocated — paths below mirror their original location.

## Contents
- `app/(tabs)/community/` — the tab's routes (feed, post detail, event detail)
- `app/modals/new-post.jsx`, `new-event.jsx`, `new-rental.jsx` — the create flows launched from the community feed
- `components/RentalCard.jsx`, `EventCard.jsx`, `EventsView.jsx`, `RentalFilterSheet.jsx`, `RentalMap.jsx` — community-only presentational components

`lib/api.js` (`postsAPI`) and the post-related seed data in `lib/mockData.js` were left in place since they're shared data-layer code, not community-specific UI.

## To restore
1. Move each file back under its listed path (e.g. `app/(tabs)/community/index.jsx` back to `app/(tabs)/community/index.jsx`).
2. Re-add the `community` tab in `app/(tabs)/_layout.jsx`.
3. Re-register `modals/new-post` and `modals/new-event` as modal screens in `app/_layout.jsx`.
4. Re-wire the "Local buzz" links on the home screen and the "Open" button that pointed at `/(tabs)/community`.
