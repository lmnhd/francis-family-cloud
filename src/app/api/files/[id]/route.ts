import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFileById, renameFile, softDeleteFile } from "@/lib/repos/files";
import { writeAuditEvent } from "@/lib/repos/audit";

const renameSchema = z.object({ displayName: z.string().min(1).max(255) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: fileId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const file = await getFileById(userId, fileId);
  if (!file || file.status === "deleted")
    return NextResponse.json({ error: "File not found" }, { status: 404 });

  await renameFile(userId, fileId, parsed.data.displayName);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: fileId } = await params;

  const file = await getFileById(userId, fileId);
  if (!file || file.status === "deleted")
    return NextResponse.json({ error: "File not found" }, { status: 404 });

  await softDeleteFile(userId, fileId);
  await writeAuditEvent({
    targetUserId: userId,
    eventType: "file.delete",
    entityType: "file",
    entityId: fileId,
  });

  return NextResponse.json({ ok: true });
}
