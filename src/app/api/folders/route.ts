import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { listAllFolders, getFolderById, createFolder } from "@/lib/repos/folders";

// GET — list all folders for the current user (used by the move-file picker).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folders = await listAllFolders(session.user.id);
  return NextResponse.json({ folders });
}

const schema = z.object({
  name: z.string().min(1).max(100),
  parentFolderId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const parent = await getFolderById(userId, parsed.data.parentFolderId);
  if (!parent)
    return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });

  const folder = await createFolder({
    ownerUserId: userId,
    name: parsed.data.name,
    parentFolderId: parsed.data.parentFolderId,
  });

  return NextResponse.json(folder, { status: 201 });
}
