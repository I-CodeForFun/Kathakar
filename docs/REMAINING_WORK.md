# Kathakaar — remaining work (handoff prompt)

Paste this into an AI coding agent (Claude Code, Cursor, Aider…) opened in the Kathakaar repo.

---

You are continuing work on **Kathakaar**, a zero-dependency Node + vanilla-JS writing app (schema **v10**, no build step). The master spec is the "Master Implementation Prompt v2" (items P0-*, A*, B*, C*, D*, E*, F*, G*). Roughly 70% is implemented and tested. Read `README.md` first, then `public/js/boot.js` (load order + sync), `public/js/schema.js` (collections, migrate, merge3, repair), `public/js/keys.js` (key registry), `server/index.js`.

## Rules (unchanged)
- One item per commit; tests first for pure logic (UMD files in `public/js/` are `require()`-able from `test/unit.js`).
- No new runtime dependencies on client or server. Escape all user text with `SFX.esc` / `SFX.escAttr`; never single-quoted interpolated attributes (`test/guards.js` enforces this, plus no native `alert(`, i18n keys present, every tab documented).
- Any persisted-shape change ships with a `SCHEMA.STEPS[n]` migration and a round-trip test; bump `VERSION` once per phase.
- Run before every commit: `npm test`, `npm run test:e2e`, and `URL=http://127.0.0.1:3111 python3 test/e2e/a11y.py` (needs `npm i` for axe-core and a running server). The a11y test must report 0 serious/critical.
- Verify before claiming done: run the thing in a real browser (Playwright) — several bugs this project hit were only visible there.

## Known failing / unverified (do these first)
1. **F2 live sync is unverified.** `test/e2e/realtime.py` (two browser contexts, same token; a save in A should appear in B without reload) currently **times out**. The server side is tested and passes (`test/users.js`: change feed, presence, `Last-Event-ID` resume). Debug the client path in `public/js/boot.js` (`startFeed`, `onFeed`, `SF.adopt`): confirm the stream connects (the `api()` helper adds the token header), that `ev.owner != SF.me` filtering isn't dropping events (`SF.me` comes from `/api/me`; in single-token mode the id is `_`), that `connect(false)` pulls the changed key, and that `adopt()` replaces `S` and re-renders. Then add the test to `npm run test:e2e`.
2. **Recto chapter starts** (`break-before:right`) did not insert blank verso pages in Chromium's PDF output (page size with bleed is correct: A5 + 3 mm → 154×216 mm). Either implement JS pagination/blank-page insertion in `printHtml` (`public/js/v7.js`) or keep the documented limitation.
3. Platform numbers in `public/data/platforms.json` (KDP/Ingram margins, paper thickness, serial-platform allowed tags) are **unverified**; verify against current platform docs and set `lastVerified`.

## Not implemented (in suggested order)
**Collaboration UI (server API exists: `/api/share`, `/api/shared/<owner>/<key>`, `/api/presence`, `/api/events`)**
- Sharing UI in Data tab: share a story (user id + reader/editor), list "shared with me", open a shared story (read-only for readers; editors write via `/api/shared/...` with `If-Match`), presence banner ("Ben is editing Chapter 7") from the `sf:presence` window event.
- F4b end-to-end encryption (envelope `{enc:1,alg:'AES-GCM',kdf:{PBKDF2,SHA-256,600000,salt},iv,ct}`; key never leaves the browser; server `badValue` must accept envelopes; AI/semantic features disabled in this mode; mandatory "export decrypted"; fixed-vector tests).
- F5 plugin API (flag `KATHAKAAR_PLUGINS=1`, same-origin `/plugins/*.js` only, `plugin.json` manifest, `window.SF` registration API for tabs/commands/lint rules/checks/drawer sections/packs; plugin storage key `sf-plg-<id>` must be added to `keys.js`; a plugin that throws 3× is disabled).
- Full per-hunk three-way conflict UI (F7) — today a 3-option dialog (merge / keep mine / use server) exists.

**AI layer (Part G) — nothing but local helpers exists** (name generator, style stats, voice fingerprint)
- G0 platform: `server/gen.js` provider kind `generate` (Ollama / OpenAI-compatible / Anthropic), streaming + cancel + timeouts; **allow-listed tasks with server-side prompt templates only (no open LLM proxy)**; `AI_DAILY_TOKEN_BUDGET`; consent per device (`xl-aiconsent`); manuscript text delimited as data (prompt-injection hygiene); outputs untrusted, shown as diff + Accept (reuse `DIFF` in `extras.js`), one undo step; cache by hash; mock provider + golden prompt tests.
- Then G2 idea generator → inbox, G3 whole-manuscript continuity (incremental, per chapter hash), G4 synopsis/blurb (map-reduce), G7 drafting assists, G6 translation mode (`sf-tr-<KEY>-<lang>` key, stale detection).

**Foundation / polish**
- A11 "islands": views with live input (comment composer, lint panel) lose focus on `render()`; add `renderIsland` or a render guard.
- A12 touch pass for drag interactions (corkboard has pointer + long-press; world-map pins need long-press); keyboard screen-reader pass on the corkboard (live announcements exist, not tested with a screen reader).
- B11 bound undo memory (`H` stores up to 60 full-story JSON strings; use per-collection deltas or a byte cap; add a unit test).
- E10 accessible DOCX export (heading styles, language, alt text) and an honest "PDF is untagged" note in the export dialog; E8 per-platform chapter scheduling beyond the `.ics`.
- Pack gaps: lexicon undefined-term finder (needs a word list), power-scaling UI field (`e.power` has a check but no editor), C3.1 system-rule links, C5.4 escalation ledger, romance dual-POV balance chart, chemistry/attraction line on the arc chart (C2.3).
- Mutation guard for `lint.js` rules; migration corpus `test/fixtures/v1…v10.json` (only inline cases exist); golden-file tests for DOCX/EPUB exports.
- CSP: inline `style=` attributes still require `style-src 'unsafe-inline'`; migrate to classes over time. Optional cookie-session mode (`KATHAKAAR_SESSION=1`) to keep the token out of `localStorage`.
- Docker: `docker-compose.yml`/Dockerfile were not updated for new env vars (`KATHAKAAR_KEY`, `TRUST_PROXY`, `KATHAKAAR_CLIP`, `KATHAKAAR_USERS_FILE`); see Appendix E of the spec for the hardened Caddy compose.

## Where things live
| Area | Files |
|---|---|
| Sync, boot, load order | `public/js/boot.js`, `public/js/keys.js` |
| Schema, merge3, repair | `public/js/schema.js` |
| Pure helpers (diff, wiki, print, serial, GEDCOM, EPUB validate, …) | `public/js/extras.js`, `lint.js`, `read.js`, `beats.js`, `find.js`, `wlog.js`, `packs.js`, `props.js` |
| UI modules | `ui.js` (toasts/dialogs/i18n), `v8`–`v16.js` |
| Server | `server/index.js`, `store.js`, `blobs.js`, `crypt.js`, `clip.js`, `users.js` |
| Tests | `test/unit.js`, `server.js`, `clip.js`, `users.js`, `guards.js`, `test/e2e/v8.py`, `perf.py`, `a11y.py`, `realtime.py` (failing) |
