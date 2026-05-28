# Security and Privacy Plan

## Security Posture

This is a private family app, but it stores personally important files. Treat it as sensitive even though the user base is small.

Core rules:

- No public signup.
- Every user is created personally by the admin before they can appear on the app.
- The first public screen is a family roster, not an email/username field.
- Every file belongs to exactly one owner unless sharing is explicitly added later.
- Never expose AWS credentials to the browser.
- Use short-lived presigned URLs for file transfer.
- Keep audit records for uploads, downloads, share-link creation, share-link access, deletes, admin actions, and imports.

## Authentication

Recommended MVP:

- Admin-created family profiles.
- Name selection first, password second.
- Passwords hashed with a strong modern password hash.
- Optional password reset by admin at first.

Because the users are non-technical, avoid MFA as a first-login blocker unless a simple email code flow is easy to support. Consider adding email magic-link recovery later.

Public roster considerations:

- Show only display names, not email addresses.
- Hide disabled users.
- Rate limit password attempts per selected user and per IP.
- Consider a private family access code later if the roster itself should not be visible to strangers.

## Authorization

Every file operation must check:

- User is authenticated.
- User owns the file or has admin role.
- File is not permanently deleted.
- Requested folder belongs to the user.

Do not rely on S3 key prefixes alone. The database should be the authority for ownership.

## S3 Bucket Configuration

Recommended:

- Block all public access.
- Enable server-side encryption.
- Enable bucket versioning if cost is acceptable.
- Configure lifecycle rules for deleted objects and abandoned multipart uploads.
- Restrict IAM permissions to only the app bucket/prefix.

## Provider OAuth Tokens

Provider imports require access/refresh tokens. Store them carefully:

- Encrypt tokens at rest before saving.
- Scope tokens as narrowly as provider allows.
- Allow user/admin to disconnect provider.
- Delete tokens on disconnect.
- Log import activity, but never log tokens.

## File Safety

MVP should store files as-is. Later, consider:

- Virus scanning pipeline.
- Thumbnail generation for images.
- Content-type validation.
- File size limits by user.

## Privacy Defaults

- Users cannot see each other's files.
- Admin can see metadata and recover files.
- Decide before implementation whether admin can download any family member file. If yes, make this explicit in the app and audit every admin download.
- Share links should be token-based, revocable, and expiring by default.
- Share links should expose only the intended file, not the user's whole box.

## Backup and Recovery

S3 is durable, but accidental deletion and metadata loss are still risks.

Recommended:

- Daily database backup.
- S3 versioning or delayed permanent deletion.
- Admin restore from trash.
- Exportable file inventory report.

## Security Checklist Before Production

- Public S3 access blocked.
- Production secrets only in Vercel environment variables.
- OAuth callback URLs set to production domains.
- Admin account uses strong password.
- Public entry screen only exposes active display names.
- File download URLs expire quickly.
- Share-link tokens expire and can be revoked.
- Upload URL size/type limits enforced server-side.
- Audit log visible to admin.
