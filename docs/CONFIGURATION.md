# Configuration reference

Configuration comes from **environment variables**. For convenience the server also reads a `.env` file in the project root (real environment variables win). `.env` is loaded *first* (`server/env.js`), so every setting below — including the encryption key and data directory — is honoured. Old `STORYFLOW_*` names still work and are mapped to `KATHAKAAR_*`.

> Never commit `.env`. It is in `.gitignore` and `.dockerignore`.

## Network

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | TCP port |
| `HOST` | `127.0.0.1` when no auth is configured, otherwise `0.0.0.0` | Bind address. The safe default prevents exposing an unprotected server to your LAN. |
| `TRUST_PROXY` | `0` | Set `1` behind a reverse proxy: use the **last** `X-Forwarded-For` as client IP, send HSTS when `X-Forwarded-Proto: https`, and disable all "same machine" shortcuts. |
| `RATE_LIMIT` | `600` | API calls per minute per IP |
| `KATHAKAAR_LOG` | `0` | `1` = log one line per request |

## Authentication & accounts

| Variable | Default | Meaning |
|---|---|---|
| `KATHAKAAR_MULTIUSER` | off | `1` = accounts with username + password ([MULTI_USER.md](MULTI_USER.md)). Also switches on automatically if `accounts.json` / `users.json` exists. |
| `KATHAKAAR_SIGNUP` | open | `0` = close public sign-up (invitation only). |
| `KATHAKAAR_SIGNUPS_PER_HOUR` | `10` | Sign-ups per IP per hour |
| `KATHAKAAR_SESSION_DAYS` | `30` | Session lifetime |
| `KATHAKAAR_QUOTA_MB` | `50` in multi-user, otherwise unlimited | Per-account storage cap (stories + images). `0` = unlimited |
| `KATHAKAAR_TOKEN` | – | Single shared token for every `/api/*` call (shared-token mode; ignored in multi-user mode) |
| `KATHAKAAR_USERS_FILE` | `data/users.json` | Location of the session file |
| `KATHAKAAR_PASSWORD` | – | Only for the admin CLI (never set on the server process) |

## Storage & encryption

| Variable | Default | Meaning |
|---|---|---|
| `KATHAKAAR_DATA` | `./data` | Data directory (Docker: `/app/data`) |
| `KATHAKAAR_KEY` | – | Encrypt story files at rest (AES-256-GCM). 64 hex characters, or any passphrase. **Losing it loses the data.** |
| `KATHAKAAR_KEY_FILE` | – | Read the key from a file (Docker/Kubernetes secrets) |
| `OLD_KEY` | – | Used only by `server/rekey.js` |

Images (blobs) and the account files are not covered by `KATHAKAAR_KEY`; protect them with disk encryption.

## Semantic checker / AI

| Variable | Default | Meaning |
|---|---|---|
| `EMBED_BACKEND` | auto | `hash` = built-in, no download |
| `EMBED_MODEL` | `Xenova/all-MiniLM-L6-v2` | Local model (needs `npm run setup-model`) |
| `EMBED_OFFLINE` | `0` | `1` = never download models |
| `AI_EMBED_PROVIDER`, `AI_EMBED_MODEL` | `local`, `Xenova/bge-base-en-v1.5` | `local \| ollama \| openai \| hash` |
| `AI_JUDGE_PROVIDER`, `AI_JUDGE_MODEL` | `none` | `none \| local \| ollama \| openai \| anthropic` verifier |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama endpoint |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | – | Only needed for those providers |
| `AI_CONFIG_OPEN` | `0` | Single-user Docker only: allow saving AI settings from a non-localhost browser. Ignored in multi-user mode (admins only). |

Settings saved in the AI Engine tab are stored in `data/ai-config.json` (contains keys; never sent to browsers).

## Optional features

| Variable | Default | Meaning |
|---|---|---|
| `KATHAKAAR_CLIP` | `0` | `1` enables `/api/clip` (fetch a web page as plain text for research notes). SSRF-protected, but **leave off on public servers** unless needed. |
| `KATHAKAAR_CLIP_ANYPORT` | `0` | Allow non-80/443 ports for clipping |

## Docker Compose variables (`.env.production`)

`DOMAIN`, `KATHAKAAR_SIGNUP`, `KATHAKAAR_QUOTA_MB`, `KATHAKAAR_SIGNUPS_PER_HOUR`, `RATE_LIMIT`, `KATHAKAAR_KEY`, `WITH_MODELS`, `PRELOAD_MODEL` — see [DEPLOYMENT.md](DEPLOYMENT.md).

## Recommended presets

| Scenario | Settings |
|---|---|
| Laptop, just me | none |
| Home server for the family | `KATHAKAAR_MULTIUSER=1`, `KATHAKAAR_SIGNUP=0`, create accounts with the CLI |
| Public platform | `docker-compose.prod.yml` (multi-user, open sign-up, 50 MB quota, HTTPS, `TRUST_PROXY=1`) |
| Private cloud with a team | multi-user, `KATHAKAAR_SIGNUP=0`, `KATHAKAAR_KEY` set, disk encryption |
