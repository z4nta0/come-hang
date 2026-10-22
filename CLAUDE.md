# CLAUDE.md

Project guidance for group-planner. The user-level CLAUDE.md (pointing to
`~/projects/claude-rules/CLAUDE.md`) holds every coding, formatting,
naming, comment, copy, testing, and commit rule; this file only adds what's
specific to this project.

## What this is

A progressive web app for planning a group get-together: group chat, an
event scheduler, notes on who's bringing what, and opt-in location
sharing on the day of an event. People can belong to more than one group.

**Read [ARCHITECTURE.md](ARCHITECTURE.md) before designing or building
anything.** It's the decision record from the planning conversations: the
Firebase setup, the data model, encryption, retention, invites, join
approval, billing, and every open question. When a decision changes or a
new one is made, update it there in the same change.

## Status

Scaffolded: the app shell, a placeholder home page, the 404 page, the
global stylesheet, and the accessibility and interaction suites. No
Firebase code yet. Next steps are in ARCHITECTURE.md's Section 14.

**Placeholders to replace in the design pass**: the colors and the main
font in `src/styles/styles.css` (neutral stand-ins, marked as such), the
working name "Group Planner", and the text width tokens, which need
re-measuring once the main font is chosen.

## Commands

```
npm run dev                  # Vite dev server
npm run build                # type check, then production build to dist/
npm run lint                 # ESLint across the repo
npm run typecheck            # tsc -b
npm test                     # every suite, in Chromium, Firefox, and WebKit
npm run test:accessibility   # the pre-commit accessibility scan
npm run test:interaction     # navigation and interaction feedback
```

The suites start their own dev server on port 5198 (sibling projects use
5190 through 5197), so they never touch a dev server already running.

## Project facts

- **Kind of site** (per the SEO rules): a web app. Public pages (landing,
  help, legal) are indexed; every screen behind identity or holding
  personal data carries `noindex`. Live URL: not yet chosen.
- **Stack**: Vite, React, React Router, TypeScript (`strict` on from the
  first file), `vite-plugin-pwa`.
- **Backend**: Firebase on the Blaze plan (Auth, Firestore, Realtime
  Database, Cloud Messaging, Storage, Cloud Functions, App Check). No
  other server.
- **Hosting**: Netlify.
- **Environments**: the Firebase Emulator Suite for development and
  automated tests, plus two real Firebase projects, live and staging
  (staging backs Netlify deploy previews).
- **Client storage**: raw IndexedDB, no wrapper library.
- **UI**: built in-house, no component library.
- **Horizontal sizing system**: not yet chosen (per the global CSS rules,
  discuss with the user before converting any widths).

## Don't forget

- Firebase/Google Analytics stays **off** in every Firebase project.
- Budget alerts and the automatic billing cutoff are set up the same day
  Blaze is enabled (ARCHITECTURE.md Section 15).
