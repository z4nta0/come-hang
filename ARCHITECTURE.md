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

Last updated: 2026-10-28 (members, leaving, removal, link rotation, and
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
- `vite-plugin-pwa` gives install/offline-shell caching for free without
  hand-rolling a service worker.
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
| Removed-member blocklist | Firestore | `/groups/{groupId}.removedUids` (or subcollection) |
| Invite token | Firestore | `/invites/{token} → { groupId }`, one active token per group |
| Events | Firestore | Under the owning group |
| Notes / task-assignments | Firestore | Under the owning event; single-owner field per claimable item |
| Chat messages | RTDB | Under the owning conversation, each with a waiting-on list of who hasn't received it yet; see Sections 5 and 11.7 |
| Membership mirror | RTDB | `/mirrors/{conversationId}`, written only by a Cloud Function, so the RTDB rules can check membership; see Section 11.7 |
| Live location | Firestore | One doc per user per group, TTL-expired; see Section 11.4 for why this moved off RTDB |
| Presence | RTDB | Standard `onDisconnect()` pattern |
| Push token | Firestore | `/accounts/{uid}/pushToken/current`, the identity's one phone, written and read only by its owner; see Section 11.1 |
| Ownership claim record | Firestore | `/groups/{groupId}/ownerClaim/current`, read and written only by Cloud Functions; see Section 18 |

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
  bandwidth/battery cost down.

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
  - Automatic one-shot location update on every app foreground/open,
    via the Page Visibility API (`visibilitychange`), so simply opening
    the app periodically updates location with no extra action needed.
  - An explicit "I've arrived" action: a one-shot location fix plus a
    distinct status flag (e.g. an "Arrived" badge), separate from the
    ambient live-location display. The flag is encrypted with the position
    (decided 2026-10-28), so Firebase can't tell who has arrived.
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
when it next opens, alongside the push that went out when it happened,
and the owner dismisses it by deleting it. Only Cloud Functions write
notices, which the rules enforce by allowing clients no writes, so a
member can't forge one telling someone a group was deleted. Kinds: a group
deleted (`groupDeleted`), a removal (`removed`), an ownership offer
accepted (`offerAccepted`), declined (`offerDeclined`), lapsed
(`offerLapsed`), or ended by the person offered leaving (`offerLeft`), and
ownership claimed from an inactive owner (`ownershipClaimed`). A notice's
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
pushes off.

| Field | Type | Notes |
|---|---|---|
| `token` | plaintext | FCM's registration token, letters, digits, colons, hyphens, and underscores, at most 4,096 characters. |
| `updatedAt` | plaintext | The server's time of the last refresh. The app rewrites the document each time it opens, at most once a day. |
| `expireAt` | plaintext, TTL field | 60 days after the last refresh, as Firebase advises for a token, so a phone that stopped opening the app is dropped. The app sets it by its own clock, so the rules accept 50 to 70 days out. |

**Pushes** (decided 2026-10-28, `functions/src/push.ts`): each one carries
the group's name as its title and a fixed sentence for its kind, never a
message or a display name, since those are encrypted where the server
can't read them. Sending is best effort: an identity with no token gets no
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
| `locationEnc` / `iv` | ciphertext bytes | The lat/lng, its accuracy, and the "I've arrived" flag, encrypted together. Safe to encrypt since nothing server-side ever queries into it, all distance/proximity math happens client-side after each member decrypts everyone's current location. The rules cap the ciphertext at 128 bytes, and the IV is 12. |
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
| `ciphertext` / `iv` | base64 strings | Message content, AES-GCM under the group key. The IV is 12 bytes (16 base64 characters), and the ciphertext holds 1 to 2,000 characters (Section 11.10) at 3 bytes each plus the 16-byte tag, so at most 8,024 base64 characters. |
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
- **Sending**: a member creates a message with all four fields above and
  nothing else, as themselves, stamped with the server's time. Messages are
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
requester, so the fulfiller forwards the original cached ciphertext
envelopes (`senderUid`, `sentAt`, `ciphertext`, `iv`) as-is. Firebase
relaying the bundle still never sees plaintext, same guarantee as live
chat.

| Path | Service | Notes |
|---|---|---|
| `/groups/{groupId}/historyRequests/{uid}` | Firestore | `{ requestedByUid, kind: 'recovery' \| 'backlog', rangeStart, createdAt, expireAt, status: 'pending' \| 'claimed' \| 'fulfilled', claimedByUid, claimedAt }`, keyed by the asker's UID (decided 2026-10-28), so each member has at most one open request per group, which caps the notifications one person can send. Visible to all current members; an FCM notification fires whenever `status` becomes (or reverts to) `pending`. `expireAt` is a native Firestore TTL field: the app sets it 10 days out by its own clock, and the rules accept 7 to 14 days, so an unfulfilled request quietly disappears instead of lingering forever. |
| `groupHistoryTransfers/{groupId}/{uid}` | Storage | The uploaded bundle of cached ciphertext envelopes, keyed like the request it answers, written only by whoever currently holds the claim. One binary file of at most 25 MB (decided 2026-10-28), about 125,000 typical messages. |

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
- No new cryptography, re-encryption, or key exchange, reuses the
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
for a `backlog` request if their own local cache actually covers it,
specifically, their earliest cached message for that group's chat is at
or before the request's `rangeStart`. This is a purely local check
(their own IndexedDB, no network round trip, no new infrastructure) and
is deliberately based on actual cached coverage rather than `joinedAt`
alone, `joinedAt` only approximates "could plausibly have it," actual
local cache reflects whether they still do. This is what replaces a
priority/ranking system: instead of ordering candidates by likelihood of
having full coverage, under-qualified candidates are simply never shown
the option at all, so the claim race only ever happens among people who
can actually satisfy it.

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
person types usually passes. The rules check every plaintext field
directly. The display name, events, and items are encrypted, so the app
checks them before encrypting and the rules can only cap each ciphertext's
size, at 3 bytes per character plus the 16-byte tag (Sections 11.3 and
11.5). The event and item rows were decided 2026-10-27. A chat message holds
1 to 2,000 characters (decided 2026-10-28), which the rules cap at its
ciphertext's size (Section 11.7); the characters it allows are decided with
the chat screen.

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
  details) cannot be retroactively revoked if that member is later
  removed from the group.
