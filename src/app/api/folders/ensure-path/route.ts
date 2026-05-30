import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { ensureFolderPath, getFolderById } from "@/lib/repos/folders";

const segmentSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((value) => value !== "." && value !== "..", "Invalid folder name")
  .refine((value) => !/[\\/]/.test(value), "Folder names cannot contain slashes");

const schema = z.object({
  parentFolderId: z.string().min(1),
  pathSegments: z.array(segmentSchema).min(1).max(25),
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

  const parent = await getFolderById(userId, parsed.data.parentFolderId);
  if (!parent)
    return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });

  const folder = await ensureFolderPath({
    ownerUserId: userId,
    parentFolderId: parent.id,
    pathSegments: parsed.data.pathSegments,
  });

  return NextResponse.json({ folderId: folder.id });
}
