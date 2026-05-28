# Manifestation Plan

This is the single, ordered execution plan for taking Francis Family Cloud from scaffold to a usable family MVP. It is the canonical entry-point for the build and supersedes any conflicting build sequencing in earlier roadmap docs.

## Context

Francis Family Cloud is a private Next.js app that gives each family member one personal file box backed by AWS S3. The repo currently contains:

- A Next.js 16 / React 19 / Tailwind 4 / shadcn scaffold (`src/app/page.tsx` is a static roster mockup).
- A planning hub in `docs/` (product, architecture, security, data model, roadmap, backlog, family playbook).
- An empty `aws/cdk/` skeleton and an `aws/cli/` placeholder for infrastructure.
- A canonical policy at `AI_POLICY.md` that all AI assistants must follow.

A decisive infrastructure choice has been made for this project: **DynamoDB only, AWS only, keep it simple**. Earlier docs that reference PostgreSQL (Neon, Supabase, Vercel Postgres) are out of date and must be reconciled as the first task of Phase 0. Provider imports (Google Drive, OneDrive, Dropbox, iCloud) are explicitly deferred until the core box is reliable.

The outcome we are driving toward: one named family member can sign in, drop a file in the browser, see it land in their private box, share a single file by revocable link, and recover a soft-deleted file - all backed entirely by AWS services with no third-party data plane.

## Decisions Locked In

| Area | Choice | Why |
| --- | --- | --- |
| Metadata store | DynamoDB single-table (on-demand billing) | User directive; no Postgres. Matches the small access-pattern surface. |
| Object store | S3 private bucket, presigned uploads/downloads | Mandated by `AI_POLICY.md` section 4. |
| Auth | Auth.js v5 Credentials provider + `@auth/dynamodb-adapter` | Name-pick then password flow per docs; DynamoDB-native sessions. |
| Hosting | Vercel (primary), AWS Amplify Hosting as alternative | Vercel is already named in `README.md`; IAM credentials only, no Vercel-side data. Revisit if a single-cloud bill is preferred. |
| Infra-as-code | AWS CDK in `aws/cdk/` | Skeleton already exists. |
| Imports | Deferred until MVP plus admin recovery are stable | Per `README.md` and user direction. |
| Frontend stack | Keep current: Next.js App Router, React 19, Tailwind v4, shadcn/ui, lucide-react | Already wired. |
| ID strategy | ULIDs (sortable, URL-safe) for users, files, folders, shares | Stable, time-ordered, K-sortable for DynamoDB sort keys. |
| Password hashing | `@node-rs/argon2` (or `argon2`) | Modern, memory-hard. |

## Doc Reconciliation (first task of Phase 0)

Per `AI_POLICY.md` section 6 hard-rule 8, doc updates ship in the same change as the storage migration. Files to edit:

- `README.md` - replace the PostgreSQL recommendation with DynamoDB single-table.
- `docs/02-architecture.md` - replace "PostgreSQL for metadata" and the "Store import jobs in Postgres" line; add DynamoDB table and GSI overview.
- `docs/05-data-model.md` - replace the relational schema with the DynamoDB single-table design below.
- `AI_POLICY.md` section 5 - replace the `DATABASE_URL` row with DynamoDB env vars (`AWS_REGION`, `DYNAMODB_TABLE_NAME`).

## DynamoDB Single-Table Design

One table per environment: `francis-family-cloud-dev`, `francis-family-cloud-prod`.

Keys: `PK` (partition), `SK` (sort). All entity types live in one table; access patterns drive the key design.

| Entity | PK | SK | Notes |
| --- | --- | --- | --- |
| User profile | `USER#<userId>` | `PROFILE` | `displayName`, `role`, `passwordHash`, `showOnLoginRoster`, `disabledAt` |
| Folder | `USER#<userId>` | `FOLDER#<folderId>` | `parentFolderId`, `name`, `deletedAt` |
| File | `USER#<userId>` | `FILE#<fileId>` | `folderId`, `displayName`, `s3Key`, `status`, `sizeBytes`, `mimeType`, `deletedAt`, `etag` |
| Share link | `SHARE#<token>` | `META` | `fileId`, `ownerUserId`, `expiresAt`, `revokedAt`, `allowPreview`, `allowDownload` |
| Upload session | `USER#<userId>` | `UPLOAD#<sessionId>` | `fileId`, `status`, `s3MultipartUploadId`, TTL on `ttl` attr |
| Audit event | `USER#<targetUserId>` | `AUDIT#<isoTs>#<eventId>` | `actorUserId`, `eventType`, `metadata` |
| Roster anchor | `ROSTER#ACTIVE` | `USER#<displayNameLower>` | Sparse projection used to list the public name picker without scanning |