- The group's symmetric key is never rotated when a member is removed.
  They still hold a local copy of it, but rotation is skipped: security
  rules already cut off their access to any *future* ciphertext, so a
  stale key alone gets them nothing without also bypassing the access
  control, and full rotation-on-removal is exactly the kind of
  E2E-grade complexity Section 6 already opted out of.

---

## 13. Open Questions / Not Yet Locked In

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
  install.** A "Paste invite link" option is built in regardless, see
  Section 16; the real-iPhone test of the invite address still decides
  whether it's the main path or only the backup. Also still open, for
  the invite screen's design: whether the invite page shown in Safari
  before the install names the group. Reading an invite needs a sign-in,
  and the app's invite read runs the identity bootstrap, which would leave
  an identity in Safari's storage that the installed app can't use
  (Section 16). The page could skip the name there, or sign in
  anonymously without the rest of the bootstrap, at the cost of one
  never-used Auth account per visitor.
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
  - The app calls `navigator.storage.persist()` on every launch, so the
    browser treats its storage as worth keeping.
- UI: no component library; every component is built in-house.
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
    (`/join/<token>`) opens the invite screen, and a notification's target
    opens its screen. Each is built with the feature it serves.
  - The legal pages, `/privacy` and `/terms`, are static pages served at
    fixed addresses, outside the app, since Google's sign-in verification
    and app listings link to them.

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
  replaced and republished.
- `src/state/groups.ts` creates a group (Sections 9 and 11) once both
  names are tidied and checked (`src/core/text-limits.ts`): the identity
  bootstrap, a new group key and invite token, then one batch with the
  group, the creator's membership holding the key wrapped for them and
  their encrypted display name, the first invite, and the owned slot. The
  key is kept on the device as `group:{groupId}`, and a key missing there
  is recovered from the member's own wrap. Screens come after the design
  pass (decided 2026-10-28), so each feature is built and tested as app
  code first.
- `src/state/joins.ts` is joining (Sections 9 and 17): reading an invite
  for its group's name, filing a join request with a tidied and checked
  name and note, the joiner's view of where it stands, withdrawing it, and
  for members, listing the unexpired requests oldest first, approving one,
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
  transaction that keeps the working invite in step.
- The browser suite in `tests/client/` (`npm run test:client`) checks
  this in Chromium, Firefox, and WebKit against the emulators, since
  WebCrypto and IndexedDB differ between engines.

