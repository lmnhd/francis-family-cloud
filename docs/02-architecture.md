# Architecture

## System Shape

Francis Family Cloud is a server-rendered Next.js 16 App Router application deployed on Vercel.

Core services:

- Next.js 16 on Vercel for UI, API routes, and server actions.
- DynamoDB single-table (on-demand billing) for all metadata: users, folders, files, share links, family shares, upload sessions, and audit events. No Postgres.
- AWS S3 (private bucket) for file objects.
- Auth.js v5 with Credentials provider and JWT sessions. No database adapter is needed for sessions since JWTs are stored in signed cookies.
- AWS CDK in `aws/cdk/` defines the S3 bucket, DynamoDB table with GSIs, IAM app user, and AWS Backup plan.

## Storage Flow

### Upload

Files ≤ 100 MB use a single presigned PUT URL. Files between 100 MB and 5 GB use S3 multipart upload.

**Single-part (≤ 100 MB):**

1. Client calls `POST /api/files/presign` with file metadata.
2. Server creates a `FILE#` record with `pending_upload` status and returns a presigned `PutObject` URL.
3. Client uploads the file directly to S3 via XHR (XHR exposes the `upload.onprogress` event for the progress bar).
4. Client calls `POST /api/files/[id]/complete` with the S3 key.
5. Server calls `HeadObject` to verify the object exists, then sets status to `available`.

**Multipart (100 MB – 5 GB):**

1. Client calls `POST /api/files/presign`. Server calls `CreateMultipartUpload` and returns a presigned `UploadPart` URL for each 10 MB chunk.
2. Client uploads each chunk via XHR, collecting the `ETag` response header from each part.
3. Client calls `POST /api/files/[id]/complete` with `{ uploadId, parts: [{partNumber, etag}] }`.
4. Server calls `CompleteMultipartUpload`, then `HeadObject` to verify and record the final size.

### Download

1. Client calls `GET /api/files/[id]/download`.
2. Server verifies ownership (or family/user share access via `/api/sharing/download`).
3. Server returns a 15-minute presigned `GetObject` URL and redirects the browser to it.

### Family Sharing Download

1. Client calls `GET /api/sharing/download?owner=<ownerUserId>&fileId=<id>`.
2. Server checks `SHARE#FAMILY / FILE#<id>` or `SHARE#USER#<myId> / FILE#<id>`.
3. If authorized, fetches the owner's file record and returns a presigned download URL.

### Share Links (public, tokenized)

1. User creates a share link via `POST /api/files/[id]/share`.
2. Server generates a ULID token and stores `SHARE#<token> / META` with a 7-day expiry.
3. Anyone with the link visits `/s/[token]`, which resolves the token, checks validity, and redirects to a presigned download URL.

### Delete (soft)

- Mark file status as `deleted`. Set `GSI3PK` to `USER#<id>#STATUS#deleted`.
- File disappears from normal browsing but stays in S3.
- Trash view reads `byFileStatus` GSI for deleted files.
- Admin or owner can restore via `POST /api/files/[id]/restore`.
- Daily Vercel cron (`/api/cron/cleanup`) tags S3 objects deleted more than 30 days ago with `cleanup-eligible: true`. The S3 lifecycle rule then deletes those objects after 1 day.

## S3 Layout

One private S3 bucket. CORS is configured to allow browser PUT (for presigned uploads) with `ETag` exposed (required for multipart part ETags).

Object key pattern:

```
family-cloud/users/{userId}/objects/{fileId}/{safeName}
```

Folders are metadata only — S3 keys use stable ULIDs, never user-supplied folder names. Thumbnails are served via presigned `GetObject` URLs (no separate stored thumbnail objects).

## App Routes

### Public

| Route | Description |
| --- | --- |
| `/` | Family roster — lists active member names |
| `/login/[userId]` | Password entry for a selected family member |
| `/s/[token]` | Public share-link page (download only, no box context) |