Global secondary indexes:

- **GSI1 `byShareOwner`**: `GSI1PK = USER#<ownerUserId>`, `GSI1SK = SHARE#<createdAt>` - list a user's share links and admin view.
- **GSI2 `byFolder`**: `GSI2PK = USER#<userId>#FOLDER#<folderId>`, `GSI2SK = <displayNameLower>` - browse and name-sort folder contents; supports prefix `begins_with` for search.
- **GSI3 `byFileStatus`**: `GSI3PK = USER#<userId>#STATUS#<status>`, `GSI3SK = <updatedAt>` - trash view, pending uploads, failed items.

TTL attribute (`ttl`, epoch seconds) drives auto-expiry of abandoned upload sessions (24 hours) and optional expired-share-link cleanup.

## Build Order

### Phase 0 - Foundation [COMPLETE 2026-05-27]

Outcome: app deploys, health route confirms wiring.

1. Reconcile docs (see Doc Reconciliation above) - single commit.
2. Add env validation with `zod`: `src/lib/env.ts`. Required vars: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `DYNAMODB_TABLE_NAME`, `AUTH_SECRET`, `AUTH_URL`.
3. AWS clients: `src/lib/aws/s3.ts`, `src/lib/aws/ddb.ts` - singletons of `S3Client` and `DynamoDBDocumentClient`.
4. CDK stack in `aws/cdk/lib/`: one S3 bucket (block public, SSE-S3, lifecycle for incomplete multiparts at 7 days), one DynamoDB table with the three GSIs above, IAM user/policy scoped to that bucket and table only. Output credentials to Vercel env vars manually.
5. Health route at `src/app/api/health/route.ts`: pings DDB `DescribeTable` and S3 `HeadBucket`; returns 200 only if both succeed.
6. App shell: keep the current `/` roster page (still static for now), add `(app)` and `(admin)` route groups, wire a global `<Providers />` for theme and Auth.js session.

Exit: `vercel deploy` succeeds, `/api/health` returns OK, `npm run lint` is clean.

### Phase 1 - Identity [COMPLETE 2026-05-27]

Outcome: an admin-seeded user can sign in via name-pick then password.

Implementation notes (discoveries during build):
- Next.js 16 renamed `middleware.ts` to `proxy.ts`. The proxy file must export a named `proxy` function. `middleware.ts` was deleted.
- `@node-rs/argon2` is a NAPI module and must be listed in `serverExternalPackages` in `next.config.ts` to prevent Edge runtime errors.
- Auth.js v5 middleware pattern: `src/auth.config.ts` is Edge-safe (only jwt/session callbacks, no providers) and is used by `src/proxy.ts`. `src/auth.ts` has the full Credentials provider and imports DynamoDB repos. The proxy uses `getToken` from `@auth/core/jwt` for Edge-compatible JWT verification.
- Base UI `Button` (from `@base-ui/react`) does not have an `asChild` prop. Use `buttonVariants()` class directly on a `<Link>` component instead.

1. DynamoDB repos in `src/lib/repos/`: `users.ts`, `roster.ts`. Functions: `listActiveRoster()`, `getUserById()`, `getUserByDisplayName()`, `verifyPassword()`.
2. Seed script at `scripts/seed-roster.ts` (run via `tsx`): inserts the four family members (Angela, Maria, Nina, Sofia from the current mockup) with placeholder hashes the admin replaces.
3. Auth.js v5 at `src/auth.ts` with `@auth/dynamodb-adapter` and Credentials provider. JWT sessions (lighter for DynamoDB).
4. Routes:
   - `/` - server-renders `listActiveRoster()`; each card links to `/login/[userId]`.
   - `/login/[userId]` - server-renders display name only; POSTs to credentials provider.
   - `/box` - protected layout (redirect to `/` if no session).
