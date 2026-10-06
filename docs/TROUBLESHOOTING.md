# Troubleshooting

## Sign-in and accounts
| Symptom | Cause / fix |
|---|---|
| Sign-in dialog appears again and again | Session expired (30 days), password was changed/reset (all sessions revoked), or the server was reset. Sign in again. |
| "Wrong username or password" | Usernames are case-insensitive but exact; check the keyboard. After 10 failures the account is locked for 15 minutes. |
| "Too many failed attempts" / 429 | Wait for `Retry-After`; admins can reset: `admin.js set-password <user>`. |
| "Sign-up is closed" | `KATHAKAAR_SIGNUP=0`; ask the administrator for an account. |
| "That username is reserved" | `admin`, `root`, `support`… are blocked. |
| Forgot password | No email reset. Ask the admin → `admin.js set-password <user>`. |
| Admin forgot password | Run `admin.js set-password <admin>` on the server shell. |
| Cannot create the first admin on the web | By design. Use `admin.js create-admin <name>`. |
| Another user's stories vanished after I signed in | Local copies are per account; they are wiped on account switch but remain on the server. Sign back in to the original account. |

## Sync
| Symptom | Fix |
|---|---|
| Chip says "saved locally, retrying" | Server unreachable. Keep writing; it retries with back-off up to 60 s. Press **↻ Reconnect**. |
| "Not saved to server: <key>" | The server rejected the data (invalid schema or over quota → HTTP 400/507). Export the story, check *Data & storage* for sizes. |
| Quota exceeded (507) | Default 50 MB per account. Delete old snapshots/images or ask the admin to raise `KATHAKAAR_QUOTA_MB`. |
| "changed on both devices" dialog | Pick *Merge*, *Keep this device*, or *Use server*. Both versions are saved under **Backup history**. |
| Edits from another device don't appear | The live feed needs an unbuffered proxy for `/api/events`. Reload to force a pull. |
| "Newer data on server — reload" | You were mid-edit when another device saved. Finish typing, then reload. |

## Server
| Symptom | Fix |
|---|---|
| Port busy | `PORT=3001 npm start` |
| Can't reach it from another computer | Default bind is `127.0.0.1` when no auth is configured. Set `KATHAKAAR_MULTIUSER=1` (or a token) and `HOST=0.0.0.0`. |
| Everyone shares one IP / lock-outs hit all users | Behind a proxy without `TRUST_PROXY=1`. Set it and forward `X-Forwarded-For`. |
| `KATHAKAAR_KEY` from `.env` ignored | Fixed since `server/env.js`; ensure the file is named `.env` in the project root. |
| "encrypted data but no KATHAKAAR_KEY set" | The data was written with a key. Provide the same key. |
| Certificate not issued (Caddy) | DNS not pointing to the server yet, or ports 80/443 blocked. See `docker compose logs caddy`. |
| Static files return 404 after update | Hard-reload; the service worker updates itself (toast "Update available"). |
| Health check failing | `curl localhost:3000/healthz`; read `docker compose logs kathakaar`. |

## Semantic checker
| Symptom | Fix |
|---|---|
| "No semantic matches" | Use *Strict* sensitivity, add alternatives to triggers, or enable a better model. |
| Many false alarms | Use *Allow exception*, enable an LLM **verifier** in AI Engine, or switch to *Loose*. |
| Engine shows "hash fallback" | Run `npm run setup-model`, or in Docker build with `WITH_MODELS=1`. |
| Ollama unreachable | Start Ollama and check `OLLAMA_URL`; in Docker use `host.docker.internal`. |
| Can't save AI settings | Only admins can in multi-user mode; in single-user mode only from localhost (or `AI_CONFIG_OPEN=1` in Docker). |

## Exports
| Symptom | Fix |
|---|---|
| EPUB blocked | The validator found a structural error; the message lists it. |
| PDF has no blank pages before chapters | Known Chromium limitation for "recto" starts. |
| Print platform numbers look wrong | `public/data/platforms.json` is unverified; check your printer's specs. |

## Diagnostics
* **Tools → Data & storage**: sizes, sync status, recent client errors (`xl-errors`).
* `GET /api/diag` (admin) – Node version, uptime, key/blob counts.
* `KATHAKAAR_LOG=1` – per-request server log.
* Browser console: `SFSYNC.status`, `SFSYNC.pending()`, `SFSYNC.rejectedKeys`.
