# Product Plan

## Vision

Create a private family cloud that gives each family member one obvious place to put important files. The app should feel like "my box" rather than a technical storage system.

The product succeeds if a non-technical family member can pick their own name from a preloaded family list, sign in, drag files into their box, find those files later, and optionally authorize the app to copy files out of an old free cloud account.

## Users

### Family Member

Likely behavior:

- Does not understand folders, sync clients, quotas, or backup rules.
- Has files scattered across phone storage, Google Drive, OneDrive, Dropbox, email attachments, and old laptops.
- Needs a simple path: pick my name, enter my password, drop files, confirm they are safe.

Primary interface:

- Big upload area.
- Recent files.
- Search bar.
- Share by link controls.
- Simple folders.
- Clear import buttons.
- Plain-English status messages.

### Family Admin

Likely behavior:

- Sets up accounts.
- Handles password resets.
- Monitors storage costs.
- Helps recover deleted files.
- Troubleshoots imports.

Primary interface:

- User list.
- Storage usage by person.
- Failed uploads/imports.
- Recent activity log.
- Recovery/deleted files view.

## MVP Scope

Build a reliable private file box first.

Included:

- Admin-managed user accounts.
- First screen is a family name picker.
- Password login after name selection.
- User-owned file space.
- Drag-and-drop upload.
- Direct-to-S3 upload using presigned URLs.
- File/folder browser.
- Search by file name.
- Download.
- Share by link.
- Rename.
- Move to folder.
- Soft delete.
- Admin user management.
- Basic audit trail.

Deferred:

- Google Drive import.
- OneDrive import.
- Dropbox import.
- iCloud research/import.
- AI file organization.
- Automatic duplicate cleanup.
- Mobile app.
- Shared family albums.

## Provider Import Scope

Provider imports are phase two because OAuth, provider rate limits, token refresh, partial failures, and large files add complexity.

First import version:

- Family member clicks "Connect Google Drive", "Connect OneDrive", or "Connect Dropbox".
- Provider redirects back after OAuth approval.
- App lists top-level files/folders.
- User selects what to copy.
- App copies selected content into a folder named `Imported from [Provider]`.
- Import job shows clear progress and failures.

Do not try to sync both directions in the first version. This is a copy-in backup tool, not a replacement sync client.

## Link Sharing

Files can be shared by link, but the sharing model should stay controlled:

- Links are created per file.
- Links are revocable by the owner or admin.
- Links should expire by default.
- Links should allow both preview and download by default.
- Links can optionally be password protected later if needed.
- Link pages should expose only the shared file, not the user's whole box.

The sharing feature should feel like "send this one file to someone" rather than "open my storage account to the internet."

## Non-Goals

- Public signups.
- Email-first login.
- Enterprise sharing.
- Real-time collaborative editing.
- File editing inside the browser.
- Complex permissions between family members.
- Replacing Google Drive/Dropbox as a full productivity suite.

## Success Criteria

- A family member can upload files without training.
- A family member can find and download a file later.
- A family member can create and revoke a share link for a file.
- Admin can see whether a file upload completed.
- Storage is private per user by default.
- No raw AWS credentials are exposed to the browser.
- Failed uploads/imports are visible and recoverable.
