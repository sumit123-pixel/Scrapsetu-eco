# ScrapSetu — From E-Waste to a Greener Future

A full e-waste recycling workflow: collectors log a pickup request, get an AI-assisted
material ID, live pricing, and a match to the nearest verified recycler — recyclers
log in to a real-time dashboard to accept jobs and move them through the recycling pipeline.

## Project structure

```
frontend/
  index.html                → landing page (choose collector or recycler)
  collector.html             → collector-facing site (Steps 1-9 of the workflow)
  recycler-dashboard.html    → recycler login + live job dashboard
backend/
  server.js                  → tiny Express server, keeps the Gemini key server-side
  package.json
  .env.example
```

## What's already working

- Firestore database (project: `scrapsetu-92ce6`) storing `requests`, `recyclers`, `transactions`
- Geolocation + reverse geocoding (free, no key)
- Nearest-recycler matching (Haversine distance, no paid maps API)
- Leaflet map showing collector ↔ recycler
- QR-coded digital pickup slip
- Live status sync between collector and recycler pages (Firestore real-time listeners)
- Recycler login/registration (Firebase email/password auth)
- AI photo classification via a backend that calls Gemini (keeps your API key private)

## One-time Firebase setup

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Firestore Database → Rules** → use rules scoped to this app (ask me to resend these
   if you need them again — they restrict recyclers to editing only their own profile,
   and transactions to being updated only by the assigned recycler).
3. Firestore will need a `recyclers` collection with real data — register recyclers
   through `recycler-dashboard.html`'s "Register your business" form rather than
   adding them manually, so each one gets a matching login.

## Running the frontend

No build step — these are plain HTML files. Two easy options:
- Open `frontend/index.html` directly in a browser to test locally.
- Deploy the whole `frontend/` folder to **Vercel** or **Netlify** (drag-and-drop the
  folder on Netlify's dashboard, or connect the GitHub repo) for a real live URL.

## Running the backend (for AI photo classification)

See `backend/README.md` for full steps. Summary:
1. `cd backend && npm install`
2. Copy `.env.example` to `.env`, add your **regenerated** Gemini API key
3. `npm start` to test locally, or deploy free on **Render.com**
4. In `collector.html`, update `const BACKEND_URL = "..."` to your deployed backend URL

## What's not built yet

- Collector-side login (right now anyone can submit a request without an account)
- Editable pricing (currently a hardcoded table in `collector.html` — could move to
  a Firestore `pricing` collection so you can update rates without touching code)
- SMS/email pickup notifications (needs the same "keep the key on a backend" pattern
  as the Gemini classification)
- Real SMS OTP for collectors (possible, but requires Firebase's Blaze billing plan)

## Security reminder

Never commit a real `.env` file or paste real API keys into chat, docs, or public
repos. The Firebase `apiKey` in the HTML files is safe to expose (that's how Firebase
web apps work) — your actual security boundary is the Firestore Rules, not that key.
