Browser tests (Python + Playwright; optional, not part of `npm test`):

    pip install playwright && playwright install chromium
    PORT=3111 node server/index.js &        # fresh data dir: rm -rf data first
    python3 test/e2e/fixes.py               # also: history_focus.py, arc_templates.py
    python3 test/e2e/offline_sync.py        # starts its own server on :3112
