# Trackr

Personal gym, sports, and supplement log. Next.js App Router, Prisma, and SQLite.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
# existing local SQLite: node scripts/backfill-namekey.mjs && npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Phone testing on the LAN hostname is allowed automatically; add extras with `ALLOWED_DEV_ORIGINS`.

### Environment

| Variable | Required in production | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | SQLite file URL, e.g. `file:./dev.db` |
| `AUTH_SECRET` | yes | At least 16 characters. Used to sign session JWTs. |
| `REGISTRATION_CODE` | yes | Invite code for `/register`. Compared in constant time. |

Development falls back to insecure defaults so `npm run dev` works without a filled `.env`. Those defaults are rejected in production.

### Demo data

```bash
npm run seed:demo
```

Creates user `test` / `testpass1` with ~90 days of gym, sports, supplements, and PR snapshots. Other accounts are left alone.

## App map

- `/` Home for a day (`?date=YYYY-MM-DD`)
- `/log` Full history
- `/analytics` Period via `?period=7|30|90|0`
- `/settings/...` Muscles, exercises, supplements, appearance (including kg/lb and km/mi), export/import, account
- `/login` and `/register`

Sessions live in SQLite and are revoked on logout. Writes go through server actions. The service worker caches icons and an offline page only — it does not cache logged-in HTML and does not queue logs offline. Weights are stored in kilograms and distances in km/meters; Appearance can display pounds and miles.

## Scripts

```bash
npm test
npm run lint
npm run build
```
