# Security model

## Threat model

| Asset | Threat | Mitigation |
|---|---|---|
| Users' manuscripts | Another user reading them | Per-account folders; ACL checked on every shared request; blobs namespaced per account |
| Passwords | Database leak | scrypt (N=16384) with per-user salt; never logged |
| Sessions | Token theft from disk | Only SHA-256 of tokens stored; expiry 30 days; password change/reset revokes sessions |
| Accounts | Brute force | 10 attempts/account → 15 min lock; per-IP exponential lock-out; sign-up 10/h/IP; global 600 req/min/IP |
| Admin access | Privilege escalation via sign-up | Admins only via CLI; "localhost = admin" shortcut disabled behind any proxy |
| API keys for AI | Members reading/changing them | Stored in `ai-config.json`, never sent to browsers; only admins may change |
| Server | SSRF via page clipper | Off by default; blocks private/link-local/loopback ranges, pins DNS result, limits redirects, ports, size |
| Server | Path traversal | Static files resolved and checked to stay inside `public/`; keys restricted to `[\w-]{1,64}` |
| Browser | XSS | CSP `script-src 'self'`; all user text escaped (`SFX.esc`); automated guard test forbids unsafe interpolation |
| Data at rest | Stolen disk/backup | Optional AES-256-GCM (`KATHAKAAR_KEY`) for stories; use disk encryption for the rest |
| Availability | Oversized/slow requests | Body caps (5 MB, 20 MB batch), 30 s read timeout, per-user quota, server timeouts |

## Authentication details
* Tokens are 256-bit random values. Comparison of the shared token uses constant-time comparison of SHA-256 digests.
* Login of an unknown user performs a dummy scrypt so response time does not reveal which usernames exist.
* Failed logins and unauthenticated API calls both count toward the IP lock-out.

## HTTP hardening
Sent on every response: `Content-Security-Policy` (self only, no frames, no objects), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`, `Permissions-Policy` (camera/mic/geo off), `Cache-Control: no-store` on API responses, `Strict-Transport-Security` when behind HTTPS proxy with `TRUST_PROXY=1`.

## Known limitations (be aware)
1. The session token lives in `localStorage`, so an XSS bug would expose it. CSP and escaping reduce that risk; an HttpOnly-cookie mode is a recommended future change.
2. CSP still allows inline **styles** (`style-src 'unsafe-inline'`) because the UI uses `style=` attributes.
3. No email: password recovery is manual via the CLI.
4. No CAPTCHA or email verification on sign-up; the IP throttle limits abuse but a determined attacker with many IPs can create accounts. Use `KATHAKAAR_SIGNUP=0`, a WAF, or add verification if you see abuse.
5. Content is not scanned or moderated. If you host public users you are responsible for abuse reports and legal requests.
6. Encryption at rest covers stories only (not images, accounts, ACL, audit log).
7. Native `confirm()` dialogs remain in a few older screens (usability, not security).

## Operational checklist
- [ ] HTTPS in front (Caddy config provided), `TRUST_PROXY=1`
- [ ] Firewall: only 80/443 open; container port 3000 not published
- [ ] `.env`, `.env.production`, `data/` not in git and not world-readable
- [ ] Admin created via CLI; no default accounts
- [ ] Backups tested (restore on a spare machine)
- [ ] Rotate any token that was ever committed (the original upload contained one)
- [ ] `npm audit` is clean (the project has only a dev dependency, `axe-core`)
- [ ] Privacy policy & terms published; contact address for removal requests
- [ ] Monitoring on `/healthz`; disk space alerts (quota limits per user, not total)

## Reporting vulnerabilities
Add a `SECURITY.contact` address of your own here before launch and monitor it.
