# Kathakaar — feature notes (technical changelog by version)

> Historical notes kept from earlier iterations. For current documentation start at [README.md](../README.md).
Story planner with Worlds & Rules. Node ≥ 18, no remote AI.

    npm start                # http://localhost:3000 (no install needed, uses built-in embedder)
    npm run setup-model      # optional, big download (~100 MB): enables MiniLM embeddings

- **Backend** `server/` – file storage API (`/api/kv`), semantic checker (`/api/check`).
- **Frontend** `public/` – `app.js` (planner), `worlds.js` (worlds & rules), `semantic.js` (check UI).
- **Embeddings** (semantic check): `npm install` does **not** download a model — `@xenova/transformers` is deliberately not a dependency.
  - Default: a built-in hashed embedder (no download; matches word forms, weaker on synonyms).
  - Better: run `npm run setup-model` once (installs `@xenova/transformers`; the first start then downloads `all-MiniLM-L6-v2`, ~23 MB). Check the engine with `GET /api/health`.
  - Fully offline: put the model files in `models/` and set `EMBED_OFFLINE=1`. Force the built-in one with `EMBED_BACKEND=hash`.
- **Rules** (see "Rule syntax" below): an **offline** check in the browser (works without the backend: forbidden words, concepts from the rule sentence, triggers) plus the optional **semantic** check on the server (matches meaning). Both share `public/js/rules.js` and are merged, so one problem is reported once, with a "Why was this flagged?" panel (matched sentence, score).
- `npm test` runs the smoke + unit tests (rule extraction, schema/migrations, server validation, auth). Browser tests live in `test/e2e/`.

## Using the app
- Sidebar groups: **Plan** (Journey map, Corkboard, Matrix, Life timeline, Calendar) · **Write** (Book/Script, Craft, Genre packs, Tension, Weave) · **People** · **World** · **Tools** · **Help**. New tabs not listed in `GR` (`public/js/app.js`) appear under **More**.
- Open the built-in examples from **Stories**; they include props, world rules, packs, place profiles and wiki links (`public/js/samples.js`, bump `VERSION` there to re-issue updated examples; the previous copy is kept in `sf-baks-<id>`).
- Token-protected server: the app asks once in an in-app dialog; or open `/#token=…` once. Unset `KATHAKAAR_TOKEN` to disable.
- Docs: in-app **Help → Docs** (searchable; sections in `public/js/docs.js`, per-feature notes in `docs.js`/`docs2.js` via `DOCS.register`).

## v5 additions
- **Relationship arcs** (`public/js/v5.js`): per-relationship *beats* (closeness −5…+5 + type, anchored to events or years), person/group comparison, group average, *intended arc* with preset shapes and a drift report.
- **Collapsible lists**: characters, places (tree), relationships, shared info, rule categories, chapters; filter box, collapse/expand all, “+N more” on long character selectors.
- **Edit final** (Book / Script tab): edit the rendered text directly; stored per chapter in `ev.fin`, used by preview, print and all exports; find & replace, revert, stale-plan warning, chapter status, word goal.
- **Focus mode** (Edit final → 🖋): full-screen single-chapter writing, fading controls, session word count, chapter navigation, context panel.
- **History**: snapshots (manual, Ctrl/⌘+S, timed auto-saves, and before risky actions) stored in `localStorage` key `sf-snaps-<story>`; compare (paragraph diff) and restore per chapter or whole manuscript.
- **Genre arc templates**: 25+ ready-made intended arcs (Romance, Thriller & Mystery, Fantasy & Adventure, Drama & Family, Comedy, Tragedy & Horror, War & Historical) with named beats; save your own (stored in `sf-ui`).
- **Theme** (`public/css/theme.css`): warm cream/terracotta editorial look with serif headings, light + dark.

## Rule syntax and limits
- **Rule text**: plain sentence. If *Forbidden words* is empty the key concept is derived from patterns like “No X…”, “Nobody may carry X in…”, “Humans cannot X”, “X is forbidden”, “There is no X” (e.g. `Nobody may carry weapons in the temple` → *weapons*, plus related words such as sword, dagger).
- **Forbidden words**: comma/newline separated. `*` = any letters inside a word (`fly*` matches *fly, flying, flyer*, not *butterfly*) — same meaning on client and server. Multi-word phrases match as phrases.
- **Triggers**: groups joined by `+`, alternatives inside a group by `|` or `,`; the rule applies when all groups appear in the same scene, e.g. `gold + water|river`. If empty, “X reacts with Y” is recognised.
- Limits: the semantic check takes 500 items per request and 60,000 characters per item (the app batches 100 at a time and warns if text was cut). Concept extraction is heuristic (no grammar parser): if the derived concept is wrong, type the exact words into *Forbidden words*. The edited final text is what gets checked when it exists. Negation (“never flew”) is flagged as *check context*, not excluded.

