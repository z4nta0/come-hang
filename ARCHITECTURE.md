# Come Hang: Architecture Decisions

Living document. Updated as design decisions are made during planning
conversations, before implementation starts. When a decision changes,
every passage it affects is rewritten to match in the same change, so the
whole document always reflects what the project is currently committed
to. Open questions live in Section 13 and upcoming work in Section 14.
Each decision section includes a
**Pros** / **Cons** breakdown of the tradeoff actually being accepted;
purely descriptive or tracking sections (concept, storage map overview,
known limitations, open questions, next steps) don't get one, since
there's no distinct decision to weigh there.

Last updated: 2026-11-11 (Android's white navigation bar accepted after viewport-fit=cover didn't change it, in Section 14; a tapped push launching the installed app on an iPad accepted as opening at the group list, in Section 11.1; a message sent from the outbox before the chat's watch starts shown in the log, in Section 14; the chat's own connection watched, with the banner, waiting messages, and paused status lines while it can't connect, in Section 14; a new version of the service worker taking over without waiting for the app to close, in Section 14; a hidden diagnostic log for the chat database's connection, in Section 14; the screen kept on while sharing on the Map, in Section 10; a tapped push's address kept for the app it launches, and the window told the address before it's focused, in Section 11.1; chat pushes held to one per member and group every 2 minutes, in Sections 11.1 and 11.7; the join screen reading the request again as it comes into view and every 15 seconds, waiting messages kept in order when the clock steps back, Settings kept open when a just-deleted group drops out, the map's distances in the device's region's units, and the frame's content area holding what's positioned against it, in Section 14); 2026-11-10 (one active device at a time, an older device stepping back with the keys to share and a way back, and the push token refreshed as the app opens, in Sections 6, 8, 11.1, and 13; the Realtime Database kept on WebSockets, in Section 14; the bars around an installed app kept in the color of the mode showing, and Android's launcher icon on a pale tile, in Section 14; a member's own old device sharing a group's key with their new one, in Sections 6, 12, and 14; Google sign-in falling back to a full-page redirect when its popup is blocked, in Section 8; the manifest's theme color dropped so Android draws its own navigation bar, in Section 14; the sandbox purchase and refund checked on staging, in Section 14's setup checklist; staging's own Polar sandbox set up, in Section 14's setup checklist; a sixth stage for search engines and outside checks of the headers and social preview, in Section 14's setup checklist; live Polar tested with a real purchase and refund, in Section 14's setup checklist; live Polar set up from the product first made for staging, with staging's sandbox still to make, in Section 14's setup checklist); 2026-11-09 (comehang.app attached and checked through Cloudflare, and the manifest sent with its own type, in Section 14; the paywall switched on, in Sections 14 and 18; DNSSEC done, in Section 14's setup checklist; live's sign-in, API key, and App Check prepared and DNSSEC turned on, in Section 14's setup checklist; staging's domain, sign-in, API key, and App Check done, and comehang.app held until the first deploy, in Section 14's setup checklist; Google sign-in's helper script allowed by the built policy, in Section 14's setup checklist; two Netlify sites, live and staging, with staging kept out of search, in Section 14's setup checklist; stage 2, the Firebase projects, done for staging and live, with live Polar moved to the first deploy, in Section 14's setup checklist; the live project created and deployed, and the first functions deploy's permission delay, in Section 14's setup checklist; staging's Polar sandbox and full functions deploy, the product's settings, and live Polar moved after the first deploy, in Section 14's setup checklist; Storage soft delete, object versioning, and Firestore backups kept off, in Section 14's setup checklist; join requests added to the TTL policies the setup checklist lists, in Section 14; the billing cutoff tested on staging with the Project Billing Manager role, and the functions image cleanup policy, in Sections 14 and 15; the billing cutoff built and spend caps on Cloud Run Functions and Cloud Run added, in Section 15, with the staging project's progress in Section 14's setup checklist; a Google account on the support address added to the setup checklist, for the sign-in consent screen, in Section 14; the Storage lifecycle rule limited to the history transfer and photo folders, sparing profile photos, in Section 14's setup checklist; the setup checklist's first stage, the domain and email, done, and the checklist ordered into stages, in Section 14; the full photo uploaded once and never replaced, in Section 20; a waiting message's send tried again after a refusal, in Section 14); 2026-11-08 (the offline banner, waiting chat messages, and other changes paused offline, in Section 14; profile photos, one for every group, in a new Section 21, with pointers in Sections 4, 5, and 11.3; bring-list lines in the chat, posted quiet, in Sections 11.5 and 11.7, and the notifications card, shown until it's answered, in Section 11.1; a shared key loading the recovered member's open section without a reload, in Section 6; the notices sheet closing once its entries all go, in Section 14; what's waiting on the member, with its dots, the notices sheet's "Waiting on you" part, and Review's jump to the item, in Section 14); 2026-11-07 ("Save all" downloading one ZIP archive on a computer, and the share sheet kept to touch screens, in Section 20; the photo viewer's round steps over the photo's sides, with the arrow keys and a swipe stepping too and the stepped-to photo sliding in, in Section 20; saved photos keeping their format, in Section 20; the chat's photos line opening the event's photos, in Section 20; event photos built, with ended events kept in the Events section, in Sections 14 and 20; event photos decided for launch, with their caps, tallies, start, chat line, and the Cloud Function keeping them with their event, in a new Section 20, with pointers in Sections 4, 5, 11.5, and 12 and its open choices in Section 13; the event form's place suggestions, kept on each device, in Section 5's Events & Notes and Section 14; Settings' support form posting to Netlify Forms, in Section 14's infrastructure and its setup checklist); 2026-11-05 (the app's frame with no groups built for a phone with an identity in no group, its group tabs turned off and Settings' phone and account parts working, the welcome its content, in Section 14, with the deletion's place in Settings; the invite form branded, with "What is Come Hang?" opening the landing page in its invite mode and the form's draft kept, in Section 14; the landing page built, shown when the phone holds no identity, with the welcome kept for an identity in no group and the deletion's note moved to it, in Sections 14 and 16; the landing page for a visitor with no identity, its three-color headline, its route with pins dropping in and the group gathering along it, its trust and upgrade sections, the invite form's branding, and its pre-render planned and then dropped for the loader-first screen choice, in Section 14, with the root for an identity in no group recorded as open, and the paywall switched on for launch, in Section 18); 2026-11-04 (the daily cleanup of unused identities, in no group, unpaid, and unlinked for 180 days, in Sections 8 and 14, its open item closed; the notices sheet, shown at launch and live and dismissed together, in Sections 11.1 and 14, its open item closed); 2026-11-03 (deleting one's data from Settings or the welcome, handing an owner's groups to the earliest member, and the `ownershipPassed` notice, in Sections 11.1, 14, and 18, with notices not yet shown and unused identities recorded as open; the privacy policy and terms, their static pages and Settings sheet, the refund promise, and identity deletion recorded as open, in Sections 14 and 18; the hosting files filled in per project, sign-in on the app's own domain, and App Check, in Section 14; the history request screens, the chat's banner and People's list, in Sections 11.1, 11.9, and 14; history requests' missing screen recorded as open, in Section 14; a tapped push opening its group and section, in Sections 11.1 and 14; the install screen on iPhone and iPad, the install note and Settings' Install button elsewhere, and the invite in Safari left unnamed, in Sections 13, 14, and 16; joining with a pasted invite link, from the welcome and the group list, in Sections 14 and 16); 2026-11-02 (the development member switcher, its per member storage, and the seed of a demo group, in Section 14; joining through an invite link, its join screen, and watching a request until it's answered, in Section 14; the Map section drawn without a street map, status posts in the chat, and sharing kept across sections and reloads, in Sections 10, 11.7, and 14); 2026-11-01 (reviewing join requests in the People section, the Settings section's group settings, leaving, deleting, handing the group over, this phone's appearance and notifications, and the account's Google link and upgrade, getting groups back on a new phone and sharing the group's key from People, and focus in confirmations, in Section 14); 2026-10-31 (the Events section and its form, editing bring-list items, and the People section, in Section 14); 2026-10-30 (the group's section tabs, the event sheet and panel, the bring-list's watch, and the panel's width, in Section 14; the group chat, each member's color slot built, the first screens, the group list, the look, light and dark modes, and each member's color slot, in Sections 11.3 and 14); 2026-10-29 (the screen layout, in Section 14; leaving and
arriving posted to the chat, in Sections 10 and 11.7; asking the browser to keep the storage once the
identity exists, in Section 14; the purchase's checkout and webhook functions,
their delivery records, and the app's side of buying, in Sections 4, 14,
and 18; Google linking and recovery in the app, the
group key shared again with a recovered member, and the newest phone's
key standing, in Sections 6, 8, 11.1, 11.3, 12, and 14; push notifications in the app, its one service
worker, and offline opening, in Sections 2, 11.1, and 14; the activity pushes, for chat, join requests,
and history requests, in Sections 11.1, 11.7, 11.9, 14, and 17; location
sharing in the app, its throttle, and
the position's rounding, in Sections 5, 11.4, and 14; presence and history
requests in the app, the
history bundle's format, and coverage by join time, in Sections 11.9 and
14; chat in the app, its allowed characters, and the
emulator's shared database instance, in Sections 11.10 and 14; events and
their bring-lists in the app, and a description's blank lines, in Sections
11.10 and 14); 2026-10-28 (group
deletion in the app, in Section 14;
ownership offers and notices in the app, in Section 14; members, leaving, removal, link rotation, and
group settings in the app, in Section 14; joining a group in the app, with the approver
encrypting the joiner's name, in Sections 11.3, 13, 14, and 17; group creation in the app and emoji listed by code
point in the rules, in Sections 11.10 and 14; the group key wrapping scheme and extractable
group keys, in Sections 6 and 14; the app's Firebase services and identity
bootstrap, in Sections 8 and 14; push tokens, their rules, and the pushes for
notices and offers, in Sections 4, 9, 11.1, and 14; the daily run, its server-only claim record, and
the lapse and claim notices, in Sections 4, 11.1, 14, and 18; declines through a callable and the removal and
offer notices built, in Sections 9, 11.1, 14, and 18; group deletion built as
a callable and notice IDs,
in Sections 9, 11.1, and 14; every service in us-central1, the Cloud
Functions' layout, and the membership mirror's functions, in Sections 11.7
and 14; the Storage rules for history transfers, their
25 MB cap, and the bucket's 15-day cleanup, in Sections 11.9 and 14; chat's waiting-on list, the membership mirror,
and the Realtime Database rules for chat and presence, in Sections 4, 5,
11.7, 11.8, 11.10, and 14; history requests keyed by the asker's UID, with
their rules, in Section 11.9, completing the Firestore rules noted in
Section 14; location sharing's window, expiry, encrypted
arrived flag, and rules in Sections 5, 10, and 11.4); 2026-10-27 (events as one encrypted bundle with time bounds,
and items expiring on their own, in Section 11.5, with their text limits in
Section 11.10; the owner renames the group with its invite in
one batch, in Sections 11.2 and 11.6, and who edits events and their items
in Section 11.5); 2026-10-26 (ownership offers, acceptance, lapsing, and claims
in Section 18, notices in Sections 4 and 11.1, removal notices and group
deletion in Section 9, the group's `pendingOfferedAt` in Section 11.2, and
the functions they need in Section 14; the account's groups split into
owned and member maps in Sections 11.1 and 18; leaving, removal, and
rotation batches in Section 9; the group's `countedUid` in Section 11.2; untrusted text and paths in Section 11.11;
text limits in Section 11.10 and binary formats in Section 6; the private
`/accounts/{uid}` doc, the group's `memberCount`, and the paywall's switch
decided for the caps' enforcement, Sections 4, 9, 11.1, 11.2, 17, and 18;
the emulator harness for the security rules noted in Section 14; routing
decided in Section 14).

---

## 1. App Concept

A progressive web app for planning a group meetup or get-together. Core
features: group chat, an event scheduler/tracker, notes tracking who's
responsible for what at each event (e.g. who's bringing which dish), and
opt-in location sharing on the day of an event. Users can belong to more
than one group.

Original goal was a fully peer-to-peer app with no third-party server
involved at all. That goal was revised after working through the real
constraints (see Section 3): push notifications and reliable async
delivery are not achievable without *some* always-on infrastructure, so
the design uses Firebase as a thin, largely transient relay instead of
true P2P.

---

## 2. Tech Stack

- Vite + React + React Router
- TypeScript
- `vite-plugin-pwa`
- Firebase (Blaze plan, Section 15): Auth, Firestore, Realtime Database,
  Cloud Messaging, Storage, Cloud Functions (push sends and the billing
  cutoff), App Check
- Hosting: Netlify (Section 14)
- Zustand, for the small slice of state that's genuinely global (see
  below)

**Resolved: no Redux / Redux Toolkit.** Its core value, taming state
that many different contributors mutate somewhat independently over
time without losing track of where a change came from, addresses a team-
coordination problem this project doesn't have with a single consistent
implementer working from this document. It's also a poor technical fit
regardless: most of this app's state is a live mirror of whatever
Firestore/RTDB's own `onSnapshot` listeners are already streaming down,
which already provides subscription, caching, and offline persistence.
Piping that into a Redux store would mean re-dispatching every snapshot
update into an action just to arrive back at the same data, pure
indirection with no functional gain. RTK Query, often the actual
selling point over plain Redux, is built around request/response APIs
with cache invalidation, it doesn't map onto an already-live subscription
model like Firestore's.

**Chosen pattern instead**:
- A **custom hook per Firestore/RTDB collection** (`useGroupMembers`,
  `useChatMessages`, `useEvents`, etc.), each wrapping its own
  `onSnapshot` listener and exposing current state locally, scoped
  naturally to whichever component subtree consumes it. This is the
  established, idiomatic pattern in the Firebase+React ecosystem, not
  something unusual or under-tested.
- **Zustand for the genuinely cross-cutting state**: current session/
  identity, the in-memory unlocked group keys, UI state like the active
  modal or a toast queue, things multiple, unrelated parts of the
  component tree each need just one piece of. Zustand's selector
  pattern (`useStore(state => state.currentModal)`) only re-renders a
  component when its own selected slice changes, unlike plain React
  Context, where any change to the context value re-renders every
  consumer regardless of what they actually read, without needing
  Redux's reducers/actions/dispatch machinery to get that granularity.

**Pros**
- Standard, well-documented, widely-supported tooling; easy to hire for
  or find help with later.
- `vite-plugin-pwa` writes the build's file list into the app's one
  service worker, so caching the app for offline use is a few lines of
  Workbox, beside the push handling the worker also does.
- TypeScript catches a real class of bugs early, especially valuable
  given the amount of cross-service data shuffling (Firestore, RTDB,
  WebCrypto) this app involves.
- The hooks-per-collection + Zustand combination is far less boilerplate
  than Redux Toolkit would have been, and maps directly onto how the
  data already behaves (live-synced vs. genuinely local/global), rather
  than forcing everything through one uniform store shape.

**Cons**
- TypeScript adds build/tooling overhead and a learning curve if the
  team isn't already fluent in it.
- No centralized action log or time-travel debugging the way Redux
  DevTools provides; debugging a cross-cutting state bug relies on
  Zustand's own (lighter) devtools middleware plus ordinary React/
  Firestore debugging instead.
- State management conventions now live in this document and in the
  hooks' own code rather than being enforced by a framework, that's an
  acceptable trade given a single consistent implementer, but would need
  real discipline if more contributors ever join the project.

---

## 3. Infrastructure & Backend Services

No custom backend server. Firebase is used as an intermediary, but
deliberately scoped to hold app content only transiently, not as a
long-term data store, see Section 5 for retention rules per data type.

| Service | Used for |
|---|---|
| Firebase Auth | Anonymous identity, optional linked recovery credential |
| Firestore | Structured, lower-frequency data: events, notes/assignments, group & membership metadata, invite tokens, live location |
| Realtime Database (RTDB) | High-frequency, ephemeral data: chat messages, presence |
| Cloud Messaging (FCM) | Push notifications, the only mechanism that can reach a backgrounded or closed app on either platform |
| Storage | One-off bulk chat-history transfer blobs for history-sync requests between members, see Section 11.9 |

No custom signaling server, TURN server, or WebRTC is used. Firebase's
listeners and FCM replace the need for a peer-to-peer data channel
entirely.

**Revision**: live location was originally grouped with chat as
"high-frequency ephemeral data" in RTDB. Moved to Firestore once the
concrete schema surfaced a better reason to split them apart, see
Section 11.4. Location doesn't actually fan out the way chat does (one
write per sharer, not one write per recipient), so the original
per-operation-cost argument for RTDB never applied to it as strongly,
and Firestore's native TTL-based auto-deletion, which RTDB has no
equivalent for, turns out to matter more for location than the RTDB
billing model does.

