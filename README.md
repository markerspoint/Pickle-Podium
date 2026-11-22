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
submitter) pasted in, usually the organiser's Facebook results post. The **Proof** button just opens
that link in a new tab.

Data lives in the browser's `localStorage` (`src/lib/store.ts`) and starts empty: add records in
`/admin` (one by one or by CSV import). Each browser has its own copy. To share one
database between visitors, replace the functions in `src/lib/store.ts` with calls to a backend
(Supabase, Firebase, your own API) — the pages only talk to that file.

## Admin

The admin passcode defaults to `admin`; set `VITE_ADMIN_PASSCODE` in a `.env` file to change it.
This check runs in the browser and only keeps casual visitors out — it is not real security. Use
backend authentication before putting real records online.

Bulk import expects a CSV with this header row:

```
full_name,nickname,home_club,city,tournament_name,event_date,placement,skill_level,division,partner_name,proof_url
```

## Deploying to Vercel

Import the repository in Vercel; it detects Vite automatically (build `npm run build`, output `dist`).
`vercel.json` rewrites every path to `index.html` so links like `/players/<id>` work on refresh.
