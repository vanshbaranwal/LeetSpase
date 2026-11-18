# Spase history

Admin dashboard → Spases shows total, active, inactive, and ended sessions. Totals count creations, including host-only sessions, once. Lists and each detail history use pages of 20 records.

The database retains creator/current host, access mode, start/end times and ending actor/reason; confirmed participants and individual visits; problem/language selections; and existing execution jobs with request, start and completion times. HTTP reservations alone do not establish attendance.

Reconnects within the reservation window resume a visit. A new tab closes the old visit as TAB_REPLACED. Explicit departures and removals have separate reasons. Disconnected visits expire after the 60-second presence lease; empty Spases close after five minutes. Host endings and empty expiry close remaining visits and pending jobs in the same transaction. Presence recovery runs at backend startup.

Account deletion preserves Spase and participation history through nullable user references. The UI displays Deleted account. Deleting a current host through profile settings ends their open Spases. Original creators of older Spases are unavailable because earlier host transfers were not recorded. Migrated participant records do not invent join/leave times, and earlier job completion times remain unavailable.

## Deployment

From the backend directory, with the deployment DATABASE_URL configured:

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
npm start
```

On Render, use Root Directory `backend`, Build Command `npm ci && npx prisma generate && npx prisma migrate deploy`, Start Command `npm start`, and Health Check Path `/health`. Keep FRONTEND_URL set to the production frontend origin (currently https://leetspase.vanshbaranwal.com). Comma-separated origins are supported by HTTP and Socket.IO.

Deploy the frontend after the backend migration and updated API are ready. No additional environment variables are required. These presence/expiry handlers use the current single backend instance. Keep one instance; multiple permanent socket instances require shared presence and broadcasts. Deployments can briefly reconnect existing clients. The server binds its port before running presence recovery, rejects traffic until recovery completes, and reports a clear error if the port is already occupied.

## Validation

Install dependencies in both backend and frontend, set a local PostgreSQL DATABASE_URL, then run from backend:

```sh
npm run validate:spase-migrations
npm run validate:spases
```

The integration check rejects nonlocal databases, creates an isolated schema, uses real HTTP/Socket.IO and a local CodeBox stand-in, and removes its schema afterward. It covers confirmed attendance, reconnection, replacement, leave/removal, host transfer/end, concurrent Yjs edits, five-person capacity and unique colors, viewer restrictions, execution success/failure/idempotency and shared diagnostics, duplicate startup, account deletion, expiry/restart recovery, admin authorization, filtering and pagination. The migration check applies the full migration chain to legacy fixtures and verifies retained history without invented timestamps. It does not call the production judge.

History endpoints omit source snapshots and full judge outputs; execution summaries extract only verdict and pass counts. No per-keystroke activity log is added.

Shared Run and Submit results both include full diagnostic details. Legacy summary-only jobs still display their saved verdict and pass counts.
