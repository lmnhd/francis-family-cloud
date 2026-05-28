import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFileById, completeFileUpload } from "@/lib/repos/files";
import { headS3Object, completeMultipartUpload } from "@/lib/aws/presign";
import { writeAuditEvent } from "@/lib/repos/audit";

const schema = z.object({
  s3Key: z.string().min(1),
  // Multipart fields — required together when isMultipart
  uploadId: z.string().optional(),
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().positive(),
        etag: z.string().min(1),
      })
    )
    .optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: fileId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { s3Key, uploadId, parts } = parsed.data;

  const file = await getFileById(userId, fileId);
  if (!file)
    return NextResponse.json({ error: "File not found" }, { status: 404 });

  // Finalize multipart upload first so HeadObject can see the assembled object.
  if (uploadId && parts && parts.length > 0) {
    await completeMultipartUpload(s3Key, uploadId, parts);
  }

  const head = await headS3Object(s3Key);
  if (!head)
    return NextResponse.json(
      { error: "Upload not found in S3. Try uploading again." },
      { status: 422 }
    );

  await completeFileUpload({
    ownerUserId: userId,
    fileId,
    sizeBytes: head.sizeBytes,
    etag: head.etag,
  });

  await writeAuditEvent({
    targetUserId: userId,
    eventType: "file.upload.complete",
    entityType: "file",
    entityId: fileId,
    metadata: { fileName: file.displayName, sizeBytes: head.sizeBytes },
  });

  return NextResponse.json({ ok: true });
}
