# Implementation Backlog

Items marked ✅ are complete. Items marked 🔜 are next. Items marked ⏸ are deferred.

## Foundation ✅

- ✅ Next.js 16 App Router app with TypeScript strict mode.
- ✅ App shell: `(app)` and `(admin)` route groups with auth-protected layouts.
- ✅ DynamoDB single-table design (replaces ORM/migrations).
- ✅ zod env validation with `SKIP_ENV_VALIDATION` CI escape hatch.
- ✅ S3 and DynamoDB client singletons.
- ✅ Health check route (`/api/health`).
- ✅ AWS CDK stacks: S3 bucket, DynamoDB table + GSIs, IAM user, Backup plan.
- ✅ `.env.local.example` and `npm run gen-secret` helper.

## Auth ✅

- ✅ Auth.js v5 Credentials provider with JWT sessions.
- ✅ `src/proxy.ts` Edge-safe route guard (Next.js 16 "proxy" convention).
- ✅ Family roster — name-pick entry screen rendered from DynamoDB.
- ✅ Password login after name selection.
- ✅ argon2 password hashing.
- ✅ Login attempt rate limiting (5 attempts / 15 min, DynamoDB TTL).
- ✅ Role checks (member / admin) in middleware and layouts.
- ✅ Admin-managed roster: create, disable, enable users.
- ✅ Admin password reset.
- ✅ Self-service password change (`/box/settings`).
- ✅ Self-service display name edit (inline in sidebar).
- ✅ `scripts/seed-roster.ts` and `scripts/promote-admin.ts`.

## File Box ✅

- ✅ Root folder auto-created on first sign-in.
- ✅ Subfolder creation, rename, navigation.
- ✅ Drag-and-drop upload with XHR progress bar.
- ✅ Single-part presigned upload (≤ 100 MB).
- ✅ Multipart upload via S3 (100 MB – 5 GB), per-chunk progress.
- ✅ S3 CORS configured (PUT + ETag exposed for multipart).
- ✅ File browser: list view and photo grid view.
- ✅ Sort by date / name / size (server-side, URL-persisted).
- ✅ View toggle (list / grid, URL-persisted).
- ✅ Breadcrumb navigation with Home icon.
- ✅ Photo thumbnails via presigned preview URLs.
- ✅ File rename, move to folder (folder-tree picker), soft delete.
- ✅ Trash view with restore.
- ✅ Search by filename prefix (per-folder and cross-folder).
- ✅ Public share links: 7-day expiry, revocable, `/s/[token]`.
- ✅ Multi-select: bulk download (sequential presigned URLs) and bulk delete.
- ✅ File detail sheet (mobile tap: metadata + all actions).
- ✅ Family sharing: share files/folders with all family or specific members.
- ✅ `/box/family` page: shared-with-everyone, shared-with-you, shared-by-you.
- ✅ Read-only shared folder view for non-owners.

## Admin ✅

- ✅ `/admin/users` — create, disable, enable, reset password.
- ✅ `/admin/storage` — per-user storage totals.
- ✅ `/admin/activity` — merged audit feed across all users.
- ✅ `/admin/share-links` — all active public share links.
- ✅ Restore deleted file (admin or owner).
- ✅ Daily trash cleanup cron (`/api/cron/cleanup`, Vercel Cron).

## Observability ✅

- ✅ Audit events: login, file upload/download/delete/restore, share create/revoke/access, admin actions, family share events.
- ✅ Health check route verifies both DynamoDB and S3.
- ✅ Failed/pending uploads are filtered from the file browser (only `available` files shown).

## Security ✅

- ✅ S3 bucket: block all public access, SSE-S3 encryption, versioning.
- ✅ Server-side ownership checks on every file and folder operation.
- ✅ Admin role check in `(admin)` layout and all admin API routes.
- ✅ Shared-file access validated before any presigned URL is issued.
- ✅ `CRON_SECRET` bearer auth on cleanup endpoint (fails closed if unset).
- ✅ Rate limiting on login (5 attempts / 15-minute window).
- ✅ Auth.js JWT signing via `AUTH_SECRET` (≥ 32 chars, validated at startup).
- ✅ Production secret checklist completed.

## UX Polish ✅

- ✅ Dark mode (system preference default, manual toggle).
- ✅ Mobile-responsive layouts: top icon nav on mobile, sidebar on desktop.
- ✅ File detail sheet on mobile (tap to see metadata + actions, no hover required).
- ✅ Grid view: checkboxes always visible on mobile; hover overlay desktop-only.
- ✅ Storage warning banner (amber at 80%, red at 100% of 5 GB).
- ✅ Sticky frosted-glass page header with breadcrumb + bold title.
- ✅ Empty states with dashed border cards and plain-English messages.
- ✅ Upload progress bar (single-part and multipart).

## Media Viewer 🔜

- 🔜 yet-another-react-lightbox for images and videos (tap or click to open).
- 🔜 PDF preview (react-pdf or PDF.js).
- 🔜 Native `<audio>` player for audio files.
- ⏸ Office document preview — no privacy-safe in-browser solution; these will remain download-only.

## Provider Imports ⏸

- ⏸ Google Drive OAuth connect/disconnect.
- ⏸ OneDrive OAuth connect/disconnect.
- ⏸ Dropbox OAuth connect/disconnect.
- ⏸ Provider file/folder listing.
- ⏸ Copy-in import with progress UI.
- ⏸ Retry failed import items.
- ⏸ Background worker via Vercel Cron.
- ⏸ iCloud — no viable web import path; manual upload only.

## Future Considerations

Folder deletion is now implemented as recursive delete of the folder tree and its contents.

- Video thumbnail generation (requires server-side ffmpeg or AWS MediaConvert).
- HEIC image thumbnails via server-side conversion to JPEG.
- Storage limit per user (currently soft-warn only, no hard enforcement).
- Email-based password reset (currently admin-only reset).
- Admin ability to download any family member's file (product decision pending).
