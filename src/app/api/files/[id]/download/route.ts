import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFileById } from "@/lib/repos/files";
import { createPresignedDownloadUrl } from "@/lib/aws/presign";
import { writeAuditEvent } from "@/lib/repos/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: fileId } = await params;

  const file = await getFileById(userId, fileId);
  if (!file || file.status !== "available")
    return NextResponse.json({ error: "File not found" }, { status: 404 });

  const downloadUrl = await createPresignedDownloadUrl(
    file.s3Key,
    file.displayName
  );

  await writeAuditEvent({
    targetUserId: userId,
    eventType: "file.download",
    entityType: "file",
    entityId: fileId,
  });

  return NextResponse.redirect(downloadUrl);
}
