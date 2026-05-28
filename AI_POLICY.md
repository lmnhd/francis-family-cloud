# AI_POLICY.md - Canonical Repo-Wide AI Policy

This file is the single source of truth for AI assistants working in this repository.
Local instruction files point here and add only narrow tool-specific exceptions.
If a local instruction file conflicts with this policy, this file wins.

---

## 1. Policy Order

1. Read this file first.
2. Read [README.md](./README.md) and the project docs before asking questions about the codebase.
3. Read the docs hub in `docs/` before making product or implementation assumptions.
4. Treat local wrappers such as `AGENTS.md` as thin entry points only; they do not override this policy.

## 2. Project Overview

Francis Family Cloud is a private Next.js application for a small family group.
Each family member gets one personal file box backed by AWS S3.
The app supports direct uploads, retrieval, controlled share links, and copy-in imports from existing cloud accounts.
The first login screen lists pre-created family names, and each person enters through their own name plus password flow.

## 3. Where to Find Documentation

Agents must always check `docs/` first before asking questions about the codebase.

| Topic                | Path                                                                       | Purpose                                                       |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Product direction    | [`docs/01-product-plan.md`](./docs/01-product-plan.md)                     | Scope, users, MVP, and success criteria                       |
| Architecture         | [`docs/02-architecture.md`](./docs/02-architecture.md)                     | App shape, routes, storage flow, and public share routes      |
| Security and privacy | [`docs/03-security-privacy.md`](./docs/03-security-privacy.md)             | Auth rules, S3 security, token handling, and privacy defaults |
| Provider imports     | [`docs/04-provider-imports.md`](./docs/04-provider-imports.md)             | Google Drive, OneDrive, Dropbox, and iCloud import guidance   |
| Data model           | [`docs/05-data-model.md`](./docs/05-data-model.md)                         | Tables, indexes, retention, and share-link records            |
| Delivery roadmap     | [`docs/06-delivery-roadmap.md`](./docs/06-delivery-roadmap.md)             | Implementation phases and exit criteria                       |
| Backlog              | [`docs/07-implementation-backlog.md`](./docs/07-implementation-backlog.md) | Ordered build tasks                                           |
| Family playbook      | [`docs/08-family-user-playbook.md`](./docs/08-family-user-playbook.md)     | Plain-English user flows and UI expectations                  |

## 4. AWS S3 Storage and File Transfer

### Hard Rules (always active)

1. Keep the S3 bucket private.
2. Use presigned URLs for uploads, downloads, and share-link access.
3. Never expose AWS credentials in browser code or client-side environment variables.
4. Store stable file and share-link identifiers in the database; keep file bytes in S3.
5. Enforce ownership and share-link authorization on the server before any presign or redirect.
6. Treat upload completion as a server-verified state transition, not a client-side promise.

| Service | Env Vars                                                                    | Access Pattern                                                            |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| AWS S3  | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | Private bucket, presigned upload/download URLs, server-side authorization |

## 5. Authentication and Identity

### Hard Rules (always active)

1. The admin creates family users before they can sign in.
2. The public entry screen lists only active display names.
3. Users select their name first and enter their password after that.
4. Disabled users stay hidden and cannot authenticate.
5. Passwords, session secrets, and auth settings come from environment variables only.
6. The app does not support public self-signup.

| Service                       | Env Vars                            | Access Pattern                                                                                                                         |
| ----------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth.js / NextAuth-style auth | `AUTH_SECRET`, `AUTH_URL`           | Server-managed sessions and password login after name selection                                                                        |
| DynamoDB                      | `AWS_REGION`, `DYNAMODB_TABLE_NAME` | Source of truth for users, files, folders, share links, upload sessions, and audit events. Single-table design with GSIs. No Postgres. |

## 6. Family File Box, Share Links, and Provider Imports

### Pipeline Phases

| Phase | Scope                  | Operating Constraint                                                                |
| ----- | ---------------------- | ----------------------------------------------------------------------------------- |
| 0     | Project setup          | Keep the foundation small and deployable                                            |
| 1     | Private family box MVP | Support upload, browse, search, download, rename, move, and delete                  |
| 2     | Share links            | Share links are per-file, expiring, revocable, and expose only the shared file      |
| 3     | Admin recovery         | Add trash, restore, storage visibility, and activity tracking                       |
| 4     | Provider imports       | Copy in from Google Drive, OneDrive, and Dropbox only                               |
| 5     | iCloud handling        | Treat iCloud as manual upload or later research unless the app architecture changes |

### Hard Rules (always active)

1. Share links are created per file.
2. Share links allow both preview and download by default.
3. Share links are revocable by the owner or admin.
4. Share links expire by default.
5. Share-link pages expose only the intended file and no broader box contents.
6. Provider imports copy files into the family box and never delete from the source account.
7. iCloud is not a first-class web import path unless the project explicitly adds a supported approach.
8. Any change to sharing, auth, storage, or import behavior updates the relevant docs in the same change.

| Service                   | Env Vars                                                                                          | Access Pattern                  |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------- |
| Google Drive import       | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`                                 | OAuth-based copy-in import only |
| Microsoft OneDrive import | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_REDIRECT_URI` | OAuth-based copy-in import only |
| Dropbox import            | `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REDIRECT_URI`                                   | OAuth-based copy-in import only |

## 7. Repository Operating Rules

### Hard Rules (always active)

1. Use `apply_patch` for manual file edits.
2. Default to ASCII unless an existing file already uses non-ASCII.
3. Prefer `rg` and `rg --files` for search and file discovery.
4. Do not use destructive git commands such as `git reset --hard` or `git checkout --`.
5. Do not revert user changes that are unrelated to the task.
6. Keep product docs in `docs/` and update them when behavior changes.
7. Prefer small, direct edits over broad refactors.
8. NEVER start the dev server yourself. Always ask the user to start it.
9. This application should run on port 4000 instead of 3000.

## 8. Agent Conduct

1. Read the documentation before making assumptions.
2. Ask a question only when a reasonable assumption would be risky or likely wrong.
3. Log process deviations and operator exceptions in [`docs/agent-exceptions.md`](./docs/agent-exceptions.md).
4. Keep changes and explanations aligned with the current project plan.
5. If a task affects user-visible behavior, update the matching docs in the same turn.