**Revision (2026-10-22): the project runs on the Blaze plan, not Spark.**
Three parts of this design turned out to need billing enabled, see Section
15 for the full reasoning and the cost protections that come with it:
- Cloud Storage (Section 11.9's history transfers) has required Blaze
  since February 3, 2026; a Spark project can't reach any bucket.
- Firestore TTL deletes (Sections 11.4, 11.5, 11.9) are listed by Google
  among the features that "don't include free usage. You must enable
  billing to use these features."
- FCM can only be sent from a trusted server holding a service-account
  credential, so push notifications need Cloud Functions, which also
  require Blaze. Functions use Firestore/RTDB triggers ("a message was
  written, notify the group"), which is why they live in Firebase rather
  than on the web host.

Blaze keeps every Spark free quota, so expected cost is still $0 at
realistic scale. Blaze also raises RTDB's simultaneous-connection limit
from Spark's 100 to 200,000.

**Pros**
- No server to build, host, patch, or scale ourselves. The only server
  code is a few small Cloud Functions (push sends, the billing cutoff),
  run and scaled by Firebase.
- FCM solves push notifications outright, something no P2P/relay-of-our-
  own design could ever do, since waking a closed app requires the OS's
  own push service.
- Firestore/RTDB client SDKs include offline caching and automatic
  reconnect/resync, which replaces most of what a hand-built local-first
  sync layer would otherwise require.
- Firebase's free quotas (kept on Blaze) comfortably cover this app's
  realistic scale (see Section 5's chat cost discussion).

**Cons**
- Abandons the original "no third-party server in the data path at all"
  goal: Google's infrastructure does see encrypted-but-present traffic,
  even if it's designed not to retain it.
- Vendor lock-in: the data model, security rules, and sync patterns are
  fairly Firebase-specific, migrating off it later would be a real
  rewrite, not a config change.
- Correctness now depends on Firestore/RTDB security rules being written
  right; a misconfigured rule is a real, easy-to-miss vulnerability
  class this design didn't have to think about under pure P2P.
- Cost is only "free" at the scale currently expected. Blaze has no
  built-in spending cap, so a viral spike or abuse would bill past the
  free quotas instead of stopping; Section 15's budget alerts and
  automatic billing cutoff are the mitigation.

---

## 4. Data Storage Map

| Data | Service | Shape |
|---|---|---|
| Group metadata (creator, name, etc.) | Firestore | `/groups/{groupId}` |
| User identity (public key) | Firestore | `/users/{uid}`, fetchable by UID by anyone signed in |
| User account (memberships, paid flag) | Firestore | `/accounts/{uid}`, readable only by its owner |
| Notices (what happened while away) | Firestore | `/accounts/{uid}/notices/{noticeId}`, readable and dismissable only by its owner, written only by Cloud Functions |
| Group membership | Firestore | Subcollection `/groups/{groupId}/members/{uid}` |
| Profile photos | Cloud Storage | `avatars/{groupId}/{uid}`, one encrypted copy of a member's photo in each group, named on the membership; see Section 21 |
| Removed-member blocklist | Firestore | `/groups/{groupId}.removedUids` (or subcollection) |
| Invite token | Firestore | `/invites/{token} → { groupId }`, one active token per group |
| Events | Firestore | Under the owning group |
| Notes / task-assignments | Firestore | Under the owning event; single-owner field per claimable item |
| Event photos | Firestore and Cloud Storage | Each photo's encrypted thumbnail in a doc under the owning event, its encrypted full photo in Storage; see Section 20 |
| Chat messages | RTDB | Under the owning conversation, each with a waiting-on list of who hasn't received it yet; see Sections 5 and 11.7 |
| Membership mirror | RTDB | `/mirrors/{conversationId}`, written only by a Cloud Function, so the RTDB rules can check membership; see Section 11.7 |
| Live location | Firestore | One doc per user per group, TTL-expired; see Section 11.4 for why this moved off RTDB |
| Presence | RTDB | Standard `onDisconnect()` pattern |
| Push token | Firestore | `/accounts/{uid}/pushToken/current`, the identity's one phone, written and read only by its owner; see Section 11.1 |
| Ownership claim record | Firestore | `/groups/{groupId}/ownerClaim/current`, read and written only by Cloud Functions; see Section 18 |
| Handled payment deliveries | Firestore | `/polarEvents/{webhookId}`, read and written only by the purchase webhook, expiring a day later; see Section 18 |

**Full field-level schema is in Section 11.**

**Pros**
- Billing model matches access pattern: Firestore's per-operation cost is
  avoided for the fan-out-heavy data (chat) by keeping it in RTDB
  instead, while Firestore's native TTL auto-deletion is used for
  location, which has no fan-out cost problem to begin with.
- Firestore's real querying is used exactly where it's actually needed
  (events, notes, membership), rather than forcing everything into one
  database's constraints.
- RTDB's built-in `onDisconnect()` primitive fits presence naturally,
  without hand-rolled heartbeat logic.

**Cons**
- Two databases means two SDKs, two security-rule languages, and two
  places a bug can hide, more surface area than a single-database design.
- Anything that needs to correlate data across the split (e.g. a unified
  activity feed mixing chat and note updates) requires querying both
  services and merging client-side, there's no single query that spans
  them.
- RTDB is Firebase's older, less actively developed product compared to
  Firestore; long-term feature parity/investment from Google isn't
  guaranteed to stay even between the two.

---

## 5. Data Retention & Deletion Policies

### Location
- Not an append-only log: each update **overwrites** the previous value.
- Deleted on an inactivity timer: an hour after its last update (decided
  2026-10-28), which covers a drive with the phone locked and a fresh
  update on arrival.
- Always deleted at event-end, regardless of timer state.
- Sharing opens 3 hours before an event starts (decided 2026-10-28), for
  getting ready and the trip there, and never earlier.
- Throttled client-side by time-since-last-update **and** distance moved
  (whichever threshold is hit first), not a fixed-interval ping, to keep
  bandwidth/battery cost down: an update every 2 minutes or every 100
  meters, and never more than every 15 seconds (decided 2026-10-29). Opening
  the app and arriving always send a fresh fix.

**Pros**: minimal storage footprint, minimal privacy exposure (no
location history ever accumulates server-side), simple mental model with
no delivery/sync-confirmation logic needed at all.
**Cons**: no location history is retained, so a "here's the route
everyone took" or past-position feature is impossible without a
redesign; correctness relies on the timer/event-end cleanup actually
firing (a missed cleanup leaves stale data sitting until the next one
does).

### Events & Notes
- Deleted once the event is over.
- **Resolved**: 48-hour grace period before deletion, so people can
  still review "who brought what" for a bit afterward, chosen as a
  middle ground between practical concerns (out-of-town attendees who
  won't reopen the app until they're home, no recovery path for
  events/notes the way chat has via Section 11.9's history-sync) and
  staying consistent with this design's overall minimal-retention
  philosophy.
- **Places stay on each device** (decided 2026-11-07): so the event form
  can suggest where a group has met before, each member's device keeps the
  places of the group's events it has seen, and only the places, the most
  recent 20 per group, in IndexedDB. Nothing about them reaches the server
  or any outside service, and they're removed when the member leaves, is
  removed, or the group is deleted, and with the rest of the device's data.

**Pros**: bounded, predictable storage growth; matches the natural
lifecycle of the data (nobody needs an event's logistics once it's
happened and reviewed); still gives a short post-event window rather
than deleting instantly; 48 hours specifically covers the "just got
home from travel" case reasonably well without drifting toward a
retention window that feels inconsistent with the rest of the app.
**Cons**: no long-term archive, users can't look back at a past event
("remember what we did for that trip last year") once the grace period
elapses; unlike chat, there's no recovery mechanism if 48 hours turns
out to be too short for a given group, once it's gone, it's gone.

### Photos
- Deleted from the server with their event, 48 hours after it ends, and
  kept on a device only until then unless the member saves them; see
  Section 20.

### Profile photos
- Deleted from a group with the membership, and removed from every group
  when the member removes it; see Section 21.

### Chat
Strictly sync-based, not time-based, with these refinements:
- A message's "has everyone received this" check reads its waiting-on
  list (`waitingOn`, Section 11.7), filled at send time with every other
  member, so a member who joins later is never waited on. Each member
  takes themselves off the list once their device has the message, and a
  member who leaves or is removed is taken off by anyone, so they can't
  block cleanup after they're gone.
- **Multi-device is explicitly out of scope** (see Section 8): the app
  is single-device per user, so "delivered" means delivered to that one
  device, no cross-device history backfill is attempted.
- A safety-valve max-retention TTL exists as a backstop for a message
  stuck waiting on a member whose device never comes back online
  (uninstalled, abandoned). **Resolved**: defaults to 30 days, and is a
  per-group setting the owner can adjust between a 7-day floor and a
  180-day ceiling, rather than one fixed global number. Stored as
  `chatTtlDays` on `/groups/{groupId}` (Section 11.2), checked by every
  client's own opportunistic cleanup sweep (Section 11.7) against that
  group's configured value instead of a hardcoded constant. Changing it
  only affects future enforcement, it doesn't retroactively rescue
  anything already deleted under a prior value.
  - **Why 30, not something higher**: the risk of being "too
    aggressive" is softened by the `recovery` history-sync path (Section
    11.9), a message deleted before a genuinely-infrequent user saw it
    isn't lost forever, it just now requires an explicit ask instead of
    silent resync. That safety net makes leaning toward the more
    privacy-protective default the right call.
  - **Why a 7-day floor**: below that, the safety valve stops being a
    backstop behind normal sync and starts racing ahead of it, firing
    for perfectly ordinary groups where people simply don't open the app
    daily, defeating the point of trying "wait for everyone to sync"
    first at all.
  - **Why a 180-day ceiling**: generous enough to serve a genuinely
    low-frequency group (e.g. one used only for an annual event, dormant
    the rest of the year) without stretching toward "basically a year,"
    which would undercut the minimal-retention story this design is
    built around even as an opt-in maximum. A group that's truly
    annual-only can still function at 180 days, just occasionally
    needing a `recovery` request for anything older, an acceptable
    tradeoff for that edge case rather than a reason to raise the
    global ceiling.
  - Kept as an advanced/optional group setting rather than a prominent
    choice at group creation, most groups never need to touch it.
- The user's own device retains full local chat history indefinitely
  (IndexedDB) once synced; the server never holds history long-term,
  the client does. This is what makes chat feel persistent for recurring
  users despite the server-side transience.

**Pros**: no indefinite server-side retention regardless of how long a
group stays active, which is the actual privacy goal; naturally serves
both a one-event-only user (their unsynced messages stop mattering the
moment they leave) and a long-term recurring user (their own device
keeps full history); avoids per-operation cost blowup by not keeping a
permanent server-side archive at all.
**Cons**: meaningfully more implementation complexity than a simple
time-based expiry (delivery tracking, a membership mirror, transaction-safe
deletion); an inactive-but-still-a-member device can delay cleanup of a
message until the TTL backstop kicks in; a user who loses their device
without linking a recovery credential loses their entire local history
with no server-side copy to fall back on, by design, but worth being
clear-eyed that this is a real, occasionally painful consequence for
users of the "don't retain data" choice.

---

## 6. Encryption Model

Explicitly **not** end-to-end (no per-device key verification, no
ratcheting, no multi-device key exchange ceremony): the goal is
"not sent/stored in the clear," not defense against a compromised group
member or full metadata privacy.

- Transport encryption is automatic (TLS/WSS to Firebase).
- App-level: content (chat text, note contents, location coordinates) is
  encrypted client-side with a **per-group symmetric key** (WebCrypto
  AES-GCM) before being written to Firestore/RTDB, so Firebase itself
  only ever sees ciphertext for actual content.
- The group key is generated once per group and wrapped individually for
  each member using their own public key (WebCrypto ECDH) when they
  join, by the member who approves the join (Section 17), so Firebase
  never sees an unwrapped key either.
- Only routing metadata (sender UID, timestamps, group ID) stays
  plaintext, since Firestore/RTDB need it to route/query.
- **Formats (decided 2026-10-25)**: the ECDH curve is P-256, and every
  binary value (a public key, an IV, ciphertext, a wrapped key) is stored
  as Firestore bytes rather than text, so the security rules can check its
  exact size. A public key is the raw 65-byte point WebCrypto exports. A
  wrapped group key is one opaque bytes field of at most 256 bytes. An
  AES-GCM IV is 12 bytes.
- **Wrapping a group key** (decided 2026-10-28, `src/platform/crypto.ts`):
  each wrap uses a one-time key. The wrapper makes a throwaway ECDH P-256
  pair, derives a key-wrapping key from its private half and the member's
  published public key through HKDF-SHA-256, bound to both public keys,
  and wraps the group key with AES-KW. The member document stores the
  throwaway public key followed by the wrapped key, 105 bytes. Unwrapping
  needs only the member's own private key, so a wrap keeps working whoever
  made it and whatever later happens to their key. The group key itself is
  AES-GCM, 256 bits, with a fresh random IV for every encryption.
- **A recovered member gets each key shared again** (decided 2026-10-29,
  `src/state/key-share.ts`): a member recovered onto a new phone (Section
  8) has a new key pair, so the wrap made for the old phone won't open.
  Loading the group's key then stamps a key request on their membership
  (`keyRequestedAt`), which pushes every other member, and any member
  holding the key answers it the way an approval wraps one: they wrap the
  key for the member's newly published public key, replacing the old wrap
  and ending the request in one write. The member's own device watches its
  membership, and once the request ends with the membership still there,
  the group's open section loads again, so the key's arrival needs no
  reload. The member's own old device can answer too (decided 2026-11-10):
  each device keeps its own copy of a group's key once it has unwrapped it,
  so a device the member still has can share it, from the screen it shows
  once it has stepped back (Section 8), which lists every group the new
  device is waiting on with one button sharing them all. Replacing the wrap
  doesn't touch that device's own copy, so it can still take the identity
  back later and read the group. The push reaches only the identity's
  newest device, so the old device shows the request once it's opened. The
  rules
  let a member file only their own request, at the server's time, and let
  any member answer it, themselves included, with a new wrap, and only
  while it stands, so nobody can spoil a wrap that works. A member who
  ends their own request with a bad wrap spoils only their own copy, and
  can ask again. A member who's the only one in a group, with no other
  device holding its key, has nobody to ask (Section 12).
- **Group keys stay extractable** (decided 2026-10-28): any member may
  approve a join and wrap the group key for the joiner (Section 17), and
  WebCrypto only wraps an extractable key, so a member's copy of a group
  key can be read by script on their device. The identity's ECDH private
  key, which every wrap for this member depends on, is the one key kept
  non-extractable.

**Pros**
- Firebase itself can never read actual content, satisfying "not sent in
  the clear" without the complexity of true E2E.
- Avoids the UX and engineering weight of E2E key-verification ceremonies
  and cross-device key management, both of which the app has already
  chosen not to need (single-device, no signup).
- Uses well-vetted, browser-native primitives (WebCrypto AES-GCM, ECDH)
  rather than a hand-rolled crypto scheme.

**Cons**
- No protection against a compromised or malicious group member, anyone
  with the group key can read everything, and there's no per-message
  forward secrecy if a key is ever exposed.
- Group-key wrapping per member adds real implementation surface (key
  generation, per-member wrapping on join, safe local key storage) that
  a plain "just use TLS" approach wouldn't need.
- Risks creating a false sense of security if not communicated carefully
  since it resembles E2E on the surface without offering its guarantees,
  user-facing copy needs to be honest about exactly what this does and
  doesn't protect against.

---

## 7. Concurrency Handling

Claim-style data (dish assignments, task assignments, RSVP slots) is
modeled as a single record with **one owner field**, mutated via a
Firestore/RTDB transaction (compare-and-swap), not a full-document
overwrite from client-cached state. Two people claiming the same thing
at once results in one transaction succeeding and the other being
rejected and shown a "someone already claimed that" message, rather than
one silently overwriting the other.

A real CRDT library (Yjs/Automerge) was considered and explicitly not
adopted, since it would only be needed for live simultaneous free-text
co-editing, which isn't a planned feature. If that changes, this
decision should be revisited.

**Removed-member handling for existing claims**: if a member who claimed
something is later removed from the group, their claim is **left in
place**, not auto-cleared, attributed to something like "removed user"
in place of their name. Any member can reassign or release it (Section 11.5).

**Pros**
- Prevents real, silent data loss (two people stomping the same claim)
  without needing a heavyweight library.
- Transactions are a native, well-tested primitive in both Firestore and
  RTDB, with no extra dependency, no custom conflict-resolution logic.
- Simple mental model for both engineering and UX: you either got it, or
  someone beat you to it.

**Cons**
- Doesn't extend to real simultaneous free-text co-editing; that would
  need a CRDT library added later if ever wanted, a genuinely different
  piece of infrastructure, not an incremental extension of this one.
- Transaction retries under contention add a small amount of latency and
  failure-handling complexity the client has to surface gracefully
  (a rejected claim can't just fail silently, it needs a clear UI
  response).

---

## 8. Authentication & User Identity

- **No signup required.** Firebase Anonymous Authentication
  (`signInAnonymously()`) generates a random UID per device with no
  user-provided credential, at the first group action rather than on page
  load (Section 16), together with the device's key pair (Section 14).
- **Single-device by design**: no multi-device sync is attempted or
  promised. The anonymous identity lives entirely in that browser's
  local storage; it's not portable on its own.
- **Passkeys were considered and rejected**: not a first-class Firebase
  Auth provider (would require a custom Cloud Function + WebAuthn
  verification), and platform passkeys sync across a user's own devices
  by default, which is in tension with the single-device model anyway.
- **Recovery / "I got a new phone" case**: an optional, opt-in
  `linkWithCredential()` call attaches a real credential (email/password,
  or a Google/Apple sign-in) to the existing anonymous UID. This
  preserves the same UID and all group memberships on a new device, using
  Firebase's supported linking mechanism, no custom backend required.
  - **How recovery runs** (decided 2026-10-29, `src/state/identity.ts`):
    linking and recovery each start from the person's tap and go through
    Google's sign-in popup. On the new phone, signing in with Google brings
    the identity back, then the bootstrap makes that phone's key pair and
    publishes it, and each group's key waits for a member to share it
    (Section 6). Recovery refuses, before signing in, on a phone whose own
    identity already belongs to a group, since those groups would be
    stranded. A Google account linked to no identity simply becomes a new
    identity, linked from the start. The bootstrap publishes only a key
    pair it has just made, so an old phone still signed in to the
    identity never takes the published key back from the newer one. A
    Google account linked to one identity can't be linked to another.
    A popup the browser blocks falls back to Google's full-page redirect
    (decided 2026-11-10, `src/state/google-redirect.ts`): an installed app on
    Android blocked the link's popup, opened after Firebase loaded its
    sign-in helper and the app checked the server, so a blocked popup notes
    which sign-in it was in session storage and leaves for Google's page,
    which no blocker can stop. A link returns to the group's Settings, which
    announces how it went; a recovery returns to the root, where the screen
    host makes the device's key pair and opens the groups, and the landing
    page or the welcome announces a refusal. The tests run the redirect in
    Chromium and Firefox; WebKit can't read it back in the emulator, whose
    sign-in page sits on another site, while the real site serves it through
    its own domain. Whether the popup, or the redirect, works in an
    installed iOS app is still checked on a real phone against staging.
  - **One active device at a time** (decided 2026-11-10,
    `src/state/identity.ts` and `src/screens/moved.tsx`): the identity has one
    published public key, one wrap per group, one push token, and a chat that
    waits on members rather than devices, so it's used on one device at a
    time, and the device whose key is published is the active one. Every
    device signed in to the identity watches the published key, and once a
    recovery publishes another device's, the older device steps back: the
    screen host shows "Come Hang is open on another device" in place of every
    other screen, which lists the groups whose key the new device is waiting
    on and this device holds, with one button sharing them all (Section 6),
    and offers "Use Come Hang here instead", which publishes this device's
    key again, so the other device steps back in turn. A device that steps
    back releases the identity's push token while it's still its own and
    ends any location sharing it was running, and the active device refreshes
    the token each time the app opens. Using one identity on several devices
    at once, as linked devices, would need a key pair, wrap, and push token
    per device and a chat that waits on devices, which is recorded as open
    (Section 13).
  - Raw credential/token export (e.g. a backup file containing the
    Firebase refresh token) was explicitly rejected: not a supported
    recovery path, relies on undocumented internals, and creates a
    single indefinite-lifetime bearer secret with no revocation story if
    it leaks. Linking a real credential achieves the same outcome more
    safely.
  - **Must be communicated clearly to users**: linking a recovery
    credential restores *identity and group membership only*, not chat
    history. Under the sync-based chat deletion policy, history is
    already gone from the server once it synced to the original device.
    A follow-up step can recover the history itself too, not just
    identity: once relinked, the user can send a history-sync request to
    a fellow current member whose device still has it cached, see
    Section 11.9. Not automatic, and not guaranteed (it depends on
    another member still having and choosing to share it), but it closes
    most of this gap rather than leaving history loss as a hard,
    permanent consequence of every device change.
  - **Resolved**: Google sign-in only for v1. It needs no
    password-hygiene UX (no form, no forgot-password flow, no password-
    strength policy to configure) and no recurring cost (unlike Apple
    sign-in for web, which requires a paid Apple Developer Program
    membership and periodic manual secret rotation just to enable it on
    a PWA with no App Store presence). Both deferred as later additions,
    not rejected outright:
    - **Apple sign-in**: revisit if/when this ever becomes a native
      (e.g. Capacitor-wrapped) app, at which point the Developer account
      cost is already being paid for anyway, so it stops being an
      incremental cost specific to this feature.
    - **Email/password**: genuinely zero new infrastructure whenever
      it's added, Firebase Auth already stores and hashes linked
      credentials in its own managed user records, the same store
      anonymous and Google identities already live in, no new database
      or collection required. The cost is UI (a form instead of a
      button) and a bit more security surface (a weak user-chosen
      password is now this app's problem in a way Google's own account
      security isn't), not infrastructure. Worth adding once it's clear
      Google alone isn't covering everyone who wants to link a recovery
      credential.
- **Unused identities are cleaned up** (decided 2026-11-04, built as
  `ideCleFun` in `functions/src/identity-cleanup.ts`): a phone wiped or
  lost without deleting its data leaves its identity behind, its account,
  public key, and Auth record. A scheduled function runs once a day at
  09:00 UTC, an hour after the daily run (Section 18), and deletes each
  identity whose Auth record hasn't been refreshed for 180 days, which the
  app does at least hourly while it's open, falling back to its last
  sign-in when it never refreshed. Only an identity in no group is
  deleted, and never one that bought the upgrade or has a Google account
  linked, since a linked identity can still be recovered and a purchase is
  never thrown away. 180 days is well past every other limit (join
  requests 7 days, notices 30, push tokens 60), so nothing is left under
  the account by then. The account is checked and deleted in a
  transaction, so a group joined since the run began keeps the identity,
  then the rest goes the way the end of deleting one's data does (Section
  14). A phone that comes back finds its sign-in gone, since Auth checks a
  restored sign-in with the server as it starts, and quietly becomes a new
  identity, with nothing lost, having been in no group.

**Pros**
- Zero-friction onboarding, no signup screen at all, which matches the
  casual, drop-in nature of the app well.
- Firebase manages the actual credential security; no custom
  password/token scheme to invent, store, or get wrong.
- Recovery remains fully opt-in, users who never care about losing a
  device pay no UX cost for a feature they don't need.

**Cons**
- Zero account recovery unless the user proactively opts into linking,
  many users won't, and will simply lose everything if their device is
  lost, reset, or has its storage cleared.
- No cross-device support at all, even for a user who wants to use the
  app on both a phone and a laptop.
- Anonymous identity is trivially regenerable, which directly enables
  the ban-bypass limitation documented in Section 9, this is a structural
  tradeoff of "no signup," not a fixable bug.

---

## 9. Group Invite & Membership System

- **One shared, reusable link per group**, not a unique link per invitee.
  Matches how people actually organize a get-together (post one link
  into an existing group chat, let people trickle in), rather than
  requiring a finalized guest list up front.
- Data shape: `/invites/{token} → { groupId }`. The link is a disposable
  pointer, entirely separate from the group's own data, so regenerating it
  never touches the group document, membership list, chat, notes, or
  events, all of which are keyed to `groupId`, not to any token.
- The link is open-ended (multi-redeem, valid until revoked), not
  single-use.
- The creator can revoke/regenerate the link at any time, independent of
  any removal action, for cases like the link being over-shared. A
  rotation is one batch (decided 2026-10-26): the group names a new token,
  the new invite is created, and the old one is deleted. Only the creator
  may delete an invite, and never the one the group currently names, so a
  group always has exactly one working link.
- **Throughout this doc, "creator" means the group's current owner**
  (`ownerUid`), which starts as the person who created it and can change
  through an ownership transfer (Section 18).
- **The creator can remove any individual member at any time**, gated by
  a security rule restricting this action to the group creator, but never
  themselves. Every other member can always remove themselves (leave), in
  one batch that deletes their membership, drops the group from their
  `/accounts/{uid}` member map, and lowers `memberCount` with `countedUid` set to
  them (decided 2026-10-26). The creator leaves only by transferring the
  group first (Section 18).
- **Removal always rotates the invite link** (decided over the
  simpler "only rotate if you want to" alternative, accepting the added
  friction deliberately): the creator is shown a warning before
  confirming removal (e.g. "Removing this user will also invalidate the
  group link. Anyone with a link who hasn't joined yet will need the new
  one."), and the newly generated link is surfaced immediately after so
  it can be re-shared with anyone still pending.
- **Removed-UID blocklist kept as defense-in-depth alongside rotation**:
  `removedUids` on the group blocks that specific identity from
  redeeming *any* link for that group (old or newly rotated), covering
  the case where the new link reaches them through some indirect route
  (e.g. someone else re-shares it into a channel the removed person still
  sees).
- The full removal operation (remove from members, drop the group from
  the removed member's `/accounts/{uid}` member map, lower `memberCount` by one
  with `countedUid` set to the removed member,
  add to `removedUids`, deactivate old invite doc, create new invite doc)
  is bundled as a **single Firestore transaction**, so a partial failure
  can't leave the group in an inconsistent state.
- **The removed member is told** (decided 2026-10-26): a Cloud Function
  watching group updates sees a UID join `removedUids` as the count falls
  for that same UID, which only a removal does, and leaves the removed
  member a notice (Section 11.1) plus a push, so the group doesn't just
  vanish from their list. A member who leaves on their own gets neither.
  Built 2026-10-28 as `groChaFun` in `functions/src/group-changes.ts`, a
  trigger on every group update that also handles the end of an ownership
  offer (Section 18), and sends the push once the notice has landed.
- **Deleting a group** (decided 2026-10-26): only the owner can, after a
  confirmation naming the group, through a callable Cloud Function rather
  than a client batch, since a big group's documents won't fit one batch.
  The function deletes the group, its member docs, events, join requests,
  chat, and invite, drops it from every member's `/accounts/{uid}` maps,
  and leaves every other member a notice saying the owner deleted it, with
  a push. No client rule allows deleting a group document. The function
  works in batches and finishes the job if it's retried, so a failure
  partway is completed rather than left half done, and the group stops
  being readable to anyone as soon as its first batch lands. Built
  2026-10-28 as `delGroFun` in `functions/src/group-deletion.ts`, called
  with `{ groupId }`: it refuses a caller with no sign-in, an ID that isn't
  in Firestore's own ID form (so it can't name another path), and anyone
  but the owner, and does nothing once the group document is gone. Its
  first batch deletes every member doc, frees every account's slot, writes
  the notices, and deletes the working invite. Then go the group's other
  collections, its chat, presence, and mirror, and its history transfers,
  and the group document goes last, so a retry still passes the owner
  check. Each member's push goes out once the first batch has landed.
- **Known, accepted limitation**: a removed user can bypass the
  `removedUids` block by clearing local app data (or opening the link in
  a different browser), which mints a brand-new anonymous UID never on
  the blocklist. This is an inherent consequence of anonymous,
  freely-regenerable identity, not a fixable bug: a durable ban requires
  a non-anonymous identity, which conflicts with the no-signup goal.
  Link rotation on every removal mitigates the realistic version of this
  (rejoining with the link they already had); it does not make bans
  airtight against a determined user. Accepted as a reasonable tradeoff
  given the app's casual, low-stakes social context.

**Pros**
- Matches natural, low-friction real-world invite behavior, one link,
  shared however's convenient, no need to know the full guest list
  upfront.
- Simple data model, one active token per group, easy to reason about and
  cheap to implement.
- Rotation-on-removal closes the obvious, most-likely bypass (rejoining
  with the link they already had) outright, not just partially.
- The blocklist adds real defense-in-depth for a leaked-new-link scenario
  at essentially no extra engineering cost.

**Cons**
- No per-person invite tracking: a single shared link can't say who it
  was sent to. Pending join requests are visible (Section 17), but not
  who has the link and hasn't used it yet.
- Every join waits for a member's approval (Section 17), so a newcomer
  can't get in while no member is around to let them in.
- Rotation-on-removal creates real, deliberately-accepted friction: every
  removal invalidates the link for anyone still mid-invite, requiring
  the creator to notice and re-share the new one.
- The anonymous-identity ban bypass (Section 8) remains possible even
  with rotation, it only meaningfully raises the bar, it doesn't close
  the gap entirely.

---

## 10. Location Sharing Design

- Opt-in per event, not an always-on background feature.
- **No reliable background location on either platform**: this is an OS
  platform restriction, not something solvable via PWA architecture:
  - **iOS**: no background geolocation capability for web content at
    all, installed PWA or not. WebKit suspends JS execution for a
    backgrounded/locked-screen tab; there's no web-exposed equivalent to
    native `CoreLocation` background modes.
  - **Android**: partially better but still unreliable: Chrome throttles
    background tabs, OS-level Doze/App Standby restrict further, and many
    OEMs' battery managers kill background web content aggressively. No
    dedicated background-geolocation API exists for web content.
  - Getting genuinely reliable background location on both platforms
    would require a native (or Capacitor-wrapped hybrid) app. **Decision:
    stay PWA-only**, and design the UX around the limitation instead of
    building native.
- **UX approach chosen**:
  - Continuous foreground tracking (`watchPosition()`, throttled by
    time/distance) for users willing to keep the app open and screen on.
    While a member shares for the open event and the Map section shows,
    the app keeps the screen on through the Screen Wake Lock API (decided
    2026-11-11, `src/ui/wake-lock.ts`), asking again each time the app
    comes back into view, since the browser drops the lock while it's
    hidden, and releasing it on leaving the Map or stopping. The lock only
    holds while the app shows, so it can't drain a battery in the
    background, and the Permissions-Policy header allows it to the app's
    own origin (`screen-wake-lock=(self)`), which had turned it off.
  - Automatic one-shot location update on every app foreground/open,
    via the Page Visibility API (`visibilitychange`), so simply opening
    the app periodically updates location with no extra action needed.
  - An explicit "I've arrived" action: a one-shot location fix plus a
    distinct status flag (e.g. an "Arrived" badge), separate from the
    ambient live-location display. The flag is encrypted with the position
    (decided 2026-10-28), so Firebase can't tell who has arrived.
  - **Leaving and arriving post to the chat** (decided 2026-10-29): an
    "I'm on my way" button and the "I've arrived" action each post a short
    status line to the group's chat ("Sam is on the way", "Dana arrived"),
    so the group sees it without opening the map. Only those two do: the
    ambient position updates never post, so the chat isn't flooded. Leaving
    is a tap, never detected, since the app can't watch a phone's position
    in the background (above). A status post is an ordinary chat message
    whose kind is marked inside its encryption (Section 11.7), so Firebase
    can't tell it from any other message. The chat shows each one as a line
    of its own beside the member's color, naming "You" for the member's own
    (built 2026-11-02).
  - **No street map is drawn** (decided 2026-11-02): a street map needs
    tiles from another site, and every tile request tells that site roughly
    where someone is looking, which would undo keeping positions where
    Firebase can't read them. The Map section draws everyone sharing around
    the member instead, north up, the farthest on a ring whose distance the
    caption gives, and lists each member's distance and compass direction,
    how old their position is, an Arrived badge, and a link that opens their
    spot in Google Maps, so a position reaches another site only when a
    member asks. A street map can still come later, from a tile host the
    group trusts.
  - Every displayed location shows a staleness timestamp ("updated 6 min
    ago") so an old ping is never presented as if it were live.
  - Users are told plainly, at the point they enable sharing, that
    continuous updates require the screen to stay on and the app
    visible, and that otherwise the app will update on open or on
    arrival.

**Pros**
- No native app development/distribution overhead at all, no Apple
  Developer account, no App Store review, no separate native codebase to
  maintain alongside the web app.
- Fully honest UX, staleness is always visible, so the feature never
  silently misleads anyone about how current a location actually is.
- Reuses the same web codebase and Firebase/RTDB plumbing already built
  for everything else, no separate sync mechanism needed just for this
  feature.

**Cons**
- No reliable continuous background tracking on either platform, the
  "live dot moving on a map the whole drive" experience a native app
  like Life360 offers isn't achievable here.
- Realistic behavior for most users will default to periodic/arrival-only
  updates rather than continuous, even for users who intend to keep the
  app open, since locking the phone screen suspends it just the same as
  backgrounding.
- If reliable continuous background tracking ever becomes a hard
  requirement later, it would force revisiting the PWA-only decision
  entirely (Capacitor wrapper or native rewrite), this isn't something
  that can be incrementally improved within the PWA model.
- Without a street map in the app, finding someone among streets takes a
  tap out to Google Maps, which then learns that one position.

---

## 11. Data Model

Reviewed and approved (2026-10-22). Field names ending in `Enc` store ciphertext;
every such field has a sibling `Iv` field (or a shared `iv` on the same
document) holding the AES-GCM initialization vector needed to decrypt
it. The IV isn't secret, it's just required alongside the ciphertext.
A field with no `Enc` suffix is intentionally plaintext, either because
it's routing/query metadata (Section 6's principle) or because it's
inherently public (a public key).

### 11.1 Firestore: `/users/{uid}` and `/accounts/{uid}`

Two docs per anonymous identity, both created on first sign-in. They're
split by who may read them (decided 2026-10-25): an approving member has
to fetch a joiner's public key, but nobody but its owner should see which
groups a person belongs to or whether they've paid.

`/users/{uid}`, the public half. Anyone signed in may fetch one doc by its
UID (`get`), never list the collection, and only its owner may write it.

| Field | Type | Notes |
|---|---|---|
| `publicKey` | plaintext bytes | This user's ECDH P-256 public key, the raw 65-byte point (Section 6), used by others to wrap a group key for them on join. Can't be encrypted: there is nothing to encrypt it with yet. |
| `createdAt` | plaintext | Timestamp. |

`/accounts/{uid}`, the private half, readable only by its owner. The rules
read it to enforce Section 18's caps (a rule's own lookups ignore read
permissions), and a client can update one entry of a map without
reading the doc first, which is how an approver adds a joiner's group.
The groups sit in two maps, owned and member, rather than one map of
roles (decided 2026-10-26), so a change of role moves a key from one map
to the other, which the rules can name and check, where a changed value
in one map can't be traced to its group.

| Field | Type | Notes |
|---|---|---|
| `ownedGroups` | plaintext map `{ groupId: true }` | Every group this user owns. Changed in the same batch as every create and transfer (Section 18). |
| `memberGroups` | plaintext map `{ groupId: true }` | Every group this user belongs to without owning it, so a group sits in one map or the other, never both. Changed in the same batch as every join, leave, removal, and transfer (Section 18). |
| `paid` | plaintext boolean, absent until bought | Written only by the Polar webhook's Cloud Function, never by a client (Section 18). |

`/accounts/{uid}/notices/{noticeId}` (decided 2026-10-26) holds what
happened to someone while they were away, so a group never just vanishes
or changes hands silently: the app shows each waiting notice as a message
in a sheet when it next opens, or at once while it's open, alongside the
push that went out when it happened, and seeing it dismisses it by deleting
it (Section 14). Only Cloud Functions write
notices, which the rules enforce by allowing clients no writes, so a
member can't forge one telling someone a group was deleted. Kinds: a group
deleted (`groupDeleted`), a removal (`removed`), an ownership offer
accepted (`offerAccepted`), declined (`offerDeclined`), lapsed
(`offerLapsed`), or ended by the person offered leaving (`offerLeft`), and
ownership claimed from an inactive owner (`ownershipClaimed`), and a group
passed on by an owner who deleted their data (`ownershipPassed`). A notice's
ID is its kind and group, `<kind>-<groupId>` (decided 2026-10-28), so a
retried function writes it once, and a later notice of the same kind about
the same group replaces the earlier one.

| Field | Type | Notes |
|---|---|---|
| `kind` | plaintext | Which of the kinds above this is, picking the message the app shows, such as `groupDeleted`. |
| `groupId` | plaintext | The group it's about, which may no longer exist. |
| `groupName` | plaintext | The group's name when it happened, so a deleted group can still be named. |
| `otherUid` | plaintext, absent when there's none | The other person involved, such as who declined an offer, named in the app from the group's member docs while they're still readable. |
| `createdAt` | plaintext | Timestamp. |
| `expireAt` | plaintext | Firestore TTL field, 30 days out, so a notice never seen doesn't linger. |

`/accounts/{uid}/pushToken/current` (decided 2026-10-28) holds the token FCM
gives the identity's one phone, since the app is one device per person
(Section 8): a new phone's token replaces the old one, and the pushes follow
it. Only the owner reads, writes, or deletes it, and deleting it turns
pushes off. The active device refreshes it each time the app opens
(`pusRefFun`, wired in on 2026-11-10 after it was found never called), and a
device stepping back from the identity deletes it while it's still its own
(`pusRelFun`), so pushes don't reach a device the identity moved away from.

**The app's side** (decided 2026-10-29, `src/state/push.ts` and
`src/platform/messaging.ts`): notifications are turned on from a tap,
since a browser shows its permission prompt only then, and only where the
browser can show pushes, which on iOS means once the app is installed
(Section 16). Once permission is granted the app stores the token and
keeps the choice on the device, so each open refreshes a token that's on
and restores one the server dropped, while turning notifications off in
the app deletes the token, retires it with FCM, and forgets the choice, so
no open turns them back on. Besides Settings, a card above the chat offers
notifications once on a device (decided 2026-11-08,
`src/screens/push-nudge.tsx`): "Want a heads-up when your group's chatting
or plans change?", with "Turn on notifications", "Not now", and "No
pressure, you can always turn them on in Settings." It shows the first
time a group's chat opens where the browser can show notifications and
hasn't been asked, and notifications aren't on, and it stays, visit after
visit, until one of its buttons is pressed, which the device keeps, so it
never returns after. When the person
withdraws the permission in the browser's settings, the next open deletes
the token and turns notifications off. FCM gets the token through the
app's one service worker (Section 14), with the project's public web push
(VAPID) key, which Netlify sets as `VITE_FIREBASE_VAPID_KEY`. There's no
FCM emulator, so development stores a stand-in token of the same form, and
the Functions emulator records what would be pushed to it. A push that
arrives while the app is open and in front goes to the page rather than
the phone's notifications, and the app doesn't show it, since the screens
will show the same activity as it happens. A tap on a push opens where its
news is (built 2026-11-03): each push carries its group's ID and a section
in its data, the chat for messages, People for history, join, and key
requests, and Settings for anything about ownership, while a removal or a
deletion carries none, having no group left to open. The service worker
turns that into an entry address, `/open/<group>/<section>`
(`src/core/push-target.ts`), opens a window there when the app isn't open,
and otherwise sends it the address, which the app follows inside its router
(`src/ui/push-open.ts`), so the screen it was on stays one step back, and
then brings it forward where the browser allows (decided 2026-11-11, since
a refused focus once stopped the address being sent). An installed app on
an iPad that a tap launched opened at its root rather than the address, so
before opening a window the worker also keeps the address, with the time,
in a small IndexedDB database of its own
(`src/platform/push-target-store.ts`), which the app takes as it starts,
once per page, following it when it's under a minute old. IndexedDB holds
it where WebKit's cache storage lost an entry across a reload (measured
2026-11-11). On an iPad the installed app still opens at its group list
after a tap that launches it, even on the version holding this (checked on a
device 2026-11-11), while the same tap works elsewhere and with the app
already open, so it's accepted as a limit of iPadOS's installed apps rather
than chased further.

