# CLAUDE.md

Project guidance for Come Hang (`come-hang`). The user-level CLAUDE.md (pointing to
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
font in `src/styles/styles.css` (neutral stand-ins, marked as such), and the
text width tokens, which need re-measuring once the main font is
chosen.

## Commands

```
npm run dev                  # Vite dev server
npm run build                # type check, then production build to dist/
npm run lint                 # ESLint across the repo
npm run typecheck            # tsc -b
npm test                     # every suite, in Chromium, Firefox, and WebKit
npm run test:accessibility   # the pre-commit accessibility scan
npm run test:interaction     # navigation and interaction feedback
npm run test:security        # headers policy, build secrets, npm audit
```

The suites start their own dev server on port 5200, and the security suite
a production build served by `vite preview` on 5201 (sibling projects use
5190 through 5199), so they never touch a dev server already running.

## Project facts

- **Kind of site** (per the SEO rules): a web app. Public pages (landing,
  help, legal) are indexed; every screen behind identity or holding
  personal data carries `noindex`. Live URL: https://comehang.app (domain
  registered 2026-10-22, not yet deployed).
- **Support email**: support@comehang.app.
- **Stack**: Vite, React, React Router, TypeScript (`strict` on from the
  first file), and `vite-plugin-pwa` once the service worker is built (not
  yet installed).
- **Backend**: Firebase on the Blaze plan (Auth, Firestore, Realtime
  Database, Cloud Messaging, Storage, Cloud Functions, App Check). No
  other server.
- **Hosting**: Netlify.
- **Environments**: the Firebase Emulator Suite for development and
  automated tests, plus two real Firebase projects, live and staging
  (staging backs Netlify deploy previews).
- **Client storage**: raw IndexedDB, no wrapper library.
- **Security suite** (per the security testing rule): the baseline lives in
  `tests/security/`, checking `public/_headers` and the production build. The
  policy is strict while the app talks to no other origin: the Firebase work
  adds its addresses to the Content-Security-Policy and turns the secret
  search's Google key pattern into an allowance for the Firebase web config's
  browser key (named here when it lands), and location sharing opens
  `geolocation` in the Permissions-Policy, each in the change that needs it.
- **UI**: built in-house, no component library.
- **Horizontal sizing system**: not yet chosen (per the global CSS rules,
  discuss with the user before converting any widths).
- **Layout and spacing** (per the global grid-first and spacing tier
  rules): grid with areas named after each child's class, and five
  spacing tiers, each two rhythm steps below the one above it, starting
  from p04 (decided 2026-10-22):

  | Tier | Tokens | Value | Separates |
  |---|---|---|---|
  | 1 | `--tie-ver-001` / `--tie-hor-001` | p04, ~44.9px | The page frame: the tab bar or header and a screen's content |
  | 2 | `--tie-ver-002` / `--tie-hor-002` | p02, ~25.6px | Sections of one screen |
  | 3 | `--tie-ver-003` / `--tie-hor-003` | bas, ~14.6px | Items in a list; a heading and its content |
  | 4 | `--tie-ver-004` / `--tie-hor-004` | m02, ~8.3px | The parts of one item (title, details, actions) |
  | 5 | `--tie-ver-005` / `--tie-hor-005` | m04, ~4.7px | The pieces of one part (an icon and its label, a label and its field) |

## Don't forget

- Firebase/Google Analytics stays **off** in every Firebase project.
- Budget alerts and the automatic billing cutoff are set up the same day
  Blaze is enabled (ARCHITECTURE.md Section 15).
