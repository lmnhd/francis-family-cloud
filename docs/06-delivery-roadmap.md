# Delivery Roadmap

## Phase 0: Project Setup

Outcome: a deployable empty app with database and storage wiring.

Tasks:

- Create Next.js app in this directory.
- Add linting, formatting, and TypeScript.
- Configure database.
- Configure S3 bucket and IAM policy.
- Configure Vercel project and environment variables.
- Add base layout and private app shell.

Exit criteria:

- App deploys to Vercel.
- Database migration runs.
- Health route verifies database and S3 configuration.

## Phase 1: Private Family Box MVP

Outcome: family members can upload, browse, and retrieve files.

Tasks:

- Add admin-managed family roster.
- Add "select your name" entry screen.
- Add password login/session handling after name selection.
- Add member dashboard.
- Add folder/file metadata model.
- Add direct-to-S3 upload.
- Add file browser.
- Add search by file name.
- Add download through presigned URL.
- Add share-by-link for individual files.
- Add preview and download for share links.
- Add soft delete/trash.

Exit criteria:

- A test user can upload and download files.
- A test user can create and revoke a share link.
- Files are private between users.
- Admin can see user storage usage.

## Phase 2: Admin and Recovery

Outcome: app is manageable by one family admin.

Tasks:

- Admin user management.
- Password reset flow.
- Storage usage dashboard.
- Recent activity log.
- Failed upload visibility.
- Shared-link management.
- Restore from trash.
- S3 lifecycle cleanup rules.

Exit criteria:

- Admin can personally add a new family member to the roster.
- Admin can see what failed.
- Admin can restore a deleted file during retention window.

## Phase 3: Provider Import Foundations

Outcome: provider connections and import jobs are technically ready.

Tasks:

- Add provider connection table.
- Add encrypted token storage.
- Add import job model.
- Add background worker loop.
- Add import progress UI.
- Add retry/cancel controls.

Exit criteria:

- A fake provider adapter can import files into S3.
- Import progress survives page refresh.

## Phase 4: Google Drive Import

Outcome: Google Drive copy-in works.

Tasks:

- Register Google OAuth app.
- Implement connect/disconnect.
- Implement folder/file listing.
- Implement selected file copy.
- Implement error/retry UI.

Exit criteria:

- User imports selected Google Drive files into their box.

## Phase 5: OneDrive and Dropbox Imports

Outcome: the other major free cloud accounts are supported.

Tasks:

- Register Microsoft OAuth app.
- Register Dropbox OAuth app.
- Implement provider adapters using the same import contract.
- Add provider-specific error handling.

Exit criteria:

- User imports selected OneDrive and Dropbox files into their box.

## Phase 6: Polish and Hardening

Outcome: ready for family use.

Tasks:

- Mobile layout pass.
- Plain-English empty/error states.
- Upload progress polish.
- Storage limit warnings.
- Database backups.
- Security review.
- Family walkthrough.

Exit criteria:

- The app is usable by a non-technical family member with minimal guidance.

## Phase 7: iCloud Research

Outcome: decide whether iCloud support is worth building.

Tasks:

- Confirm current Apple-supported options.
- Test manual browser upload from iCloud Drive.
- Document any native-helper alternative.
- Decide whether to leave iCloud as manual-only.

Exit criteria:

- Clear yes/no recommendation for iCloud.
