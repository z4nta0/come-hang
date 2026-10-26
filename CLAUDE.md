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
approval, billing, and every open question. It always reflects the
current decisions:
- **A new or changed decision updates it in the same change**, including
  every earlier passage the decision affects. Search the whole document for
  the topic (the data it touches, the section numbers that discuss it) and
  rewrite each passage that no longer holds, a Pros/Cons entry included, so
  nothing contradicts the latest decision. A new section never sits beside
  an old passage it overturns.
- **Passages are rewritten in place, never marked superseded**: git keeps
  the history, and the document stays a description of the present.
- **The header's "Last updated" line** moves to the date of the change,
  naming what changed.

## Status

Scaffolded: the app shell answering at one address, a placeholder home page,
the global stylesheet, the accessibility, interaction, and security suites,
and the Firebase Emulator harness with a rules suite. `firestore.rules`
covers the user and account documents, a group's creation, join requests,
their approval and blocking, leaving, removal, invite rotation, ownership
transfer, and account notices so far, and the rest are written one collection at a time, each walked through
with the user. No Firebase code in the app yet. Next steps are in
ARCHITECTURE.md's Section 14.

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
npm test                     # every suite, browser suites in all three engines
npm run test:accessibility   # the pre-commit accessibility scan
npm run test:interaction     # navigation and interaction feedback
npm run test:rules           # Firestore security rules, in the emulator
npm run test:security        # headers policy, build secrets, npm audit
```

The suites start their own dev server on port 5200, and the security suite
a production build served by `vite preview` on 5201 (sibling projects use
5190 through 5199), so they never touch a dev server already running.
`npm test` and `npm run test:rules` run inside `firebase emulators:exec`,
which starts the Firestore emulator on 8200 (ease-my-life's uses 8080) under
the `demo-come-hang` project, which can't reach a real one. The emulator
needs Java, 21 installed.

## Project facts

- **Kind of site** (per the SEO rules): a web app. Its public addresses (the
  root, which a signed-out visitor meets as the landing, and the legal
  pages) are indexed; every screen behind identity or holding personal data
  carries `noindex`. Live URL: https://comehang.app (domain
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
- **Firestore SDK override**: the Firestore SDK's Node build pins
  `@grpc/grpc-js` to 1.9, which carries a high advisory and failed the
  security suite's audit, so `package.json` overrides it to 1.14.6 under
  `@firebase/firestore` only. The browser build never loads gRPC; the rules
  suite runs on the override. Drop it once the SDK moves past 1.13.5 itself.
- **UI**: built in-house, no component library.
- **Section links** (per the section links rule): the rule doesn't apply,
  since the app moves between screens and has no links to sections of a
  page. If the public landing page gains in-page links, the rule applies
  to that page then.
- **Main content** (per the skip link rule): the `<main>` element in
  `app.tsx`, which holds whichever page the address matches. There's no bar
  or tab bar yet, so it's everything after the skip link; once the tab bar
  joins, it stays the open screen's content, past the bar.
- **Routing** (decided 2026-10-25, an app rather than a website): the app
  answers at one address, its root. React Router stays, with a single path:
  - **Unknown addresses** render a redirect that replaces the address with
    the root, so the bar never keeps a path the app doesn't use and back
    doesn't return to it. There's no 404 page (the "Required Pages: 404"
    rule's app exception).
  - **Screens are history entries, not paths**: moving to a screen adds an
    entry that records the screen in its state, so the back gesture walks
    back through screens while the address stays the root. Built with the
    first screens.
  - **Entry addresses** carry something in from outside, such as an invite
    link (`/join/<token>`) or a notification's target: the app reads one as
    it starts, acts on it, then replaces the address with the root. Each is
    built with the feature it serves.
- **Legal pages** (decided 2026-10-25): the privacy policy and terms get fixed
  addresses, `/privacy` and `/terms`, as static pages in `public/`, which
  Netlify serves ahead of its every-path rewrite. Google's sign-in
  verification and app listings ask for those URLs. They're written before
  Google sign-in is set up.
- **Horizontal sizing** (decided 2026-10-25): every horizontal size, widths
  and spacing alike, reads the horizontal rhythm, `--hor-rhy-*` (the
  viewport width divided by powers of the core design number). There's no
  `--spa-hor-*` family. A value that gets too small or too big on some
  screens becomes fluid, `clamp()` with a `--hor-rhy-*` step in the middle
  and fixed ends written as a vertical rhythm step times `1rem`, as the
  gutter and the skip link's padding do.
- **Layout and spacing** (per the global grid-first and spacing tier
  rules): grid with areas named after each child's class, and five
  spacing tiers, each two rhythm steps below the one above it, starting
  from p04 vertically and horizontal rhythm step 14 horizontally (decided
  2026-10-22, horizontal moved to the horizontal rhythm 2026-10-25, values at
  a 1,920px wide screen):

  | Tier | Tokens | Vertical | Horizontal | Separates |
  |---|---|---|---|---|
  | 1 | `--tie-ver-001` / `--tie-hor-001` | p04, ~44.9px | step 14, ~49.6px | The page frame: the tab bar or header and a screen's content |
  | 2 | `--tie-ver-002` / `--tie-hor-002` | p02, ~25.6px | step 12, ~28.3px | Sections of one screen |
  | 3 | `--tie-ver-003` / `--tie-hor-003` | bas, ~14.6px | step 10, ~16.1px | Items in a list; a heading and its content |
  | 4 | `--tie-ver-004` / `--tie-hor-004` | m02, ~8.3px | step 8, ~9.2px | The parts of one item (title, details, actions) |
  | 5 | `--tie-ver-005` / `--tie-hor-005` | m04, ~4.7px | step 6, ~5.2px | The pieces of one part (an icon and its label, a label and its field) |

## Don't forget

- Firebase/Google Analytics stays **off** in every Firebase project.
- Budget alerts and the automatic billing cutoff are set up the same day
  Blaze is enabled (ARCHITECTURE.md Section 15).
