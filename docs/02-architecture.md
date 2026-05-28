# Architecture

## System Shape

Francis Family Cloud should be a server-rendered Next.js app with API routes/server actions for auth, metadata, S3 signing, and provider imports.

Core services:

- Next.js on Vercel for UI and API routes.
- DynamoDB single-table (on-demand billing) for all metadata: users, folders, files, sessions, share links, upload sessions, and audit events. No Postgres.
- AWS S3 for file objects.
- Auth.js v5 with Credentials provider and `@auth/dynamodb-adapter` for sessions.
- Admin-managed family roster used by the public entry screen.
- Background job runner for imports.
- Optional email provider for password reset only if desired later.

## Storage Flow

### Upload

1. User chooses files in the browser.
2. App creates file metadata rows with `pending_upload` status.
3. Server validates user ownership and requested object key.
4. Server returns a short-lived S3 presigned upload URL.
5. Browser uploads directly to S3.
6. Browser tells the app upload is complete.
7. Server verifies/finalizes metadata as `available`.

For large files, use S3 multipart uploads. AWS documents multipart upload as the right path for large objects, and presigned URLs can keep file bytes out of the Vercel function runtime.

### Download

1. User requests a file.
2. Server checks ownership.
3. Server creates a short-lived S3 presigned download URL.
4. Browser downloads directly from S3.

### Share Link

1. User creates a share link for a file.
2. Server stores a share token, optional expiration, and link permissions for preview plus download.
3. Shared link resolves through a public route.
4. Server checks token validity, expiration, and revocation state.
5. If valid, server redirects to a short-lived S3 download URL or streams the file.

### Delete

Use soft delete first:

- Mark metadata as `deleted`.
- Hide from normal browsing.
- Keep object in S3 for a retention window.
- Allow admin restore.

After retention, a cleanup job can permanently delete the S3 object.

## S3 Layout

Use one private S3 bucket.

Object key pattern:

```text
family-cloud/users/{userId}/objects/{fileId}/{safeOriginalName}
family-cloud/users/{userId}/thumbnails/{fileId}.jpg
```

Avoid using user-provided folder names directly as security boundaries. Folders should be metadata, while S3 object keys should use stable IDs.

## App Areas

### Family Dashboard

Routes:

- `/`
- `/login/[userId]`
- `/box`
- `/box/folder/[folderId]`
- `/box/search`
- `/box/imports`
- `/box/trash`

Entry behavior:

- `/` shows active family member names from the admin-managed roster.
- Selecting a name opens that person's password screen.
- Users cannot type arbitrary emails or create accounts.
- Disabled users are hidden from the roster and cannot authenticate.

### Admin Dashboard

Routes:

- `/admin/users`
- `/admin/storage`
- `/admin/imports`
- `/admin/activity`
- `/admin/share-links`
- `/admin/settings`

### Public Share Routes

Routes:

- `/s/[shareToken]`
- `/s/[shareToken]/preview`

Public share routes should not reveal the owner's name or private folder structure unless the owner explicitly opts in later.

## Background Jobs

Provider imports need background execution because copying cloud files can exceed serverless request limits.

Recommended first approach:

- Store import jobs in DynamoDB (same single table).
- Trigger processing through Vercel Cron or a managed job service.
- Process small batches per run.
- Persist cursor/checkpoint state.
- Retry failed files individually.

If import volume grows, move workers to a dedicated queue/worker host.

## Environments

Recommended environments:

- `local`: local Next.js, dev database, dev S3 prefix or bucket.
- `preview`: Vercel preview, separate OAuth callback URLs, preview database.
- `production`: real family app, production S3 bucket, production OAuth apps.

## References

- AWS S3 presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
- AWS S3 multipart upload: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html
- Next.js authentication guide: https://nextjs.org/docs/app/guides/authentication
