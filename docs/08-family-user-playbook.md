# Family User Playbook

## Purpose

This document captures the plain-English workflows the app should support. Use it while building UI so the product stays simple for non-technical family members.

## First Login

User goal: "I just want to get into my box."

Flow:

1. Admin creates the family member in the system.
2. User opens the app.
3. User selects their name from the family list.
4. User enters their password.
5. User sets a new password if using a temporary password.
6. User lands directly in "My Box".

Avoid:

- Asking the user to choose a plan.
- Asking the user to understand storage providers.
- Showing technical setup screens.
- Asking the user to type an email address before they can enter.

## Upload Files

User goal: "I want these files backed up."

Flow:

1. User opens My Box.
2. User drags files into the upload area or taps Upload.
3. App shows progress.
4. App says files are saved.
5. Files appear in Recent Files.

Important messages:

- "Uploading"
- "Saved"
- "This file did not upload. Try again."

Avoid:

- Raw S3 language.
- Provider jargon.
- Technical error dumps.

## Find a File

User goal: "I need that document/photo again."

Flow:

1. User opens My Box.
2. User searches by file name.
3. User opens folder or result.
4. User downloads the file.

Useful UI:

- Search at top.
- Recent files.
- Simple file type icons.
- Sort by newest/name/size.

## Share a File

User goal: "I want to send one file to someone by link."

Flow:

1. User opens a file.
2. User clicks Share.
3. App creates a private link.
4. User copies the link and sends it.
5. User can later revoke the link.

Important messages:

- "Link created"
- "Link copied"
- "Link revoked"

Avoid:

- Making the whole family box public.
- Asking the user to understand tokens or access policies.
- Leaving old links alive forever by default.

## Import From Old Cloud Account

User goal: "Move my old stuff into my family box."

Flow:

1. User clicks Import.
2. User chooses Google Drive, OneDrive, or Dropbox.
3. User signs into provider.
4. User selects folders/files.
5. App copies files in the background.
6. App shows progress.
7. Imported files appear in a clearly named folder.

Important messages:

- "Connected"
- "Copying files"
- "Some files need attention"
- "Import complete"

Avoid:

- Continuous sync language.
- Surprising deletes from original provider.
- Making the provider account connection feel permanent or mysterious.

## Admin Recovery

Admin goal: "Help someone who deleted or lost a file."

Flow:

1. Admin opens user record.
2. Admin views deleted files.
3. Admin restores selected file.
4. Audit event records the restore.

## Support Script for Family Members

Suggested wording:

```text
This is your private family file box. Anything you upload here is saved in our family cloud. You can come back anytime to download it. Import buttons make a copy from your old cloud account; they do not delete anything from the old account.
```
