import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFileById, renameFile, softDeleteFile, moveFile } from "@/lib/repos/files";
import { getFolderById } from "@/lib/repos/folders";
import { writeAuditEvent } from "@/lib/repos/audit";

const patchSchema = z
  .object({
    displayName: z.string().min(1).max(255).optional(),
    folderId: z.string().min(1).optional(),
  })
  .refine((d) => d.displayName || d.folderId, {
    message: "Provide displayName (rename) or folderId (move)",
  });

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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );

  const file = await getFileById(userId, fileId);
  if (!file || file.status === "deleted")
    return NextResponse.json({ error: "File not found" }, { status: 404 });

  if (parsed.data.folderId) {
    const dest = await getFolderById(userId, parsed.data.folderId);
    if (!dest)
      return NextResponse.json(
        { error: "Destination folder not found" },
        { status: 404 }
      );
    await moveFile(userId, fileId, parsed.data.folderId);
  } else if (parsed.data.displayName) {
    await renameFile(userId, fileId, parsed.data.displayName);
  }

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
