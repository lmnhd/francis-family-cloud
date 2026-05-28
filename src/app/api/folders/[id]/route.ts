import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFolderById, renameFolder } from "@/lib/repos/folders";

const renameSchema = z.object({ name: z.string().min(1).max(100) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: folderId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const folder = await getFolderById(userId, folderId);
  if (!folder || folder.isRoot)
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });

  await renameFolder(userId, folderId, parsed.data.name);
  return NextResponse.json({ ok: true });
}
