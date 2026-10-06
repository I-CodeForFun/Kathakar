# Development guide

## Setup
```bash
node -v                # ≥ 18
npm install            # only dev dependency: axe-core (accessibility test)
npm start              # http://localhost:3000
npm test               # all Node tests
```
No bundler, no transpiler: edit files in `public/` and refresh. The service worker caches aggressively — use DevTools → Application → *Update on reload* while developing.

## Script load order (`boot.js`)
`keys.js` → `boot.js` → `ui rules wlog read lint beats find extras packs props schema samples app worlds places semantic ai docs v5 v6 v7 v8 v9 v10 v11 v12 v13 docs2 v14 v15 v16 v17`. All tabs register themselves (`TABS.push`) before the first `render()`, so every tab exists on first paint. A new file must be added to that list in `boot.js`. New tabs not listed in `GR` (`app.js`) appear under **More**.

## Conventions (enforced by `test/guards.js`)
* Escape every user string with `SFX.esc` / `SFX.escAttr`; never put interpolated values in **single-quoted** HTML attributes.
* No native `alert(` — use `SFX.notice`, `SFX.toast`, `SFX.ask`, `SFX.choose`, `SFX.askText`.
* i18n keys used in code must exist in `public/i18n/en.json`.
* Every tab must have a documentation entry (`docs.js` / `docs2.js`, `DOCS.register`).
* A persisted-shape change needs a `SCHEMA.STEPS[n]` migration, a round-trip test and a `VERSION` bump.
* New synced storage keys must be added to `keys.js` (browser and server share it).
* No new runtime dependencies.

## Tests

| Command | Covers |
|---|---|
| `node test/smoke.js` | App boots, sample stories valid, exports (DOCX/EPUB/print/serial) |
| `node test/unit.js` | Rules extraction, schema/migrations, merge3, helpers |
| `node test/server.js` | Security headers, traversal, auth lock-out, ETag/If-Match, batch, blobs, encryption, service worker |
| `node test/clip.js` | SSRF protection of the clipper |
| `node test/guards.js` | Code-style guards above |
| `node test/users.js` | Token users: isolation, sharing, audit log, change feed, presence |
| `node test/auth.js` | **Accounts**: register/login, scrypt storage, admin-only rules, per-user blobs, UTF-8 integrity, CLI reset/promote/delete, self-delete, public sign-up roles |
| `node test/ai.js` | Embedding + judge pipeline with mock providers |
| `npm run test:e2e` | Browser tests with Playwright (Python) in `test/e2e/` — start a server first; see `test/e2e/README.md` |
| `python3 test/e2e/a11y.py` | axe-core accessibility: 0 serious/critical expected |

CI: `.github/workflows/ci.yml`.

## Adding a feature (checklist)
1. Pure logic first, in a UMD file under `public/js/` so `test/unit.js` can `require()` it.
2. Data shape → `schema.js` collection + migration + test.
3. UI → module `vNN.js`, register tab, escape output, keyboard accessible, add docs entry.
4. Server route → `server/index.js` inside the authenticated section; use `req.user.store` / `req.user.blobs` (never the root store) so multi-user isolation holds; add a test.
5. Run `npm test` and the e2e/a11y tests.

## Server code map (`server/index.js`)
1. `require('./env')` – configuration
2. helpers: `send`, `body`/`rawBody` (byte-safe), `hdrs` (security headers)
3. rate limit + lock-out (`limited`, `locked`, `failed`)
4. `authed()` → sets `req.user = {id,name,role,multi,store,blobs}`
5. change feed (`BUS`, `emit`)
6. request handler: health → auth routes → auth gate → `/api/*` → static files

## Release checklist
- [ ] `npm test` green, e2e + a11y run
- [ ] `schema.js` VERSION bumped if the shape changed; samples `VERSION` bumped to re-issue examples
- [ ] Docs updated (this folder + in-app Docs)
- [ ] `docker compose -f docker-compose.prod.yml build` succeeds
- [ ] Tag and note changes
