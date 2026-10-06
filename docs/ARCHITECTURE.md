# Architecture

Kathakaar is a **local-first** web app: the browser is the primary place where your story lives, and an optional Node.js server stores a synchronised copy, provides accounts and sharing, and runs the semantic consistency checker. There is **no build step** and **no runtime npm dependency** (the neural embedder is an optional extra).

## 1. The big picture

```mermaid
flowchart LR
  subgraph Browser["Browser - vanilla JS, no framework"]
    UI["UI modules<br/>app.js, v5…v17.js"]
    LS[("localStorage<br/>sf-* keys")]
    IDB[("IndexedDB<br/>mirror + overflow + merge base")]
    SYNC["boot.js<br/>sync engine"]
    SW["Service worker<br/>(offline shell)"]
    UI <--> LS
    LS <--> IDB
    LS <--> SYNC
  end
  subgraph Server["Node.js server - server/index.js"]
    AUTH["Auth & sessions<br/>users.js"]
    KV["Key/value store<br/>store.js"]
    BL["Blob store<br/>blobs.js"]
    CHK["Semantic checker<br/>checker.js / embedder.js / judge.js"]
    BUS["Change feed (SSE)<br/>+ presence"]
  end
  DISK[("data/<br/>kv, blobs, users.json,<br/>accounts.json, acl.json")]
  SYNC <-- "HTTPS /api/*" --> AUTH
  AUTH --> KV & BL & CHK & BUS
  KV & BL --> DISK
  AUTH --> DISK
  CHK -. optional .-> EXT["Ollama / OpenAI / Anthropic"]
```

**Why local-first?** Writing must never be blocked by a network. Every keystroke is saved to `localStorage` immediately; the server is a mirror that catches up when reachable.

## 2. Repository layout

| Path | Purpose |
|---|---|
| `public/index.html` | Single page; loads `keys.js` then `boot.js` |
| `public/js/boot.js` | Storage patching, IndexedDB mirror, **sync engine**, script loader, live feed, sign-in hook |
| `public/js/keys.js` | **Key registry** shared by browser and server: which keys sync, how they validate and merge |
| `public/js/schema.js` | Story schema (version 10), migrations, validation, `merge3` (three-way merge), reference repair |
| `public/js/app.js` | Core planner: state `S`, render loop, Journey map, Matrix, Book renderer, Kathākośa drawer |
| `public/js/v5.js … v17.js` | Feature modules loaded in order (arcs, history, print/EPUB/DOCX export, packs, problems panel, accounts/sharing in `v17.js`) |
| `public/js/ui.js` | Foundation: toasts, dialogs, sign-in dialog, i18n, escaping helpers (`SFX`) |
| `public/js/rules.js`, `lint.js`, `beats.js`, `find.js`, `wlog.js`, … | Pure helpers (also `require()`-able in tests) |
| `public/css/` | `app.css` layout, `theme.css` warm editorial theme (light/dark) |
| `server/index.js` | HTTP server, routing, security headers, rate limits, SSE |
| `server/env.js` | Loads `.env` **before** anything else reads configuration |
| `server/users.js` | Accounts, sessions, ACL (sharing), audit log |
| `server/store.js`, `blobs.js`, `crypt.js` | File storage, content-addressed images, optional AES-256-GCM at rest |
| `server/checker.js`, `embedder.js`, `judge.js`, `aiconfig.js` | Semantic rule checking |
| `server/clip.js` | SSRF-safe page clipper (off by default) |
| `server/tools/admin.js` | Administration CLI |
| `test/` | Node tests (`npm test`) and Playwright/Python browser tests (`test/e2e/`) |

## 3. Data model

A **story** is one JSON document (schema `v10`) stored under a key such as `sf2`, `s1abc…`, `sf-river`.