5. Rate limiting: simple DDB-backed counter on `LOGIN_ATTEMPT#<userId>` with TTL 15 minutes, blocks after 5 fails.
6. Audit: write `auth.login.success`, `auth.login.failure` events.

Exit: a seeded user can complete the full name-pick to password to `/box` flow. Disabled users are absent from the roster. Wrong-password rate-limits after 5 attempts.

### Phase 2 - Family Box MVP [COMPLETE 2026-05-28]

Outcome: upload, browse, download, share, soft-delete.

1. Folders model plus root-folder auto-create on first `/box` visit.
2. Drag-and-drop upload at `src/components/box/UploadDropzone.tsx`. Flow per `docs/02-architecture.md` Storage Flow - Upload: client requests presign, uploads to S3, calls completion API, server `HeadObject` verifies and flips status to `available`.
3. API routes:
   - `POST /api/files/presign` - validates user, creates `FILE#` row with `pending_upload`, returns presigned PUT URL (or multipart init for files larger than 100 MB).
   - `POST /api/files/[id]/complete` - verifies S3 object exists, sets `available`, writes audit event.
   - `GET /api/files/[id]/download` - ownership check, returns short-lived presigned GET.
   - `POST /api/folders`, `PATCH`, `DELETE` - folder CRUD.
   - `PATCH /api/files/[id]`, `DELETE` - rename, move, soft-delete.
4. File browser at `/box/folder/[folderId]` and `/box/search` - server components reading via `byFolder` GSI.
5. Share links:
   - `POST /api/files/[id]/share` - creates `SHARE#<token>` with default 7-day expiry.
   - `GET /s/[token]/preview` and `GET /s/[token]` - public route; checks `revokedAt`, `expiresAt`; redirects to presigned URL or streams.
   - UI: per-file share modal with copy-link and revoke.
6. Trash view at `/box/trash` - reads `byFileStatus` GSI for `deleted` status.
7. Search: per-folder `begins_with` query on GSI2; cross-folder search falls back to scan-with-filter (acceptable at family-scale data).

Exit (from `docs/06-delivery-roadmap.md`): test user uploads and downloads files; test user creates and revokes a share link; files are private between users.

### Phase 3 - Admin and Recovery [COMPLETE 2026-05-28]

Outcome: one admin can fully manage the app.

1. Admin route group `/admin/*` gated by `role === 'admin'`.
2. User management: create/disable users (writes to roster anchor records too).
3. Storage usage: per-user `sum(sizeBytes where status='available')` - denormalize a running counter on the user profile updated by upload-complete and delete handlers (cheaper than scanning files each render).
4. Activity feed: query audit events by `targetUserId` over GSI.
5. Shared-link admin view: list via `byShareOwner` GSI.
6. Restore from trash: PATCH file to clear `deletedAt`, audit event.
7. S3 lifecycle: 30-day permanent delete for objects whose metadata row is gone (handled by a Vercel cron route hitting `DeleteObject` for rows past retention).

Exit: admin can add a family member, see what failed, and restore a deleted file inside the retention window.

### Phase 4 - Polish before going live [COMPLETE 2026-05-28]

1. Mobile dashboard pass (already mostly responsive; verify drop zone on iOS Safari).
2. Plain-English empty/error states per `docs/08-family-user-playbook.md`.
3. Large-file progress UI (multipart parts to percent).
4. Storage limit warning (configurable per user; soft warn at 80 percent).
5. DynamoDB on-demand backups enabled in CDK; weekly export to S3 cold storage.
6. Run `/security-review` against the diff.
7. Family walkthrough on a real device per `docs/08-family-user-playbook.md`.

Exit: a non-technical family member can use the app with no hand-holding.

### Deferred (post-MVP)

- Provider imports (Google Drive, OneDrive, Dropbox), each behind its own phase per `docs/06-delivery-roadmap.md` Phases 3 through 5.
- iCloud research per Phase 7.
- Email-based password reset (until then, admin resets via a seed-script analogue).

