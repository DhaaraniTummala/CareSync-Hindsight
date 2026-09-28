# CareSync AI — backend

FastAPI service backing the CareSync frontend. Firebase Auth for login,
Firestore for patients/records/appointments, Cloudinary for file uploads,
Grok (xAI) for the clinical brief + chatbot, and Hindsight for the
chatbot's cross-session memory.

**Security model:** the frontend only ever holds a Firebase Auth ID token.
Firestore is touched *only* from this backend, using the Firebase Admin SDK
(which has full access, bypassing client-side security rules entirely) — so
there are no Firestore security rules to write or maintain. Every route
checks the caller's role/identity itself (see `app/security.py`).

## 1. Install

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## 2. Set up each service

**Firebase (Auth + Firestore)**
1. Create a project at https://console.firebase.google.com
2. Build → Authentication → get started → enable "Email/Password" sign-in.
3. Build → Firestore Database → create database (production mode is fine —
   see the security model note above, no rules needed since only the Admin
   SDK touches it).
4. Project settings (gear icon) → Service accounts → Generate new private
   key → save the downloaded file as `backend/firebase-service-account.json`.
5. Still in Project settings → General → "Your apps" → add a Web app, and
   copy its config values into the **frontend's** `.env` (see frontend
   README) — the frontend needs the public web config to sign users in.

**Cloudinary (Files)**
1. Sign up at https://cloudinary.com — the free tier is enough to start.
2. Dashboard shows `Cloud name`, `API Key`, `API Secret` at the top —
   copy all three into `backend/.env`.

**Grok / xAI (AI brief + chatbot)**
1. Get an API key at https://console.x.ai
2. Put it in `GROK_API_KEY` in `backend/.env`. `GROK_MODEL` defaults to `grok-4`.

**Hindsight (chatbot memory)** — optional; chat still works without it, just
without long-term recall across sessions.
1. Easiest local option:
   ```bash
   docker run -it --pull always --name hindsight --restart unless-stopped \
     -p 8888:8888 -p 9999:9999 \
     -e HINDSIGHT_API_LLM_API_KEY=$GROK_API_KEY \
     -e HINDSIGHT_API_LLM_PROVIDER=openai \
     -e HINDSIGHT_API_LLM_BASE_URL=https://api.x.ai/v1 \
     -v hindsight-data:/home/hindsight/.pg0 \
     ghcr.io/vectorize-io/hindsight:latest
   ```
   Leave `HINDSIGHT_BASE_URL=http://localhost:8888` in `.env`.
2. Or use Hindsight Cloud (https://hindsight.vectorize.io) and set
   `HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io` and
   `HINDSIGHT_API_KEY` to your Hindsight Cloud key.

## 3. Seed demo accounts (optional, but recommended for first run)

Once Firebase is configured:

```bash
python scripts/seed_demo.py
```

Creates:
- Doctor: `dr.priya@example.com` / `demo1234`
- Patient: `rohan.singh@email.com` / `demo1234` (with a couple of sample
  records and an appointment, so the dashboard isn't empty)

## 4. Run

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs
Health check: http://localhost:8000/health

Every real route lives under `/api` (e.g. `POST /api/auth/bootstrap-profile`)
so this exact app also runs unchanged as a Vercel serverless function — see
the root `README.md`'s "Deploying to Vercel" section.

The server boots fine with none of the above configured — it just returns a
clear "X is not configured" error from any route that needs the missing
service, instead of crashing, so you can wire services up one at a time.

## API surface

| Route | Method | Who | Purpose |
|---|---|---|---|
| `/api/auth/bootstrap-profile` | POST | any signed-in Firebase user | create the CareSync profile right after signup |
| `/api/auth/me` | GET | any CareSync user | current user + role |
| `/api/patients` | GET/POST | doctor | list / add patients |
| `/api/patients/{id}` | GET | doctor, or that patient | patient profile |
| `/api/patients/{id}/records` | GET/POST | doctor, or that patient | medical records |
| `/api/patients/{id}/appointments` | GET/POST | doctor, or that patient | appointments |
| `/api/uploads/signature` | GET | doctor, or that patient | signed Cloudinary upload params |
| `/api/ai/brief` | POST | doctor | generate the cited clinical brief |
| `/api/ai/chat` | POST | that patient | chatbot reply, grounded in their own records |
