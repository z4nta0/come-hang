# Come Hang

Plan get-togethers with your group in one place: chat, set the date, see who's
bringing what, and find each other on the day of the event. Coming soon at
[comehang.app](https://comehang.app/).

Come Hang is a progressive web app for a group of friends, family, or
neighbors planning time together. Each group has its own chat, its upcoming
events with a bring-list for each one, and opt-in location sharing on the day
of an event, so everyone can see who's on their way. A person can belong to
more than one group, and switch between them from a rail on a wide screen or
a switcher on a phone. It's built and maintained by
[techgeek.dev](https://techgeek.dev/).

## How it works

- **No sign-up.** The app makes an anonymous identity on the phone the first
  time someone starts or joins a group, along with that phone's own key pair.
  Linking a Google account is optional, and brings the same groups back on a
  new phone. "Delete my data" removes everything kept for you, handing each
  group you own to the member who joined it earliest.
- **Content is encrypted before it leaves the phone.** Chat messages, events
  and their bring-lists, member names, and locations are encrypted with a key
  each group holds, and each member's copy of that key is wrapped with their
  own phone's key, so Firebase only stores ciphertext for them. Only what's
  needed to route and expire data (who sent something, when, an event's times,
  and the group) stays readable. It isn't end-to-end encryption in the strict
  sense: there's no verifying of each other's devices.
- **Joining takes an invite and an approval.** A group shares one invite link,
  and anyone who opens it asks to join, giving a name and an optional note.
  Any member can let them in, decline them, or block them, and letting someone
  in shares the group's key with them.
- **Little is kept, and nothing for long.** Chat history lives on each phone,
  and the server deletes a message once every member has it, or after a
  period the group's owner sets (7 to 180 days, 30 by default). Events and
  their lists expire 48 hours after they end. A shared location overwrites
  itself rather than building a trail, and is deleted when the event ends or
  an hour after its last update.
- **History can be passed along.** A new member, or one on a new phone, can
  ask for the group's earlier chat, and another member whose phone holds it
  sends it, encrypted, through a short-lived transfer.
- **Location sharing is opt-in and bounded.** It opens 3 hours before an
  event starts and closes when the event ends. The Map section shows each
  sharing member's distance, direction, and how fresh their position is,
  without a street map, and "I'm on my way" and "I've arrived" post to the
  chat.
- **Installable, with notifications.** It opens without a connection, and
  push notifications cover new messages, join requests, and other news, each
  opening the group at the section it's about. On an iPhone or
  iPad the app asks to be installed first, since Safari keeps an installed
  app's storage apart from its own.
- **One group is free.** Owning more than one group is a one-time upgrade,
  paid through Polar. The limits are in place but unlocked until launch.

## The sections

Each group has five:

- **Chat:** the group's messages, with its next event pinned above it, or in
  a panel beside it on a wide screen, where its bring-list can be claimed.
- **Events:** upcoming events, each with its bring-list. Any member can plan
  one, and its planner or the group's owner can change or cancel it.
- **Map:** location sharing for the day's event.
- **People:** the invite link, people waiting to join, members waiting on a
  new phone for the group's key, requests for history, and the members.
- **Settings:** the group's name, its chat retention, handing it to another
  member, leaving, and deleting it, plus this phone's light or dark mode and
  notifications, linking Google, the upgrade, deleting your data, and the
  privacy policy and terms.

## Running it locally

Requires Node.js 24 and npm, and Java 21 for the Firebase Emulator Suite. The
Firebase CLI is installed with the other dependencies.

```
npm install
npm --prefix functions install
npm run emulators   # the Emulator Suite, in its own terminal
npm run dev         # the development server, against the emulators
```

In development the app talks only to the emulators, under the
`demo-come-hang` project, which can't reach a real one. A member switcher on
the screen's edge seeds a demo group and acts as each of its members, one
browser tab per member.

```
npm run build       # type check what ships, then production build into dist/
npm run preview     # serve the production build locally
npm run lint        # ESLint across the whole repo
npm run typecheck   # TypeScript across the app, config, tests, and functions
npm run icons       # rebuild the icons in public/ from design/brand
npm run og-image    # rebuild the social preview card
```

A production build reads its Firebase project from `VITE_FIREBASE_CONFIG`
(the project's web config, as JSON), which also fills in the hosting files'
security policy and sign-in passthrough for that project.
`VITE_FIREBASE_VAPID_KEY` turns on push notifications, and
`VITE_APPCHECK_SITE_KEY` turns on App Check. A build without a project, such
as the test suites', keeps the strict policy and talks to no other origin.
[ARCHITECTURE.md](ARCHITECTURE.md)'s setup checklist covers the console work
each environment needs.

## Tests

The suites live in `tests/` and run on [Playwright](https://playwright.dev/),
the browser suites in Chromium, Firefox, and WebKit. `npm test` runs them
all, starting the emulators it needs.

- `npm run test:accessibility` scans every screen and its main states with
  axe-core, plus keyboard, focus, reflow, and reduced-motion checks.
- `npm run test:interaction` drives the screens, checking navigation and
  each control's feedback.
- `npm run test:client` runs the app's own code against the emulators.
- `npm run test:rules` checks the Firestore, Realtime Database, and Storage
  security rules.
- `npm run test:functions` checks the Cloud Functions end to end.
- `npm run test:security` checks the security headers, the policy in practice,
  the build for secrets, and the dependencies.
- `npm run test:seo` checks the head, the social preview card, the icons, the
  manifest, and the crawler files.
- `npm run test:worker` checks the service worker in a production build,
  opening the app offline.

The suites start their own servers on ports 5200 and 5201, and the emulators
on ports from 8200 up, so they don't touch a server already running.
[CLAUDE.md](CLAUDE.md) has the details.

## Project layout

```
src/
  main.tsx           entry point
  app.tsx            root component: the router and the screen host
  service-worker.ts  offline caching and push notifications
  core/              small pure helpers about the app's data, no React
  state/             reading and writing each kind of data in Firebase
  platform/          browser services: Firebase, encryption, storage, install
  screens/           each screen, with its CSS module beside it
  ui/                shared components and hooks
  utils/             small app-agnostic helpers
  legal/             the privacy policy and terms, their pages, and their sheet
  dev/               the development member switcher and its demo seed
  styles/            global CSS (fonts, tokens, base styles)
  assets/            the self-hosted fonts and shared images
functions/           the Cloud Functions, with their own package.json
tests/               the test suites and their helpers
public/              files served at fixed addresses, such as the icons
design/              the brand artwork and its renderers, not shipped
privacy.html         the privacy policy's page, the document built into it
terms.html           the terms' page, the document built into it
deploy-files.ts      fills in the hosting files for a build's Firebase project
firestore.rules      who may read and write each Firestore document
database.rules.json  who may read and write chat and presence
storage.rules        who may read and write history transfers
```

## Conventions

This codebase follows a detailed set of naming, formatting, and comment rules.
[ARCHITECTURE.md](ARCHITECTURE.md) records every design decision and the
reasons behind it, and [CLAUDE.md](CLAUDE.md) the rules that apply to this
project alone. Read both before changing code.

## Support

If this project is useful to you, you can support its development with a tip
on Ko-fi. It's never required, and always appreciated.

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/techgeekdev)

## License

Source available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md):
free to use, copy, and change for any noncommercial purpose. The written
content, images, and Come Hang name and marks aren't covered, and remain
all rights reserved.
