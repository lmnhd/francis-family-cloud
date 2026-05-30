# Provider Imports

## Goal

Provider imports should copy files from a family member's existing cloud account into their Francis Family Cloud box. The first version should be copy-only, user-selected, and easy to recover from if it fails.

## Supported Providers

### Google Drive

Feasibility: good.

Google Drive has an official Drive API with OAuth and file upload/download support. First implementation should request the minimum scopes needed to list and read selected files.

Recommended UX:

- Connect Google Drive.
- Show folders/files.
- Let user select folders/files to import.
- Copy into `Imported from Google Drive`.

Reference: https://developers.google.com/drive/api/v3/manage-uploads

### OneDrive

Feasibility: good.

OneDrive access is handled through Microsoft Graph OAuth. Microsoft documents OneDrive API authorization through Graph access tokens.

Recommended UX:

- Connect OneDrive.
- Show folders/files.
- Let user select folders/files to import.
- Copy into `Imported from OneDrive`.

Reference: https://learn.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/graph-oauth

### Dropbox

Status: first adapter implemented.

Dropbox supports OAuth 2.0 and scoped app access. Prefer narrow scopes and user-selected imports.

Recommended UX:

- Connect Dropbox through OAuth.
- Show folders/files.
- Let user select files to import.
- Copy selected files into the user's box. Current implementation imports into the root box and caps direct copy-in at 100 MB; larger jobs should move through the deferred background importer.

Reference: https://developers.dropbox.com/oauth-guide

Implemented routes:

- `GET /api/imports/dropbox/connect`
- `GET /api/imports/dropbox/callback`
- `GET /api/imports/dropbox/list?path=<dropbox-path>`
- `POST /api/imports/dropbox/import`
- `POST /api/imports/dropbox/disconnect`

### iCloud Drive

Feasibility: poor for a simple web app.

iCloud Drive is useful to users, but Apple does not offer the same straightforward third-party web import API pattern as Google Drive, OneDrive, and Dropbox. Treat iCloud as a research item rather than an MVP promise.

Practical alternatives:

- Manual upload from iCloud Drive through the browser file picker.
- Family member installs iCloud for Windows or uses iCloud Drive locally, then drags files into the app.
- Later research Apple-specific options if a native macOS/iOS helper app becomes acceptable.

Reference: https://support.apple.com/guide/icloud/icloud-drive-on-icloudcom-overview-mmd0b4a7f5e8/icloud

## Import Job States

Suggested states:

- `draft`: connection exists, no import started.
- `queued`: user selected content and job is waiting.
- `running`: job is copying files.
- `paused`: job needs attention.
- `completed`: all selected files copied.
- `completed_with_errors`: some files failed.
- `failed`: job could not continue.
- `cancelled`: user/admin stopped the job.

## Import File States

Suggested states:

- `pending`
- `listing`
- `downloading`
- `uploading_to_s3`
- `available`
- `skipped_duplicate`
- `failed`

## Duplicate Handling

MVP:

- If same provider file ID was imported before, skip by default.
- If same file name exists in destination folder, append a suffix.

Later:

- Hash-based duplicate detection.
- User-facing duplicate review.

## Error Handling

Provider imports will fail sometimes. Make failure visible and boring:

- Show which files imported.
- Show which files failed.
- Let admin retry failed files.
- Preserve provider error code internally.
- Show user-friendly text to family members.

## Scoping Rule

Do not build continuous sync in version one. A one-way copy is easier to explain, easier to secure, and much less likely to surprise family members.