```mermaid
erDiagram
  STORY ||--o{ CHARACTER : chars
  STORY ||--o{ PLACE : places
  STORY ||--o{ TIME : times
  STORY ||--o{ TIMELINE : tls
  TIMELINE ||--o{ EVENT : ev
  EVENT }o--o{ CHARACTER : involves
  EVENT }o--|| PLACE : "happens at"
  STORY ||--o{ RELATIONSHIP : rels
  STORY ||--o{ WORLD : worlds
  WORLD ||--o{ RULE : rules
  STORY ||--o{ PROP : props
  STORY ||--o{ EVENT_LINK : lk
  STORY ||--o{ INFO : "shared info"
```

Other collections (genre packs, inbox, templates, encyclopedia, etc.) are registered in `schema.js` (`COLLECTIONS`). Every collection has a `since` version, so older files are **migrated on load** (`SCHEMA.STEPS`) and newer files produce a warning.

### Storage keys

| Key | Synced | Contents | Merge strategy |
|---|---|---|---|
| `sf-lib` | yes | list of story keys (the Kathākośa) | union |
| `sf-cur` | yes | currently open story | this device wins |
| `sf-ui` | yes | UI settings, saved arc templates, character groups | field-wise merge |
| `sf2`, `s<id>`, `sf-river`, `sf-sunstone` | yes | a story | three-way merge (`merge3`), else ask |
| `sf-snaps-<id>` | yes | history snapshots (max 40) | by `id` |
| `sf-baks-<id>` | yes | automatic backups (max 8) | by `ts` |
| `sf-wlog-<id>` | yes | daily word counts | max per day |
| `xl-token`, `xl-user`, `xl-uname` | **no** | session token, account id, display name | — |
| `xl-sync`, `xl-dirty`, `xl-errors` | **no** | sync bookkeeping, diagnostics | — |

`sf-*` keys are synchronised; `xl-*` keys never leave the device. This rule lives in `keys.js` so browser and server agree.

### Server-side layout

```
data/
├─ kv/                      single-user mode: one JSON file per key
│  └─ u-<account>/          multi-user mode: one folder per account
├─ blobs/                   images, named by SHA-256 of their content
│  └─ u-<account>/
├─ accounts.json            id → {name, role, salt, scrypt hash}
├─ users.json               SHA-256(session token) → {id, name, role, exp}
├─ acl.json                 "<owner>/<story>" → {members:{user: reader|editor}}
├─ audit.log                who / what / when / key (never content); rotates at 5 MB
└─ ai-config.json           AI provider settings incl. API keys (never sent to browsers)
```

## 4. How saving and syncing work

```mermaid
sequenceDiagram
  participant U as You
  participant A as App (S state)
  participant L as localStorage + IndexedDB
  participant Q as Write queue
  participant S as Server
  U->>A: type / edit
  A->>L: setItem(sf2, json)   (instant, durable)
  L->>Q: queue key (debounced 400 ms)
  Q->>S: PUT /api/kv/sf2  (If-Match: etag)
  alt ok
    S-->>Q: 200 + new ETag
    Q-->>A: header shows "✓ Saved"
  else 412 conflict
    S-->>Q: 412 {etag, value}
    Q->>Q: connect(): 3-way merge using stored base
  else offline / 5xx / 429
    Q-->>A: "⚠ saved locally, retrying" (back-off 5 s → 60 s)
  end
```

### Connect / merge algorithm (`boot.js › connect`)

```mermaid
flowchart TD
  A["GET /api/me → who am I?"] --> B{"Different account than<br/>last time on this browser?"}
  B -- yes --> W["Wipe local copy, reload<br/>(never upload one user's data into another account)"]
  B -- no --> C["GET /api/kv-meta (key → mtime,size)"]
  C --> D{"For each key"}
  D -- "only local" --> U["upload"]
  D -- "only server" --> P["download"]
  D -- "both, server unchanged" --> N["upload if local changed"]
  D -- "both, server changed" --> E{"Local changed too?"}
  E -- no --> P
  E -- yes --> M["merge3(base, local, server)"]
  M -- "no conflicts" --> OK["adopt merged value"]
  M -- conflicts --> ASK["Ask: merge / keep mine / use server<br/>(both copies saved in Backup history)"]
```

