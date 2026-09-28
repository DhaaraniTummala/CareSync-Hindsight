# CareSync AI

A hospital-record continuity app: doctors get a source-cited AI clinical
brief across a patient's records from every hospital; patients get one
timeline of their own records plus an AI health assistant.

- `src/` — React frontend (Vite)
- `backend/` — FastAPI backend (Firebase Auth, Firestore, Cloudinary, Groq, Hindsight)
- `api/index.py` — thin Vercel entrypoint that re-exports the same FastAPI
  app as a serverless function (see **Deploying to Vercel** below)

## Running it locally

**1. Backend first** — see `backend/README.md` for full setup (Firebase,
Cloudinary, Groq, Hindsight accounts + keys, then seed demo accounts).

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

All backend routes live under `/api` (e.g. `/api/auth/me`) so the exact
same app works locally and on Vercel. `/health` (no prefix) also works
locally as a quick liveness check.

**2. Frontend**

```bash
npm install
cp .env.example .env   # fill in VITE_API_BASE_URL + VITE_FIREBASE_* (Firebase Console > Your apps)
npm run dev             # opens http://localhost:5173
```

Once both are running and `backend/scripts/seed_demo.py` has been run once,
sign in with:
- Doctor: `dr.priya@example.com` / `demo1234`
- Patient: `rohan.singh@email.com` / `demo1234`

Or use "New here? Create an account" on the login screen to register a real
account — doctors from the Doctor tab, patients from the Patient tab.

## Deploying to Vercel

One Vercel project serves both halves: the React build as the static site,
and `api/index.py` (the same FastAPI app, unchanged) as a Python serverless
function. `vercel.json` rewrites every `/api/*` request to that function,
so the frontend calls its own domain and no CORS setup is needed in
production.

```bash
npm i -g vercel   # if you don't have it
vercel login
vercel             # first deploy — link/create the project, review settings
vercel --prod      # promote to production
```

Vercel auto-detects the Vite frontend build and the Python function; no
other project settings need changing.

**Environment variables** — set these in the Vercel dashboard
(Project → Settings → Environment Variables), not in any committed file:

| Variable | Used by | Notes |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | frontend | Firebase Console → Your apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | frontend | " |
| `VITE_FIREBASE_PROJECT_ID` | frontend | " |
| `VITE_FIREBASE_APP_ID` | frontend | " |
| `VITE_API_BASE_URL` | frontend | leave **unset** — defaults to `/api`, which is correct on Vercel |
| `FIREBASE_SERVICE_ACCOUNT_JSON_INLINE` | backend | paste the **entire** service account JSON (minified to one line) — never commit the file itself |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | backend | Cloudinary dashboard |
| `GROQ_API_KEY` | backend | https://console.groq.com |
| `GROQ_MODEL`, `GROQ_BASE_URL` | backend | optional, have working defaults |
| `HINDSIGHT_BASE_URL`, `HINDSIGHT_API_KEY` | backend | optional — **must** point at a network-reachable Hindsight (e.g. Hindsight Cloud), since Vercel's serverless functions can't reach a `localhost` Docker container on your machine. Chat still works without it, just without cross-session memory. |
| `ALLOWED_ORIGINS` | backend | optional now that frontend + backend share a domain; only matters if you call the API from elsewhere |

Minify the service account JSON before pasting it in, e.g.:
```bash
python3 -c "import json,sys; print(json.dumps(json.load(open('backend/your-key.json'))))"
```

## Layout

- `src/App.jsx` — all screens (login/signup, doctor dashboard, patient dashboard)
- `src/api.js` — typed fetch wrapper for the backend, + direct Cloudinary upload helper
- `src/firebase.js` — Firebase Auth client setup
- `src/index.css` — all styling (design tokens at the top)
- `backend/app/main.py` — FastAPI app + routers, all mounted under `/api`
- `api/index.py` — Vercel serverless entrypoint (imports `backend/app/main.py` unchanged)
