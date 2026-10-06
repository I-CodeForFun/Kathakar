# HTTP API reference

Base URL: the server root. All `/api/*` routes return JSON unless noted and are sent with `Cache-Control: no-store`. Authenticate with `Authorization: Bearer <token>` (a session token from login, or `KATHAKAAR_TOKEN` in shared-token mode). Keys must match `^[\w-]{1,64}$`.

## Status codes you will see
`200` ok · `304` not modified · `400` invalid input/schema · `401` not authenticated · `403` forbidden (role) · `404` not found / no access · `412` precondition failed (conflict) · `413` body too large · `429` rate limited or locked out (read `Retry-After`) · `507` quota exceeded.

## Public

| Method & path | Description |
|---|---|
| `GET /healthz` | Liveness probe `{ok:1}` (no auth, no model loading) |
| `GET /sw.js` | Generated service worker (cache version = hash of the public files) |
| `GET /api/auth/config` | `{multi, signup, bootstrap}` – used by the sign-in dialog |
| `POST /api/auth/register` | `{id, name?, password}` → `{token,id,name,role}`; 403 if sign-up closed, 429 if throttled |
| `POST /api/auth/login` | `{id, password}` → `{token,id,name,role}`; 401 wrong credentials, 429 locked |

## Session

| Method & path | Description |
|---|---|
| `GET /api/me` | `{id,name,role,multi}` |
| `POST /api/auth/logout` | Revoke the current token |
| `POST /api/auth/password` | `{old,new}`; other sessions are revoked |
| `POST /api/auth/delete` | `{password}`; deletes the account and all data |

## Stories (key/value)

| Method & path | Description |
|---|---|
| `GET /api/kv-meta` | `{key:{m:mtimeMs,n:bytes}}` – cheap change detection |
| `GET /api/kv` | Everything (`{key: jsonString}`) – avoid for large libraries |
| `GET /api/kv/<key>` | Value + `ETag`; `If-None-Match` → 304 |
| `PUT /api/kv/<key>` | Body = JSON text. Validated by key type + schema. `If-Match: <etag>` → 412 `{etag,value}` on conflict. 507 if over quota |
| `DELETE /api/kv/<key>` | Delete (also revokes shares of that story) |
| `POST /api/kv-batch` | `{puts:{key:text}, dels:[key]}` → `{key:"ok"\|"400:reason"\|"507:quota"}` (body ≤ 20 MB) |
| `GET /api/export` | NDJSON backup of all keys + blob list (`application/x-ndjson`) |
| `GET /api/storage` | `{keys, blobs, total, quotaMB}` |

## Images (content-addressed)

| Method & path | Description |
|---|---|
| `GET /api/blobs` | `{sha256:size}` |
| `PUT /api/blob/<sha256>` | Raw bytes; server verifies the hash; ≤ 5 MB |
| `GET` / `HEAD /api/blob/<sha256>` | Download / exists |
| `DELETE /api/blob/<sha256>` | Remove from *your* store |

## Sharing (multi-user only)

| Method & path | Description |
|---|---|
| `POST /api/share` | `{key,user,role:"reader"\|"editor"\|"none"}` – 404 if the user/story does not exist |
| `GET /api/shares?key=<k>` | Who has access to your story |
| `GET /api/users` | Usernames and display names (for the share picker; excludes you) |
| `GET /api/shared` | `[{owner,key,role}]` shared with you |
| `GET /api/shared/<owner>/<key>` | Read a shared story (`X-SF-Role` header) |
| `PUT /api/shared/<owner>/<key>` | Write (editor only; `If-Match` supported) |

## Realtime

| Method & path | Description |
|---|---|
| `GET /api/events` | Server-Sent Events. Events: `{id,type:"kv"\|"presence",owner,k,etag,by,t}`. Resume with `Last-Event-ID` or `?since=<id>` (ring buffer of 500) |
| `POST /api/presence` | `{story,chapter,owner?}` → `{here:[…]}` and broadcast to collaborators |

## Semantic checker and AI

| Method & path | Who | Description |
|---|---|---|
| `POST /api/check` | any user | `{world, items[], sens}` ≤ 500 items × 60 000 chars |
| `POST /api/explain` | any user | "Why was this flagged?" |
| `GET /api/health` | any user | Engine/judge status |
| `GET /api/ai/config` | any user | Public view (no keys) + `canConfigure` |
| `POST /api/ai/config` | **admin** (or localhost single-user) | Save provider settings |
| `POST /api/ai/test`, `POST /api/ai/calibrate`, `GET /api/ai/ollama-models` | **admin** | Diagnostics |
| `GET /api/diag` | **admin** in multi-user | Node version, uptime, counts |
| `POST /api/clip` | any user, only if `KATHAKAAR_CLIP=1` | `{url}` → `{title,author,date,text}`; 20/min/IP |

## Examples

```bash
# log in and use the token
TOKEN=$(curl -s localhost:3000/api/auth/login -H 'content-type: application/json' \
  -d '{"id":"asha","password":"correct horse"}' | jq -r .token)

curl -s localhost:3000/api/kv-meta -H "authorization: Bearer $TOKEN"

# optimistic concurrency
ETAG=$(curl -si localhost:3000/api/kv/sf2 -H "authorization: Bearer $TOKEN" | awk -F': ' 'tolower($1)=="etag"{print $2}' | tr -d '\r')
curl -s -X PUT localhost:3000/api/kv/sf2 -H "authorization: Bearer $TOKEN" -H "if-match: $ETAG" --data @story.json
```