**App structure, still open**:
- The exact hook API/conventions (naming, loading/error state shape, how
  a hook exposes its listener's unsubscribe).
- Scroll behavior per screen, decided as each data screen is built. The
  app's scroll hook (`src/ui/scroll-top.ts`) restores a back, forward, or
  reload position right after the page renders, so a screen whose Firebase
  data arrives later can land short of where the person left it, and such a
  screen re-applies the position once its content is in. Screens like the
  chat will likely scroll inside their own container rather than the whole
  window and open at the newest message, which the hook doesn't cover.

**Infrastructure, decided 2026-10-22**:
- Firebase Blaze plan with the cost protections in Section 15.
- Hosting: Netlify, as with the user's other sites. Firebase doesn't need
  its own hosting; the app talks to Firebase from the browser wherever
  it's served. Server code runs as Firebase Cloud Functions, since it's
  triggered by database writes, which a Netlify Function can't listen
  for. Setup carries ease-my-life's lessons: the site's domains in
  Firebase Auth's authorized domains, the API key's website restrictions
  (including the project's `firebaseapp.com` address used for Google
  sign-in), and Firebase's addresses in the CSP's `connect-src`.
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
  (Section 11.1). Still to build, each with the feature it serves: the
  history request alerts (Section 11.9), the grouped join request push
  (Section 17), and chat pushes. The app's side, asking permission, calling
  FCM's `getToken()`, storing and refreshing the token, and showing a push
  through the service worker, comes with the app's Firebase wiring.
- Environments, see Section 13.
- Combining the service workers: a PWA gets one service worker per
  scope, but `vite-plugin-pwa` generates one for offline caching and FCM
  by default registers its own `firebase-messaging-sw.js` for background
  push. Plan: `vite-plugin-pwa`'s `injectManifest` mode with one
  hand-written worker that does both (Workbox precaching plus Firebase
  Messaging's background handler), and that worker's registration passed
  to FCM's `getToken()` so it never registers a second one.

**Setup checklist (don't skip)**:
- [ ] **Turn Firebase/Google Analytics OFF** when creating each Firebase
      project. The setup flow suggests turning it on, and quietly enabling
      it would cut against this app's privacy stance.
- [ ] Budget alerts and the automatic billing cutoff (Section 15), set up
      the same day Blaze is enabled, on every project.
- [x] Cloud Functions capped with `maxInstances`: 10 each, set in
      `functions/src/setup.ts`.
- [ ] A lifecycle rule on the Storage bucket deleting every object 15 days
      after upload (Section 11.9).
- [ ] App Check enforced on Firestore, RTDB, Storage, and Functions.
- [ ] Firestore TTL policies on the `expireAt` field of every collection
      group that has one (`liveLocations`, `events`, `assignments`,
      `historyRequests`, `notices`, `pushToken`), since a TTL policy is
      set per collection group in the console, not by the rules.
- [ ] Authorized domains, API key restrictions, and CSP, per the hosting
      bullet above.
- [ ] The privacy policy and terms written and published at `/privacy` and
      `/terms`, before Google sign-in is set up (its verification asks for
      both URLs).

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
   project's billing account once spending passes a set ceiling.
   Caveats to accept knowingly:
   - Budget notifications lag behind real usage by hours, so spending can
     overshoot the ceiling somewhat before the cutoff fires. The ceiling
     is set below what would actually hurt.
   - Unlinking billing stops every paid service in the project at once:
     the app goes down until billing is re-enabled by hand. That's the
     intended outcome (an outage instead of a bill), but Google warns
     resources may not shut down gracefully, so what happens to Storage
     data and TTL policies when billing returns must be checked before
     relying on it. Test it on the staging project first.
3. **Preventing the spike in the first place**:
   - App Check at launch, so only the real app can call Firebase; a
     script holding the public config gets rejected. On the web it uses
     reCAPTCHA, which has a free monthly allowance.
   - `maxInstances` on every Cloud Function, so a flood of triggers can't
     scale functions without limit.
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

Android and desktop Chrome share storage between the browser and the
installed app, so data carries over there, and Chrome offers an install
button the app can trigger itself (`beforeinstallprompt`). The
recommendation still shows, just without blocking.

**Carrying an invite through the install.** Most people will arrive
by tapping an invite link, which opens in Safari. After installing, the
home-screen app opens at its own start address, so the invite token may
be lost along the way. Still to test on a real iPhone: whether "Add to
Home Screen" from the invite page keeps that page's address.

**Decided (2026-10-22): "Join with an invite link" is a permanent part of
the app**, not only an install workaround. The installed app's first
screen offers it, and so does the group list for existing users, who
paste a link someone sent them instead of opening it in the browser
(which, on iOS, would land in Safari's separate storage rather than the
installed app). The invite screen offers to copy its link before
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
  than one push per request, so a flood can't flood phones too.
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
It's built from the start but stays unlocked for everyone until the
paywall is switched on before launch.

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

**Buying (decided 2026-10-22)**:
- Requires linking Google sign-in (Section 8). Paid status is tied to the
  UID, and an anonymous UID can be lost with the device, so a purchase
  without a recoverable sign-in would be a support problem. ease-my-life
  reached the same conclusion for its paid accounts.
- Polar takes the payment, as in ease-my-life. Its webhook, a Cloud
  Function here, writes a permanent `paid` flag on `/accounts/{uid}`
  (Section 11.1), which the rules read and no client can write. A refund
  clears the flag, and the "over a limit" rule above applies.

**Ownership transfer (decided 2026-10-22)**:
- **Offer, then accept.** The owner offers ownership to a current member
  (`pendingOwnerUid`, with `pendingOfferedAt`), and it moves only when that
  member accepts, so nobody is handed a group, and a slot of theirs,
  without agreeing. The owner can withdraw the offer and the member can
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
- **The paywall's switch** (decided 2026-10-25): while it's unlocked, one
  rules function reports every user as paid, so the paid caps apply to
  everyone. The real checks are written and tested under both answers from
  the start (the rules suite loads the paywall-on version into a second
  emulator project), and switching the paywall on before launch changes
  that one function, together with `PAY_LOC_BOO` in
  `functions/src/daily-run.ts`, which mirrors it so the daily run only
  offers a group to someone the rules would let accept it.

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