| Field | Type | Notes |
|---|---|---|
| `token` | plaintext | FCM's registration token, letters, digits, colons, hyphens, and underscores, at most 4,096 characters. |
| `updatedAt` | plaintext | The server's time of the last refresh. The app rewrites the document as it opens, at most once a day, or at once when FCM's token has changed or the document is gone. |
| `chatPushedAt` | plaintext, written by Cloud Functions only | A map from a group's ID to when the member's last chat push for it went, in milliseconds, which holds the next one back for 2 minutes (11.7). A fresh token replaces the document, and the map with it. |
| `expireAt` | plaintext, TTL field | 60 days after the last refresh, as Firebase advises for a token, so a phone that stopped opening the app is dropped. The app sets it by its own clock, so the rules accept 50 to 70 days out. |

**Pushes** (decided 2026-10-28, `functions/src/push.ts`): each one carries
the group's name as its title and a fixed sentence for its kind, never a
message or a display name, since those are encrypted where the server
can't read them. A push for ongoing activity carries a tag, so a newer push
with the same tag replaces it on the phone rather than stacking (decided
2026-10-29), and the join request push's sentence carries its count. Sending is best effort: an identity with no token gets no
push, a failure is logged without undoing the notice beside it, and a
token FCM rejects as no longer registered is deleted, unless the app has
replaced it since. There's no FCM emulator, so under the Functions emulator
each push is written to an `emulatorPushes` collection instead, which the
functions suite reads, and which no rule opens.

Global `displayName` deliberately **not** included here. **Resolved**:
display names are per-group, not global, encrypted per membership, see
11.3, exactly because different groups may know the same person by
different names.

### 11.2 Firestore: `/groups/{groupId}`

| Field | Type | Notes |
|---|---|---|
| `ownerUid` | plaintext | The group's current owner, starting as its creator. Used by security rules for owner-only actions (remove member, revoke/rotate link, rename, chat TTL, transfer). Renamed from `creatorUid` on 2026-10-22, since ownership can now be transferred (Section 18). |
| `pendingOwnerUid` | plaintext, nullable | A member the owner has offered ownership to, until they accept, decline, or the offer is withdrawn or lapses (Section 18). |
| `pendingOfferedAt` | plaintext, nullable | When the standing offer was made, stamped with the server's time, null with no offer. An offer lapses 7 days after it (Section 18). |
| `name` | plaintext | The group's own name. Deliberately not encrypted, see below. At most 50 characters, emoji allowed (Section 11.10). Only the owner renames it (decided 2026-10-27), since it's what invitees see on the invite screen, in one batch that also updates the current invite's copy. |
| `createdAt` | plaintext | Timestamp. |
| `currentInviteToken` | plaintext | Denormalized copy of whichever `/invites/{token}` doc is currently active, so the UI can show/copy the link without a separate query. |
| `removedUids` | plaintext map `{ uid: true }` | Checked by security rules to block redemption by a specific identity; low write-frequency, so a map field (not a subcollection) is fine here. |
| `memberCount` | plaintext number | How many member docs the group has, since rules can't count documents. Moves by exactly one in the same batch as each join, leave, and removal, and the rules check it against the member cap (Section 18). |
| `countedUid` | plaintext | The UID whose join, leave, or removal the last `memberCount` change counted, starting as the creator (decided 2026-10-25). Rules can't see which member doc a batch creates or deletes, so the count may change only when the member doc for this UID is created or deleted in the same batch. Without it, any member could raise the count to the cap and block every join. |
| `chatTtlDays` | plaintext, owner-adjustable | Section 5's chat safety-valve TTL, default 30, clamped between 7 and 180. Read by every client's opportunistic cleanup check (11.7), through the membership mirror there for this group's chat instead of a hardcoded constant. |

**Exception to "encrypt all content"**: the group's own name is the one
piece of content proposed to stay plaintext, not encrypted like
everything else. Reason: an invite screen needs to show *something*
identifying the group before the person has joined and been handed the
wrapped key, if the name were encrypted, there'd be nothing to show
except "you've been invited to a group." A group name is also a much
smaller leak than message content if Firebase can see it. **Resolved**:
confirmed as a deliberate, narrow exception (re-confirmed 2026-10-22).

### 11.3 Firestore: `/groups/{groupId}/members/{uid}` (subcollection)

| Field | Type | Notes |
|---|---|---|
| `joinedAt` | plaintext | Used both for display and to gate chat backlog visibility, through the membership mirror, see 11.7. |
| `wrappedGroupKey` | ciphertext bytes | The group's AES-GCM key, wrapped for this member's public key via ECDH, at most 256 bytes (Section 6). Decrypting this is how a member gets the group key at all. |
| `displayNameEnc` / `iv` | ciphertext bytes | Per-group, not global, chosen deliberately: the same person may want a different name recognized in different groups. Follows the person name limits (Section 11.10), which the app enforces before encrypting, while the rules cap the ciphertext at 136 bytes (40 characters at 3 bytes each, plus the 16-byte tag) and the IV at 12. Written with the membership itself: the creator's as the group is created, and a joiner's by the approving member, who encrypts the name from the join request (Section 17). The rules also accept a membership without one, and the member may change it at any time. |
| `lastActiveAt` | plaintext | Updated at most once a day on app open, by the member alone, and only to the server's time. Used only to let members claim ownership from an owner inactive for 30 days (Section 18). |
| `colorSlot` | plaintext number, 0 to 49 | Which of the 50 member colors this member wears (decided 2026-10-29, built 2026-10-30): written with the membership, as the lowest slot no current member holds, so no two members share a color while the group has room, and kept for as long as they stay, so their color never changes. The creator's is 0. Two approvals at the same moment could pick the same slot, which only means two members share a color, so the rules check the range, a whole number from 0 to 49, and not uniqueness, and refuse any change to it. It reveals nothing beyond the order people joined in, which `joinedAt` already shows. |
| `avatarId` / `avatarIv` / `avatarAt` | plaintext ID, IV bytes, and time, all absent without a photo | The member's profile photo (decided 2026-11-08, Section 21): the 22-character ID every group's copy shares, the 12-byte IV its encrypted file in Storage opens with, and the server's time it was set. Only the member changes them, all three together. |
| `keyRequestedAt` | plaintext, absent unless asking | Set by the member alone, to the server's time, when the wrap won't open on a phone they were recovered onto, and removed by the member who answers by replacing `wrappedGroupKey` (Section 6). |

A subcollection, not a map field on the group doc, specifically so many
members can update their own entry (or be added) without contending on
writes to one shared document, Firestore's write-rate guidance is
per-document, and a shared map field would put every member's write
through the same document.

On removal, this document is deleted outright (not just excluded from
some "active" list), consistent with the "attribute their old claims to
a generic 'removed user'" decision in Section 7, nothing needs to look
up their name after removal, the client just checks "is this UID still
a member" and shows a generic label if not.

### 11.4 Firestore: `/groups/{groupId}/liveLocations/{uid}`

**Revision from the original plan** (which had location in RTDB
alongside chat): moved to Firestore. Reasoning:
- Location writes are one-per-sharer, not fan-out like chat (nobody else
  writes a copy for each recipient), so the RTDB per-operation-cost
  argument that justified moving chat off Firestore never really applied
  to location.
- The "inactivity timer" and "always deleted at event-end" rules from
  Section 5 need *something* to enforce them. RTDB has no TTL feature at
  all. Firestore does (a native TTL policy on a timestamp field,
  documents are auto-deleted once that field's value is in the past,
  usually within ~24h of expiry, not instant, but the UI can stop
  *displaying* an expired/ended entry immediately regardless of when the
  physical delete happens).
- This gets automatic cleanup with zero extra infrastructure and no
  Cloud Function. **Correction (2026-10-22)**: TTL deletes need billing
  enabled, so this relies on the Blaze plan (Section 15). They're billed
  as ordinary deletes, which the free quota of 20,000 a day covers.

| Field | Type | Notes |
|---|---|---|
| `locationEnc` / `iv` | ciphertext bytes | The lat/lng, rounded to 6 decimal places (about 0.1 meters), its accuracy in whole meters, and the "I've arrived" flag, encrypted together as JSON. Safe to encrypt since nothing server-side ever queries into it, all distance/proximity math happens client-side after each member decrypts everyone's current location. The rules cap the ciphertext at 128 bytes, and the IV is 12. |
| `updatedAt` | plaintext | Timestamp, for staleness display in the UI, always the server's own time. |
| `expireAt` | plaintext, TTL field | Refreshed to an hour after each update, or the event's end time if that's sooner. Firestore's TTL policy targets this field. The phone sets it by its own clock, which can't match the server's exactly, so the rules accept any expiry after the server's time, no later than the event's end, and no more than 65 minutes out, an hour plus 5 minutes of allowance for a clock running ahead. A manual "stop sharing" action deletes the doc directly rather than waiting on TTL. |
| `eventId` | plaintext | Which event this share-session belongs to. The rules allow a share only from 3 hours before that event starts until it ends. |

Rules (decided 2026-10-28): a member writes only their own document, keyed
by their UID, so each update overwrites the last and no history builds up.
Members read every shared location. Only the sharer deletes theirs, even
after leaving the group, while a member who has left can no longer update
it. A removed or departed member's last share stays readable to the group
until its own expiry, at most an hour.

**Pros**: automatic, free, zero-infrastructure expiry; real-time reads
work the same as RTDB via `onSnapshot`; no loss of functionality versus
the original RTDB plan.
**Cons**: TTL deletion isn't instant (up to ~24h lag on the physical
delete, though the UI-level cutoff is immediate); one more asymmetry
between the two databases to keep straight (chat and presence are RTDB,
everything else, now including location, is Firestore).

### 11.5 Firestore: `/groups/{groupId}/events/{eventId}` (subcollection)

| Field | Type | Notes |
|---|---|---|
| `detailsEnc` / `iv` | ciphertext bytes | The title, description, and location text encrypted together as one bundle (decided 2026-10-27), so Firebase can't see which parts are filled in or how long each one is. The bundle is the three as JSON, `{"t":"…","d":"…","l":"…"}`, and the rules cap its ciphertext at 2,148 bytes: the 700 characters Section 11.10 allows at 3 bytes each, 32 for the JSON around them, and the 16-byte tag. The IV is 12 bytes. |
| `startAt`, `endAt` | plaintext | Must stay plaintext: the deletion-grace-period query (Section 5) needs to filter/sort on real timestamps, which isn't possible against an opaque ciphertext blob. Same routing-metadata tradeoff already accepted for chat's `sentAt`. An event ends after it starts, lasts at most 7 days, starts at most a year ahead, and can only be created or edited while it hasn't ended yet (decided 2026-10-27), so nothing sits stored for years and a finished event stays as it was for its review window. |
| `createdByUid` | plaintext | Permission checks: any member creates an event, and only its creator or the group's owner edits or deletes it (decided 2026-10-27), so the owner can clean up after a creator who left. |
| `expireAt` | plaintext, TTL field | Exactly `endAt` + 48 hours (Section 5), which the rules check. Same native-TTL mechanism as location, no Cloud Function needed here either. |