### Authenticated member (`(app)` route group)

| Route | Description |
| --- | --- |
| `/box` | Root folder dashboard |
| `/box/folder/[folderId]` | Subfolder view |
| `/box/search` | File search (prefix match via `byFolder` GSI) |
| `/box/family` | Family-shared content + items shared with you |
| `/box/family/folder/[ownerUserId]/[folderId]` | Read-only view of a shared folder |
| `/box/trash` | Soft-deleted files with restore |
| `/box/settings` | Self-service display name and password change |

### Admin only (`(admin)` route group, role check in layout)

| Route | Description |
| --- | --- |
| `/admin/users` | Create, disable, enable, reset passwords |
| `/admin/storage` | Per-user storage totals |
| `/admin/activity` | Audit event feed across all users |
| `/admin/share-links` | All active public share links |

### API routes (server-side only)

| Route | Purpose |
| --- | --- |
| `GET /api/health` | DynamoDB + S3 connectivity check |
| `POST /api/files/presign` | Create file record + presigned upload URL |
| `POST /api/files/[id]/complete` | Finalize upload (single or multipart) |
| `GET /api/files/[id]/download` | Presigned download redirect |
| `PATCH /api/files/[id]` | Rename or move a file |
| `DELETE /api/files/[id]` | Soft delete |
| `POST /api/files/[id]/restore` | Restore from trash |
| `POST /api/files/[id]/share` | Create public share link |
| `DELETE /api/files/[id]/share` | Revoke share link |
| `POST /api/files/download-urls` | Batch presigned URLs for multi-file download |
| `POST /api/folders` | Create folder |
| `PATCH /api/folders/[id]` | Rename folder |
| `GET /api/folders` | List all folders (for move-file picker) |
| `GET /api/users` | Active roster (for family share picker) |
| `GET/POST /api/sharing` | Read or update family/user sharing |
| `GET /api/sharing/download` | Presigned download for shared file |
| `GET /api/sharing/folder` | File listing for a shared folder |
| `GET/POST /api/admin/users` | Admin user management |
| `PATCH /api/admin/users/[id]` | Disable, enable, reset password |
| `GET /api/cron/cleanup` | Daily trash cleanup cron (Vercel cron, bearer auth) |
| `PATCH /api/me` | Update own display name |
| `PATCH /api/me/password` | Change own password |

## Route Protection

`src/proxy.ts` (Next.js 16 "proxy" convention, replaces the deprecated `middleware.ts`) runs in the Edge runtime. It uses `getToken` from `@auth/core/jwt` to verify the session JWT without importing any NAPI or DynamoDB code. Routes `/box/*` and `/admin/*` are protected. `src/auth.config.ts` contains the Edge-safe callbacks; `src/auth.ts` extends this with the full Credentials provider that imports argon2 and DynamoDB repos.

## Background Jobs

- **Vercel Cron** runs `GET /api/cron/cleanup` at 03:00 UTC daily. It scans for files soft-deleted more than 30 days ago, tags the S3 objects, and removes the DynamoDB records.
- Provider imports (Google Drive, OneDrive, Dropbox) are deferred. When implemented they will use Vercel Cron plus DynamoDB-backed job tracking.

## AWS Backup

The CDK `DatabaseStack` provisions an AWS Backup vault and plan: weekly full backup every Sunday at 03:00 UTC, 90-day retention. DynamoDB PITR is also enabled on the table for 35-day point-in-time recovery.

## Environments

| Environment | Description |
| --- | --- |
| `local` | `npm run dev` on port 4000, `.env.local` pointing to the production DynamoDB table and S3 bucket |
| `production` | Vercel deployment, env vars set in Vercel dashboard |

## References

- AWS S3 presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
- AWS S3 multipart upload: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html
- Auth.js v5 Next.js guide: https://authjs.dev/getting-started/installation
- Next.js App Router: https://nextjs.org/docs/app
