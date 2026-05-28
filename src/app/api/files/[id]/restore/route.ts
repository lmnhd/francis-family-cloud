import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFileById, restoreFile } from "@/lib/repos/files";
import { writeAuditEvent } from "@/lib/repos/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: fileId } = await params;

  const file = await getFileById(userId, fileId);
  if (!file || file.status !== "deleted")
    return NextResponse.json({ error: "File not found in trash" }, { status: 404 });

  await restoreFile(userId, fileId);
  await writeAuditEvent({
    targetUserId: userId,
    eventType: "file.restore",
    entityType: "file",
    entityId: fileId,
  });

  return NextResponse.json({ ok: true });
}
