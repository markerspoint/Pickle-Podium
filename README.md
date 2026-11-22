# Pickle Podium

A pickleball podium-finish database built with **React + TypeScript + Vite** (Tailwind CSS, React Router).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build in dist/
```

## Pages

| Route | What it does |
| --- | --- |
| `/` | Hero search, totals, top-5 leaderboard, latest podiums |
| `/players` | Searchable, sortable registry with tournament / year / skill / division / medal filters |
| `/players/:id` | Player profile: medal counts, doubles partners, every podium finish with its **Proof** link |
| `/submit` | Public form to submit a result or correction (held for admin review) |
| `/admin` | Manage players and finishes, review submissions, bulk-import a CSV |

## Where the data comes from

Nothing is fetched from Facebook. Each podium finish has a `proof_url` field — a link an admin (or a
submitter) pasted in, usually the organiser's Facebook results post. The **Proof** button opens that
link in a new tab. The "Search on Facebook" buttons (on a player profile, and when a search finds
nobody) open Facebook's own search page for that name; nothing is read back into the app.

Records are stored in one of two places, decided by environment variables (`src/lib/store.ts`):

- **Shared database (Supabase)** — set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Every
  visitor sees the same records and admins sign in with email and password. Use this for the live site.
- **This browser only** — with those variables missing, records go to `localStorage` behind a
  passcode (`VITE_ADMIN_PASSCODE`, default `admin`). Fine for trying the app, not for a public site.

The database starts empty: add records in `/admin`, one by one or by CSV import.

## Setting up the shared database

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: paste all of `supabase/schema.sql` and run it.
3. **Authentication → Users → Add user**: create your admin login (email + password, tick "Auto Confirm User").
4. Back in the SQL Editor, make that login an administrator (use your email):
   ```sql
   insert into public.admins select id from auth.users where email = 'you@example.com';
   ```
5. **Project Settings → API**: copy the *Project URL* and the *anon public* key.
6. In Vercel: **Project → Settings → Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` with those values, then redeploy. For local development put the same two
   lines in a `.env` file (see `.env.example`).

The anon key is meant to be public. The rules in `schema.sql` are what protect the data: visitors can
read published records and send submissions; only logins listed in `admins` can change anything or
read submissions.

Bulk import (Admin → Bulk import) expects a CSV with this header row:

```
full_name,nickname,home_club,city,tournament_name,event_date,placement,skill_level,division,partner_name,proof_url
```

## Deploying to Vercel

Import the repository in Vercel; it detects Vite automatically (build `npm run build`, output `dist`).
`vercel.json` rewrites every path to `index.html` so links like `/players/<id>` work on refresh.