## Server options (`.env`)
- `KATHAKAAR_TOKEN=secret` requires `Authorization: Bearer secret` on every `/api/*` call (the app asks once and stores it in this browser as `xtoken`). Use it if the server is reachable from other machines. `RATE_LIMIT=600` = max API calls per minute per IP.
- Everything written to `/api/kv/<key>` is validated (JSON + story schema); invalid data gets HTTP 400.

## Sync, backups, troubleshooting
- On start the app **merges** local and server data per story. Only-local stories are uploaded, only-server stories downloaded. If a story changed on both sides you are asked which to keep; the other version goes to **Backup history**.
- The header shows **✓ Saved**, or **⚠ Server unreachable — saved locally, retrying** (back-off up to 60 s) with a **↻ Reconnect** button. Nothing is lost offline; queued writes are sent on reconnect.
- **Backup history** (Data → Backup): last 8 copies of the current story (every ~5 min, before restores and conflicts). **Export all / Import all** (My stories) moves the whole library incl. snapshots and arc templates; importing never overwrites an existing story.
- Story files carry a schema version (`v`); older files are migrated on load and imports are validated.
- “Server needs an access token” → enter `KATHAKAAR_TOKEN`; to reset run `localStorage.removeItem('xtoken')` in the console.
- Port busy → `PORT=3001 npm start`. Semantic check unavailable → the offline check still runs.
- Storage-full warning → Export all, then delete old stories/snapshots (browser localStorage is ~5 MB).

## AI for meaning-based rules (v6)
Two stages, both configurable on the **🧠 AI Engine** tab (settings live in `data/ai-config.json`, never in the browser; keys are never sent back to the page):

1. **Embedding model** – finds passages close in meaning to a forbidden concept.
2. **Verifier ("judge")** – optional; reads each *candidate* (≤3 sentences + the rule) and dismisses false alarms such as negation ("nobody could fly"). Verdicts are cached, run 4 at a time, at most 60 per check; if the verifier is down the embedding result is kept and the problem is shown.

