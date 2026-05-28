import { NextResponse } from "next/server";
import { z } from "zod";
import { ulid } from "ulid";
import { auth } from "@/auth";
import { getFolderById } from "@/lib/repos/folders";
import { createFilePending, buildS3Key } from "@/lib/repos/files";
import { createPresignedUploadUrl } from "@/lib/aws/presign";
import { S3_BUCKET } from "@/lib/aws/s3";

const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

const schema = z.object({
  folderId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(MAX_FILE_BYTES, {
    message: "Files larger than 100 MB are not yet supported.",
  }),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );

  const { folderId, fileName, mimeType, sizeBytes } = parsed.data;

  const folder = await getFolderById(userId, folderId);
  if (!folder)
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });

  // Generate the stable fileId first so the S3 key uses it from the start.
  const fileId = ulid();
  const s3Key = buildS3Key(userId, fileId, fileName);
  const uploadUrl = await createPresignedUploadUrl({ s3Key, mimeType });

  await createFilePending({
    fileId,
    ownerUserId: userId,
    folderId,
    fileName,
    mimeType,
    sizeBytes,
    s3Bucket: S3_BUCKET,
    s3Key,
  });

  return NextResponse.json({ fileId, uploadUrl, s3Key });
}
