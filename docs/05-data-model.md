# Data Model

The app uses a DynamoDB single-table design. All entities share one table per environment (`francis-family-cloud-dev`, `francis-family-cloud-prod`). Access patterns drive key design.

## Table Keys

- `PK` (string) — partition key
- `SK` (string) — sort key
- `ttl` (number, epoch seconds) — optional TTL for auto-expiry

## Entity Map

| Entity | PK | SK | Key attributes |
| --- | --- | --- | --- |
| User profile | `USER#<userId>` | `PROFILE` | `displayName`, `role`, `passwordHash`, `showOnLoginRoster`, `disabledAt`, `lastLoginAt`, `email` |
| Folder | `USER#<userId>` | `FOLDER#<folderId>` | `parentFolderId`, `name`, `createdAt`, `updatedAt`, `deletedAt` |
| File | `USER#<userId>` | `FILE#<fileId>` | `folderId`, `originalName`, `displayName`, `s3Bucket`, `s3Key`, `etag`, `status`, `sizeBytes`, `mimeType`, `source`, `sourceProviderFileId`, `createdAt`, `updatedAt`, `deletedAt` |
| Provider connection | `USER#<userId>` | `PROVIDER#<provider>` | `provider`, `accountId`, encrypted access/refresh token fields, `expiresAt`, `scope`, `createdAt`, `updatedAt` |
| Share link | `SHARE#<token>` | `META` | `fileId`, `ownerUserId`, `shareToken`, `expiresAt`, `revokedAt`, `allowPreview`, `allowDownload`, `lastAccessedAt`, `createdAt` |
| Upload session | `USER#<userId>` | `UPLOAD#<sessionId>` | `fileId`, `status`, `uploadType`, `s3MultipartUploadId`, `expectedSizeBytes`, `createdAt`, `completedAt`, `ttl` |
| Audit event | `USER#<targetUserId>` | `AUDIT#<isoTs>#<eventId>` | `actorUserId`, `eventType`, `entityType`, `entityId`, `metadataJson`, `createdAt` |
| Roster anchor | `ROSTER#ACTIVE` | `USER#<displayNameLower>` | `userId`, `displayName` — sparse index for the public name picker |
| Login attempt counter | `LOGIN_ATTEMPT#<userId>` | `COUNT` | `attempts`, `ttl` (15-minute window) |
| Family share | `SHARE#FAMILY` | `FILE#<fileId>` or `FOLDER#<folderId>` | `ownerUserId`, `type`, `resourceId`, `displayName`, `mimeType`, `sizeBytes`, `s3Key` (files only), `sharedAt` |
| User share | `SHARE#USER#<targetUserId>` | `FILE#<fileId>` or `FOLDER#<folderId>` | `ownerUserId`, `targetUserId`, `type`, `resourceId`, `displayName`, `mimeType`, `sizeBytes`, `sharedAt` |

File `status` values: `pending_upload`, `available`, `deleted`, `failed`.

File `source` values: `manual_upload`, `google_drive`, `onedrive`, `dropbox`, `icloud_manual`.

## Global Secondary Indexes

### GSI1 — byShareOwner

Used to list a user's share links and the admin share-link view.

- `GSI1PK` = `USER#<ownerUserId>`
- `GSI1SK` = `SHARE#<createdAt>`

### GSI2 — byFolder

Used to browse folder contents sorted by display name and for prefix-based search.

- `GSI2PK` = `USER#<userId>#FOLDER#<folderId>`
- `GSI2SK` = `<displayNameLower>`

Supports `begins_with` queries for per-folder search.

### GSI3 — byFileStatus

Used for the trash view, pending-upload cleanup, and failed-item dashboards.

- `GSI3PK` = `USER#<userId>#STATUS#<status>`
- `GSI3SK` = `<updatedAt>`

## Ownership Rules

- Every folder belongs to exactly one user.
- Every file belongs to exactly one user.
- Admin can view metadata for all users.
- Admin file download is permitted with a mandatory audit event (decided before Phase 3 implementation).

## Retention and TTL

- Abandoned upload sessions: TTL 24 hours.
- Login attempt counters: TTL 15 minutes.
- Soft-deleted files stay restorable for 30 days (enforced by a Vercel cron job that calls `DeleteObject` after the retention window).
- Failed import items stay visible until admin clears them.

## Access Pattern Reference

| Access pattern | Key / index |
| --- | --- |
| Public name picker | `PK = ROSTER#ACTIVE`, all SKs |
| User profile lookup | `PK = USER#<userId>`, `SK = PROFILE` |
| List user's folders (root) | `PK = USER#<userId>`, `SK begins_with FOLDER#` |
| Browse folder contents | GSI2, `GSI2PK = USER#<userId>#FOLDER#<folderId>` |
| Search by name prefix in folder | GSI2, `begins_with(GSI2SK, <prefix>)` |
| Trash view | GSI3, `GSI3PK = USER#<userId>#STATUS#deleted` |
| Pending uploads cleanup | GSI3, `GSI3PK = USER#<userId>#STATUS#pending_upload` |
| Share link resolve | `PK = SHARE#<token>`, `SK = META` |
| User's share links | GSI1, `GSI1PK = USER#<userId>` |
| Admin: all share links | GSI1 scan (small user base) |
| Audit feed for user | `PK = USER#<userId>`, `SK begins_with AUDIT#` |
| All family-shared items | `PK = SHARE#FAMILY`, all SKs |
| Items shared with me | `PK = SHARE#USER#<myId>`, all SKs |
| Is a resource family-shared? | `GetItem(PK=SHARE#FAMILY, SK=FILE#<id>)` |
| Is a resource shared with user? | `GetItem(PK=SHARE#USER#<id>, SK=FILE#<id>)` |
