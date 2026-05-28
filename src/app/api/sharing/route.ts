import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFileById } from "@/lib/repos/files";
import { getFolderById } from "@/lib/repos/folders";
import {
  createFamilyShare,
  removeFamilyShare,
  createUserShare,
  removeUserShare,
  getFamilyShare,
  listExplicitShareTargets,
} from "@/lib/repos/family-shares";

const schema = z.object({
  type: z.enum(["file", "folder"]),
  resourceId: z.string().min(1),
  scope: z.enum(["family", "user"]),
  targetUserId: z.string().optional(),
  enabled: z.boolean(),
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

  const { type, resourceId, scope, targetUserId, enabled } = parsed.data;

  if (scope === "user" && !targetUserId)
    return NextResponse.json({ error: "targetUserId required for user scope" }, { status: 400 });

  // Verify ownership
  let meta = { displayName: "", mimeType: "", sizeBytes: 0, s3Key: "" };
  if (type === "file") {
    const file = await getFileById(userId, resourceId);
    if (!file || file.status !== "available")
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    meta = { displayName: file.displayName, mimeType: file.mimeType, sizeBytes: file.sizeBytes, s3Key: file.s3Key };
  } else {
    const folder = await getFolderById(userId, resourceId);
    if (!folder)
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    meta = { displayName: folder.name, mimeType: "", sizeBytes: 0, s3Key: "" };
  }

  if (scope === "family") {
    if (enabled) {
      await createFamilyShare({
        ownerUserId: userId,
        type,
        resourceId,
        displayName: meta.displayName,
        ...(type === "file" ? { mimeType: meta.mimeType, sizeBytes: meta.sizeBytes, s3Key: meta.s3Key } : {}),
      });
    } else {
      await removeFamilyShare(type, resourceId);
    }
  } else {
    if (enabled) {
      await createUserShare({
        ownerUserId: userId,
        targetUserId: targetUserId!,
        type,
        resourceId,
        displayName: meta.displayName,
        ...(type === "file" ? { mimeType: meta.mimeType, sizeBytes: meta.sizeBytes, s3Key: meta.s3Key } : {}),
      });
    } else {
      await removeUserShare(targetUserId!, type, resourceId);
    }
  }

  return NextResponse.json({ ok: true });
}

// GET /api/sharing?type=file&resourceId=xxx — returns sharing status
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "file" | "folder" | null;
  const resourceId = searchParams.get("resourceId");
  if (!type || !resourceId)
    return NextResponse.json({ error: "type and resourceId required" }, { status: 400 });

  const [familyShare, sharedWithUsers] = await Promise.all([
    getFamilyShare(type, resourceId),
    listExplicitShareTargets(type, resourceId),
  ]);

  return NextResponse.json({
    familyShared: !!familyShare,
    sharedWithUserIds: sharedWithUsers,
  });
}