* **Base** = the last version both sides agreed on, kept in IndexedDB (`base` store) so a real three-way merge is possible.
* **Live updates:** after connecting, the client opens `GET /api/events` (Server-Sent Events over `fetch`, because `EventSource` cannot send an `Authorization` header). Changes made on another device arrive in about a second; the open story is replaced when you are not mid-edit (3-second quiet period).
* **Offline:** the service worker serves the app shell; writes queue (`xl-dirty` survives reloads) and flush on reconnect.
* **Storage full:** if `localStorage` (~5 MB) overflows, values are kept in memory + IndexedDB and a warning is shown; export your library.

## 5. Request lifecycle on the server

```mermaid
flowchart TD
  R["HTTP request"] --> H["Security headers (CSP, nosniff, HSTS behind proxy)"]
  H --> S{"Path"}
  S -- "/healthz" --> OK1["200 {ok:1}"]
  S -- "/api/auth/*" --> AU["Rate limit → per-IP & per-account lock-out → login/register"]
  S -- "/api/*" --> LK{"IP locked out? rate limited?"}
  LK -- yes --> E429["429 + Retry-After"]
  LK -- no --> AT{"Authenticated?"}
  AT -- no --> E401["401 (counts as a failed attempt)"]
  AT -- yes --> NS["Resolve per-user store + blob store"]
  NS --> RT["Route: kv / blobs / share / events / check / ai …"]
  S -- "other GET" --> ST["Static file from public/ (ETag, gzip cache)"]
```

Key points:
* **Namespacing:** in multi-user mode the account id selects the folder (`kv/u-<id>`, `blobs/u-<id>`). A user can only reach another user's data through the `/api/shared/...` routes, which consult the ACL on every request.
* **Validation:** every value written to `/api/kv/<key>` is validated against the key registry and story schema (HTTP 400 on failure). Limit: 5 MB per value.
* **Concurrency:** writes are atomic (temp file + rename). Optimistic concurrency uses `ETag` / `If-Match`.
* **Encryption at rest (optional):** `KATHAKAAR_KEY` encrypts every kv file with AES-256-GCM (`SFE1` header + nonce + ciphertext + tag).

## 6. Semantic rule checking

```mermaid
flowchart LR
  T["Manuscript text + rules"] --> OFF["Offline check in browser<br/>(rules.js: forbidden words, triggers)"]
  T --> SRV["POST /api/check"]
  SRV --> EMB["Embedder<br/>hash | MiniLM | BGE | Ollama | OpenAI"]
  EMB --> CAND["Candidate sentences<br/>(cosine ≥ calibrated threshold)"]
  CAND --> J{"Judge enabled?"}
  J -- yes --> LLM["LLM verifies each candidate<br/>(drops negations, false alarms)"]
  J -- no --> RES
  LLM --> RES["Merged, de-duplicated problems<br/>+ 'Why was this flagged?'"]
  OFF --> RES
```

If the server or model is unavailable the offline check still runs. API keys live only in `data/ai-config.json`; in multi-user mode only administrators can change them.

## 7. Design decisions

| Decision | Reason |
|---|---|
| No framework / bundler | Zero build, tiny attack surface, easy to self-host and audit |
| Files instead of a database | Simple backups (`tar`), easy encryption, enough for text documents |
| Last-writer-wins avoided via `merge3` | Two devices editing the same story must not silently lose text |
| Content-addressed images | Duplicates stored once; integrity verified by hash |
| Session tokens stored hashed | A leaked `users.json` does not leak usable sessions |
| Admin only via CLI | Public sign-up can never escalate to administrator |

## 8. Known architectural limits

* `app.js` and `v5.js` are large single files with global functions; refactor into modules before adding big features.
* `store.all()/meta()` read directories synchronously — fine for thousands of keys, not millions.
* Undo keeps up to 60 full-story snapshots in memory.
* Shared stories are copied, not co-edited live (the server API for editor write-back exists).
