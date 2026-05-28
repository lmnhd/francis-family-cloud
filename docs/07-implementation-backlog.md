# Implementation Backlog

## Foundation

- Create Next.js app in `Projects-26/Francis_Family_Cloud`.
- Add TypeScript strict mode.
- Add app shell with authenticated and admin layouts.
- Add database ORM and migrations.
- Add environment validation.
- Add S3 client wrapper.
- Add health check route.

## Auth

- Add users table.
- Add admin-created user flow.
- Add active family roster query.
- Add name picker entry page.
- Add selected-user password page.
- Add password hashing.
- Add login attempt rate limiting per selected user.
- Add session middleware.
- Add role checks.
- Add password reset path.
- Add disabled-user handling.

## File Box

- Add folders table.
- Add files table.
- Add root folder creation per user.
- Add drag-and-drop upload component.
- Add presigned upload API.
- Add upload session tracking.
- Add upload progress UI.
- Add file browser.
- Add folder create/rename/delete.
- Add file rename/move/delete.
- Add trash view.
- Add download API.
- Add share-link creation API.
- Add public share-link resolver route.
- Add share-link revoke action.
- Add share-link expiry handling.
- Add share-link preview and download modes.
- Add search.

## Admin

- Add admin user list.
- Add create/edit/disable user.
- Add storage usage by user.
- Add recent activity feed.
- Add shared-link admin view.
- Add failed uploads panel.
- Add restore deleted file action.
- Add configuration/status page.

## Imports

- Add provider connection model.
- Add token encryption helpers.
- Add provider adapter interface.
- Add import job model.
- Add import item model.
- Add worker runner.
- Add import progress UI.
- Add retry failed import item action.
- Add cancel import action.
- Add Google Drive adapter.
- Add OneDrive adapter.
- Add Dropbox adapter.

## Observability

- Add audit event writer.
- Add structured server logging.
- Add upload/import failure capture.
- Add share-link access logging.
- Add admin-visible diagnostics.
- Add database backup checks.

## Security

- Add S3 public-access verification checklist.
- Add server-side file ownership checks everywhere.
- Add request size/type validation.
- Add rate limiting for login.
- Add CSRF/session protection per auth library guidance.
- Add production secret checklist.

## UX Polish

- Add mobile-first dashboard.
- Add friendly empty states.
- Add clear import status text.
- Add large-file progress.
- Add plain-English failure messages.
- Add family walkthrough page.