Firestore's TTL deletes only the expired document, never its subcollections
(by Firestore's own TTL documentation), so an event's items carry the same
`expireAt` and expire on their own. That also covers an event deleted
without its items: they stay behind, read-only since their event is gone,
until their own TTL removes them.

#### `/groups/{groupId}/events/{eventId}/assignments/{assignmentId}` (subcollection)

| Field | Type | Notes |
|---|---|---|
| `labelEnc` / `iv` | ciphertext bytes | "Bring dessert," etc. At most 50 characters (Section 11.10), so the rules cap the ciphertext at 166 bytes, and the IV is 12. |
| `assignedUid` | plaintext, nullable | The compare-and-swap target for the claim transaction (Section 7). Left as-is (not cleared) if that member is later removed; the client resolves "removed user" by checking current membership (11.3), not by storing a name snapshot here. |

| `expireAt` | plaintext, TTL field | The event's own `expireAt`, which the rules check against the event as each write leaves it. When an event's end moves, the same batch moves every item's `expireAt`, and any member can bring an item that fell out of step back in line. |

An event's photos (Section 20) sit in a `photos` subcollection beside its
items, carrying the same `expireAt`, which a Cloud Function moves with the
event's, and their counts in a `photoTally` subcollection.

**Bring-list lines in the chat** (decided 2026-11-08, built in
`src/state/bring-lines.ts`): adding to a list and claiming from it each post
a status line to the chat, like a photos line (Section 20), such as "Sam
added Chips, Salsa, and 2 more to Picnic's list" and "Sam is bringing Chips
to Picnic". A member's changes to one event's list gather for a minute, the
adds into one line and the claims into another, posting once a minute
passes without another, or as soon as they close the event or switch away
from the app. An item removed, let go, or handed on before its line posts
leaves it, and a claimed item leaves the line about adding it, since
bringing it says it's on the list. A line names the event's ID and title,
how many items, and the first three labels, encrypted like any message, and
a tap opens the event at its list while the event exists. Removing an item
or letting one go posts nothing. The lines are marked `quiet` (11.7), so
they push nobody.

Any member adds or removes an item, claims an open one, and reassigns or
releases anyone's claim (decided 2026-10-27), which is how the group
reassigns a removed member's claims (Section 7). A new assignee has to be a
current member, while an edit that leaves the claim alone keeps a removed
member's claim in place.

### 11.6 Firestore: `/invites/{token}`

| Field | Type | Notes |
|---|---|---|
| `groupId` | plaintext | What this token unlocks. |
| `createdAt` | plaintext | Timestamp. |

Rotation is a delete-and-recreate, not a flag flip, there's never more
than one valid doc for a given group at a time, so redemption is just
"does a doc exist at this token, and is its UID not in that group's
`removedUids`."

**Token strength (decided 2026-10-22)**: the token is 128 random bits
from `crypto.getRandomValues()`, written as 22 base64url characters,
never `Math.random()`, a counter, a timestamp, or anything derived from
the group. Guessing one means searching 2^128 (about 3.4 x 10^38)
possibilities: at a billion guesses a second that's over 10^22 years,
and every guess is a billed, App Check-gated Firestore read (Section 15).
A cryptographic random number has no pattern for AI or math to find; the
only way to learn a token is to be given the link.

**Rules (decided 2026-10-22)**: `/invites/{token}` allows `get` (fetching
one doc whose token you already hold) and never `list` or queries, so
the collection can't be enumerated. Rules can't see a token unless it's
in the path, so the invite screen can't be allowed to read
`/groups/{groupId}` by token. Instead the invite doc carries its own
plaintext copy of the group name, updated in the same batch as every
rename, and `/groups/{groupId}` stays readable by members only. The rules
let only the owner change that copy, only on the invite the group names,
and only to the group's name as the batch leaves it.

| Field | Type | Notes |
|---|---|---|
| `groupName` | plaintext | Denormalized copy of `/groups/{groupId}.name`, for the invite screen. |

### 11.7 RTDB: `/chats/{conversationId}/messages/{messageId}`

Keyed by conversation ID rather than group ID (decided 2026-10-22), so
private messages (Section 19) can reuse this structure later. For now the
only kind of conversation is a group's own chat.

| Field | Type | Notes |
|---|---|---|
| `senderUid` | plaintext | Routing metadata. Always the sender's own UID. |
| `sentAt` | plaintext number | The server's time when it was sent (milliseconds), for ordering, the join-time cutoff, and the TTL safety valve below. |
| `ciphertext` / `iv` | base64 strings | Message content, AES-GCM under the group key. A status post (leaving or arriving, Section 10) marks its kind inside the encrypted content, so the stored fields look the same for every message (decided 2026-10-29): its text is the control character U+0001 followed by its kind, `way` or `arr`, or for a photos or bring-list post (Sections 20 and 11.5) its kind and details, which a typed message can't hold, since the app refuses control characters in one, so a status post is never mistaken for a typed message, and one a member forges is only ever a status line under their own name (built 2026-11-02, `src/core/chat-status.ts`). The IV is 12 bytes (16 base64 characters), and the ciphertext holds 1 to 2,000 characters (Section 11.10) at 3 bytes each plus the 16-byte tag, so at most 8,024 base64 characters. |
| `quiet` | plaintext, `true` or absent | Marks a message that pushes nobody (decided 2026-11-08): a bring-list line (11.5) is news for the chat alone. It reveals only that the message is one of those lines, never what it says. |
| `waitingOn` | plaintext map `{ uid: true }` | Who hasn't received the message yet (decided 2026-10-28, replacing a recipients snapshot plus an acknowledgement map): the sender lists every other member, so a member who joins later is never on it, and each member deletes their own entry once their device has the message. RTDB drops an empty map, so a message no one is waiting on has no `waitingOn` at all. |

**The membership mirror** (decided 2026-10-28): RTDB's rules can't read
Firestore, so a Cloud Function copies each group's membership into
`/mirrors/{conversationId}` whenever it changes: `members`, a map of each
member's UID to their `joinedAt` in milliseconds, and the group's
`chatTtlDays`. Clients can't read or write it. A group's chat uses the group
ID as its conversation ID, so presence (11.8) reads the same mirror. A
member who has just joined or left may meet the old membership for the
moment the function takes to run. Built 2026-10-28 as two triggers in
`functions/src/mirror.ts`, one on group documents and one on member
documents. Since Firebase may deliver triggers late, out of order, or more
than once, each reads the document's current state rather than the change
it was handed, and rereads after writing until the two reads agree.

**Rules** (`database.rules.json`, decided 2026-10-28):
- **Sending**: a member creates a message with the four required fields
  above, `quiet` only as `true`, `waitingOn`, and nothing else, as
  themselves, stamped with the server's time. Messages are
  never edited.
- **Reading**: a member reads only through a query ordered by `sentAt` that
  starts exactly at their own `joinedAt` from the mirror, so nobody reads
  chat from before they joined. The rules can only compare where a query
  starts for equality (measured in the emulator, which refused every
  ordering comparison), so the client starts its query at its join time
  rather than anywhere later.
- **Waiting-on entries**: each one is `true` for a current member. A member
  deletes their own entry, and any member deletes the entry of someone no
  longer in the group. Nothing else changes them.

**Chat pushes** (decided 2026-10-29): a new message pushes each member on
its waiting-on list who has no presence entry in the group (11.8), so
anyone with the group open isn't pushed, and a message marked `quiet`
pushes nobody. The push says only "New messages"
under the group's name, tagged by the chat so a busy chat shows as one
notification that later pushes replace. A member gets at most one chat push
per group every 2 minutes (decided 2026-11-11, `thrPasFun` in
`functions/src/activity-pushes.ts`): a burst of messages pushed a phone often
enough that Android blocked the app's notifications, and since a push never
says what was written, the one already showing stands for the burst. The
time of each member's last chat push in a group is kept on their push token's
document, read and stamped in one transaction, so two messages arriving
together push once. Other pushes are rare and aren't held back.

**Deletion, still opportunistic and client-triggered** (no Cloud
Function): whichever client is already reading a message deletes it once
either is true, which the rules check: (a) its `waitingOn` is empty, or (b)
its `sentAt` is older than the group's own `chatTtlDays` (Section 5, default
30, owner-adjustable 7-180), read from the mirror. RTDB has no native TTL,
so this reuses the same cleanup codepath rather than needing separate
infrastructure for the safety valve. The rules can't check that a sender
listed every other member, so a sender who leaves someone off only shortens
how long that message waits, and the history requests in 11.9 cover anyone
who missed it.

**Resolved** (originally an open question, settled via 11.9): a member
who joins after a message was sent does **not** automatically see it,
since the read rule above only lets them query from their own `joinedAt`.
Keeps chat consistent with "not a permanent archive" rather than showing
new joiners a partial, arbitrary slice of not-yet-deleted backlog. This
does NOT apply to events/notes, those are persistent Firestore documents a
new joiner should see in full, matching your original description of new
members "syncing whatever information was already there for that group." A
new joiner who specifically wants older chat context can request it
explicitly, see 11.9.

### 11.8 RTDB: `/presence/{groupId}/{uid}`

| Field | Type | Notes |
|---|---|---|
| `online` | plaintext boolean | Set `true` on connect; `onDisconnect()` clears it automatically. Standard RTDB presence pattern, no Firestore equivalent exists for this, which is why presence is the one thing staying in RTDB alongside chat. |

**Rules** (decided 2026-10-28): members of the group, by the membership
mirror (11.7), read its presence, and each member writes only their own
entry, holding nothing but `online`.

### 11.9 Peer-Assisted History Sync Requests

Resolves two gaps at once: recovering chat history after linking a new
device (Section 8's `linkWithCredential()` only recovers identity, not
content), and giving a new joiner access to older chat context if they
want it (11.7). Both are really the same underlying problem, "I don't
have history that another current member's device still has", so one
mechanism covers both rather than solving each separately.

Deliberately **not** restricted to the group creator: fulfilling a
request is just "share a copy of what's already on my device," it
doesn't touch membership or security the way removal/link-rotation do,
so requiring the creator specifically would break exactly when the
creator themselves is the one who needs it (their own new-phone case).
Any current member can request, any current member can voluntarily
fulfill.

No new cryptography is needed: the fulfiller already holds the group's
symmetric key (from their own `wrappedGroupKey`), and so does the
requester. A device keeps its chat history decrypted (Section 5), so the
fulfiller encrypts the requested messages (each one's ID, sender, time, and
text) as one bundle under the group key, with a fresh IV (decided
2026-10-29). Firebase relaying the bundle still never sees plaintext, same
guarantee as live chat, and Storage sees only the bundle's total size, not
how many messages it holds or how long each is.

| Path | Service | Notes |
|---|---|---|
| `/groups/{groupId}/historyRequests/{uid}` | Firestore | `{ requestedByUid, kind: 'recovery' \| 'backlog', rangeStart, createdAt, expireAt, status: 'pending' \| 'claimed' \| 'fulfilled', claimedByUid, claimedAt }`, keyed by the asker's UID (decided 2026-10-28), so each member has at most one open request per group, which caps the notifications one person can send. Visible to all current members; an FCM notification goes to every member but the asker whenever `status` becomes (or reverts to) `pending`. `expireAt` is a native Firestore TTL field: the app sets it 10 days out by its own clock, and the rules accept 7 to 14 days, so an unfulfilled request quietly disappears instead of lingering forever. |
| `groupHistoryTransfers/{groupId}/{uid}` | Storage | The uploaded bundle, the requested messages encrypted as one under the group key with its 12-byte IV first, keyed like the request it answers, written only by whoever currently holds the claim. One binary file of at most 25 MB (decided 2026-10-28), about 125,000 typical messages. |

**Rules (decided 2026-10-28)**: a member files only their own request,
pending and unclaimed, at the server's time. Any other member claims a
pending one in their own name, at the server's time, but only while the
asker is still in the group, since history goes only to a current member.
The claimant releases their claim at any time, and any member may release
it once it's 30 minutes old. Only the asker marks a claimed request
fulfilled or deletes their request, and a fulfilled one can't be reopened.

**Storage rules (`storage.rules`, decided 2026-10-28)**: they read the
request and the group's members from Firestore. Only the member holding a
standing claim uploads the bundle, or replaces a failed attempt, and only
while both they and the asker are still in the group. A bundle is one file
typed as generic binary (`application/octet-stream`), 1 byte to 25 MB, with
no custom metadata, since metadata would sit beside it unencrypted. Only the
asker downloads it, while still a member. The asker deletes it, and the
claimant may withdraw it while their claim stands. Nobody lists the folder.
A bundle nobody collects is deleted by the bucket's own lifecycle setting
15 days after upload, after its request has expired (decided 2026-10-28), so
no Cloud Function is needed for it.

**`kind` distinguishes the two cases, and the requester, not the
fulfiller, sets the scope**:
- **`recovery`**: the requester already has an existing membership doc
  with an old `joinedAt`, they're just on a fresh device with an empty
  local cache. Range is implicit and non-negotiable: their own original
  `joinedAt` to now, content they already had every right to see.
  `rangeStart` isn't used for this kind.
- **`backlog`**: the requester's `joinedAt` is recent, they're asking
  for content from *before* their own `joinedAt`, genuine new access
  they didn't have by default. The requester picks `rangeStart` when
  creating the request, bounded between the group's own creation date
  and their `joinedAt`, defaulting to "everything" but narrowable if
  they want less. This is a v1 feature, not deferred: the person asking
  should control how far back they're actually asking for, rather than
  leaving that call to whoever happens to fulfill it.

**Fulfillment is a claim, the same compare-and-swap pattern as Section
7's dish/task assignments, not a broadcast-and-race.** A member willing
to help runs a transaction: succeed only if `status == 'pending'`, then
set `status = 'claimed'`, `claimedByUid = me`, `claimedAt = now`. Only
one transaction wins, so only one blob is ever uploaded per request, no
redundant transfers, no ambiguity about which copy is authoritative.
Everyone else's UI just reflects "someone's already helping with this,"
the identical UX already established for a lost dish-claim race.

This also resolves the "who should get the request, and what about an
offline creator" question without needing a priority list or online-
status ranking at all: claiming requires the client to be running and
to have fetched the request in the first place, so being online is
already a precondition to enter the race, not something to check for
separately. If the creator (or anyone else near the top of a
hypothetical priority list) is offline, they simply never see the
option to claim, whoever *is* around and willing does, with zero extra
logic needed to make that happen. A `claimedAt` timeout (30 minutes) is
the only other piece needed: if the claim stalls, whether the claimant's
connection drops mid-upload or they simply change their mind, `status`
reverts to `pending` and re-notifies everyone, rather than the request
getting stuck behind one unresponsive claimant.

**Trigger, not a click or an invite event**: neither kind is created by
joining a group or by clicking a link, both fire off a single client-
side check, "am I a current member of this group with zero locally
cached chat for it?" That condition is agnostic to *why* the cache is
empty, so it naturally covers both cases:
- Empty cache **and** `joinedAt` is right now → fresh join, prompt
  "Want to see chat from before you joined too?" (a `backlog` request,
  purely optional, easy to decline).
- Empty cache **but** `joinedAt` is from a while ago → this device
  wasn't the one that originally joined, prompt "Looks like you're on a
  new device, want to recover this group's chat history?" (a `recovery`
  request, worth defaulting toward "yes" since it's just restoring
  what they already had).

Neither fires silently in the background, both are a prompt at the
moment they're actually relevant, the person always chooses. This also
means a link sitting unclicked for hours, or someone joining a group
much later than everyone else, doesn't need special-casing, the
mechanism only ever compares the requester's own `joinedAt` to their own
local cache, never to absolute time or to when the invite was created.

Flow: requester creates the request doc with `kind` (and `rangeStart` for
`backlog`) → a willing member wins the claim transaction → that member
uploads exactly the requested range to the Storage path → requester
downloads it, merges it into their own local store, marks the request
`fulfilled` → both the Storage object and the request doc are deleted,
matching the "transient, delete once delivered" pattern used everywhere
else in this design, no permanent server-side archive is created just
because this feature exists.

**Pros**
- Solves new-phone recovery and new-joiner backlog with one mechanism
  instead of two separate policy decisions.
- Fixes the creator-bottleneck problem outright, since fulfillment isn't
  a privileged action, and the claim mechanism means "who ends up
  fulfilling it" naturally resolves to whoever's actually online and
  willing, with no priority list or online-status check needed to make
  that happen.
- The requester, not the fulfiller, controls how much history a
  `backlog` request actually asks for.
- Reuses two patterns that already exist elsewhere in this design
  instead of inventing new ones: the claim transaction (Section 7) and
  the transient relay-then-delete lifecycle (used everywhere else).
- No new cryptography or key exchange: the bundle is encrypted under the
  already-shared group key.

**Cons**
- Only works if *some* current member has cached the requested range
  locally; if everyone who ever had it has since cleared their device,
  it's genuinely unrecoverable, by design, there's no fallback archive.
- Not instant, depends on another person being active and choosing to
  claim it, unlike the rest of the sync model which is near-real-time.
  The 30-minute claim timeout bounds how long a stalled attempt can
  block a retry, but doesn't make the whole thing fast.
- Introduces a third Firebase product (Storage) into the stack, one
  more SDK and security-rule surface to maintain.
- Even with the local-cache pre-filter below, coverage isn't
  mathematically guaranteed, a member could pass the filter and still
  have a gap mid-range (e.g. was offline long enough near the group's
  chat safety-valve edge, `chatTtlDays`, 30 days by default, to miss
  something before it aged out server-side).
  Treated as an acceptable residual risk, not something to engineer
  around further: this feature was never presented as guaranteed-
  complete, a partial result is still more than the requester had, and
  they can simply ask again.

**Locked in, not deferred**: a member is only offered the claim option
for a request if their own local cache actually covers it, specifically,
their earliest cached message for that group's chat is at or before the
start of the request's range (the `rangeStart` of a `backlog`, the asker's
`joinedAt` for a `recovery`). A member who joined at or before that start
and holds history counts as covering it too (decided 2026-10-29), since a
chat that began after the start has no message that early, and without
this nobody could ever answer a request for a group whose chat began
later. This is a purely local check
(their own IndexedDB, no network round trip, no new infrastructure) and
is deliberately based on actual cached coverage rather than `joinedAt`
alone, `joinedAt` only approximates "could plausibly have it," actual
local cache reflects whether they still do. This is what replaces a
priority/ranking system: instead of ordering candidates by likelihood of
having full coverage, under-qualified candidates are simply never shown
the option at all, so the claim race only ever happens among people who
can actually satisfy it.

**Screens (decided and built 2026-11-03)**: the offer is a banner atop the
group's chat (`src/screens/history-banner.tsx`), shown only while this
phone holds none of the group's chat. For a day after joining it offers a
`backlog`, unless the group began within a minute of the join, as it does
for its creator, with a choice of everything, the last month, or the last
week, each offered only where the group reaches back that far; after that
day it offers a `recovery`. "Not now" is kept on the device. Once asked,
the banner shows the request waiting or being sent, with Withdraw, and
since nothing tells the asker when the copy lands, it checks every 5
seconds while the request is claimed, adding the history to the chat and
saying how many messages came. Helpers find open requests in People
(`src/screens/history-requests.tsx`), watched live, each offering Send
history only where this phone covers the range, saying who is sending a
claimed one, and offering to free a claim stalled for 30 minutes; a push
about a request opens People.

**Client UX when multiple members are shown the same request**: the
request-visible-to-all design means several people can see the "help
sync this" prompt at once, so what happens on everyone else's screen
once one person claims it matters.

- **Primary path, real-time auto-dismiss**: whatever shows the prompt is
  already a live listener on the request doc, that's the only way a
  client knows to show it. That same listener fires again the instant
  `status` moves off `pending`, on every other subscribed client, so any
  client still showing the prompt reacts to that update by dismissing it
  proactively. This isn't new infrastructure, it's the same listener the
  prompt already depends on to exist at all, and it resolves the common
  case (five people notified, one claims, the other four's prompts
  disappear) before the others would realistically have time to act.
- **Fallback, the claim transaction's own rejection**: network
  propagation isn't instant, so a small window remains where someone
  taps "yes" moments before their own client has caught up. Their claim
  transaction simply fails the same compare-and-swap check used
  everywhere else in this design, not an error, just "didn't win the
  race." This is unavoidable in a distributed system and is why the
  fallback still matters even with fast auto-dismissal.
- **Neither path is silent.** A prompt that just vanishes with no
  acknowledgment can read as a glitch, so both paths surface a brief,
  auto-fading toast (not another modal requiring a tap to dismiss, that
  would reintroduce the exact friction being avoided): "Already handled
  by someone else, thanks anyway" for the passive auto-dismiss case, a
  slightly warmer variant for the case where the person actually tapped
  and lost the race.
- The initial prompt itself is worth designing as a lightweight,
  non-blocking banner or notification-center entry rather than a hard
  interrupting modal, consistent with minimizing popup fatigue generally,
  not just at the dismissal step.

### 11.10 Text Limits

Decided 2026-10-25. Every field a person types has a length and a set of
characters it allows, so names stay readable and recognizable, and nobody
can disguise one with invisible or direction-reversing characters. Lengths
count the way JavaScript's `.length` and the rules' `size()` both do (UTF-16
units, measured in the emulator), so a form field's `maxLength` and the rule
always agree. An emoji counts 2 or more.

