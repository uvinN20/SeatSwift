# Browser tests (development aid)

These scripts drive the real built frontend in headless Chromium against `mock-api.js`, a **stand-in** for the
Spring backend that reproduces its response envelope and endpoint contract. They prove the UI behaves; they do
not prove the real backend/MySQL behaves (see `backend/src/test/.../SecurityIntegrationTest` for backend checks).

    node mock-api.js &            # :8081
    node static-server.js &       # serves the built app on :5173 (edit `root` to your build output)
    python3 public.py             # anonymous browsing, login dialog, resume, route guards
    python3 flow.py               # search -> seats -> reserve -> slip -> admin approval -> mobile
Requires `pip install playwright && playwright install chromium`. Restart `mock-api.js` between runs (it keeps state in memory).
