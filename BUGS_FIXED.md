# Kathakaar — audit (fixed items)

| # | Sev | Area | Location | Issue → Fix |
|---|---|---|---|---|
| 1 | Critical | Security | `.env` (shipped in zip) | Real access token committed → removed; use `.env.example`. **Rotate the old token.** |
| 2 | Critical | Security | `server/users.js` `load()` | Corrupt/partial `users.json` made `enabled()` false → auth failed open → sticky enable, keeps last good copy, atomic writes |
| 3 | Critical | Multi-user | `server/index.js` `/api/ai/config` (`canConfigure`) | Any member could read/change AI API keys → admin only in multi-user mode |
| 4 | High | Privacy | `server/blobs.js`, `/api/blob*` | Blob store shared by all users (read/delete anyone's images) → per-user namespaces |
| 5 | High | Data loss | `server/index.js` `body()` | Per-chunk `d+=c` corrupted multi-byte UTF-8 (Hindi etc.) at chunk edges → byte buffering |
| 6 | High | Config | `server/index.js` startup | `.env` loaded *after* store/crypt/blobs read env → `KEY`, `DATA` from `.env` ignored (data silently unencrypted) → new `server/env.js` loaded first |
| 7 | High | Security | `server/index.js` listen | Bound to 0.0.0.0 with no auth → defaults to 127.0.0.1 unless token/users configured |
| 8 | High | Privacy | `public/js/boot.js` `connect()` | Another account on same browser uploaded previous user's local stories → local data wiped on account switch / sign-out |
| 9 | High | Data loss | `server/rekey.js` | Skipped per-user folders → recursive |
| 10 | Medium | Security | `authed()` | `timingSafeEqual` threw (500) on multi-byte/unequal tokens, leaked length → compare SHA-256 digests |
| 11 | Medium | Perf | `/sw.js`, static files | Walked/stat'ed whole tree and re-gzipped on every request → 5 s cache, gzip cache |
| 12 | Medium | Perf | `/api/kv-batch` | Quota recomputed (directory scan) per key → once per request; quota was global, now per user |
| 13 | Medium | Correctness | `/api/kv-batch`, `/api/kv` DELETE | Deletes not audited/emitted to live feed; share ACL left behind → emitted + ACL dropped |
| 14 | Medium | Multi-user | `/api/share` | Could share with non-existent users / self → validated |
| 15 | Medium | Perf | `users.js` ACL | ACL file read synchronously on every event → mtime cache |
| 16 | Medium | Data | `app.js` delete story (`sx`) | Orphaned `sf-snaps-*` / `sf-baks-*` → removed |
| 17 | Medium | UX | `boot.js` `askToken` | Token prompt only → sign-in / create-account dialog |
| 18 | Medium | Arch | `boot.js` | `/api/me` raced with the change feed (`SF.me` unset) → resolved before sync |
| 19 | Low | UX | `app.js` `bt` | Deprecated `execCommand` only → Clipboard API with fallback |
| 20 | Low | UX | Library menu | "Stories" vs "Kathākośa" duplicates → **Kathākośa** / **Story Markdown** |

## Not fixed (needs a decision / larger work)
- Medium · UX/A11y — ~10 native `confirm()` calls (`v5.js` 365–426, `v6.js` 32/126/128, `worlds.js` 43, `boot.js resolve`) should use `SFX.ask`.
- Medium · Security — token/session kept in `localStorage` (XSS-readable); CSP still needs `style-src 'unsafe-inline'`. Cookie sessions recommended.
- Medium · Architecture — `app.js`/`v5.js` are 100 KB / 74 KB single files, `v5…v17` naming, global functions; `store.all()/meta()` are synchronous full-directory reads.
- Medium · Perf — undo keeps 60 full-story JSON copies (`H` in `app.js`).
- Low — audit log unbounded; no per-IP vs per-account login lockout; shared stories are copy-only (no live co-editing UI).
- Unverified: browser UI was not run in a real browser here; server and API are covered by `npm test` (new `test/auth.js`).