| Field | Length | Allowed |
|---|---|---|
| Group name | 1 to 50 | Letters in any language with their accents, numbers, spaces, basic punctuation (`. , ' ’ - & ! ? ( ) : # / +`), and emoji, as Discord's display names allow by its own help center. |
| Person name (the join request's name, then the per-group display name) | 1 to 40 | Letters in any language with their accents, spaces, apostrophes, hyphens, and periods. No numbers, symbols, or emoji: it's a real name the approver has to recognize (Section 17), and decoration only makes look-alike names easier. |
| Join request note | 0 to 150 | Letters, numbers, spaces, and basic punctuation, no emoji. |
| Event title | 1 to 50 | The group name's set: letters, numbers, basic punctuation, and emoji. |
| Event description | 0 to 500 | The title's set, plus line breaks. |
| Event location text | 0 to 150 | The title's set. |
| Item label (who's bringing what) | 1 to 50 | The title's set. |

**The rules' Unicode is old** (measured 2026-10-28): the rules' `\p{...}`
classes follow Unicode 6.0, so `\p{So}` misses every emoji added since,
even 😀. Emoji are therefore allowed by code point, their blocks listed in
the rules' pattern and the app's alike, and the rules suite proves recent
ones pass. A letter added to Unicode after 6.0 still fails the rules'
`\p{L}`, a rare enough case to accept.

Every field refuses leading or trailing spaces and runs of two or more
spaces (an event description's line breaks aside), and the app trims,
collapses spaces, and normalizes text (Unicode NFC) before saving, so what a
person types usually passes. A description is tidied line by line and keeps
at most one blank line between paragraphs (decided 2026-10-29). The rules check every plaintext field
directly. The display name, events, and items are encrypted, so the app
checks them before encrypting and the rules can only cap each ciphertext's
size, at 3 bytes per character plus the 16-byte tag (Sections 11.3 and
11.5). The event and item rows were decided 2026-10-27. A chat message holds
1 to 2,000 characters (decided 2026-10-28), which the rules cap at its
ciphertext's size (Section 11.7). It allows any visible text (decided
2026-10-29): letters, numbers, punctuation, symbols, emoji, spaces, and line
breaks, refusing only control, format, private-use, and unassigned
characters and the line and paragraph separators, so nothing invisible or
direction-reversing can disguise a message. The zero-width joiner and
non-joiner and the emoji tag characters stay allowed, since emoji, flags,
and scripts such as Persian need them. It's tidied line by line, like a
description.

### 11.11 Untrusted Text And Paths

Decided 2026-10-25. Firestore has no query language that strings are
pasted into, and the SDK sends every value typed, so text can't become a
database command the way SQL injection works. Two neighbours of it are
real, and the app is built against both:

- **Paths**: a value that becomes part of a document path could point
  somewhere else. The app builds every path from separate segments
  (`doc( db, 'invites', tokStr )`) and every map key with `FieldPath`,
  never by joining strings, and checks a value from outside (an invite
  link's token) against its form before using it. The security rules
  cross-check every lookup they build from request data, so a path-shaped
  value is refused there too, which the rules suite tests.
- **Display**: most text is encrypted, so only the clients ever see it,
  and a modified client can skip the app's own checks before encrypting.
  So every client treats text from another member, decrypted or plaintext,
  as untrusted: it renders it only as text (React's escaping, never
  `innerHTML` or `dangerouslySetInnerHTML`), isolates its direction
  (`<bdi>` or `unicode-bidi : isolate`) so a direction override can't flip
  the interface around it, applies Section 11.10's limits again when
  showing it, and only links an address it has checked is `https:`. The
  security suite's untrusted input checks cover each screen that shows such
  text, as the screens are built.

---

## 12. Known Limitations & Accepted Tradeoffs

- Not true peer-to-peer; Firebase sits in the data path, though data is
  designed to not persist there long-term (Section 5) and content is
  encrypted before it arrives (Section 6).
- No end-to-end encryption; protects against the server/host reading
  content, not against a compromised group member or full metadata
  privacy.
- Single-device only; no seamless multi-device identity. History can be
  recovered onto a new device via an explicit, consent-based
  history-sync request to a fellow member (Section 11.9), but this is
  not automatic and depends on someone else still having it cached.
- A removed member's identity ban can be bypassed by regenerating their
  anonymous identity (clearing data); mitigated, not eliminated, by
  link rotation on removal.
- Reliable background location sharing is not achievable as a PWA on
  either platform; addressed via UX design (foreground + periodic +
  arrival check-in) rather than native app development.
- Data already delivered to a device (chat history, notes, event
  details, and photos) cannot be retroactively revoked
  if that member is later removed from the group.
- A member recovered onto a new device reads a group again only once
  another member, or another of their own devices still holding it, shares
  its key (Section 6), so a group whose other members never come back
  stays closed to them, and a group they're the only member of can't be
  opened again at all once no device of theirs holds its key.
- The group's symmetric key is never rotated when a member is removed.
  They still hold a local copy of it, but rotation is skipped: security
  rules already cut off their access to any *future* ciphertext, so a
  stale key alone gets them nothing without also bypassing the access
  control, and full rotation-on-removal is exactly the kind of
  E2E-grade complexity Section 6 already opted out of.

---

## 13. Open Questions / Not Yet Locked In

- **Linked devices** (raised 2026-11-10): using one identity on a phone, a
  tablet, and a computer at once, rather than one active device (Section
  8). It needs a key pair and a wrap per device, key shares and approvals
  wrapping for every device, a push token per device, and a chat that waits
  on devices rather than members, so a member's own devices get each
  other's messages. Left for after 1.0.

- Whether to eventually support per-person invite tracking as an
  additive feature on top of the shared-link model (Section 9), not
  needed for launch. **Likely superseded** by the join-approval proposal
  below, whose pending list already shows who has used the link.
- **Resolved (2026-10-22): approval is always required**, see Section 17
  for the full design. Original proposal, kept for the record: Section 6
  never says who wraps the group key for a new joiner, and wrapping needs
  a member who already holds it to be online. Proposal: joining through a
  link creates a *pending* membership; any current member (not only the
  creator) can approve it, and the approving client wraps the key for the
  joiner at that moment. This one step closes the key-handoff gap, stops
  a leaked link from letting strangers or bots straight in, and gives the
  "who's waiting to join" view the deferred invite tracking wanted. The
  alternative, the key in the link's `#fragment` for instant access, was
  set aside: anyone holding a leaked link would also hold the key.
- **Partly resolved (2026-10-22): carrying an invite across an iOS
  install.** A "Join with an invite link" option is built in regardless
  (built 2026-11-03), see Section 16; the real-iPhone test of the invite
  address still decides whether it's the main path or only the backup.
  **Resolved (2026-11-03)**: the invite page shown in Safari before the
  install doesn't name the group, since reading the invite needs a
  sign-in that would leave an identity in Safari's storage the installed
  app can't use (Section 16).
- **Resolved (2026-10-22): environments.** Decided: the Emulator Suite
  for daily development and every automated test, plus two real Firebase
  projects, live and staging, the staging one backing Netlify deploy
  previews. Staging exists because push notifications, App Check, Google
  sign-in, and installing on a real phone can't be emulated.
- **Resolved**: the fulfill-claim option (Section 11.9) is only offered
  to members whose own local cache actually covers a `backlog` request's
  `rangeStart`, checked locally against their earliest cached message,
  not just `joinedAt`. This is what replaces a priority/ranking system,
  under-qualified candidates never enter the claim race at all.

- **Resolved (2026-11-07): event photos (Section 20)** ship at launch,
  capped per event and per member by the owner's plan and counted through
  tallies the rules check, open from the event's start, and announced by
  one chat status line per burst of uploads. The full photo's size and
  format are settled by measuring in each engine as it's built.

**Resolved during the data-model pass** (kept here briefly for the
record): location moves from RTDB to Firestore (11.4); the group's own
name stays plaintext for invite-preview purposes (11.2); display names
are per-group and encrypted, not global (11.1/11.3); new joiners don't
see chat backlog automatically, but can request a specific range via
11.9's `backlog` requests, distinct from `recovery` requests for a lost
device; both are triggered by client-side detection of "member with an
empty local cache," never by the invite/join event itself; fulfillment
is a claim transaction, not a broadcast, so exactly one member fulfills
each request and no priority/online-status list is needed; unfulfilled
requests and stalled claims both expire rather than lingering
indefinitely; Redux Toolkit is dropped in favor of hooks-per-collection
plus Zustand for cross-cutting state (Section 2); the events/notes
grace period is set at 48 hours post-event (Section 5); chat's
safety-valve TTL defaults to 30 days and is a per-group, creator-
adjustable setting clamped between 7 and 180 days, not a fixed global
number (Section 5, `chatTtlDays` in 11.2); recovery-credential linking
ships with Google sign-in only for v1, Apple sign-in and email/password
are both deferred as later additions rather than rejected (Section 8).

---

## 14. Next Steps

Data model (Section 11) is reviewed and approved. Updated 2026-10-22 after
the Blaze change.

**App structure, decided 2026-10-22**:
- Stack: Vite, React, React Router, and TypeScript, per Section 2. Node is
  the build tooling and the Cloud Functions runtime, not an app server.
- Local storage: raw IndexedDB, as in ease-my-life, with no wrapper
  library. It covers everything the client keeps:
  - The ECDH private key and unwrapped group keys, stored as `CryptoKey`
    objects, which IndexedDB can hold directly (localStorage can't). The
    private key is non-extractable, so its bytes are never readable by
    script, while group keys stay extractable so any member can wrap one
    for a joiner (Section 6).
  - The decrypted chat history. RTDB's web SDK keeps no offline copy on
    disk, so this cache is ours to keep, as Section 5 already assumes.
  - Firestore's own offline cache uses IndexedDB too, managed by its SDK.
  - The app asks the browser to keep its storage (`navigator.storage.persist()`,
    `src/platform/persist.ts`) on each launch once the identity exists, as
    the bootstrap finishes at the first group action, and not when the
    browser already keeps it (decided 2026-10-29). Never before a group
    action, so a visitor who hasn't acted isn't prompted (Firefox may ask),
    and nothing runs in iOS Safari unless someone chooses to carry on there
    rather than install (Section 16).
- UI: no component library; every component is built in-house.
- Layout (decided 2026-10-29, from the wireframes of the design pass):
  - **Wide screens**: a rail of every group down the left, then the open
    group's sections (chat, events, map, people, settings), its content,
    and a panel with the next event and its bring-list, from 1,100px wide
    (decided 2026-10-30); between 720px and 1,100px the rail shows and the
    next event stays pinned above the chat, as on a phone.
  - **Phones**: the group's name at the top opens a sheet of every group,
    with joining and creating one; the group's sections are tabs along the
    bottom; and the group's next event is pinned above its chat, opening
    as a sheet with its details and bring-list.
  - **On the day of an event** the group leads with it: the pinned event
    offers the map, "I'm on my way", and "I've arrived" (Section 10).
- Look (decided 2026-10-29): a periwinkle accent with a coral spark on a
  cool off-white page, set in Bricolage Grotesque for headings and Figtree
  for text, both self-hosted, so the app loads nothing from another origin.
  Every member wears their own color from a palette of 50 (their
  `colorSlot`, Section 11.3) on their avatar, their claims, and their status
  lines.
- Light and dark (decided 2026-10-29, built 2026-10-30 in
  `src/platform/color-mode.ts`): every color holds a light and a dark value,
  and the app follows the phone's setting unless someone picks light or dark,
  which is kept on the device and applied as the app starts. Settings
  offers the choice (built 2026-11-01).
- Routing (decided 2026-10-25): the app answers at one address, its root,
  since it's an app rather than a website with pages to land on:
  - An address the app doesn't use is replaced with the root, so the address
    bar never keeps it and back doesn't return to it. There's no 404 page.
  - Screens (the group list, a group's chat, events, notes, and location
    views, settings, onboarding, and the install screen from Section 16) are
    history entries that record the screen in their state, not paths, so the
    back gesture walks back through screens while the address stays the
    root.
  - Entry addresses bring something in from outside and are read once as
    the app starts, then replaced with the root: an invite link
    (`/join/<token>`) opens the join screen (built 2026-11-02), and a
    tapped push's address (`/open/<group>/<section>`) opens its group at
    the section (built 2026-11-03, Section 11.1).
  - The legal pages, `/privacy` and `/terms`, are static pages served at
    fixed addresses, outside the app, since Google's sign-in verification
    and app listings link to them. Built 2026-11-03 as in ease-my-life:
    the documents' text lives once in `src/legal/text.tsx`; `privacy.html`
    and `terms.html` are Vite build inputs with the app's fonts and colors,
    a build plugin rendering each document into its page so it reads
    without JavaScript; `_redirects` serves each at its extensionless
    address; Settings opens each in a sheet, which works offline, where a
    link from one document to the other switches the sheet rather than
    leaving the app, a modified click still opening the page; and the
    landing page, the welcome, and the join form say starting, joining,
    or asking to join means agreeing to both, linking each. The terms set a minimum age of
    18, Missouri law, and a full refund of the upgrade on request within 14
    days (Section 18).

- **The landing page** (decided 2026-11-05, built 2026-11-05 in
  `src/screens/landing/`, the invite form's branding built the same day):
  the root shows
  it to a visitor whose phone holds no identity, someone arriving from a
  search result, a shared post, a bookmark, a typed or mistyped address,
  a legal page, or the home-screen icon before their first group action,
  and to every crawler. It replaces the welcome for them: the screen host
  checks the key store for an identity, without connecting, beside the
  group watch, and waits on both, so a deletion, which leaves none, lands
  here too, and the page says the data is gone. A phone holding
  an identity never sees it uninvited: a member goes straight to their
  groups, a tapped push to its section, and an invite to its join form.
  What the root shows an identity in no group is still open (below).
  - **Tone**: balanced between fun and serious, the whimsy coming from a
    dashed map route and the pins, the rest plain type, real screenshots,
    and honest copy.
  - **Order**: the hero, the trust section, the route, how a group starts,
    free and the upgrade, installing, a short FAQ (such as whether it's
    free, losing a phone, who sees a location, and being in more than one
    group), then a closing call to action and a footer with the privacy
    policy, the terms, and the support email.
  - **Hero**: the mark, the wordmark, the headline "Plans made. Fun had.
    Memories created." in three lines of ink, periwinkle, and coral, the
    one-line pitch, "Start a group" as the main action with "Join with an
    invite link" beside it and "Get my groups back" as a small link, and a
    collage of phone screenshots.
  - **Trust, right after the hero**: the app handles chat, plans, and
    locations, which can make people nervous, so this section drives home
    that what people write is encrypted on their phone before it's sent
    (messages, event details, bring-list items, names, and locations) and
    can't be read by the server, that messages wait on the server only
    until everyone in the group has them, that events go 2 days after they
    end and a location within the hour, and that there's no account, email,
    ads, or tracking. Every line stays exactly true (Section 11's
    plaintext fields, Section 5's retention): no claim that all data is
    encrypted, and a "What we can see" link to the privacy policy's list of
    what the server reads, so the section never contradicts the policy.
  - **The route**: four stops along a dashed route line that draws itself as
    the page scrolls, ending at an arrival pin: talking it over (the chat
    with its pinned event), picking the day (the Events section), who's
    bringing what (the bring-list in members' colors), and finding each
    other on the day (the Map section and the chat's status lines). Each
    stop has a catchy headline and one plain sentence of what the feature
    does, with no icon beside it, since a second marker beside each pin read
    as busy, and the arrival reads "You're all here." at the size of a
    stop's headline. The route is a dotted periwinkle line wiggling down a
    spine of coral numbered pins to a periwinkle check pin. Each pin drops
    in with a small bounce as the line reaches it, and the group gathers
    along the way: avatar circles in members' colors, each with an initial,
    join at the stops (one at the first, more at each later one) and follow
    just behind the line's tip, then line up as an overlapping row under
    "You're all here." once it reaches the check pin. On a phone the spine
    runs down the left with each stop's text beside it and its screenshot
    centered below; on a wide screen the stops' text and screenshots
    alternate sides of a central spine. Under reduced motion the route is
    simply drawn, every pin in place and each person sitting just past the
    stop where they join.
  - **How a group starts**: start a group, share the link, let people in.
  - **Free and the upgrade**: the upgrade is sold from day one (Section
    18), and the section makes the free tier's generosity plain with
    Section 18's limits, free beside $9.99 once: groups started, groups
    belonged to, and people in a group started. It says joining is never
    paid for, that it's one payment rather than a subscription, refunded in
    full within 14 days, and that it needs a linked Google account.
  - **Installing**: a short note that it runs in the browser and goes on
    the home screen, with no app store.
  - **Screenshots**: rendered by a script from seeded demo data, like the
    social card, so they follow the design, in light and dark, optimized
    as WebP and shown in a simple phone frame. The demo group's names are
    believable but plainly sample ones, and nothing poses as a real user or
    a review.
  - **Not pre-rendered** (decided 2026-11-05, replacing an earlier plan to
    render it into `index.html` at build time): the page is drawn by the
    app like any screen, once the screen host knows whether the phone holds
    an identity, the loader showing meanwhile after its 300ms delay, so
    nobody sees the wrong screen first. A pre-rendered page would flash
    before a member's groups, since the identity sits in IndexedDB, which
    can't be read before the first paint, and avoiding that would take a
    boot script and a flag kept in step with every identity change, beside
    a server-side render of the page's styled components and images.
    Keeping its text in `index.html` hidden behind the loader would be
    hidden text, which the SEO rules forbid. Google and Bing run the app's
    script, so they read the page, and link previews read `index.html`'s
    own tags, which already describe the app; only crawlers that run no
    script miss it.
  - **Invites**: an invite link still opens the join form first, since its
    visitor already has a reason and a friend vouching for the app. The
    form shows the mark, the wordmark, and the landing page's headline,
    "Plans made. Fun had. Memories created.", above the heading "You're
    invited to" the group, with a "What is Come Hang?" link that opens the
    landing page as a new history entry, `about`, carrying the group's
    name. Opened that way, the page's hero and closing band offer only
    "Back to joining" the group, which steps back like the back gesture,
    leaving out starting a group, pasting a link, and getting groups back.
    The token stays in the join entry, so a reload keeps the way back, and
    the form keeps what was typed in session storage, per invite, until the
    request is sent.

- **A phone with an identity in no group** (decided and built 2026-11-05),
  such as after leaving its last group or deleting it, sees the app's own
  frame with no groups rather than a separate page, so it still feels like
  the app. The rail, or on a phone the bar and its sheet, lists no groups
  and keeps starting one and joining with a link, and the bar shows the
  Come Hang wordmark where a group's name goes. All five section tabs stay
  in place, Chat, Events, Map, and People turned off with `aria-disabled`,
  dimmed, and each saying why ("Start or join a group first") through a
  tooltip and a screen reader description, a press on one leading back to
  the welcome, and Settings working. Settings stays open when the group it
  was opened from turns out to be gone (decided 2026-11-11): a reload can
  briefly show a just-deleted group from the device's cache, and a press in
  that moment once bounced someone to the welcome as the group dropped out. Otherwise the content area holds the
  welcome (`src/screens/welcome.tsx`): the mark, "You're not in a group
  yet", a line on what to do, "Start a group", "Join with an invite link",
  "Get my groups back", the line agreeing to the terms and the policy, and
  the install note. Settings (`src/screens/solo-settings.tsx`) shows the
  parts that belong to the phone and the account
  (`src/screens/personal-settings.tsx`, shared with a group's Settings):
  its appearance, notifications, installing, the Google link, the upgrade,
  deleting one's data, and the legal documents, without the group's own
  parts, so Delete my data lives in Settings for everyone. A phone with no
  identity sees the landing page instead.

**App's Firebase wiring, built 2026-10-28**:
- `src/platform/firebase.ts` creates the services the first time something
  asks, never on page load, so a visitor who hasn't acted makes no
  connection. The dev server always runs against the Emulator Suite under
  the demo project (`npm run emulators` starts it beside `npm run dev`). A
  production build reads its web config, public by design, from the
  `VITE_FIREBASE_CONFIG` environment variable Netlify sets per environment,
  and fails with a clear error without it. Firestore keeps its offline cache
  in IndexedDB, shared between tabs.
- `src/state/identity.ts` is the identity bootstrap (Section 8), run at the
  first group action rather than on load (Section 16): an anonymous
  sign-in, an ECDH P-256 key pair in IndexedDB (`src/platform/key-store.ts`)
  whose private key script can't export, the raw public key published to
  `/users/{uid}`, and an empty `/accounts/{uid}`. Each step writes only
  what's missing, and a key pair lost while the sign-in survives is
  replaced and republished, while a phone that kept its pair never
  republishes it over a newer one.
- `src/state/groups.ts` creates a group (Sections 9 and 11) once both
  names are tidied and checked (`src/core/text-limits.ts`): the identity
  bootstrap, a new group key and invite token, then one batch with the
  group, the creator's membership holding the key wrapped for them and
  their encrypted display name, the first invite, and the owned slot. The
  key is kept on the device as `group:{groupId}`, and a key missing there
  is recovered from the member's own wrap. The group list watches the
  account's two maps and each group they name, reporting the groups sorted
  by name once every one has been read, and on a device with no identity yet
  it reports none without starting Firebase, so a first visit still makes no
  connection (built 2026-10-30).
- The first screens (built 2026-10-30): the screen host
  (`src/screens/screen-host.tsx`) picks the screen from the history entry and
  the group list, showing a waiting screen while the groups load, whose loader
  of bouncing typing dots appears only after 300ms, then, to someone in no
  group, the landing page when the phone holds no identity and the group
  frame with no group, holding the welcome, when it does (built 2026-11-05), the form for starting a group when the entry asks for
  it, and otherwise the group the entry names, or the first by name. The form
  tidies and checks both names, says what's wrong beside a field and focuses
  it, and announces a failed creation; a created group replaces the form's
  entry and takes focus on its heading. The group frame has the rail from
  720px wide and the bar's switcher, which opens the group sheet, below it.
  Its section tabs, chat, events, map, people, and settings, run along the
  bottom below 720px and down a column beside the content from 720px, and
  each opens its section as a new history entry, which records it, so back
  walks back through them; a group opens at its chat, as does an entry naming
  a section this version doesn't know. Every section is built.
  The People section shows the invite link, which any member copies (or,
  where the browser won't copy, selects) and the owner replaces after
  confirming, and the members in name order, each with their avatar in their
  color, the owner marked; the member changes their own name from their row,
  and the owner removes anyone else after confirming, which also replaces
  the link. The group list carries each group's owner and current invite
  token, so a new link shows as soon as it's made. While anyone is waiting to
  join, the section lists their requests between the link and the members,
  oldest first and live, so a new request or one another member answered
  shows at once: each with the name, when it was made, the note, and a
  warning when a member already has that name, under advice to approve only
  people the member recognizes. Any member approves, declines, or, after
  confirming, blocks one, and from two waiting declines them all after
  confirming; focus then lands on the waiting list's heading, or the
  members' once no one waits, and each change to the requests reads the
  members again, so an approval shows there. The Settings section (built
  2026-11-01) shows the group's name and how long the server holds a
  message someone hasn't received: the owner changes both in a form that
  tidies and checks the name, saying what's wrong beside its box, and picks
  the retention from 7, 14, 30, 60, 90, or 180 days, while everyone else
  reads them. A member leaves after confirming, focus moving to the
  confirmation's Stay; the owner, who can't leave, deletes the group after
  typing its name, the confirmation taking focus in its box, and leaving
  either confirmation returns focus to its button. A group left or deleted
  is hidden at once and its entry replaced with the next group's by name,
  or with none, so the welcome shows, and that screen takes focus on its
  heading while a status region the screen host keeps across screens
  announces the change. The group list carries each group's retention for
  the form. Between the two, the owner offers the group to a member chosen
  by name, then sees whom it's offered to and the day it lapses, with a
  withdrawal, and the member offered it sees an accept and a decline; a
  refused offer or acceptance says why without saying more about anyone's
  account, and focus lands on what replaces the button pressed once the
  group shows the change. The group list carries each group's standing
  offer for this. A part for this phone follows: its appearance, matching
  the phone, light, or dark, applied at once and kept on the device, and one
  button that turns notifications on or off, its label saying what it will
  do next, a blocked or unsupported browser saying what to do instead.
  Then the account: until Google is linked, a note on what linking is for
  and a button that links it through Google's sign-in, focus landing on the
  part's heading once it's done, and once linked, a note on getting the
  groups back on a new phone; then the upgrade, saying what it costs and
  gives, needing Google linked first, and once linked a button that opens
  Polar's checkout, or saying it's bought. A refused link or purchase says
  why. The landing page and the welcome offer "Get my groups back" below
  their start buttons, through one shared hook
  (`src/screens/group-recovery.ts`), which signs in with Google through its popup and restarts the group list,
  so the recovered groups show, the first taking focus while the screen
  host announces the sign-in; a closed or blocked sign-in says so. Each
  group's chat then says its key is waiting, and the People section lists
  the members waiting for the key on a new device, each with a share, which
  any other member presses, or the member's own old device still holding
  the key, where the request reads "Your new device", focus then landing on
  a heading as it does after answering a join request. In every section, a
  button that turns into a confirmation (removing a member, blocking,
  replacing the link, cancelling an event) puts focus on the
  confirmation's safe answer, and leaving it returns focus to the button. The Events
  section lists the events that haven't ended, soonest first, then under
  "Recently ended" those that have ended but aren't yet deleted, most recent
  first (built 2026-11-07, Section 20), as cards that open each event's
  details, bring-list, and photos in a sheet, where an ended event can no
  longer be changed; there its creator or
  the group's owner changes it in a form sheet over it, or cancels it after
  confirming, focus then landing on the section's heading. Plan an event
  opens the same form empty: a title, when it starts and ends, a place, and
  notes, each field saying what's wrong with it beside it and the first one
  with a problem taking focus. The place field suggests the group's earlier
  places, kept on the device by `src/platform/place-store.ts` (built
  2026-11-07), through the browser's own datalist, alongside the addresses
  the browser has saved, with no map or address service, since one would
  see every place typed. Each plan, change, and cancel is announced. The chat pins the group's next event that
  hasn't ended at its top, opens with the history kept on the device, then
  watches the chat, starting the watch again a second later while the rules
  refuse it, as they do until the membership mirror holds a new member, and
  says so when the group's key is still waiting to be shared. Each message
  from another member shows their avatar in their own color, their name, and
  its time, and the member's own messages sit at the other side in the accent;
  Enter sends, Shift+Enter starts a new line, and a refused or failed send is
  announced and keeps its text. Below 1,100px wide the pinned event is a
  card that opens a sheet with its details and bring-list; from 1,100px a
  panel beside the chat shows them instead (built 2026-10-30). Both share one
  sheet and one details component: the date, place, and notes, then each item
  with who's bringing it in their color, or "Open", offering "I'll bring it"
  on an open item, "Let go" on the member's own, and removal on any, with a
  box to add an open item. The list follows every member's changes as they
  land, each change is announced, and a failure says why. An item's label
  opens a form in its row for its label and who's bringing it, "Open", the
  member, or any other member, which Escape or Cancel leaves; once it saves
  or cancels, focus returns to the label. A status post shows in the chat as
  a centered line beside its member's color dot, "Sam is on the way" or
  "Dana arrived", and "You're on the way" for the member's own, and it
  breaks a run of one sender's messages.
  The Map section (built 2026-11-02) works on the group's next event that
  hasn't ended, once its window opens 3 hours before the start. Before
  then it says when sharing opens, or that no event is coming. Within the
  window it names the event and its hours, says plainly how sharing works
  (Section 10), and offers one button that starts sharing and then stops
  it, keeping focus as its label changes, beside "I'm on my way" and "I've
  arrived", each offered until it's said and replaced by a note saying it,
  which takes focus. A start can run alongside a post, since a first fix
  can take a while. Below, everyone sharing for the event is listed, the
  member first, each row with the avatar in their color, the name with an
  Arrived badge, the distance and compass direction once the member shares
  too, how old the position is, refreshed every 30 seconds, and "Open in
  Google Maps" in a new tab; the plot draws them around the member once
  they share. Blocked location, a fix that can't be found, and a failed
  post each say why. The section's checks cover the window, two members
  sharing and posting, blocked location, a reload, and a removal.
  The join screen (built 2026-11-02) is what an invite link opens: the
  link's address is replaced with the root, its history entry naming the
  screen and the token, and the screen shows whatever groups the visitor is
  in. It reads the invite to name the group, or says the link no longer
  works and leads to the app. Someone not yet asking gives their full name
  and an optional note, each checked beside its box as the start form's
  are, and a request the rules refuse says the likely reasons, since the
  rules can't say which. A sent request is remembered in the entry with its
  group and name, so a reload still finds it waiting after the link is
  replaced. While it waits, the screen says any member can let them in and
  offers to withdraw it, and it watches the request: an approval restarts
  the group list and opens the group, announcing it, and an end without one
  (a decline, a block, or the 7 days running out) says so, with a way to ask
  again. Since a live connection on an iPad stalled after an approval,
  leaving the screen waiting (found 2026-11-11), it also reads where the
  request stands directly as the app comes into view and every 15 seconds.
  A member opening a link lands in the group. Each change of part
  moves focus to its heading, and the back button leads to the app,
  restarting the group list, since opening the invite made the identity.
  On an iPhone or iPad in Safari the install screen comes first (built
  2026-11-03, Section 16), keeping an invite link's token to copy. The paste screen (built 2026-11-03, Section 16)
  reaches the same join screen from a link pasted into the app.
- `src/state/joins.ts` is joining (Sections 9 and 17): reading an invite
  for its group's name, filing a join request with a tidied and checked
  name and note, the joiner's view of where it stands, a watch of it that
  reports the answer once the request is gone, withdrawing it, and for
  members, listing the unexpired requests oldest first, approving one,
  declining one, and declining and blocking its sender. An approval is one
  transaction that rereads the request and the count, wraps the group key
  for the joiner's published public key, encrypts the requested name, and
  writes the membership, the account entry, the count, and the request's
  end together. Once in, the joiner loads the key from their own wrap the
  same way a lost key is recovered.
- `src/state/members.ts` is the membership (Sections 9, 11.3, and 18): the
  member list, oldest first, with each name decrypted, where a missing or
  unreadable name shows as none rather than failing the list; a member
  renaming themselves; the activity mark, which the app makes for each
  group as it opens, writing only when the last mark is a day old or more;
  leaving, one batch that ends the membership, its account entry, and its
  count, then deletes the group's key from the device; and the owner's
  removal, one transaction that also blocks the member and rotates the
  invite, returning the new link to share. `src/state/groups.ts` adds the
  owner's link rotation and settings (the name and chat retention), each one
  transaction that keeps the working invite in step, and the owner's
  deletion of the group through `delGroFun`, after which the device deletes
  the group's key.
- `src/state/ownership.ts` is the handover (Section 18): the owner offers
  the group to a member and can withdraw the offer, the member accepts in
  one transaction that rereads the offer, refuses one that's lapsed or names
  someone else, and swaps the group between both accounts' maps, or
  declines through `decOffFun`. An offer refused for a full owned slot
  rejects with Firestore's permission-denied, which the offer screen
  explains. `src/state/notices.ts` lists or watches the unexpired notices
  newest first and dismisses them. The client suite runs with the Functions
  emulator, so a decline and the notices it leaves are checked end to end.
- `src/state/events.ts` is the group's events (Sections 5 and 11.5): any
  member plans one, and its creator or the owner changes or cancels it. The
  title, description, and location are tidied, checked, and encrypted as
  one bundle, and the times are checked as the rules check them. Moving an
  event's end moves every item's deletion time in the same batch, and
  cancelling an event deletes its items with it. The list leaves out events
  past their deletion time and reads untrusted details safely, showing a
  bundle that won't decrypt or parse, or a part that isn't text, as empty.
  `src/state/items.ts` is the bring-list (Section 7): adding, relabeling,
  claiming, reassigning, releasing, and removing items. Each write reads
  the event in its transaction and stamps the item with the event's
  deletion time, which also brings an item that fell out of step back in
  line, and refuses an item for a cancelled event. A claim is the
  compare-and-swap Section 7 describes, refusing with "Someone already
  claimed that" when the item names an assignee. A watch follows the list
  as it changes, reporting only the newest change once its labels decrypt,
  so a claim or a new item shows to every member at once.
- `src/state/chat.ts` is the group's chat (Sections 5 and 11.7). A message is
  tidied, checked as visible text, encrypted, and sent waiting on every other
  member, and the sender's device keeps a copy once the server accepts it,
  while its own watch skips the message until then, so a refused send is never
  shown or kept (built 2026-10-30); a message nobody waits on, in a group of
  one, is deleted as soon as it's accepted. A member reads from their own join
  time, by a one-time sync or by watching, and each message read is kept on
  the device, acknowledged, cleared of departed members' entries (after
  rereading the members, so a new member isn't taken for gone), and deleted
  once nobody waits on it or it's past the retention. The device's history
  lives in `src/platform/chat-store.ts`, beside the keys and the groups'
  event places in the app's one IndexedDB database, which
  `src/platform/local-db.ts` opens at version 3, creating whichever stores
  are missing.
- `src/state/presence.ts` marks a member online with an entry the server
  clears if the device drops, clears it on going offline, and watches who's
  online (Section 11.8). `src/state/history.ts` is peer-assisted history
  (Section 11.9): asking for a recovery or a backlog, listing open
  requests, checking this device's coverage, claiming as a compare-and-swap,
  releasing, sending the range as one encrypted bundle, collecting it while
  keeping only well-formed messages inside the range, and withdrawing.
- `src/state/location.ts` is location sharing (Sections 5, 10, and 11.4):
  sharing a position for an event, inside its window and expiring an hour on
  or at the event's end, stopping, listing and watching the valid unexpired
  shares, and a sharing session that sends a fix on start, as the device
  moves while the app is open, on each return to the app, and on arrival,
  throttled as Section 5 says. `src/platform/geolocation.ts` wraps the
  browser's position calls, and `public/_headers` allows geolocation to the
  app's own origin alone. `src/state/sharing.ts` (built 2026-11-02) is this
  device's part in one event's sharing, kept apart from the screens so it
  runs while the member moves between sections: whether they share, and
  whether they've said they're on their way or have arrived, which posts
  the status line and, on arriving, marks a running share. The record is
  kept on the device, so opening the app again resumes a share with a
  fresh fix (Section 10), and it ends at the event's end, when the member
  leaves or deletes the group, and when the group drops out of their list,
  as after a removal, each deleting the share at once. A share's update
  time is read as the device's estimate until the server's arrives, so the
  member's own new share shows at once. `src/core/geo.ts` holds the
  distance, bearing, and their labels, worked out on the device after each
  position is decrypted. Distances read in the units of the device's region
  (decided 2026-11-11): feet and miles where the device's language names the
  United States, Liberia, Myanmar, or the United Kingdom, or names no region
  and is most likely used there, as a bare `en` is, and meters and
  kilometers everywhere else. The group frame's content area holds and clips
  anything positioned against it, since a member's row's hidden link words,
  placed against the whole page, let the map scroll below the app while
  someone shared.
- Under the emulator, the app, the Cloud Functions, and the tests share the
  Realtime Database's default instance, `demo-come-hang-default-rtdb`, where
  the emulator loads `database.rules.json`, as production's app and
  functions share the project's default instance. The Functions emulator
  otherwise hands the Admin SDK a namespace named after the bare project ID,
  so `functions/src/setup.ts` names the instance there (found 2026-10-29,
  when the mirror the chat rules read sat in a different namespace from the
  app's chat).
- `src/state/identity.ts` links the identity to Google and recovers it on
  a new phone (Section 8), and `src/state/key-share.ts` lists a group's key
  requests and answers one by wrapping the key for the member's new public
  key (Section 6), whose push comes from `keyPusFun` in
  `functions/src/activity-pushes.ts`. The client suite drives the Auth
  emulator's own Google popup to recover a member on a fresh browser
  context and has the owner share the key.
- `src/state/purchase.ts` starts a purchase through `cheCreFun` and reads
  the paid flag (Section 18). The functions suite checks the checkout and
  webhook in a Node process of their own
  (`tests/support/purchase-child.ts`), since Playwright's loader can't link
  the HTTP functions' module, with Polar's API stood in and webhooks signed
  the way Polar signs them.
- The browser suite in `tests/client/` (`npm run test:client`) checks
  this in Chromium, Firefox, and WebKit against the emulators, since
  WebCrypto and IndexedDB differ between engines.
- The member switcher (built 2026-11-02, development only) lets one browser
  act as several members, which is safe since the dev server only ever
  reaches the emulators:
  - **Per member storage**: a page's member comes from a `dev-member`
    address parameter or, failing that, the tab's session storage, which the
    switcher sets, so each tab can be someone else. Each member keeps its
    own Firebase app, so its own sign-in and Firestore cache, its own
    IndexedDB database, and its own local storage keys
    (`src/platform/dev-profile.ts`), while the device's own identity keeps
    the names it always had.
  - **The switcher**: a toggle on the screen's end edge
    (`src/dev/switcher.tsx`) names whom the tab acts as and opens a sheet
    listing You, Alex Kim, Sam Ortiz, and Priya Nair. Choosing one reloads
    the tab as them.
  - **The seed**: a button in the sheet (`src/dev/seed.ts`) builds Lake
    Weekend in the emulators. Alex starts it, Sam and Priya join through
    the invite and Alex's approval, Jordan Lee's request is left waiting,
    Alex plans a picnic starting about 2 hours ahead with a partly claimed
    bring-list, Sam plans a game night on the next Friday, and the three of
    them chat. Each member acts in a hidden frame of its own through the
    app's own functions, so their keys stay in the browser for the switcher.
    The frames run one at a time, since each Firestore client holds
    connections to the emulator, and with four frames open the browser's
    limit of 6 connections to a host left requests waiting a minute
    (measured 2026-11-02). Seeding starts the seeded members afresh. It's a
    button rather than an npm script, since a script's members would keep
    their keys in a browser other than the one the switcher runs in.
  - **Kept out**: the switcher isn't mounted in a browser a test drives, and
    a production build holds none of it, which the security suite checks.

- **Deleting one's data** (decided 2026-11-03, built in
  `functions/src/data-deletion.ts`, `src/state/deletion.ts`, and
  `src/screens/delete-data.tsx`): Settings' account part offers "Delete my
  data", Settings working without a group too, since an identity in no
  group can still hold a Google link or the upgrade. Its confirmation lists what happens
  and asks for the word delete. The callable `delDatFun` then, for each
  group the identity owns, deletes its own documents there and hands the
  group on or deletes it (Section 18); for each group it belongs to,
  deletes its documents and leaves; then deletes its requests to join any
  group, found by reading every join request's ID since nothing lists
  them, its account with the notices and push token under it, its public
  key, and its Auth record last, so a retry can still sign in until the
  end, those last three through `ideDelFun`, which the cleanup of unused
  identities shares (Section 8). The phone then turns notifications off,
  signs out, deletes
  Firestore's offline copy and the app's database, removes the app's local
  storage keys, and starts over at the landing page, which says the data
  is gone. Messages already delivered stay on other members' phones, and the
  ones still waiting on the server are deleted on the usual schedule.

- **The notices sheet** (decided 2026-11-04, built in
  `src/screens/notices.tsx`): the screen host watches the identity's
  notices once the groups have loaded, outside the install screen, and a
  sheet titled "While you were away" opens by itself over whatever screen
  shows when any are waiting, a notice arriving while the app is open
  opening it, or joining the list while it's open. Each notice reads as a
  sentence naming its group, and the other member where the group's members
  can still be read, such as "Dana Lee declined your offer of Beach Day.",
  falling back to wording that names no one, with when it happened, newest
  first. One "Got it" puts them all away, and closing the sheet any other
  way does too: every notice shown is deleted, and focus moves to the
  screen's main area. A notice of a kind the app doesn't know is left
  alone, so a kind added later waits for an app that can word it.
- **Offline** (decided and built 2026-11-08, `src/ui/online.ts`,
  `src/ui/offline-banner.tsx`, and `src/platform/outbox-store.ts`): while
  the browser reports the device offline, a band in the warning colors sits
  above every screen: "You're offline. What's on this device still shows,
  and your messages will send once you're back online." The frame shrinks
  by its height, so nothing runs off the screen.
  - **A chat that can't connect** (decided and built 2026-11-11,
    `src/state/chat-link.ts`): a device can be online while the chat's
    connection to the Realtime Database is stuck, as one Pixel's was, and a
    message sent then hung with the Send button doing nothing, as did the
    Map's status lines, left "Posting…". Once a device has groups, the app
    watches the database's own report of its connection (`.info/connected`),
    and when it has been down for 10 seconds, so a launch or a brief drop
    never shows, the chat counts as unreachable: the same band reads "The
    chat can't connect right now. What's on this device still shows, and
    your messages will send once it's back.", a chat message waits on the
    device as it does offline, sending once the connection returns, and a
    status line on the Map answers with "The chat can't connect right now,
    so this has to wait until it's back." Bring-list and photo lines aren't
    paused, since they're posted in the background and their failures are
    only logged.
  - **Chat messages wait**: one written offline is kept in the device's
    database (an `outbox` store) and shows in the log as the member's own,
    faded, with "Waiting to send" below it. They send in the order written,
    each dated after the one before even when the device's clock steps back
    (decided 2026-11-11), as soon as the device is back online and the chat
    connects, whichever screen is open, and
    survive the app closing. The first send after reconnecting can be
    refused while the sign-in catches up (measured 2026-11-09), so a failed
    send is tried again every 2 seconds, up to 5 tries in all, after which
    the messages wait for the next time the device comes online, the chat
    connects again, or the groups change. A message the outbox sends before
    the chat's watch has started, as can happen right after coming back
    online, has no watch to hand its copy to, and in a group of one the
    server deletes it at once, so the chat reads the device's history again
    each time its watch starts (decided 2026-11-11, after about 1 in 30 runs
    of the offline spec lost the first message from the log).
  - **Every other change is paused**: bring-lists, events, photos, People,
    Settings, sharing a location, joining, and starting a group each answer
    a press with "You're offline, so this has to wait until you're back
    online." in their own alert, rather than hanging or failing vaguely.
    These aren't queued, since a claim, an approval, or a join decided
    offline could collide with what others did meanwhile. The support form
    is the exception, since its failure already keeps the message and
    offers the support address.
  - **What still works** is everything already on the device: the app
    itself, from the service worker, the groups, events, and bring-lists as
    Firestore last read them, the chat history, photos already opened, and
    profile photos.
- **What's waiting on the member** (decided 2026-11-08, built in
  `src/state/waiting.ts`, `src/ui/waiting-dot.tsx`, and
  `src/ui/item-jump.ts`): a join request, a member waiting on a new device
  for a group's key, a member asking for chat history, and an offer of a
  group are waiting on someone, rather than news of something done, so
  they're shown until they're answered instead of being dismissed. A
  notice wouldn't fit them, and a push alone reaches nobody with
  notifications off. The screen host watches each group's join, key, and
  history requests and reads the offers from the groups, keeping only what
  this member can act on: a key request only while this device holds the
  group's key, their own from a new device included, no other request of
  their own, a history request only while it's
  unclaimed and this device holds its range, and an offer only when it names
  them and hasn't lapsed. Once anyone answers an item, it's gone for
  everyone.
  - **The dot**: a coral dot marks the People tab for requests and the
    Settings tab for an offer, the group's tile in the rail and its row in
    the group sheet, and on a phone the switcher for what waits in the
    other groups, each adding the count to its name for a screen reader
    (", 2 waiting"). It fades in and out with the items, nothing to dismiss.
  - **The sheet**: "While you were away" gains a "Waiting on you" part above
    the notices, headed only when both parts show. Each item shows once on
    a device, the first time it's waiting there, as a sentence naming the
    person and the group, such as "Sam wants to join Lake Weekend.", with a
    Review button. Closing the sheet keeps the items it showed as seen in
    the device's database, so one left unanswered doesn't reopen it on
    every launch, while the dot stays. An item already in view, in the
    section that holds it, counts as seen without opening the sheet. An item
    answered elsewhere while the sheet is open leaves it, and a sheet left
    with nothing in it closes by itself.
  - **Review** closes the sheet, then opens the item's section at the item
    through the history entry's `waiStr`: the section scrolls the item into
    view, focuses it so a screen reader announces it, and flashes an accent
    ring that fades out over about a second, or shows briefly without
    fading under reduced motion. An item answered by someone else in the
    meantime is announced as answered already. The section, not the sheet,
    acts on the item, so each answer has one screen.

**App structure, still open**:
- The exact hook API/conventions (naming, loading/error state shape, how
  a hook exposes its listener's unsubscribe).
- Scroll behavior per screen, decided as each data screen is built. The app's
  scroll hook (`src/ui/scroll-top.ts`) restores a back, forward, or reload
  position once the fonts have loaded and the screen host says its screen is
  ready (built 2026-10-30). A screen whose own data arrives later than that,
  such as an event list, re-applies its position once its content is in. The
  chat scrolls inside its own log rather than the whole window, opening at its
  newest message and following new ones while someone reads at the end (built
  2026-10-30), which the hook doesn't need to cover.

**Infrastructure, decided 2026-10-22**:
- Firebase Blaze plan with the cost protections in Section 15.
- Hosting: Netlify, as with the user's other sites. Firebase doesn't need
  its own hosting; the app talks to Firebase from the browser wherever
  it's served. Server code runs as Firebase Cloud Functions, since it's
  triggered by database writes, which a Netlify Function can't listen
  for. Setup carries ease-my-life's lessons: the site's domains in
  Firebase Auth's authorized domains, the API key's website restrictions,
  and Firebase's addresses in the Content-Security-Policy.
- Support messages (decided and built 2026-11-07): Settings' About part
  holds a short form (`src/screens/support-form.tsx`) with a subject, a
  message, an optional email for a reply, and the app's version and browser,
  posted to Netlify Forms at the site's root, which emails it on. A hidden
  copy of the form in `index.html` is how Netlify learns the form's fields,
  and a hidden honeypot field marks a bot's message as spam. A message that
  can't be sent stays in the form beside the support address. The privacy
  policy says what's sent and that it's kept only as long as answering takes.
- Built 2026-11-03 (`deploy-files.ts`): each build fills in the hosting
  files for its own Firebase project, read from `VITE_FIREBASE_CONFIG`.
  The policy's `connect-src` names that project's functions and database
  along with Firestore, Auth, Storage, FCM, and App Check, the Realtime
  Database's own servers under `firebaseio.com`, and nothing else; a build
  without a project, such as the test suites', keeps the strict policy. The
  Realtime Database stays on WebSockets (decided 2026-11-10,
  `forceWebSockets()` in `src/platform/firebase.ts`): once a WebSocket fails
  in a browser, the SDK remembers it in local storage and starts with long
  polling, which loads scripts from the database's server, and the policy
  rightly blocks scripts from `firebaseio.com`, so one Firefox profile's chat
  couldn't send or receive at all until the SDK was kept on WebSockets. A
  device whose chat database connection fails can be diagnosed without USB
  debugging (decided 2026-11-11, `src/platform/firebase.ts`): with
  `come-hang-debug-log` set to `on` in its local storage, the app keeps the
  database SDK's own log, its latest 300 lines, in memory as
  `window.__comHanLog`, which a bookmarklet can read. It's off by default,
  never leaves the device, and the chat it would show is encrypted.
  Google sign-in runs on the app's own domain (decided 2026-11-03), since
  Safari, the installed iPhone app included, blocks the storage a sign-in
  page on `firebaseapp.com` needs: `_redirects` passes `/__/auth/` through
  to the project's `firebaseapp.com`, ahead of the app's fallback, the app
  sets its sign-in domain to the site's own host, frame-src allows only
  the app itself, and the service worker leaves `/__/` alone. App Check
  starts with reCAPTCHA Enterprise in a production build that has
  `VITE_APPCHECK_SITE_KEY`, which also opens reCAPTCHA's script and frame
  addresses in the policy. A config missing its project or database fails
  the build.
- App Check moves from "later" to launch, given the concern about bots
  and abuse (Section 15).
- Location (decided 2026-10-28): every service in us-central1, so Cloud
  Functions sit beside the databases they react to and Firestore has its
  cheapest pricing. The Realtime Database offers only three locations, and
  Firestore's can never change once the project is created.
- Cloud Functions layout (decided 2026-10-28): Firebase's standard
  `functions/` folder with its own `package.json` and `tsconfig.json`, so a
  deploy uploads only server dependencies. TypeScript compiles to the
  git-ignored `functions/lib` before each deploy and test run, on Node 24,
  and `functions/src/main.ts` exports every function Firebase deploys.
  Every function runs in us-central1 with at most 10 instances. The
  functions suite in `tests/functions/` (`npm run test:functions`) checks
  them end to end in the Functions emulator, apart from the other suites,
  since the functions write data those suites clear. The security suite's
  dependency audit covers the functions' lockfile too.

**Infrastructure, still open**:
- The security rules are complete as of 2026-10-28: `firestore.rules`
  covers every collection in Section 11, `database.rules.json` covers chat
  and presence, and `storage.rules` covers history transfers, proven by the
  rules suite in `tests/rules/` (`npm run test:rules`), which runs against
  the Firestore, Realtime Database, and Storage emulators that
  `firebase.json` sets up (2026-10-25). Every check in them was confirmed to
  fail a test when dropped, except the chat read rule's ordering check,
  which the emulator can't exercise, since it refuses an unindexed query
  that the live database would answer.
- Built 2026-10-28: the membership mirror's functions (Section 11.7), group
  deletion (Section 9), the group change trigger's removal and offer
  notices, the offer decline callable, the daily run (Section 18), and the
  push tokens with the pushes for every notice and for each new offer
  (Section 11.1). Built 2026-10-29 in `functions/src/activity-pushes.ts`:
  the history request push (Section 11.9), the grouped join request push
  (Section 17), and chat pushes (Section 11.7). Built 2026-10-29: the
  app's side, asking permission, getting and storing the token, and
  keeping it fresh (Section 11.1), checked in the client suite, which also
  follows a stored token to the push a removal sends.
- Built 2026-11-04 in `functions/src/identity-cleanup.ts`: the daily
  cleanup of unused identities (Section 8), checked in the functions suite
  through a Node process of its own, since the suite's loader can't link
  the Admin SDK's Auth module, and a returning phone's fresh start checked
  in the client suite.
- Environments, see Section 13.
- One service worker (decided 2026-10-28, built 2026-10-29,
  `src/service-worker.ts`): a PWA gets one service worker per scope, while
  `vite-plugin-pwa` would generate one for offline caching and FCM would
  register its own `firebase-messaging-sw.js` for background push. So the
  plugin's `injectManifest` mode builds one hand-written worker that does
  both: Workbox caches the build's files and answers every navigation but
  the legal pages with the app's page, so the app opens without a
  connection, and in a production build Firebase Messaging's handler shows
  each push. The app hands that worker's registration to FCM's
  `getToken()`, so FCM never registers a second one. A deferred script the
  plugin adds registers it on every load. A new version takes over as soon
  as it installs (decided 2026-11-11), rather than waiting for every window
  of the app to close: a Pixel's installed app and Chrome tab, sharing one
  worker, held on to an old version until both were force-closed. Open
  windows keep running the code they loaded, and their next load runs the
  new version. The worker runs only in a
  production build, so the worker suite in `tests/worker/` checks it
  against the preview server, opening the app offline at its root and at
  an address with no file of its own, and checking a second version becomes
  the active worker with the page still open. The web app manifest stays
  hand-written, so the plugin writes none. The bars around the app match it
  in either mode, as most installed apps' do (decided 2026-11-10, following
  ease-my-life): the manifest's `theme_color` is the light header's white,
  the color an installed app opens in, and `index.html` ships a light and a
  dark `theme-color` tag for browsers and link previews. An installed app
  reads neither scheme tag, and neither sees a light or dark choice made in
  the app, so `tinSynFun` in `src/platform/color-mode.ts` keeps one tag,
  with no scheme, on the surface color of the mode showing, as the app
  starts, when Settings changes the mode, and when the device's own scheme
  changes, and Chrome on Android repaints an installed app's status bar to
  match. Its navigation bar stays white in either mode, as ease-my-life's
  does, and drawing the app behind the bars with `viewport-fit=cover` didn't
  change it (tried on a Pixel 2026-11-11 and reverted), so the white bar is
  accepted as Chrome's own. The maskable icon, the one Android's launcher
  shows, is drawn from `design/brand/icon-light.svg`, the mark in periwinkle
  on a pale tile, while every other icon keeps the periwinkle tile (decided
  2026-11-10): Android's themed icons are built from an icon's own light and
  dark parts, so the periwinkle tile came out as a dark circle with a light
  bubble beside other apps' light circles with dark marks.

**Setup checklist (don't skip)**, in the order the steps depend on each
other. It records choices and steps only: secret values, account details,
and the budget's figures stay out of this public repository, kept in
Firebase's secret manager, Netlify's environment settings, a git-ignored
`.env.local`, or the maker's own notes.

1. **Domain and email** (added 2026-11-09), set up as the maker's other
   domains are (tech-geek-dev's CLAUDE.md, "Putting a new TechGeek domain
   behind Cloudflare"), minus the old zone to copy and delete, since
   comehang.app is new:
   - [x] comehang.app added to Cloudflare on the Free plan, which holds the
         whole zone, mail included (2026-11-09), name.com's parking records
         deleted.
   - [x] SSL/TLS set to Full (strict), Automatic HTTPS Rewrites on, Always
         Use HTTPS and HSTS off, minimum TLS 1.2. Netlify sends the `http`
         to `https` and `www` redirects and `_headers` sends HSTS, so
         Cloudflare has no rules of its own.
   - [x] The nameservers at name.com switched to Cloudflare's two, then
         Cloudflare's email saying the domain is active (2026-11-09).
   - [x] The Titan mailbox for support@comehang.app, its records in the
         Cloudflare zone, DNS only, since mail can't be proxied: the two MX
         records (priorities 10 and 20), SPF, the `titan1._domainkey` DKIM
         key, and a `_dmarc` record (`p=none`, reports to
         support@comehang.app). The privacy policy, the terms, the refund
         promise, and the support form's fallback all give this address,
         so it works before anything goes live. Checked 2026-11-09 through
         Google's and Cloudflare's resolvers, Titan's DKIM check passed, and
         a test message went both ways.
2. **Firebase projects**, staging first, then live:
   - [x] **Turn Firebase/Google Analytics OFF** when creating each Firebase
         project. The setup flow suggests turning it on, and quietly
         enabling it would cut against this app's privacy stance. Both
         projects were created without it (2026-11-09).
   - [x] Every service in us-central1 (Section 14's location decision):
         Firestore (Standard, `us-central1`, not `nam5`), the Realtime
         Database, and Storage (`US-CENTRAL1`) on both projects, with
         Anonymous sign-in on and its auto clean-up off, since that would
         delete the anonymous identities members keep for good.
   - [x] Budget alerts and the automatic billing cutoff (Section 15), set up
         the same day Blaze is enabled, on every project. Staging, created
         2026-11-09 as `come-hang-staging` with Analytics off, has its
         budget, alerts, `billing-cutoff` topic, two spend caps, and the
         cutoff deployed with its permission, tested by a published
         over-budget message, which unlinked billing, then relinked by hand.
         Each project's first functions deploy also sets the container
         image cleanup policy (`firebase functions:artifacts:setpolicy`), so
         old images don't add a monthly charge. A project's very first deploy of
         second-generation functions can fail while Google's Eventarc and
         Cloud Build accounts get their permissions, leaving functions half
         made: live's did (2026-11-09), so its broken functions were deleted
         and the deploy run again a few minutes later. Live, created
         2026-11-09 as `come-hang-70edb`, has its rules and every function
         deployed, with no Polar product yet, and the same budget, topic,
         spend caps, and cutoff permission, its cutoff untested, since
         staging's test proved the code and the role.
   - [x] Cloud Functions capped with `maxInstances`: 10 each, set in
         `functions/src/setup.ts`.
   - [x] A lifecycle rule on the Storage bucket deleting objects 15 days
         after upload (Section 11.9), limited to the `groupHistoryTransfers/`
         and `photos/` prefixes, since profile photos under `avatars/` last
         as long as their membership (Section 21). Set on both projects
         2026-11-09.
   - [x] Nothing deleted lingers in a copy (added 2026-11-09): the Storage
         bucket's soft delete off and object versioning off, and no
         scheduled Firestore backups, since each would keep deleted photos,
         messages' history bundles, or records past the deletion the
         privacy policy promises, and bill for them. Set on both projects
         2026-11-09.
   - [x] Firestore TTL policies on the `expireAt` field of every collection
         group that has one (`liveLocations`, `events`, `assignments`,
         `photos`, `historyRequests`, `joinRequests`, `notices`,
         `pushToken`, `polarEvents`), since a TTL policy is set per
         collection group in the console, not by the rules. Each takes no
         expiration offset, since `expireAt` already holds the deletion
         time. All nine set on both projects 2026-11-09.
   - [x] The web push (VAPID) key pair generated in each project's Cloud
         Messaging settings (2026-11-09), its public key set as
         `VITE_FIREBASE_VAPID_KEY` in Netlify in stage 3.
   - [ ] Polar: the upgrade's product made in the sandbox (staging) and
         live (live), each project's `POLAR_ACCESS_TOKEN` and
         `POLAR_WEBHOOK_SECRET` set with `firebase functions:secrets:set`,
         its `functions/.env.<projectId>` giving `POLAR_PRODUCT_ID`,
         `POLAR_API_URL` (`https://api.polar.sh` for live), and
         `POLAR_SUCCESS_URL`, and Polar's webhook pointed at the project's
         `polWebFun` address for `order.paid` and `order.refunded`. The
         product is a one-time $9.99 purchase, private to the customer
         portal so it's bought only through the app's tagged checkout, with
         a Custom benefit, since Polar requires one, noting the upgrade is
         active on the buying account; its checkout asks for no extra
         fields, and its token holds only `checkouts:write`. The product,
         token, and webhook first made for staging (2026-11-09) turned out
         to be on live Polar rather than the sandbox, so they became live's:
         the webhook was pointed at live's `polWebFun`, and staging got its
         own at sandbox.polar.sh on 2026-11-10: a sandbox product, token,
         and webhook, its checkout returning buyers to
         staging.comehang.app. Live Polar's account review is real and looks at
         the website, so live's product is made after the first deploy
         (stage 4), once comehang.app shows the upgrade, its price, the
         terms, and the refund promise. Every project keeps a
         `functions/.env.<projectId>`, since a deploy needs the settings
         even before the product exists. Left open until live's product
         is made in stage 4.
3. **Netlify**:
   - [x] Two sites, both built from `main` with `npm run build` into
         `dist` on Node 24 (decided 2026-11-09, over one site with a
         staging branch, so each keeps simple settings and nothing extra is
         pushed): `come-hang`, the live site, with deploy previews and branch
         deploys off, and `come-hang-staging`, with branch deploys off and
         deploy previews on, so pull requests preview against staging. The
         staging site sets `SITE_NOINDEX` to `true`, which makes its build
         add an `X-Robots-Tag: noindex` rule to `_headers`
         (`deploy-files.ts`), so staging stays out of search. Each
         variable is left unmarked as secret, since Netlify fails a build
         that ships a secret's value, and the `VITE_` ones ship by design.
   - [x] comehang.app on the live site and `staging.comehang.app` on the
         staging site, with `@`, `www`, and `staging` as CNAMEs to each
         site's `.netlify.app` name in Cloudflare, never fixed A addresses,
         which go stale. They stay DNS only until Netlify has issued its own
         certificate for the domain, which it does only while it can see
         the record unproxied, and Cloudflare's Edge Certificate shows
         Active, then are proxied. Netlify sends the `http` to `https`
         redirect only once its certificate exists. Staging's was done
         2026-11-09, and comehang.app's, with `www` redirecting to it, the
         same night in stage 4, once the paywall was on.
   - [x] `VITE_FIREBASE_CONFIG` set in Netlify for each environment, the
         project's web config as JSON, which the build reads its policy
         and sign-in passthrough from, and `VITE_FIREBASE_VAPID_KEY`, the
         project's web push public key from its Cloud Messaging settings.
         Set on both sites 2026-11-09. Google sign-in also needs
         `https://apis.google.com` in script-src, where Firebase loads a
         helper before the sign-in page, which the build adds for any
         project: staging's first sign-in failed with an internal error
         without it (2026-11-09), since the test suites sign in against the
         emulator, which loads no helper.
   - [ ] Sign-in on the app's own domain: the site's domains in Firebase
         Auth's authorized domains, and each domain's
         `https://<domain>/__/auth/handler` added as an authorized redirect
         URI on the project's Google OAuth client. Deploy previews change
         their address each time, so Google sign-in is tried on the fixed
         staging address. Each project's Google provider is turned on with
         the public name "Come Hang", its OAuth client's JavaScript origins
         list each domain, its unused localhost entries removed, and its
         consent screen, edited as the support account, names
         support@comehang.app, the home page, privacy policy, terms, and
         comehang.app as an authorized domain, with no logo, which would
         need Google's brand review, and is published to production, since
         a screen in testing lets only listed test users sign in. Staging's
         worked 2026-11-09, linking Google on staging.comehang.app; live's,
         set up the same day for comehang.app and www.comehang.app, is
         tried once comehang.app is attached.
   - [x] A Google account on support@comehang.app (added 2026-11-09), as
         ease-my-life has on its own support address, given access to both
         projects as Owner, so the sign-in consent screen can name it as the
         user support email. Created 2026-11-09.
   - [x] The API key restricted to the site's domains: each project's
         browser key limited to websites, its own domains and its
         `firebaseapp.com` sign-in page, its API list left as Firebase set
         it. Both done 2026-11-09.
   - [ ] App Check: a reCAPTCHA Enterprise site key for each project's
         domain, set as `VITE_APPCHECK_SITE_KEY` in Netlify for that
         environment, and the app registered with App Check. Deploy
         previews aren't on the key, so they fail App Check, as
         ease-my-life's do. Each key is score-based, with no checkbox, and
         every service stays unenforced until real requests show as
         verified. Staging's showed 67 of 67 verified on 2026-11-09; live's
         key, for comehang.app and www.comehang.app, is registered and
         built in, waiting for the domain.
   - [x] DNSSEC turned on once the domain is active: Cloudflare signs the
         zone, and its DS record goes in at name.com with Max Sig Life
         left blank, then Confirm clicked in Cloudflare, which the record
         waits on. Done 2026-11-09: the `.app` registry holds the record,
         and after purging the resolvers' saved copies at Cloudflare's and
         Google's purge pages, the site, mail, SPF, DKIM, and DMARC records
         all come back verified from both.
4. **First deploy**:
   - [x] Live Polar, once the site is up (moved here 2026-11-09): the
         product made as staging's was, its real token and webhook secret
         replacing the placeholders, its ID in
         `functions/.env.come-hang-70edb`, the webhook pointed at live's
         `polWebFun`, the functions deployed again, and Polar's account
         review passed. Done 2026-11-10: a real purchase on comehang.app
         showed the upgrade in Settings and a full refund took it away. The
         first delivery went to staging's webhook, whose URL the reused
         endpoint still held, and was redelivered once the URL was fixed,
         so a Polar endpoint's URL is worth checking after any edit. Polar's
         account review is Polar's own to finish.
   - [x] The paywall switched on for launch (Section 18): `payLocFun` in
         `firestore.rules` and `PAY_LOC_BOO` in
         `functions/src/daily-run.ts` changed together (2026-11-09), the
         rules suite's main project moved to an open copy and two tests that
         own two groups marking their identity paid.
   - [x] The rules (Firestore, Realtime Database, Storage) and the Cloud
         Functions, both schedules included, deployed to staging, and to
         live too (2026-11-09), the paywall's rules and daily run deployed
         to both once it was switched on.
   - [x] The privacy policy and terms written (2026-11-03), published at
         `/privacy` and `/terms` with the first deploy, before Google
         sign-in is set up (its verification asks for both URLs). Worth a
         lawyer's look before launch.
   - [x] Netlify Forms: after the first deploy with Settings' support form,
         email notifications turned on for the `support` form in Netlify's
         dashboard under Forms, or its messages never reach the maker. Done 2026-11-09.
   - [x] Checked through Cloudflare, as the maker's other sites were: the
         pages, the redirects, every security header, the head tags, the
         crawler files and icons, the mail records, and that TLS 1.0 and
         1.1 are refused. Done 2026-11-09:
         `http` and `www` redirect to `https://comehang.app` with the path
         kept, every security header arrives through Cloudflare with no
         `noindex`, TLS 1.0 and 1.1 are refused, and the legal pages, crawler
         files, icons, card, and head tags are served. The manifest came
         back as `application/octet-stream`, so `_headers` gained a rule
         sending it as `application/manifest+json`, as ease-my-life's does.
5. **Real-device checks against staging**, which the test suites can't
   cover without a real project:
   - [ ] Google sign-in, App Check, chat, and pushes all working under the
         built policy, Google sign-in in the installed iPhone app included.
   - [ ] Installing, on iPhone, iPad, and Android.
   - [ ] Pushes, which never arrive under the emulators: the notifications
         card turns them on, a message from another member pushes, a
         bring-list line doesn't, and a tap opens the right group and
         section.
   - [x] A sandbox purchase, and its refund: done on
         staging.comehang.app 2026-11-10, the upgrade showing in Settings
         after the test card's payment and leaving after a full refund.
   - [ ] Photos: a photo taken sideways comes out upright; an iPhone's HEIC
         photo shares from Safari, and a computer's browser that can't read
         it says so; two members adding photos at once; a photo opened on
         a second device while the first is still uploading; and group and
         data deletion clearing photos and their files.
   - [ ] App Check enforcement turned on for Firestore, RTDB, Storage, and
         Functions once the console's metrics show tokens arriving and
         nearly every request verified.
6. **Search and outside checks** (added 2026-11-10), once the live site
   is settled:
   - [ ] Google Search Console: comehang.app added as a domain property,
         verified by the TXT record it gives, added in Cloudflare as DNS
         only, as the maker's other domains are, and the sitemap
         (`https://comehang.app/sitemap.xml`) submitted.
   - [ ] Bing Webmaster Tools: the site imported from Search Console, or
         verified on its own, and the same sitemap submitted.
   - [ ] The security headers checked from outside, through a scanner
         such as securityheaders.com and Mozilla's HTTP Observatory, on
         comehang.app, with anything they flag either fixed in `_headers`
         or recorded here with why it stays.
   - [ ] The social preview checked through opengraph.xyz and the
         platforms' own tools (Facebook's Sharing Debugger, LinkedIn's
         Post Inspector), which also refresh a stale cached card: the
         title, description, and card image show on comehang.app's link.

**Lower priority, not needed before launch**:
- Testing follows the global rules (Playwright in Chromium, Firefox, and
  WebKit, the axe accessibility scan, ESLint), plus the security rules
  tested through the emulator suite, given how much of this design's
  correctness rests on rules being right.

---

## 15. Billing Plan & Cost Protection

Decided 2026-10-22: the project runs on Firebase's Blaze (pay-as-you-go)
plan, because Storage, TTL deletes, and the Cloud Functions that send
push notifications all need it (Section 3). Blaze keeps every Spark free
quota, so expected cost is $0, but it has **no built-in spending cap**,
so cost protection is layered on:

1. **Budget alerts**: a Google Cloud budget emailing at low thresholds
   (for example $1, $5, and $10), so any real spending is noticed early.
2. **Automatic billing cutoff**: Google's documented pattern, "Disable
   billing usage with notifications." The budget publishes to a Pub/Sub
   topic, and a small Cloud Function subscribed to it unlinks the
   project's billing account once spending passes a set ceiling. Built
   2026-11-09 as `bilCutFun` in `functions/src/billing-cutoff.ts`: each
   project's budget publishes to a `billing-cutoff` topic, the ceiling is the
   budget's own amount, read from each message, so no figure sits in the
   code. The function runs as the project's default compute service
   account, which needs only the Project Billing Manager role on the
   project, with the Cloud Billing API on: on staging (2026-11-09), a
   published over-budget message unlinked billing with that role alone, and
   relinking it by hand brought back Blaze, the budget, and the spend caps.
   Caveats to accept knowingly:
   - Budget notifications lag behind real usage by hours, so spending can
     overshoot the ceiling somewhat before the cutoff fires. The ceiling
     is set below what would actually hurt.
   - Unlinking billing stops every paid service in the project at once:
     the app goes down until billing is re-enabled by hand. That's the
     intended outcome (an outage instead of a bill), but Google warns
     resources may not shut down gracefully, so what happens to Storage
     data and TTL policies when billing returns must be checked before
     relying on it. Staging's test ran before it held any data or TTL
     policies, so that check waits for staging's first real data.
3. **Preventing the spike in the first place**:
   - App Check at launch, so only the real app can call Firebase; a
     script holding the public config gets rejected. On the web it uses
     reCAPTCHA, which has a free monthly allowance.
   - `maxInstances` on every Cloud Function, so a flood of triggers can't
     scale functions without limit.
   - Spend caps (added 2026-11-09), Google's newer budgets that pause one
     service for the rest of the month once it spends its amount, counted
     before credits and within minutes rather than hours. They cover only a
     few services, of this app's only Cloud Functions, so each project has
     two, on Cloud Run Functions and on Cloud Run, since second-generation
     functions run as Cloud Run services and Google doesn't say under which
     their compute is billed. A pause stops every function (pushes, the
     membership mirror, the cleanups) until the month resets or the cap is
     lifted by hand.
   - Security rules that never allow listing or open-ended queries
     (Section 11.6), so no single request can read a whole collection.

**Pros**: everything in the design works as originally written; free
quotas still apply; the cutoff turns the worst case into downtime rather
than an unbounded bill.
**Cons**: a credit card is on file; the cutoff isn't instant, so a small
overshoot is possible; a triggered cutoff takes the whole app offline
until it's re-enabled by hand.

---

## 16. Install Flow

Decided 2026-10-22: the app **strongly** recommends installing it to the
home screen, from the very first visit, and explains exactly why. On
iPhone and iPad this is close to required:
- **Storage**: Safari deletes a site's stored data after 7 days of
  browsing without a visit. An installed home-screen app keeps its own
  day count, which only advances while the app is used, and WebKit says
  its data isn't expected to be deleted. Uninstalled, the app would lose
  the anonymous identity, private key, and chat history between events.
- **Notifications**: iOS only allows web push for installed apps, and
  only asks permission after a tap inside the installed app.
- **No carry-over**: an installed iOS app has its own storage, separate
  from Safari's, so anything done in Safari first (an identity, a joined
  group, cached chat) does not come with it. The prompt therefore comes
  *before* the app creates an identity or joins a group, not after.

**Decided (2026-11-03): on iPhone and iPad the install steps come first,
with a way past.** In Safari, before the landing page, a join screen, or
anything else, the install screen (`src/screens/install-ios.tsx`) says why
to install: nothing done in Safari moves to the app installed later,
Safari deletes a site's data after 7 days without a visit, and only the
installed app gets notifications. It then lists Safari's steps (Share, then
"Add to Home Screen"). A quieter "Continue in Safari" below says what that
risks, opens the app with focus on its main area, and is kept on the
device, so later visits go straight in. An installed app, which Safari
reports through `navigator.standalone`, never sees the steps.

Android and desktop Chrome share storage between the browser and the
installed app, so data carries over there, and Chrome offers an install
button the app can trigger itself (`beforeinstallprompt`). The
recommendation still shows, just without blocking. **Decided
(2026-11-03)**: where the browser offers its prompt, a note on the landing
page's install section, the welcome, and the join screen (`src/ui/install-note.tsx`) suggests installing, with
Install and "Not now", which is kept on the device; and Settings' part for
this phone keeps an Install button, or says how to install where the
browser has no prompt, until the app is installed.
`src/platform/install.ts` keeps the prompt from the moment the app loads,
since the browser offers it once.

**Carrying an invite through the install.** Most people will arrive
by tapping an invite link, which opens in Safari. After installing, the
home-screen app opens at its own start address, so the invite token may
be lost along the way. Still to test on a real iPhone: whether "Add to
Home Screen" from the invite page keeps that page's address. **Decided
(2026-11-03): the invite page in Safari doesn't name the group.** Reading
the invite needs a sign-in, which would leave an identity in Safari's
storage that the installed app can't use, so the install screen says only
that there's an invite, shows its link, and offers to copy it before the
steps, adding a last step of pasting it once the app opens. Nothing on
the install screen signs in or opens Firestore.

**Decided (2026-10-22): "Join with an invite link" is a permanent part of
the app**, not only an install workaround. The installed app's first
screen offers it, and so does the group list for existing users, who
paste a link someone sent them instead of opening it in the browser
(which, on iOS, would land in Safari's separate storage rather than the
installed app). Built 2026-11-03: the landing page, the welcome, the rail,
and the phone's
group sheet each open a screen with one field
(`src/screens/paste-invite.tsx`), which reads the token from the whole
link, on any address, or a bare token (`src/core/invite-link.ts`), and
opens the join screen in its place, so back returns to where the paste
began. Anything else says it isn't an invite link. The invite screen offers to copy its link before
showing the install steps, so the paste is ready once the app opens.

**Pros**: protects the identity and history the whole design relies on;
makes push notifications possible on iOS at all; honest about why.
**Cons**: real friction before first use, especially on iOS, where
installing takes several manual steps the app can only describe, not
trigger.

---

## 17. Join Approval

Decided 2026-10-22: **every join through an invite link waits for
approval** by a current member, always, with no per-group setting to turn
it off. Most groups would never change a default, and a group flooded by
bots or strangers through a leaked link would be close to impossible to
clean up, likely ending with the group deleted and recreated. Approval
also solves the group-key handoff Section 6 left open: the approver is
online and holds the key by definition.

**Who can approve**: any current member, not only the creator, so a
request never waits on one person (the same reasoning as Section 11.9's
history requests). Declining is open to any member too.

**How the approver recognizes the person** (decided 2026-10-22):
- After opening the link, the joiner enters their **full name**, one
  field, with a hint to use the name the group knows them by, first and
  last. One field rather than separate first and last fields, because
  plenty of real names don't split that way (a single name, a two-part
  surname), and a form can't force the right answer anyway.
- An optional short **note to the group** ("Dana's cousin", "from the
  Tuesday book club"), which helps whenever the name alone isn't enough,
  such as two members who share a name or a name the approver doesn't
  know.
- The name becomes the joiner's starting per-group display name (Section
  11.3), so they're not asked twice: the approving member encrypts it
  under the group key into the new membership (decided 2026-10-28), since
  the request holding it ends with the approval. The new member is never
  shown without a name, and the joiner's device doesn't have to keep what
  they typed while they wait. The joiner can change it afterwards.
- A typed name is only a claim. Anyone holding the link can type any
  name, including a real member's, so the approval screen says to
  approve only people you recognize, and to check with them outside the
  app when unsure. If a request reuses a current member's display name,
  the screen points that out.

**Data**: `/groups/{groupId}/joinRequests/{uid}` in Firestore:

| Field | Type | Notes |
|---|---|---|
| `nameText` | plaintext | The joiner's entered name, under the person name limits (Section 11.10). Can't be encrypted with the group key, since the joiner doesn't have it yet. Deleted on approval or decline, after which the name lives only in the encrypted `displayNameEnc`. Same narrow exception as the group name. |
| `noteText` | plaintext, optional | The note to the group, same treatment, under the note limits (Section 11.10). |
| `inviteToken` | plaintext | The token used. The rule checks it against `/invites/{inviteToken}` (still active, for this group), that the UID isn't in `removedUids` and isn't already a member, that the joiner has published a public key (11.1), and that they have a free slot under their belong cap, which the approval checks again (Section 18). |
| `requestedAt` | plaintext | Timestamp. |
| `expireAt` | plaintext, TTL field | 7 days out, so ignored requests clear themselves. The client sets it from its own clock, so the rules accept anything from 6 to 8 days after the server's time. |

The doc ID is the joiner's UID, so one identity can have only one request
per group. The joiner and the members can read a request; it can't be
edited once filed, and it ends when the joiner withdraws it or any member
declines or approves it. **Approval** is one transaction by the approving member: read
the joiner's `publicKey` from `/users/{uid}`, create
`/members/{uid}` with the group key wrapped for it, add the group to the
joiner's `/accounts/{uid}` member map, raise the group's `memberCount` by one and
set its `countedUid` to the joiner, and delete the request. The rules let a member change another person's
account only that way: adding this one group, alongside creating their
member doc, within the joiner's and the group's caps (Section 18). The member doc carries the
joiner's name from the request, encrypted. The joiner's app sees the membership appear and
unwraps the key from it. **Declining** deletes the
request; declining and blocking adds the UID to `removedUids` as well.

**Floods**:
- Members get one grouped notification ("3 people want to join") rather
  than one push per request, so a flood can't flood phones too (decided
  2026-10-29): each new request pushes every member the count of unexpired
  requests waiting, tagged by the group so it replaces the group's earlier
  join push on the phone. A flood still sends one push per request, which
  App Check keeps scripts from causing.
- The pending list offers "Decline all", and rotating the link (Section
  9) stops new requests at the source. Pending requests made with an old
  link stay until handled, since most are likely real people.
- App Check (Section 15) blocks scripted requests from outside the app.

**Pros**: a leaked link can't put anyone in a group by itself; the key
handoff gets a natural owner; the pending list gives the "who's waiting"
visibility the deferred invite tracking wanted.
**Cons**: every new member waits for someone to approve them; a name is
self-reported, so approval still rests on the approver's own judgment.

---

## 18. Paid Multi-Group & Group Ownership

Decided 2026-10-22: owning more than one group is a paid feature, a
one-time $9.99 purchase, to discourage abuse and as a source of income.
It was built from the start and kept unlocked for everyone until the
paywall was switched on for launch (decided 2026-11-05, switched
2026-11-09), the landing page selling the upgrade from day one (Section 14).

**Limits (decided 2026-10-22)**:

| | Free | Paid |
|---|---|---|
| Groups you own | 1 | 10 |
| Groups you belong to, owned or not | 10 | 20 |
| Members in a group you own | 20 | 50 |

- **The paywall counts groups you currently own, not groups you've
  joined.** The owner is the person getting the value, so they're the
  natural buyer; an invited friend who already uses the app for another
  group never hits a paywall just for being invited; and creating groups
  is what a spammer or bot would abuse, while joining is already gated by
  approval (Section 17). It counts groups owned *now*, so deleting or
  transferring one frees its slot.
- **Belonging to more than 10 groups is paid too** (decided 2026-10-22,
  lowered from 20 for everyone), to give paid users more value. Ten is
  still far more than most people need, so an invited friend almost never
  meets the paywall just for being invited; one who does sees why when
  the join is blocked.
- **A group's member cap follows its owner's status**: 50 if the owner is
  paid, 20 otherwise. Each message's waiting-on list (Section 11.7)
  grow with the group, and every joiner needs the key wrapped for them,
  so smaller groups are cheaper too.
- **Caps start conservative** because raising one later is one number in
  the rules and the app, while lowering one strands people already over
  it.
- **Over a limit never removes anything.** Whenever a group or a user
  ends up over a cap (a transfer below, a refund), everything already
  there stays; only adding more is blocked until it's back under.

**Refunds (decided 2026-11-03)**: the terms promise a full refund of the
upgrade on request within 14 days of buying, for any reason, by writing to
support@comehang.app. The refund is made in Polar, whose `order.refunded`
webhook removes the flag, and the "over a limit" rule above applies.

**Buying (decided 2026-10-22)**:
- Requires linking Google sign-in (Section 8). Paid status is tied to the
  UID, and an anonymous UID can be lost with the device, so a purchase
  without a recoverable sign-in would be a support problem. ease-my-life
  reached the same conclusion for its paid accounts.
- Polar takes the payment, as in ease-my-life. Its webhook, a Cloud
  Function here, writes a permanent `paid` flag on `/accounts/{uid}`
  (Section 11.1), which the rules read and no client can write. A refund
  clears the flag, and the "over a limit" rule above applies.
- **How it runs** (decided 2026-10-29, `functions/src/purchase.ts` and
  `src/state/purchase.ts`): the app calls `cheCreFun`, which refuses an
  identity not linked to Google or already paid, and creates a Polar
  checkout tagged with the UID (as the customer's external ID and in the
  order's metadata) and prefilled with the Google email, returning its
  address for the app to open. Polar sends the buyer back to a fixed
  address per project, the app's root with `?purchase=done`, so the
  function can't be made to redirect anywhere else. `polWebFun` takes
  Polar's webhook: it checks the Standard Webhooks signature and refuses
  one unsigned, mis-signed, or more than five minutes old, then sets the
  flag for a paid order of the product and removes it for a fully refunded
  one. Each delivery's ID is recorded in `/polarEvents`, in the same
  transaction as the flag, so a replayed event never acts twice while a
  failed write leaves Polar free to retry. An order for another product,
  another kind of event, or an order naming no account is logged and
  acknowledged. Each project gives its own settings: the token and webhook
  secret in Secret Manager, and the product, the API's address (the
  sandbox for staging, live Polar for live), and the return address in its
  `functions/.env.<projectId>`. A project without a product sells and
  grants nothing. The price, $9.99, lives in the Polar product, and the
  screens will show it.

**Ownership transfer (decided 2026-10-22)**:
- **Offer, then accept.** The owner offers ownership to a current member
  (`pendingOwnerUid`, with `pendingOfferedAt`), and it moves only when that
  member accepts, so nobody is handed a group, and a slot of theirs,
  without agreeing, apart from an owner deleting their data (below). The owner can withdraw the offer and the member can
  decline it, and a new offer replaces a standing one.
- **The new owner needs a free slot**: a free user who already owns a
  group, or a paid user who owns 10, can't accept until they delete or
  hand off one of their own (or, for a free user, buy).
- **The owner learns at once whether an offer can land** (decided
  2026-10-26): the rules refuse an offer to a member with no free owned
  slot as it's made, so the owner's tap fails on the spot, and the app
  explains that this member can't take a group right now and to pick
  someone else, without revealing more of their account. An offer is never
  left hanging where the owner might think the handover was done.
- **Every offer ends in a notice to the owner** (decided 2026-10-26): if
  the member accepts, declines, leaves the group, or lets 7 days pass, a
  Cloud Function leaves the owner a notice (Section 11.1) and a push, and
  the member offered the group gets a push when it's offered. A decline
  goes through a callable Cloud Function, `decOffFun` in
  `functions/src/offer-decline.ts` (decided 2026-10-28), which knows its
  caller, clears the offer in a transaction, and leaves the owner the
  notice, while the rules let only the owner end an offer from the app, so
  a decline can't skip the notice. The plan before was a trigger telling a
  decline from a withdrawal by who wrote it, but a trigger learns its
  writer only in production, never in the emulator, so that could never be
  tested. If the member offered the group leaves or is removed, the group
  change trigger clears the offer, which nobody could accept any more, and
  tells the owner of a leave, since the owner made a removal themselves.
  The rules refuse an acceptance after 7 days, so a forgotten offer can't
  be taken up long after the owner moved on, and the daily function clears
  a lapsed one. The group's settings show a standing offer and when it
  lapses, so the owner can always see where the handover stands.
- **Accepting is one batch** (decided 2026-10-26): the member offered the
  group makes themselves owner and clears the offer, moves the group from
  their member map to their owned map within their caps, and moves it the
  other way in the old owner's account, which the new owner writes since
  the old owner may be away. The rules check each write against the
  others. The old owner stays a member and can leave like anyone else.
- **The member cap may drop**: transferring a 35-member group from a paid
  owner to a free one is allowed, since blocking it could strand a group
  whose owner needs to leave. All 35 stay; new approvals pause until the
  group is under 20 or the new owner buys, and both people see that
  before the transfer completes.
- **An owner can't simply leave.** Leaving requires transferring
  ownership first or deleting the group, so no group is ever left without
  an owner by choice.
- **An owner who deletes their data hands each group on** (decided
  2026-11-03, built in `functions/src/data-deletion.ts`): each group they
  own passes, in one transaction with their leave, to the member who
  joined it earliest, any standing offer cleared, or is deleted whole when
  no one else is in it, so the other members never lose their group. The
  heir isn't asked, since the owner is gone, and may end up over a cap,
  which the "over a limit" rule above covers. The group change trigger
  reads an owner change that also counts the old owner out as this
  handover, and leaves the heir an `ownershipPassed` notice and a push
  instead of telling the departed owner anything.
- **Enforcement in the rules** (decided 2026-10-25): rules can't count
  documents, so each user's private `/accounts/{uid}` keeps two maps of
  their groups, the ones they own and the ones they only belong to, and
  each group keeps a `memberCount`, both
  updated in the same batch as every create, join, leave, removal, and
  transfer (Section 11.1 and 11.2). The rules check the resulting maps and
  count against the caps, reading the paid flag of the user (for groups
  owned and belonged to) or of the group's owner (for members). Since a
  join is approved by someone else, the approver's batch writes the
  joiner's member map entry, and the rules allow exactly that one change.
- **The paywall's switch** (decided 2026-10-25): one rules function,
  `payLocFun`, says whether the paywall is locked; while it's unlocked, every
  user counts as paid, so the paid caps apply to everyone. The checks are
  tested under both answers: the rules suite's main project loads a copy
  with the switch turned off, and a second project the rules as they ship.
  It was switched on for launch on 2026-11-09, together with `PAY_LOC_BOO`
  in `functions/src/daily-run.ts`, which mirrors it so the daily run only
  offers a group to someone the rules would let accept it. A test that
  needs one identity to own several groups marks it paid first, as the
  purchase webhook would.

**Decided (2026-10-22): an owner who disappears.** If the owner stops using the app
without transferring (a lost phone with no linked sign-in, an
uninstall), nobody can remove members, rotate the link, or change group
settings again; chat, events, and approvals keep working, since any
member can do those. So once the owner has been inactive for **30
days**, the longest-standing member can claim ownership, and the old owner
is notified if they ever return. The same slot and member-cap rules as a
transfer apply to the claimant. How it runs (decided 2026-10-26): a daily
scheduled Cloud Function finds groups whose owner hasn't been active for
30 days and offers each one, as an ordinary offer with its 7-day window,
to the longest-standing member who has been active in that time and has a
free owned slot. That member accepts through the same batch as any
transfer, so the rules need nothing extra, and if they decline or let it
lapse, the next run offers it to the next member in line. The old owner
gets a notice that the group was claimed. 30 days is a starting point:
events are mostly near term, so it may come down later.

**Built (2026-10-28)** as `dayRunFun` in `functions/src/daily-run.ts`, run
every day at 08:00 UTC, late night across the US:
- **Offers lapse** once they've stood 7 days. The owner of an offer they
  made gets an `offerLapsed` notice.
- **The claim record** (decided 2026-10-28) is a server-only document,
  `/groups/{groupId}/ownerClaim/current`, which no rule opens to clients,
  so members never learn who turned the group down. It holds who the claim
  offer went to (`offeredUid`), who has passed (`passedUids`), and when
  everyone eligible had passed (`exhaustedAt`).
- **The absent owner is told only of a claim** (decided 2026-10-28): a
  claim offer that's declined, lapses, or whose member leaves records a
  pass and tells nobody, since the owner has nothing to act on. When the
  member accepts, the old owner gets `ownershipClaimed` instead of
  `offerAccepted`, and the record is deleted.
- **When everyone has passed** (decided 2026-10-28), the record says so,
  and 30 days later it clears and the run asks again from the top, so a
  group isn't stranded for good if people change their minds.
- **An owner who comes back** ends the claim: the run deletes the record
  and withdraws a claim offer still standing.
- **A free owned slot** is judged as the rules judge it, so the run never
  offers a group to someone whose acceptance the rules would refuse.
- The emulator can't fire a v2 schedule, so the functions suite calls the
  schedule's handler directly through its `run` method. This adds a plaintext
`lastActiveAt` timestamp to each membership doc (Section 11.3), updated at
most once a day when the member opens the app, to keep writes low.

---

## 19. Private Messages (Post-Launch)

Decided 2026-10-22: direct messages between two members of the same group
ship **after launch**, but chat is shaped now so adding them is cheap.
Reasons for waiting: launch has plenty to prove without a second kind of
conversation, and private messages need blocking and safety controls
designed properly rather than rushed. It isn't a big architectural change,
since it reuses chat:
- **Built now**: chat is keyed by a conversation ID rather than the group
  ID (`/chats/{conversationId}`), with a group's own chat as one kind of
  conversation. Everything in Section 11.7 (waiting-on list, cleanup, TTL) then
  works for a two-person conversation unchanged, and adding private
  messages later needs no change to how group chat is stored.
- **Encryption needs no new exchange**: each user already publishes an
  ECDH public key (Section 11.1), so two members derive a shared private
  key directly from their own private key and the other's public key.
  Other group members can't read it, even with the group key.
- **Scoped to a group**: a conversation belongs to the group both people
  share, and the rules require both to still be members. Leaving or
  being removed from the group ends it, like every other group access.
- **Needed before it ships**: a way to block a person or turn off private
  messages, since it opens a one-to-one channel that group approval
  doesn't vet; and a decision on history recovery, since only the other
  person holds a copy (Section 11.9 would become a request to that one
  person).

---

## 20. Event Photos

Decided and built 2026-11-07, to ship at launch. Members share photos from an event with the group.
People love to share pictures from a get-together, so it's an expected
feature, but photos are far heavier than anything else the app moves, so
the design keeps them small, encrypted, short-lived on the server, and kept
on the devices that want them, the same shape as chat (Section 5).
The app's side is `src/state/photos.ts`, with the shrinking in
`src/platform/image.ts` and the part and its viewer in
`src/screens/event-photos.tsx`, and the server's is `functions/src/photos.ts`
and the photo rules in `firestore.rules` and `storage.rules`.

### Where it lives
- **In each event's details**, not a tab of its own, since the tab bar has
  no room and photos belong to an event. The event's sheet, and the panel
  beside the chat from 1,100px, gain a Photos part below the bring-list: a
  grid of thumbnails, an "Add photos" button, and a count. On the day, the
  pinned event in the chat already opens that sheet, so photos are one tap
  from where the group is talking.
- **A tapped thumbnail opens a viewer**, a sheet showing one photo at a
  time, with round arrows over its left and right sides stepping to the
  previous and next photo, as the left and right arrow keys and a sideways
  swipe across the photo also do, the new photo sliding in briefly from that
  side in a frame that keeps one size, who added it and when, "Save to device",
  and "Delete" for the member who added it or the group's owner.
- **The Events section keeps an ended event in view** until it's deleted,
  under a "Recently ended" heading below the upcoming events, since most
  photos are shared after the event and the list now shows only events
  that haven't ended (Section 14).

### How a photo is shared
1. **Shrunk on the device**: the picked image is decoded, turned upright
   from its own orientation, and drawn through a canvas at up to 1,600px on
   its long side, plus a thumbnail at about 320px. A phone photo of 3 to
   12 MB becomes roughly 200 to 400 KB. Redrawing also drops everything
   else the file carried, such as the GPS position most cameras embed, so a
   photo never shares a location the member didn't choose to share. Both
   are WebP where the browser can encode it from a canvas, and JPEG where it
   can't, as in Safari, since every browser shows both. No library is
   needed. JPEG XL was considered and set aside (decided 2026-11-07): no
   browser encodes it from a canvas, so it would need an encoder shipped as
   third-party code, and only Safari shows it by default.
2. **Encrypted with the group key** (Section 6), the thumbnail and the full
   photo each under its own IV, so the server holds only ciphertext.
3. **The thumbnail goes in Firestore**, inside the photo's document, and
   **the full photo goes in Cloud Storage**. One Firestore read then brings
   a photo's details and its thumbnail together, and Storage is touched only
   when someone opens the full photo, which keeps Storage's operation count
   low (see Cost below) and spreads the load across both services' free
   allowances. A thumbnail of about 20 to 30 KB sits well inside
   Firestore's 1 MB document limit.
4. **Members load thumbnails as the Photos part opens** and a full photo only
   when they open it, the biggest saving after shrinking, since most
   bandwidth is members downloading, not the one upload.

### Data model
- **`/groups/{groupId}/events/{eventId}/photos/{photoId}`**:

| Field | Type | Notes |
|---|---|---|
| `thumbEnc` / `thumbIv` | ciphertext bytes | The encrypted thumbnail, capped by the rules at about 40 KB. |
| `fullIv` | bytes | The full photo's IV, 12 bytes. |
| `uploaderUid` | plaintext | Who added it, for deleting their own and for showing their name. |
| `createdAt` | plaintext timestamp | Order in the grid. |
| `expireAt` | plaintext, TTL field | The event's own `expireAt`, moved with it, as items' is (Section 11.5). |

- **`photos/{groupId}/{eventId}/{photoId}`** in Cloud Storage: the
  encrypted full photo, typed as generic binary with no custom metadata,
  as history bundles are (Section 11.9), capped by the rules at 1 MB,
  which a photo shrunk to 1,600px fits well within at the highest quality
  that fits.
- **`/groups/{groupId}/events/{eventId}/photoTally/{tallyId}`**: the
  counts the caps are checked against, one document named `all` for the
  event and one per member under their UID, each holding its count and the
  ID of the photo that last raised it. Adding a photo raises both in the
  same transaction, which the rules require, so a count can't be skipped,
  and deleting a photo doesn't lower them, so the caps count photos added.
- **Rules**: a member adds a photo document as its uploader from the
  event's start until it's deleted, with both counts raised within their
  caps, and uploads the full photo once, only to the path of a document
  they added, never replacing it. Members read both. The uploader or the
  group's owner deletes a photo. Only Cloud Functions change a photo
  document. Nobody lists a Storage folder.
- **A Cloud Function keeps photos in step with their event**: when an
  event's end moves, it moves each photo's `expireAt` with it, and when an
  event is deleted, by its TTL, a cancel, or its group's deletion, it
  deletes the event's photos and tallies. So an event's own batches never
  touch its photos, and Firestore's 500-write limit on a batch never
  bounds how many an event holds.

### Retention
- **On the server, a photo goes with its event**: 48 hours after the event
  ends (Section 5), or when it's cancelled, when its group is deleted, or
  when its uploader or the owner deletes it.
- **Each photo document's deletion deletes its full photo**: a Cloud
  Function triggered on it removes the Storage file, whatever deleted the
  document, its own TTL included. The bucket's existing 15-day
  lifecycle rule (Section 14's checklist) is the backstop, since no photo
  lives longer than a 7-day event plus 48 hours.
- **On the device**, thumbnails stay in Firestore's own offline cache with
  their documents, which goes with them, and opened full photos are held in
  memory only while the app is open, so a photo is decrypted once and
  nothing about it is written to the device's storage by the app. A member
  keeps a photo by saving it to the device: the share sheet on a touch
  screen (the Web Share API with files, which puts it in the photo
  library), and a download on a computer, whose own share sheet sends files
  on rather than keeping them, with "Save all" for an event's photos. On a
  computer "Save all" downloads one ZIP archive named after the event
  (decided 2026-11-07), packed in the app with no library and the photos
  stored uncompressed, since they're already compressed, so many photos
  don't mean many downloads, or, in Firefox, a tab for each. A
  saved photo keeps the format it was shared in (decided 2026-11-07): WebP
  is shown by today's phone and computer photo apps, and converting to JPEG
  on save waits until someone runs into software that won't open it.
- **No backlog for new devices or late joiners**: they see the photos still
  on the server. Photos aren't part of history requests (Section 11.9),
  since a bundle of them would be far too large.

### Limits (decided 2026-11-07)

| | Free owner | Paid owner |
|---|---|---|
| Photos per event | 100 | 300 |
| Photos one member adds per event | 30 | 60 |

The cap follows the group owner's status, as the member cap does
(Section 18), so photos are one more thing the upgrade gives a group, and
the landing page's free and paid cards list them. The Firestore rules
check the counts through the tallies above, and the Storage rules each
file's size.

### Taking photos
- **From the event's start** until it's deleted, 48 hours after it ends
  (decided 2026-11-07), though most photos will be shared during and after
  it.
- **One line in the chat per burst**: once a member has finished adding
  photos, the chat gets one status line, "{name} just uploaded photos for
  {event name}", rather than one per photo. It's posted 60 seconds after
  their last photo finishes uploading with nothing else on its way, or as
  soon as they leave the event's photos, by closing its details, moving to
  another section, or switching away from the app, whichever comes first.
  It's a status post like "I'm on my way" (Sections 10 and 11.7), carrying
  the event's ID and its title as it stood, since the event is gone long
  before the chat is, and a title that fails its limits shows as an update
  this version can't show. While the event exists, the line is a link that
  opens the Events section with the event's sheet scrolled to its photos,
  the event's ID carried in the screen's history entry (built 2026-11-07).

### Cost
On Blaze, Cloud Storage in us-central1 has no-cost usage of 5 GB stored
and 100 GB downloaded a month, with about 5,000 uploads and 50,000
downloads a month (the download count's period to be confirmed on the live
pricing page), and normal rates past that, about $0.12 per GB downloaded.
A group of 10 sharing 100 photos at one event stores about 30 MB for a few
days, downloads 100 to 150 MB if everyone opens about half the full photos,
and uses a few hundred Storage operations, since the thumbnails come from
Firestore: cents per event at most, inside the no-cost usage for dozens of
active groups a month. The thumbnails add Firestore reads, one per photo
each time a member loads an event's photos, inside Firestore's daily
no-cost reads at this scale; reading only photos newer than the device's
newest is an optimization if that grows. The budget alerts and billing
cutoff (Section 15) cover a runaway.

### Safety
- **The security policy allows `blob:` images** (`img-src 'self' blob:` in
  `public/_headers`), since a photo is decrypted on the device and shown
  from a temporary address only the page itself can make; nothing else
  from another origin is allowed.
- Photos are encrypted, so nothing can be scanned. Groups are invite-only
  with every join approved (Section 17), the owner can delete any photo and
  remove a member, and a removed member's photos stay until their event's
  deletion unless the owner deletes them.
- The terms gain rules for what may be shared, saying we can't see it,
  worth a lawyer's look before photos ship.

**Pros**: the server never sees a photo and keeps it for days at most;
photos fit the app's privacy model and cost cents; the upgrade gains a
clear benefit; and nothing new is needed from outside the stack already in
use.
**Cons**: photos vanish from the server 48 hours after their event, so a
member who never saves them loses them; a new device or late joiner can't
get earlier photos once they're gone; device storage fills faster than with
chat, and Safari may clear it under pressure; and encrypted photos can't be
moderated by anyone but the group.

## 21. Profile Photos

Decided and built 2026-11-08, to ship at launch. A member can add one
profile photo, which shows in place of their colored initials wherever their
avatar shows. People expect it of an app with chat, and a face tells members
apart better than a color. The colors stay: everyone gets one as the default
before they add a photo, some never will, and the status lines in the chat
wear them. A photo shows inside its member's circle, a little smaller, so
the color stays as a ring around it. The app's side is `src/state/avatars.ts`,
with the cropping in `src/platform/image.ts`, the device's copies in
`src/platform/avatar-store.ts`, the circles' contents in
`src/ui/member-avatar.tsx`, and the Settings part in
`src/screens/profile-settings.tsx`. The server's side is
`functions/src/avatars.ts`, with the rules in `firestore.rules` and
`storage.rules`.

### One photo, every group
- **Set once, in Settings**: a "Your profile" part, first among the
  member's own parts, picks a photo with "Add a photo", previews it, and
  saves it with "Save photo", or sets it aside with "Cancel". A saved photo
  can be changed or removed with "Remove photo", which brings back the
  colored initials. With no group, the part says one comes first, since a
  photo is kept in a group.
- **A copy in each group**: every group the member is in keeps its own copy,
  encrypted under that group's key, like everything else in it, so Firebase
  never sees the photo and a group's members can read only their own group's
  copy. Every copy carries the same ID.
- **Kept in step**: whenever the member's groups change, as when they join
  one, and whenever the Settings part opens, the app finds the copy set most
  recently and copies it, under the same ID, into any group missing it or
  holding an older one. Removing the photo removes every copy, so no group is
  left to copy it back from. A removal that fails partway can leave a copy
  the next sync spreads again, which removing once more fixes.

### Data model
- **The file**: `avatars/{groupId}/{uid}` in Cloud Storage, the photo
  encrypted with AES-GCM under the group key, one opaque file of at most
  64 KB with no custom metadata. Members of the group read it, and only the
  member writes or deletes their own, while still in the group.
- **The membership** (11.3) names it with three fields, all present or all
  absent: `avatarId`, the 22-character ID every copy shares; `avatarIv`, the
  12-byte IV; and `avatarAt`, the server's time it was set, which decides
  the newest copy. Only the member changes them, and changing them changes
  nothing else on the membership. The file is uploaded before the fields
  name it, so a reader never finds a name without its file.
- **On the device**: each member's photo is kept decrypted in the device's
  database (an `avatars` store) under its group and member, with its ID, so
  it downloads once, shows offline, and downloads again only when the ID
  changes.

### Limits (decided 2026-11-08)
- **Cropped and shrunk on the device**: the picked image is turned upright,
  cropped to the square at its middle, and drawn at up to 256px a side, as
  WebP where the browser can and JPEG where it can't, at the highest of a
  few qualities that fits 64 KB. Avatars show at about 26 to 34px, and 256px
  stays sharp on the densest screens. Redrawing drops everything else the
  file carried, such as a camera's position.
- **What can be picked**: anything the browser can decode, the same as event
  photos (Section 20). A file it can't read, such as HEIC on a computer,
  says so and asks for a JPEG, PNG, or WebP.
- **No cropper**: the middle square is used. A drag-and-zoom cropper can
  come later.

### Where it shows
The circles in the chat beside a member's first message in a run, the
People section's member rows, the bring-list's claims, and the Map section's
list. The Map's plot keeps its colored dots with initials, since it's drawn
as one SVG.

### Retention
A photo goes with its membership: a Cloud Function deletes the file when
the membership document is deleted, however that happens, whether the
member leaves, is removed, deletes their data, or the group is deleted, and
deleting a group also clears its whole `avatars` folder. A member who
removes their photo clears the fields and deletes the file themselves.

**Pros**: members are easier to tell apart, as people expect; photos fit
the encryption model; and they're tiny, so storage and downloads cost next
to nothing.
**Cons**: the photo is stored once per group, a few KB each; an avatar
already on screen keeps its old photo until its section loads again; and
the middle square may cut a face that isn't centered until a cropper is
added.