## Files to Create vs Modify

Modify (Phase 0 doc reconciliation): `README.md`, `AI_POLICY.md`, `docs/02-architecture.md`, `docs/05-data-model.md`.

Create (Phase 0 foundation):

- `docs/00-manifestation-plan.md` - this file (durable plan).
- `src/lib/env.ts`, `src/lib/aws/s3.ts`, `src/lib/aws/ddb.ts`.
- `aws/cdk/lib/storage-stack.ts`, `aws/cdk/bin/` entry.
- `src/app/api/health/route.ts`.

Create (Phase 1): `src/auth.ts`, `src/middleware.ts`, `src/lib/repos/users.ts`, `src/lib/repos/roster.ts`, `src/app/login/[userId]/page.tsx`, `scripts/seed-roster.ts`.

Create (Phase 2): `src/lib/repos/files.ts`, `src/lib/repos/folders.ts`, `src/lib/repos/shares.ts`, `src/components/box/` tree, `src/app/api/files/`, `src/app/api/folders/`, `src/app/s/[token]/`, `src/app/box/` tree.

Create (Phase 3): `src/app/admin/` tree, `src/app/api/admin/` tree.

## Dependencies to Add

Runtime:

- `@aws-sdk/client-s3`
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`
- `@aws-sdk/s3-request-presigner`
- `next-auth@beta` (Auth.js v5)
- `@auth/dynamodb-adapter`
- `@node-rs/argon2` (or `argon2`)
- `ulid`
- `zod`
- `react-hook-form`
- `@hookform/resolvers`

Dev:

- `aws-cdk-lib`, `constructs` (already in `aws/cdk`)
- `tsx` (for seed/admin scripts)

## Environment Variables

Single source of truth lives in `src/lib/env.ts`, validated with `zod`.

| Var | Used by |
| --- | --- |
| `AWS_REGION` | S3 and DDB clients |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Server-only |
| `AWS_S3_BUCKET` | S3 client and presigner |
| `DYNAMODB_TABLE_NAME` | DDB doc client |
| `AUTH_SECRET` | Auth.js JWT signing |
| `AUTH_URL` | Auth.js callback base |

Set in Vercel for `preview` and `production`; mirror in `.env.local` for dev pointing at the `-dev` table and bucket.

## Verification Plan

End-to-end manual checks at each phase exit:

- Phase 0: `curl https://<deploy>/api/health` returns 200 with both checks `ok`. `npm run build` clean. `npm run lint` clean.
- Phase 1: from a fresh incognito window, complete name-pick to password to land on `/box`. Disabled user does not appear on `/`. After 5 bad passwords, login is rate-limited.
- Phase 2: as a seeded test user, upload a 5 MB file, a 0-byte file, and a 200 MB file (multipart). Refresh - files persist. Soft-delete one - it appears under `/box/trash` and is gone from the folder view. Create a share link, open in incognito - preview and download work. Revoke the link - incognito request 404s. Confirm a second user's `/box` cannot see the first user's files via direct URL guess.
- Phase 3: as admin, add a new user via the admin UI, sign in as that user from a clean browser. Disable a user - confirm they vanish from `/`. Restore a soft-deleted file - it returns to its folder.
- Phase 4: run `/security-review` against the merged branch; complete the production checklist in `docs/03-security-privacy.md` ("Security Checklist Before Production"). Hand the device to a non-technical tester and watch them upload and share without help.

## Open Questions for Later

These are flagged but not blocking; surface to the user before the relevant phase begins:

1. Hosting: Vercel (planned) vs AWS Amplify Hosting (closer to "AWS only"). Vercel is recommended; revisit if a single-cloud bill is preferred.
2. Admin downloads: per `docs/03-security-privacy.md`, decide before Phase 3 whether admin can download any family member's file. Plan assumes yes, with audit log.
3. Password reset: admin-CLI reset (Phase 1) vs email-based reset later. Plan assumes admin-CLI is sufficient until family needs change.
4. MFA: deferred per `docs/03-security-privacy.md`; revisit only if a simple email-code flow becomes worth the friction.