| Setup | Embeddings | Verifier | Needs | Privacy |
|---|---|---|---|---|
| Built-in | hashed n-gram | – | nothing | local |
| Light local | MiniLM-L6 (22M) | – | `npm run setup-model` (~25 MB) | local |
| **Good local ★** | BGE-base (109M) | Qwen2.5-7B via Ollama | setup-model + [Ollama](https://ollama.com) `ollama pull qwen2.5:7b` (~5 GB RAM) | local |
| Best local | Ollama mxbai-embed-large (335M) | Qwen2.5-14B (or 32B) | Ollama, ~9 GB RAM (GPU helps) | local |
| Private + cloud verifier | BGE-base local | Claude Haiku/Sonnet or OpenAI | API key | only flagged passages leave the machine |
| Fully remote | OpenAI `text-embedding-3-*` | any | API key | **whole manuscript** is sent for embedding |

Other local choices: BGE-small/large, multilingual-E5 (non-English stories), Ollama `nomic-embed-text` / `bge-m3`, a local NLI verifier (`Xenova/nli-deberta-v3-*`, concept matches only). Any OpenAI-compatible server (LM Studio, vLLM, llama.cpp, OpenRouter, Together, Groq) works via *OpenAI-compatible* + Base URL.
- **Calibrate threshold** scores 30 built-in sentence pairs with the active model and stores the best cosine threshold per model (similarity scales differ a lot between models). Done automatically the first time a model loads.
- Only the machine running the server can change AI settings (or set `KATHAKAAR_TOKEN`). Env overrides: `AI_EMBED_PROVIDER/MODEL`, `AI_JUDGE_PROVIDER/MODEL`, `OLLAMA_URL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `KATHAKAAR_DATA` (data directory).
- Model names/sizes are suggestions; models download from huggingface.co the first time (set `EMBED_OFFLINE=1` to forbid downloads).

## Also in v6
Custom calendars · multiple places per event (“Also at”) · tension/emotion graph and story weave · PDF print layout · DOCX/EPUB with author, language, series, ISBN, cover · Final Draft (.fdx) and Scrivener-ready export, import of .fdx/.fountain/.docx/.rtf/.md/Scrivener ZIP · lossless screenplay↔novel plan syntax · IndexedDB mirror (recovers data if localStorage is cleared, and stores stories that exceed the ~5 MB localStorage quota).
Tests: `npm test` (unit + AI with mock providers); browser tests in `test/e2e/` including `a11y.py` (axe-core, 0 serious/critical violations).

## Docker
```bash
docker compose up -d --build        # → http://localhost:3000   (first build downloads the BGE-base model, ~110 MB)
docker compose logs -f kathakaar
docker compose down                 # data survives in the named volumes
```
- **Volumes:** `kathakaar-data` (stories, backups, AI settings incl. API keys — keep private, back it up: `docker run --rm -v kathakaar_kathakaar-data:/d -v $PWD:/b busybox tar czf /b/kathakaar-data.tgz -C /d .`) and `kathakaar-models` (downloaded models).
- **Smaller image:** `docker compose build --build-arg WITH_MODELS=0` (built-in embedder only; you can still use Ollama / remote APIs). Skip the build-time download with `--build-arg PRELOAD_MODEL=`.
- **Network:** the port is published on `0.0.0.0` (reachable from anywhere) and `docker compose` refuses to start unless `KATHAKAAR_TOKEN` is set in `.env`. Open the port in your firewall/security group, and put a TLS reverse proxy in front for HTTPS (token is sent as a Bearer header). To lock it back to localhost, change the `ports:` line to `127.0.0.1:${KATHAKAAR_PORT:-3000}:3000`.
- **AI settings:** `AI_CONFIG_OPEN=1` is set so the AI Engine tab can save settings from your browser (inside Docker the browser does not arrive from 127.0.0.1). The token is mandatory in this configuration because the port is public.
- **Ollama:** on the host, nothing to do (`host.docker.internal:11434` is preconfigured). Bundled instead: `docker compose --profile ollama up -d`, put `OLLAMA_URL=http://ollama:11434` in `.env`, then `docker compose exec ollama ollama pull qwen2.5:7b`. NVIDIA GPU: uncomment the `deploy:` block.
- **Plain Docker:** `docker build -t kathakaar . && docker run -d --name kathakaar --init -p 127.0.0.1:3000:3000 -e AI_CONFIG_OPEN=1 -v kathakaar-data:/app/data -v kathakaar-models:/app/models kathakaar`
- Runs as the non-root `node` user; liveness endpoint `/healthz`. If you bind-mount `./data` instead of a named volume, make it writable for uid 1000 (`chown 1000:1000 data`).

## New in this iteration
- **Sync**: retry on 408/425/429/5xx, rejected-write tracking (`SFSYNC.rejectedKeys`), non-blocking boot, `xl-dirty` upload-first, meta-first pulls (`/api/kv-meta` + per-key GET), `If-Match` concurrency, 3-way `SCHEMA.merge3` with a stored base.
- **Key registry** (`public/js/keys.js`): `sf-*` synced, `xl-*` device-local.
- **Schema v7**: collection registry, `inbox`, `tpls`, `dgoal`, reference repair (`SCHEMA.repair/usage`).
- **UI**: word log + streak + heatmap (header chip), inbox (Ctrl+Shift+I), command palette + search (Ctrl+K; `@` chars, `#` chapters, `/` places), ✍ Craft tab (style lint, readability, beat sheets).

### HTTP API
| Route | Notes |
|---|---|
| `GET /api/kv-meta` | `{key:{m,n}}` |
| `GET/PUT/DELETE /api/kv/<key>` | `ETag`, `If-None-Match` → 304, `If-Match` → 412 |
| `POST /api/kv-batch` | `{puts,dels}` → per-key result |
| `GET/PUT/HEAD/DELETE /api/blob/<sha256>` | content-addressed, hash verified |
| `GET /api/blobs`, `/api/storage`, `/api/diag` | listings and diagnostics |

Env: `TRUST_PROXY=1`, `KATHAKAAR_LOG=1`, `KATHAKAAR_QUOTA_MB`.

### Genre packs, drawer sections, Problems panel (schema v8)
🧩 Packs tab: enable packs per story (Mystery, Romance, Fantasy/Sci-Fi, Historical, Horror, Comedy, Literary, Screenwriting, YA/MG, Research & family). Each adds ledgers, event-drawer sections and checks. **Problems** (Ctrl+Shift+M, header ⚠ badge) aggregates every check plus link integrity; dismissals need a reason and resurface if the text changes.
✍ Craft tab also has Compare (hunk revert), Tools (names, style outliers, family tree, SSML / GEDCOM / CSV / ICS export, EPUB validator) and Reading & audio (sprint timer, reading comfort, read-aloud).

### Server additions
`KATHAKAAR_KEY` / `KATHAKAAR_KEY_FILE` enable AES-256-GCM encryption at rest (`OLD_KEY=… node server/rekey.js` to rotate). `GET /api/export` streams JSONL. `/sw.js` (generated) + `manifest.webmanifest` make the app installable and offline-capable; `/api/*` is never cached.

### Props, corkboard, blobs, maps, wiki, publishing (schema v10)
- **🗡 Props**: weapons, equipment, documents… with a custody log (who holds it, where it is, its condition) from any chapter onward. Views: cards, props × chapters matrix, characters × chapters. Scenes list which props appear; checks flag props used after being destroyed/lost, appearing without their holder, or in the wrong place (Problems panel).
- **📌 Corkboard / Kanban**: drag, or keyboard (Space grab, arrows, Space drop, Esc cancel); bulk status, merge; palette command “Split chapter at cursor”.
- **Images** live in a content-addressed blob store (`/api/blob/<sha256>`), never inside the story JSON. 🖼 Mood board (alt text required, palette extraction) and 🗺 World map (pins, scale calibration, travel-time warnings).
- **📖 Encyclopedia**: `[[links]]`, backlinks, rename-everywhere, broken-link checks.
- **Publish** (Craft): query letter + guidance, synopsis from beats, front/back matter, beta-reader HTML export and safe feedback import. Comment threads in the event drawer.
- **Clipping**: `POST /api/clip` (opt-in `KATHAKAAR_CLIP=1`, SSRF-guarded, token required).

### Hardening and tooling
- **Importer guards**: ZIP entry/size/ratio limits and unsafe-path rejection (`ZIPGUARD`), enforced on actual inflated bytes.
- **🔐 Data & storage** tab: per-key sizes, quota, persistence request, snapshot pruning, sync diagnostics, copyable report (no manuscript text).
- **Lint** runs in a Web Worker (`work.js`); the Edit-final panel is opened from the command palette. 100k words lint in ~0.2 s off the main thread.
- **Docs registry**: `DOCS.register({id,tab,title,html})`; `test/guards.js` fails on native `alert(`, single-quoted interpolated attributes, missing i18n keys and undocumented tabs.
- Romance trope/ending checks and a moon-phase consistency check (Fantasy pack).

### Print and cover
Craft → **Print** applies trim, bleed, mirrored margins and preflight to *Export → PDF* (page size with bleed verified: A5 + 3 mm → 154 × 216 mm). Recto chapter starts depend on browser support — Chromium did **not** insert blank verso pages in my test, so check the PDF. Craft → **Cover** designs an ebook cover and a full-wrap paperback cover (spine from page count). Platform numbers live in `public/data/platforms.json` and are marked unverified; confirm them with your printer.

### Multi-user mode (optional) and sharing
Create users with `node server/tools/adduser.js ana "Ana"` (prints the token once; only its SHA-256 is stored in `data/users.json`). When `users.json` exists, each user gets a private namespace and the single shared token is no longer accepted. Share a story: `POST /api/share {key,user,role:'reader'|'editor'|'none'}`; recipients use `GET/PUT /api/shared/<owner>/<key>` (readers get 403 on PUT; revocation is immediate). `data/audit.log` records who/what/when/key — never content. All users on one server share its CPU/disk budget: this is for collaborators, not hostile multi-tenant hosting. **There is no in-app UI for shared stories yet** (server API only).

| Route | Notes |
|---|---|
| `GET /api/me` | caller identity |
| `POST /api/share` | owner-only, per story |
| `GET /api/shared`, `GET/PUT /api/shared/<owner>/<key>` | role-checked, `If-Match` supported |
| `GET /api/export` | JSONL dump of the caller’s keys |
| `POST /api/clip` | opt-in, SSRF-guarded |

## Multi-user
Set `KATHAKAAR_MULTIUSER=1`. Open the app from the server machine (`http://localhost:3000`) and create the first account — it becomes the administrator. Others sign in with username + password; open sign-up with `KATHAKAAR_SIGNUP=1`, or create accounts with `KATHAKAAR_PASSWORD=… node server/tools/adduser.js <user>`.
- Every account has its own private stories and images (`data/kv/u-<id>/`, `data/blobs/u-<id>/`). Passwords are stored as scrypt hashes; sessions are random tokens stored only as SHA-256 hashes and expire after 30 days.
- **Kathākośa → Share** gives another user read/editor access; they see it under **Shared with me** and can copy it into their own library. Removing access is immediate.
- Only the administrator can change AI Engine settings (they hold API keys). Signing in as a different account on the same browser removes the previous account's local copy (it stays on the server).
- Account menu (sidebar): change password, sign out.
- Library menu: **Kathākośa** = all your stories; **Story Markdown** = the current story as a Markdown document.
- Deploying publicly: see `DEPLOY.md` (Caddy HTTPS, admin CLI, backups).
- **Public platform:** sign-up is open by default — anyone can create an account and start writing. Set `KATHAKAAR_SIGNUP=0` to close it. Each user has a 50 MB quota (`KATHAKAAR_QUOTA_MB`, 0 = unlimited); sign-ups are limited to 10/hour per IP. The first account made from localhost is admin, everyone else a member. Use HTTPS, and `TRUST_PROXY=1` behind a proxy.
