import { NextResponse } from "next/server";
import { PutObjectTaggingCommand } from "@aws-sdk/client-s3";
import { listExpiredTrashFiles, permanentlyDeleteFile } from "@/lib/repos/files";
import { s3, S3_BUCKET } from "@/lib/aws/s3";

// Vercel injects CRON_SECRET into all cron requests as a Bearer token.
// Set this env var in Vercel dashboard → Settings → Environment Variables.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed: if CRON_SECRET is not set, deny all requests.
  if (!secret || secret.length < 20) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expired = await listExpiredTrashFiles(30);
  let cleaned = 0;
  let errors = 0;

  await Promise.allSettled(
    expired.map(async (file) => {
      try {
        // Tag the S3 object — the S3 lifecycle rule deletes tagged objects after 1 day.
        await s3.send(
          new PutObjectTaggingCommand({
            Bucket: S3_BUCKET,
            Key: file.s3Key,
            Tagging: { TagSet: [{ Key: "cleanup-eligible", Value: "true" }] },
          })
        );
        // Remove the DynamoDB record.
        await permanentlyDeleteFile(file.ownerUserId, file.id);
        cleaned++;
      } catch {
        errors++;
      }
    })
  );

  return NextResponse.json({ cleaned, errors, total: expired.length });
}
