# Delivery Roadmap

> This roadmap reflects the actual implementation path, which diverges from the original phased plan. See `docs/00-manifestation-plan.md` for the canonical build plan that was followed.

## Phase 0 — Foundation [COMPLETE]

Outcome: deployable app with DynamoDB and S3 wiring.

Delivered:
- Next.js 16, React 19, Tailwind v4, shadcn/ui scaffold.
- zod env validation (`src/lib/env.ts`) with `SKIP_ENV_VALIDATION` CI escape hatch.
- AWS SDK v3 client singletons (`src/lib/aws/s3.ts`, `src/lib/aws/ddb.ts`).
- CDK stacks: S3 bucket (private, versioned, lifecycle rules, CORS), DynamoDB single-table (3 GSIs, TTL, PITR), IAM app user, AWS Backup plan, Secrets Manager for credentials.
- Health check route (`/api/health`).
- `(app)` and `(admin)` route groups, `Providers` wrapper.
- All docs updated from Postgres to DynamoDB.

## Phase 1 — Identity [COMPLETE]

Outcome: admin-seeded user can sign in via name-pick then password.

Delivered:
- Auth.js v5 Credentials provider with JWT sessions.
- `src/proxy.ts` (Next.js 16 proxy convention, Edge-safe JWT check via `@auth/core/jwt`).
- `src/auth.config.ts` (Edge-safe callbacks) + `src/auth.ts` (full Credentials provider).
- DynamoDB repos: `users.ts`, `roster.ts`.
- Name-pick entry page (`/`) server-rendered from DynamoDB roster.
- Password login page (`/login/[userId]`) — server component + client form with `useActionState`.
- Rate limiting: 5 attempts / 15-minute TTL, DynamoDB-backed.
- Audit events for login success/failure/rate-limit.
- `scripts/seed-roster.ts` (`npm run seed`) — seeded: CC (admin), Precious, Jaz, Dessa, Bless, Isaac, Nijae.
- `scripts/promote-admin.ts` (`npm run promote-admin`) — makes any seeded user an admin.

## Phase 2 — Family Box MVP [COMPLETE]

Outcome: upload, browse, download, share links, soft delete.

Delivered:
- Root folder auto-created on first `/box` visit.
- Drag-and-drop upload dropzone with XHR progress bar.
- Single-part uploads (≤ 100 MB) and multipart uploads (100 MB – 5 GB).
- File browser: list view and photo grid view.
- Sort by date/name/size (server-side).
- View toggle (list / grid) persisted in URL.
- Folder creation, rename, navigation with breadcrumb.
- File rename, move to folder, soft delete.
- Trash view with restore.
- Search by filename prefix (per-folder, cross-folder).
- Public share links: 7-day expiry, revocable, `/s/[token]` page.
- Photo thumbnails via presigned preview URLs (generated server-side).
- Multi-select with bulk download and bulk delete.
- File detail sheet (tap on mobile to see metadata + actions).

## Phase 3 — Admin and Recovery [COMPLETE]

Outcome: one admin can fully manage the app.

Delivered:
- `/admin/users` — create, disable, enable, reset password.
- `/admin/storage` — per-user storage totals (queries `byFileStatus` GSI).
- `/admin/activity` — merged audit feed across all users (newest first).
- `/admin/share-links` — all active public share links.
- Admin password reset from the UI.
- Restore deleted file from trash (admin or owner).
- Daily cleanup cron (`/api/cron/cleanup`, Vercel Cron 03:00 UTC, `CRON_SECRET` bearer auth).

## Phase 4 — Polish [COMPLETE]

Outcome: ready for family use.

Delivered:
- Dark mode (next-themes, system preference default, sun/moon toggle).
- Mobile-responsive layouts: collapsible sidebar, top icon bar on mobile.
- File detail sheet on mobile tap (metadata + all actions without hover).
- Grid view: checkboxes always visible on mobile; overlay actions desktop-only.
- Storage warning banner at 80% and 100% of 5 GB limit.
- Self-service password change (`/box/settings`).
- Self-service display name edit (inline in sidebar).
- AWS Backup plan (weekly, 90-day retention) in CDK.
- `npm run gen-secret` helper for generating secrets on Windows.

## Beyond the Original Plan — Additional Features [COMPLETE]

These features were built after the core phases based on user direction:

- **Multipart upload (up to 5 GB)** — S3 multipart upload with per-chunk progress.
- **Family sharing** — share files and folders with all family members or specific individuals; `/box/family` page; read-only shared folder view.
- **Move file** — move a file to any folder via a folder-tree picker modal.
- **Media viewer** — in-app lightbox for images, video, and audio (see Phase 5).

## Phase 5 — Media Viewer [IN PROGRESS]

Outcome: files can be previewed in-app without downloading.

Planned:
- yet-another-react-lightbox for images and videos.
- PDF.js for PDF preview.
- Native `<audio>` player for audio files.
- Office documents (Word, Excel, PowerPoint) are download-only (no privacy-safe in-browser viewer exists).

## Deferred — Provider Imports

Google Drive, OneDrive, and Dropbox copy-in imports are deferred until the core box is stable and the family finds them necessary. iCloud has no viable public web import path and remains research-only.

When implemented, provider imports will follow the original plan:
- OAuth connect/disconnect per provider.
- User selects files/folders to copy in.
- Background job (Vercel Cron) copies files into the family box.
- Import progress persists across page refreshes.
- No continuous sync — copy-in only.
