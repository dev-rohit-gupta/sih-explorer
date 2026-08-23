# SIH Explorer 2026

A fast, resilient, unofficial explorer for the official Smart India Hackathon 2026 problem statements.

## Phase 1

- Next.js 16 App Router + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Drizzle ORM + PostgreSQL (`postgres` driver)
- Official source URL from `SIH_PS_URL`
- Server-side SIH HTML ingestion and normalization
- Relational, immutable snapshots (`sih_snapshots` + `sih_problem_statements`)
- Latest / previous snapshot switching
- Automatic stale refresh after the page is already rendered
- Protected Vercel Cron sync endpoint
- Source-down fallback: keep serving the last successful snapshot
- Suspicious scrape protection (count drop / missing IDs / invalid rows)
- Search across title, PS ID, organization, theme, description and expected solution
- Software / Hardware, theme and organization filters
- Problem statement detail pages
- Vercel Analytics

## Why Drizzle is used

The public explorer is only Phase 1. Phase 2 will add users, Auth.js identities, teams, memberships, invitations, saved PSs, votes, notes, activity and AI research. Keeping the database in Drizzle from the start gives us one typed schema and a migration path instead of spreading raw SQL through the app.

Current schema lives in `db/schema.ts` and Drizzle configuration lives in `drizzle.config.ts`.

## Architecture

The website never needs the official SIH portal to render a normal page. Users read from the most recent saved PostgreSQL snapshot. A background request checks whether the snapshot is stale and attempts a refresh. If SIH is slow or unavailable, the refresh can fail without affecting the current visitor.

Each successful changed scrape creates:

1. one immutable `sih_snapshots` row, and
2. normalized `sih_problem_statements` rows linked to that snapshot.

Sync attempts are stored in `sih_sync_runs`. `sih_sync_state` provides a short database-backed lease so multiple visitors cannot start the same scrape simultaneously.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` and `CRON_SECRET`.
3. Install dependencies:

   ```bash
   npm install
   ```

4. For a new database, apply the Drizzle schema. During local development the quickest option is:

   ```bash
   npm run db:push
   ```

   If you want versioned SQL migrations instead:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   Commit the generated `drizzle/` migration files before deploying.

5. Start the app:

   ```bash
   npm run dev
   ```

6. Create the first SIH snapshot by calling `GET /api/cron/sync` with:

   ```text
   Authorization: Bearer <CRON_SECRET>
   ```

7. Open `/`.

### Drizzle commands

```bash
npm run db:push       # sync schema directly during development
npm run db:generate   # generate SQL migration files from db/schema.ts
npm run db:migrate    # apply generated migrations
npm run db:studio     # inspect data using Drizzle Studio
```

There is no runtime `CREATE TABLE IF NOT EXISTS` logic anymore. Schema changes are explicit and managed through Drizzle.

## Vercel

Add the environment variables from `.env.example`. `vercel.json` includes a daily cron as a backstop. Normal visitors also trigger `/api/sync-if-stale` after receiving cached data; that endpoint only fetches SIH when the latest successful check is older than `SIH_SYNC_STALE_MINUTES`.

For production, generate and commit migrations, then run `npm run db:migrate` as part of your deployment/database migration process.

## Data integrity

A fetched page is not promoted blindly. The sync rejects suspicious parses when:

- too few statements are returned,
- the count suddenly drops by more than 30%,
- duplicate PS numbers are found, or
- required fields are missing.

A new snapshot and all of its problem statements are inserted in one database transaction. If that transaction fails, the previous successful snapshot stays intact.

Old snapshots are deleted according to `SIH_SNAPSHOT_RETENTION`; linked problem statements are removed automatically through the foreign key cascade.

## Phase 2 boundary

The code intentionally does **not** add authentication yet. Planned authenticated features can be added on top of the same Drizzle schema layer:

- Auth.js credentials + Google sign-in
- team creation and leader/admin role
- leader-created member accounts
- Nodemailer/Gmail invite emails
- temporary password + forced password setup flow
- join-team flow
- team shortlist, voting, notes and activity
- Gemini-assisted research per problem statement

Recommended future schema modules:

```text
db/
├── schema.ts               # Phase 1 today
└── schema/                 # split here as Phase 2 grows
    ├── sih.ts
    ├── auth.ts
    ├── teams.ts
    └── research.ts
```

## Attribution

This project is unofficial and is not affiliated with Smart India Hackathon, AICTE or the Ministry of Education. Data is sourced from the official SIH portal configured through `SIH_PS_URL`.
