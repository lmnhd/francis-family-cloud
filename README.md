# Francis Family Cloud

Francis Family Cloud is a small private Next.js app for giving family members a simple personal file box backed by AWS S3. The goal is to make backup and retrieval feel as easy as dragging files into a page, while quietly handling storage, imports from existing cloud accounts, and basic recovery workflows behind the scenes.

## Product Intent

The app is for a small known group of non-technical family users. It should avoid admin-heavy cloud-drive concepts and instead provide:

- One private box per family member.
- Drag-and-drop upload from phone or computer.
- Simple browse, search, preview, download, share by link, and delete.
- Guided import from Google Drive, OneDrive, and Dropbox.
- Optional iCloud handling only if it can be done safely and simply.
- Admin visibility for storage use, failed imports, and account setup.

## Recommended Stack

- Next.js App Router hosted on Vercel.
- Auth.js v5 with Credentials provider and `@auth/dynamodb-adapter` — admin-managed family roster, name-pick then password login.
- DynamoDB single-table (on-demand billing) for users, files, folders, sessions, share links, upload sessions, and audit records. No Postgres.
- AWS S3 for object storage.
- AWS SDK v3 for presigned direct browser uploads.
- Background jobs for provider imports using Vercel Cron plus a durable queue/provider, or a separate worker if imports become large.

## Planning Documents

- [Product Plan](docs/01-product-plan.md)
- [Architecture](docs/02-architecture.md)
- [Security and Privacy](docs/03-security-privacy.md)
- [Provider Imports](docs/04-provider-imports.md)
- [Data Model](docs/05-data-model.md)
- [Delivery Roadmap](docs/06-delivery-roadmap.md)
- [Implementation Backlog](docs/07-implementation-backlog.md)
- [Family User Playbook](docs/08-family-user-playbook.md)

## First Build Target

Build the MVP before any provider imports:

1. Admin-managed family roster with "select your name" as the first screen.
2. Family member dashboard.
3. Drag-and-drop uploads directly to S3 through presigned URLs.
4. File browser with folders, search, download, rename, move, share links, and delete.
5. Admin dashboard for users, storage totals, recent activity, and shared-link management.

Provider imports should come after the core box is reliable.

## Important Product Decision

Treat iCloud as a later research item. Google Drive, OneDrive, and Dropbox have normal OAuth/API paths. iCloud Drive does not have the same simple public web import path for a Vercel app, so the practical first version should support manual uploads plus the three OAuth providers.
