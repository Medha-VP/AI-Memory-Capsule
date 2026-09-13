mixin () {
  public query func getApiDoc() : async Text {
    "# AI Memory Capsule — Backend API

This document describes the public API of the AI Memory Capsule backend canister.
It is a personal document vault: a signed-in user uploads PDF and image documents,
the backend classifies each one into a category, and the user can list, search,
view, and delete their documents, plus read analytics and a knowledge graph derived
from them. All document data is also queryable through the OQL (Object Query Layer)
surface.

## Authentication and identity

The app uses Internet Identity (II) for sign-in, provided by the authorization
extension. A caller is **anonymous** until they complete an II sign-in flow.

- `_internet_identity_sign_in_start` — begins an II sign-in; returns a challenge
  blob the frontend presents to II.
- `_internet_identity_sign_in_finish` — completes the sign-in for the caller and
  registers them in access control. Returns `#ok` on success or an `#err` variant
  on verification failure.

The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding the
user's Internet Identity authorization derives the correct per-app principal
against that origin (for example `icp identity link web <name> --app <host>`).
Such a delegation acts with the user's full authority in this app until it
expires.

### Registration prerequisite

Access to the document and analytics endpoints is gated on the caller having a
registered role. Registration happens only when a caller signs in through the
app's own frontend (which calls `_internet_identity_sign_in_finish` or
`_initialize_access_control`). A direct API caller must register before any
role-guarded call by calling `_initialize_access_control` once as a signed-in
caller. The **first** principal to register becomes `#admin`; every subsequent
caller becomes `#user`. Anonymous callers are never registered.

A caller can therefore be unregistered even when the app already knows them:
registration only occurs when a principal signs in through the app's frontend, so
a principal that never did so is unregistered even if it belongs to the app's
owner, and a signed-in caller derived against a different origin is a different
principal than the one the frontend registered.

On any role-guarded endpoint, an unregistered or anonymous caller receives a trap
with the message `User is not registered` (from `getUserRole`). The document
endpoints additionally trap with `Unauthorized: Only users can perform this
action` when the caller's role is not `#user` or `#admin`.

## Authorization

Roles are `#admin`, `#user`, and `#guest` (anonymous).

- `getCallerUserRole` — returns the caller's role (`#guest` for anonymous).
- `isCallerAdmin` — returns whether the caller is `#admin`.
- `assignCallerUserRole(user, role)` — **admin only**; assigns a role to a user.
  Traps with `Unauthorized: Only admins can assign user roles` for non-admins.
- `_initialize_access_control` — registers the caller (first caller becomes
  `#admin`, others `#user`).

All document endpoints require the caller to have `#user` permission (admins
pass, since `hasPermission` grants admins every role). Each document is owned by
the principal that uploaded it, and every document read/write is scoped to the
caller's own documents.

## Units and encodings

- **Timestamps**: `uploadedAt` is an `Int` count of nanoseconds since the Unix
  epoch (the value of `Time.now()` at upload). `getUploadTrends` buckets uploads
  by whole days (epoch-day index rendered as a decimal string).
- **Identifiers**: document `id` is a `Nat` assigned sequentially at upload
  (`state.nextId`). It is unique per canister, not per user.
- **`blob`**: the uploaded file bytes, stored via the object-storage extension.
  `Storage.ExternalBlob` is an alias for `Blob`. It is opaque binary data and is
  not exposed as a queryable OQL column.
- **`category`**: a variant `#education | #identity | #finance | #insurance |
  #projects | #achievements`, assigned by the simulated classifier. In OQL it is
  rendered as its lowercase tag text.
- **`metadata`**: an array of `Text` tags extracted from the document. In OQL it
  is rendered as a comma-separated string.
- **`summary`**: an optional `Text`; `null` when no summary exists. In OQL it is
  rendered as the empty string when absent.
- **Passwords**: a document password is stored as a salted SHA-256 hash
  (`passwordSalt` and `passwordHash`, both `?Blob`). The plaintext password is
  never stored or returned. `passwordSalt` is a fresh 32-byte random blob
  (`Random.blob()`) generated at set/change time; `passwordHash` is
  `SHA-256(salt ‖ utf8(password))`. A document with `passwordHash = null` has no
  password.
- **OQL values**: `schema()` and `execute()` use JSON. Numeric variants compare
  across each other, so a JSON integer threshold matches an `Int` value.

## Document endpoints

All require `#user` permission and operate only on the caller's own documents.

- `listDocuments() : async [DocumentView]` — every document in the canister,
  redacted per the password rules below. The caller's own documents appear with
  full details; other users' protected documents appear with redacted details
  (`locked = true`) so they are visible but locked until the password is entered.
- `getDocument(id : Nat, password : ?Text) : async ?DocumentView` — one document,
  or `null` if absent. The owner always receives the full view. A non-owner of a
  protected document receives the full view only when `password` matches the
  document's stored hash; an absent or wrong `password` returns the redacted view
  (see \"Password protection\" below). A non-owner of an unprotected document
  receives the full view.
- `uploadDocument(name : Text, fileType : Text, blob : ExternalBlob, password : ?Text) : async Nat`
  — stores a new document, classifies it, and returns its new `id`. `name` and
  `fileType` are free text; classification is a keyword/extension heuristic.
  `password` is optional: when `?p` is supplied, the document is stored with a
  salted SHA-256 hash of `p` and is password-protected; when `null`, the document
  has no password.
- `deleteDocument(id : Nat) : async Bool` — removes the document; returns `true`
  if it existed and was owned by the caller, else `false`.
- `searchDocuments(searchText : Text) : async [DocumentView]` — case-insensitive
  substring match over name, category tag, and metadata tags. The caller's own
  documents appear with full details; other users' protected documents that match
  appear with redacted details (`locked = true`) so they are visible but locked.
- `setDocumentPassword(id : Nat, password : Text) : async Result<(), PasswordError>`
  — sets a password on a document the caller owns. Returns `#err(#alreadySet)`
  if the document already has a password, `#err(#notFound)` if the id is absent,
  `#err(#notOwner)` if the caller does not own it.
- `changeDocumentPassword(id : Nat, password : Text) : async Result<(), PasswordError>`
  — replaces the password on a document the caller owns. Returns
  `#err(#noPassword)` if the document has no password, `#err(#notFound)` if the
  id is absent, `#err(#notOwner)` if the caller does not own it.
- `removeDocumentPassword(id : Nat) : async Result<(), PasswordError>` — removes
  the password from a document the caller owns, making it publicly readable
  again. Returns `#err(#noPassword)` if the document has no password,
  `#err(#notFound)` if the id is absent, `#err(#notOwner)` if the caller does not
  own it.
- `verifyDocumentPassword(id : Nat, password : Text) : async Bool` — returns
  `true` if `password` matches the document's stored hash, `false` otherwise
  (including when the document has no password or the id is absent). This is a
  query and does not reveal any document content.
- `getAnalyticsOverview() : async AnalyticsOverview` — total document count and
  counts per category.
- `getUploadTrends() : async [UploadTrendPoint]` — upload counts per day.
- `getKnowledgeGraph() : async KnowledgeGraph` — nodes for categories, documents,
  and metadata entities, with `classified_as` and `mentions` edges.

## Password protection

A document owner may set an optional password at upload time or later. A
protected document (`passwordHash != null`) behaves as follows:

- **Owner**: the owner can always view their own protected document in full
  without entering the password. `listDocuments`, `getDocument`, and
  `searchDocuments` return the owner's protected documents with all details
  (`name`, `fileType`, `category`, `metadata`, `summary`, `blob`) and
  `locked = false`, `hasPassword = true`.
- **Non-owner**: a protected document is returned to a non-owner as a **redacted
  `DocumentView`** with `locked = true`, `hasPassword = true`, and the sensitive
  fields hidden: `name = null`, `fileType = null`, `category = null`,
  `metadata = []`, `summary = null`, `blob = null`. Only `id`, `owner`,
  `uploadedAt`, `locked`, and `hasPassword` are populated. This hides the
  document's details in lists and search until the password is entered. When the
  non-owner calls `getDocument(id, ?password)` with the correct password, the
  full view is returned (`locked = false`, all fields populated).
- **Unprotected document**: a non-owner sees the full view with
  `locked = false`, `hasPassword = false`.
- **Password re-entry**: the password is never persisted for a session. Every
  open of a protected document requires the caller to call
  `verifyDocumentPassword(id, password)` again; the backend stores only the
  salted hash, never the plaintext, so there is no way to bypass re-entry.
- **Wrong password**: `verifyDocumentPassword` returns `false` and reveals no
  document content or details.

### Password hashing scheme

A document password is stored as a salted SHA-256 hash. `passwordSalt` is a
fresh 32-byte random blob (`Random.blob()`) generated at set/change time;
`passwordHash` is `SHA-256(salt ‖ utf8(password))`. The plaintext password is
never stored or returned. A document with `passwordHash = null` has no password.
The password fields are exposed through OQL as lowercase hex strings of the
underlying blobs (empty string when absent), readable only under the entity's
per-table authorization (see \"OQL surface\").

## Object-storage surface

The object-storage mixin exposes low-level lifecycle endpoints
(`_immutableObjectStorageRefillCashier`, `_immutableObjectStorageUpdateGatewayPrincipals`,
`_immutableObjectStorageBlobsAreLive`, `_immutableObjectStorageBlobsToDelete`,
`_immutableObjectStorageConfirmBlobDeletion`, `_immutableObjectStorageCreateCertificate`).
These are platform/controller maintenance endpoints and are not part of the
normal document workflow; the frontend uploads document bytes through
`uploadDocument`.

## OQL surface

`schema() : async Text` returns a JSON schema of the queryable entities.
`execute(qJson : Text) : async Result` runs a JSON query and returns a typed
Candid result.

The `document` entity is exposed with `#controllerOrScoped` authorization and an
`owner` owner column: a signed-in user reads only their own documents, while the
platform controller (the Data Intelligence agent) can read all rows to answer
aggregate questions. Anonymous callers are denied. Queryable columns: `id`,
`owner`, `name`, `fileType`, `uploadedAt`, `category`, `metadata`, `summary`,
`passwordSalt`, `passwordHash`. The opaque `blob` column is not exposed. The
password columns are rendered as lowercase hex strings (empty when absent) and
are subject to the same per-table authorization as every other column.

## Lifecycle and polling

There is no long-running job. `uploadDocument` completes synchronously and
returns the new `id`. Reads are immediate. There is nothing to poll.

## Mutation retry safety

- `uploadDocument` is **not idempotent**: each call creates a new document with a
  new `id`. Retrying a failed upload (where the caller did not observe the
  result) can create a duplicate. There is no deduplication key.
- `deleteDocument` is idempotent: deleting an already-deleted or non-owned id
  returns `false` and changes nothing.
- `assignCallerUserRole` is idempotent: assigning the same role again is a no-op.
- `setDocumentPassword` is not idempotent in effect: calling it on a document
  that already has a password returns `#err(#alreadySet)` and changes nothing.
- `changeDocumentPassword` is idempotent in effect: re-setting the same password
  simply replaces the stored hash with a fresh salt/hash pair.
- `removeDocumentPassword` is idempotent: removing a password from a document
  that has none returns `#err(#noPassword)` and changes nothing.

## Errors, traps, and limits

- Role-guarded endpoints trap with `User is not registered` for unregistered
  callers and `Unauthorized: Only users can perform this action` for non-user
  roles.
- `assignCallerUserRole` traps with `Unauthorized: Only admins can assign user
  roles` for non-admin callers.
- `execute` traps with `OQL: invalid query — <detail>` on malformed JSON.
- `getDocument` returns `null` (not an error) for a missing or non-owned id.
- The password endpoints return a `PasswordError` variant rather than trapping:
  `#notFound` (no such id), `#notOwner` (caller does not own the document),
  `#alreadySet` (set on a document that already has a password), `#noPassword`
  (change/remove on a document with no password).
- There is no explicit per-user document-count limit; storage is bounded by the
  canister's available memory and object-storage capacity.

## Non-obvious gotchas

- Document `id`s are global (shared across users), but every endpoint scopes to
  the caller, so a caller can never read or delete another user's document even
  if it knows the id.
- `uploadDocument` accepts any `fileType` string; classification falls back to
  `#projects` when no keyword or extension matches.
- The `document` OQL entity is scoped per user, so a user's `execute` query can
  never see another user's rows, even through a join.
- A protected document's details are hidden from non-owners in `listDocuments`,
  `getDocument`, and `searchDocuments` (redacted `DocumentView` with
  `locked = true`) until the correct password is supplied to `getDocument`.
  Only the owner sees full details without entering the password.
  `verifyDocumentPassword` is a query and never reveals content.
- The password is re-entered on every open; there is no session persistence and
  no way to retrieve the plaintext, since only the salted SHA-256 hash is stored.
"
  };
};
